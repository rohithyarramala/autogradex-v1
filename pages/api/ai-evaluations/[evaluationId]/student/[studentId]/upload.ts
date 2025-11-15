import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handleFileUpload(req: NextApiRequest) {
  const uploadDir = path.join('uploads', 'pdfs');
  await fs.mkdir(uploadDir, { recursive: true });

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    multiples: false,
    filename: (name, ext, part) => `${Date.now()}-${part.originalFilename || name}`,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { evaluationId, studentId } = req.query;
    if (!evaluationId || !studentId || typeof evaluationId !== 'string' || typeof studentId !== 'string') {
      return res.status(400).json({ error: 'Invalid evaluationId or studentId' });
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
    const { files } = await handleFileUpload(req) as any;
    const scriptFile = files.file;
    // console.log("scriptFile: ", scriptFile.file[0].filepath);
    if (!scriptFile || !scriptFile[0]?.filepath) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const scriptPdfPath = `/api/pdf/${path.basename(scriptFile[0].filepath)}`;
    // Update submission
    const submission = await prisma.evaluationSubmission.findFirst({
      where: { evaluationId, studentId },
    });
    console.log("submission: ", submission);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    // console.log("scriptPdfPath: ", scriptPdfPath);
    const updated = await prisma.evaluationSubmission.update({
      where: { id: submission.id },
      data: {
        scriptPdf: scriptPdfPath,
        status: 'uploaded',
        isAbsent: false,
      },
    });
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
