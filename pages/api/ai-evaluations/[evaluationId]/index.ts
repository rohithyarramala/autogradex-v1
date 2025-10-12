import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { enqueueEvaluationJob } from '@/lib/ai-evaluation-queue'; // Implement this in your queue logic

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { evaluationId } = req.query;
    if (!evaluationId || typeof evaluationId !== 'string') {
      return res.status(400).json({ error: 'Invalid evaluationId' });
    }
    switch (req.method) {
      case 'GET': {
        const evaluation = await prisma.evaluation.findUnique({
          where: { id: evaluationId },
          include: {
            submissions: {
              include: {
                student: true,
              },
            },
            class: true,
            section: true,
            subject: true,
            creator: true,
          },
        });
        if (!evaluation) return res.status(404).json({ error: 'Not found' });
        res.status(200).json(evaluation);
        break;
      }
      case 'POST': {
        await enqueueEvaluationJob(evaluationId);
        res.status(200).json({ success: true, message: 'Evaluation started' });
        break;
      }
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
