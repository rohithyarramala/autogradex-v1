import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Student ID required' });

  try {
    // Fetch student with their evaluation submissions
    const student = await prisma.user.findUnique({
      where: { id },
      include: {
        EvaluationSubmissions: {
          include: { evaluation: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!student) return res.status(404).json({ error: 'Student not found' });

    const evaluations = student.EvaluationSubmissions.map((s) => ({
      id: s.evaluationId,
      name: s.evaluation.name,
      obtainedMarks: s.totalMark ?? 0,
      totalMarks: s.evaluation.maxMarks ?? 100,
      classAverage: 0, // s.evaluation.classAverage ?? 0, // classAverage is not directly available on evaluation object
      // topics heatmap data
      heatmap: (s.aiResult as any)?.ai_data?.map((q: any) => ({
        topic: q.topic || 'General',
        score: typeof q.marks_awarded === 'number' ? q.marks_awarded : 0,
        maxMarks: q.marks || 100,
      })) ?? [],
    }));

    const avgScore =
      evaluations.reduce((a, e) => a + e.obtainedMarks, 0) / (evaluations.length || 1);
    const highestScore = Math.max(...evaluations.map((e) => e.obtainedMarks));
    const lowestScore = Math.min(...evaluations.map((e) => e.obtainedMarks));
    const consistency = `${Math.round(
      (1 - (highestScore - lowestScore) / (evaluations[0]?.totalMarks || 100)) * 100
    )}%`;

    // Combine topics for heatmap
    const topics = Array.from(
      new Set(evaluations.flatMap((e) => e.heatmap.map((t) => t.topic)))
    );
    const heatmap = evaluations.map((e) => ({
      evaluation: e.name,
      scores: topics.map((t) => {
        const topic = e.heatmap.find((h) => h.topic === t);
        return topic ? Math.round((topic.score / topic.maxMarks) * 100) : 0;
      }),
    }));

    res.status(200).json({
      studentId: id,
      studentName: student.name,
      avgScore: Math.round(avgScore),
      highestScore,
      lowestScore,
      consistency,
      rank: 0, // optional: compute if needed
      classSize: 0,
      evaluations,
      topics,
      heatmap,
      weaknesses: [], // optional, can add topic-wise low scores
      grades: {}, // optional grade distribution
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
