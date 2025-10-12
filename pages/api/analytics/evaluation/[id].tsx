// pages/api/analytics/evaluation/[id].ts
import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Evaluation ID required" });
  }

  try {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: {
        submissions: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!evaluation) {
      return res.status(404).json({ error: "Evaluation not found" });
    }

    const students = evaluation.submissions.map((s) => ({
      id: s.student.id,
      name: s.student.name,
      aiData: (s.aiResult as any)?.ai_data || [],
    }));

    // Flatten all questions for per-question stats
    const questionMap: Record<string, { totalMarks: number; maxMarks: number; count: number; text: string }> = {};

    students.forEach((s) => {
      s.aiData.forEach((q: any) => {
        const qId = q.question_id;
        if (!questionMap[qId]) {
          questionMap[qId] = { totalMarks: 0, maxMarks: q.marks || 0, count: 0, text: q.question || "" };
        }
        // Only count marks if present
        const marks = typeof q.marks_awarded === "number" ? q.marks_awarded : 0;
        questionMap[qId].totalMarks += marks;
        questionMap[qId].count += 1;
        questionMap[qId].maxMarks = Math.max(questionMap[qId].maxMarks, q.marks || 0);
      });
    });

    const questionStats = Object.entries(questionMap).map(([id, q]) => ({
      questionId: id,
      text: q.text,
      avgMarks: q.count ? (q.totalMarks / q.count).toFixed(2) : "0.00",
      correctPercent: q.count && q.maxMarks ? ((q.totalMarks / (q.maxMarks * q.count)) * 100).toFixed(2) : "0.00",
      maxMarks: q.maxMarks,
    }));

    // Compute student total scores
    const results = students.map((s) => {
      const total = s.aiData.reduce((sum: number, q: any) => sum + (typeof q.marks_awarded === "number" ? q.marks_awarded : 0), 0);
      return {
        studentId: s.id,
        name: s.name,
        total,
        scores: s.aiData.map((q: any) => (typeof q.marks_awarded === "number" ? q.marks_awarded : 0)),
      };
    });

    const studentTotals = results.map((s) => ({ name: s.name, total: s.total }));

    const avgScore =
      studentTotals.reduce((a, b) => a + b.total, 0) / (studentTotals.length || 1);
    const topper = studentTotals.reduce((a, b) => (a.total > b.total ? a : b), { total: -1 });
    const weakest = studentTotals.reduce((a, b) => (a.total < b.total ? a : b), { total: Infinity });

    res.status(200).json({
      evaluationId: id,
      evaluationName: evaluation.name,
      averageScore: avgScore.toFixed(2),
      topper,
      weakest,
      questionStats,
      results,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
