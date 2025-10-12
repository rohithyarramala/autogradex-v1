
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import { useRouter } from 'next/router';

export const config = {
  api: {
    bodyParser: false, // Required for Formidable
  },
};

/** ====================== FILE UPLOAD HANDLER ====================== **/
async function handleFileUpload(req: NextApiRequest) {
  const uploadDir = path.join(process.cwd(), 'uploads', 'pdfs');
  await fs.mkdir(uploadDir, { recursive: true });

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    multiples: false,
    filename: (name, ext, part) =>
      `${Date.now()}-${part.originalFilename || name}`,
  });

  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>(
    (resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    }
  );
}

/** ====================== MAIN HANDLER ====================== **/
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { evaluationId } = req.query;


  if (!evaluationId || typeof evaluationId !== 'string') {
    return res.status(400).json({ error: 'Invalid evaluationId or studentId' });
  }

  try {
    switch (req.method) {
      case 'POST': {
        /** ========== Parse form and extract file ========== */
        const { fields, files } = (await handleFileUpload(req)) as any;
        const scriptFile = files.scriptPdf;

        if (!scriptFile) {
          return res
            .status(400)
            .json({ error: 'PDF file (scriptPdf) required' });
        }

        const file = Array.isArray(scriptFile) ? scriptFile[0] : scriptFile;
        const filepath = file.filepath || (file as any).path;
        if (!filepath)
          return res.status(400).json({ error: 'File path not found' });

        const scriptPdfPath = `/api/pdf/${path.basename(filepath)}`;


        /** ========== Verify student submission ========== */

        console.log(fields);
        const submission = await prisma.evaluationSubmission.findFirst({
          where: {
            evaluationId,
            student: {
              rollNo: fields.rollNo[0],
            },
          },
          include: {
            student: true, // optional: if you want to return student info
          },
        });
        if (!submission)
          return res.status(404).json({ error: 'Submission not found' });

        /** ========== Update submission ========== */
        const updated = await prisma.evaluationSubmission.update({
          where: { id: submission.id },
          data: {
            scriptPdf: scriptPdfPath,
            status: 'uploaded',
            isAbsent: false,
          },
        });

        return res.status(200).json({
          message: 'Script uploaded successfully',
          submission: updated,
        });
      }
      case 'GET': {
        const evaluation = await prisma.evaluation.findUnique({
          where: { id: evaluationId },
          select: {
            id: true,
            name: true,
            uploadedBy: true,
            status: true,
            subject: true,
          },
        });

        if (!evaluation) {
          return res.status(404).json({ error: 'Evaluation not found' });
        }

        return res.status(200).json({ evaluation });
      }
      default: {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
      }
    }
  } catch (err: any) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: err.message });
  }
}
