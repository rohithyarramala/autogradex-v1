import { prisma } from '@/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { evaluationId } = req.query;
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { rubric } = req.body;

    // Fetch evaluation
    const evaluation = await prisma.evaluation.findUnique({ where: { id: evaluationId as string } });
    if (!evaluation) return res.status(404).json({ error: 'Evaluation not found' });

    // Lock rubric if evaluation started
    if (evaluation.status === 'evaluating' || evaluation.status === 'evaluated') {
      return res.status(400).json({ error: 'Cannot update rubric after evaluation started' });
    }

    const updated = await prisma.evaluation.update({
      where: { id: evaluationId as string },
      data: { rubrics: rubric, rubricsGenerated: true },
    });

    res.status(200).json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
