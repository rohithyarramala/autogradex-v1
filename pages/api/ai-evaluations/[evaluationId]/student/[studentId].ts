import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { evaluationId, studentId } = req.query;
    if (!evaluationId || !studentId || typeof evaluationId !== 'string' || typeof studentId !== 'string') {
      return res.status(400).json({ error: 'Invalid evaluationId or studentId' });
    }
    switch (req.method) {
      case 'GET': {
        const submission = await prisma.evaluationSubmission.findFirst({
          where: { evaluationId, studentId },
          include: { evaluation: true, student: true },
        });
        if (!submission) return res.status(404).json({ error: 'Not found' });
        res.status(200).json(submission);
        break;
      }
      case 'PUT': {
        const { totalMark, feedback, aiResult } = req.body;
        // Find the submission by evaluationId and studentId
        const submission = await prisma.evaluationSubmission.findFirst({
          where: { evaluationId, studentId },
        });
        if (!submission) return res.status(404).json({ error: 'Submission not found' });
        const updated = await prisma.evaluationSubmission.update({
          where: { id: submission.id },
          data: { totalMark, feedback, aiResult },
        });
        res.status(200).json(updated);
        break;
      }
      case 'POST': {
        // Mark as absent or uploaded
        const { isAbsent } = req.body;
        const submission = await prisma.evaluationSubmission.findFirst({
          where: { evaluationId, studentId },
        });
        if (!submission) return res.status(404).json({ error: 'Submission not found' });
        let updateData: any = {};
        if (isAbsent) {
          updateData = { status: 'absent', isAbsent: true };
        } else {
          updateData = { status: 'uploaded', isAbsent: false, scriptPdf: null };
        }
        const updated = await prisma.evaluationSubmission.update({
          where: { id: submission.id },
          data: updateData,
        });
        res.status(200).json(updated);
        break;
      }
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
