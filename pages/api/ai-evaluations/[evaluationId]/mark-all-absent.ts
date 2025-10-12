import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { evaluationId } = req.query;
    if (!evaluationId || typeof evaluationId !== 'string') {
      return res.status(400).json({ error: 'Invalid evaluationId' });
    }

    if (req.method === 'POST') {
      // Find all submissions where status is NOT 'uploaded'
      const submissionsToMarkAbsent = await prisma.evaluationSubmission.findMany({
        where: {
          evaluationId,
          NOT: { status: 'uploaded' },
        },
      });

      if (submissionsToMarkAbsent.length === 0) {
        return res.status(200).json({ message: 'No submissions to mark as absent' });
      }

      // Update all found submissions
      const updatedSubmissions = await prisma.evaluationSubmission.updateMany({
        where: {
          evaluationId,
          NOT: { status: 'uploaded' },
        },
        data: {
          status: 'absent',
          isAbsent: true,
        },
      });

      return res.status(200).json({
        message: `Marked ${updatedSubmissions.count} submissions as absent`,
        count: updatedSubmissions.count,
      });
    } else {
      res.setHeader('Allow', ['POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
