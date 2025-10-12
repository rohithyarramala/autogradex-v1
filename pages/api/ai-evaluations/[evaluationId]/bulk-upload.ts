import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import formidable from 'formidable';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import unzipper from 'unzipper';

export const config = {
  api: { bodyParser: false },
};

// Handle zip file upload
async function handleZipUpload(req: NextApiRequest) {
  const uploadDir = path.join(process.cwd(), 'uploads', 'zips');
  await fsp.mkdir(uploadDir, { recursive: true });

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    multiples: false,
    filename: (_name, _ext, part) => `${Date.now()}-${part.originalFilename}`,
  });

  return new Promise<{ files: any }>((resolve, reject) => {
    form.parse(req, (_err, _fields, files) => {
      resolve({ files });
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { evaluationId } = req.query;
    if (!evaluationId || typeof evaluationId !== 'string') {
      return res.status(400).json({ error: 'Invalid evaluationId' });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { files } = await handleZipUpload(req);
    const zipFile = Array.isArray(files.zipFile)
      ? files.zipFile[0]
      : files.zipFile;

    if (!zipFile) return res.status(400).json({ error: 'No file uploaded' });

    const pdfDir = path.join(process.cwd(), 'uploads', 'pdfs');
    await fsp.mkdir(pdfDir, { recursive: true });

    const results: any[] = [];

    const zipStream = fs
      .createReadStream(zipFile.filepath)
      .pipe(unzipper.Parse({ forceStream: true }));

    for await (const entry of zipStream) {
      if (entry.type === 'Directory') {
        entry.autodrain();
        continue;
      }

      const ext = path.extname(entry.path).toLowerCase();
      if (ext !== '.pdf') {
        entry.autodrain();
        continue;
      }

      const rollNo = path.basename(entry.path, ext);

      const submission = await prisma.evaluationSubmission.findFirst({
        where: { evaluationId },
        include: { student: true },
      });
      const matchedSubmission =
        submission?.student.rollNo === rollNo
          ? submission
          : await prisma.evaluationSubmission.findFirst({
              where: {
                evaluationId,
                student: { rollNo },
              },
              include: { student: true },
            });

      if (!matchedSubmission) {
        entry.autodrain();
        results.push({ rollNo, status: 'not found' });
        continue;
      }

      const targetPath = path.join(
        pdfDir,
        `${Date.now()}-${path.basename(entry.path)}`
      );
      await new Promise<void>((resolve, reject) => {
        const ws = fs.createWriteStream(targetPath);
        entry
          .pipe(ws)
          .on('finish', () => resolve())
          .on('error', reject);
      });

      const updated = await prisma.evaluationSubmission.update({
        where: { id: matchedSubmission.id },
        data: {
          scriptPdf: `/api/pdf/${path.basename(targetPath)}`,
          status: 'uploaded',
          isAbsent: false,
        },
      });

      results.push({ rollNo, file: updated.scriptPdf, status: 'uploaded' });

      // Delete the processed PDF to clean up
      // await fsp.unlink(targetPath).catch(() => null);
    }

    const allProcessed = await prisma.evaluationSubmission.count({
      where: { evaluationId, NOT: { status: { in: ['uploaded', 'absent'] } } },
    });
    if (allProcessed === 0)
      await prisma.evaluation.update({
        where: { id: evaluationId },
        data: { status: 'evaluation pending' },
      });

    // Delete the uploaded zip after processing
    await fsp.unlink(zipFile.filepath).catch(() => null);

    res
      .status(200)
      .json({
        uploaded: results,
        message: `${results.length} files processed and cleaned`,
      });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
