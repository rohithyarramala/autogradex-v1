// pages/api/analytics/evaluation/[id].ts
import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  // Fake students (in a class)
  const students = Array.from({ length: 10 }).map((_, i) => ({
    id: i + 1,
    name: `Student ${i + 1}`,
  }));

  // Fake questions (10 questions)
  const questions = Array.from({ length: 10 }).map((_, i) => ({
    id: i + 1,
    text: `Question ${i + 1}`,
    maxMarks: 10,
  }));

  // Fake student scores per question
  const results = students.map((student) => ({
    studentId: student.id,
    name: student.name,
    scores: questions.map((q) => Math.floor(Math.random() * 11)), // 0–10 marks
  }));

  // Compute per-question accuracy
  const questionStats = questions.map((q, qi) => {
    const total = results.reduce((sum, s) => sum + s.scores[qi], 0);
    const correctPercent = ((total / (students.length * q.maxMarks)) * 100).toFixed(2);
    return { ...q, correctPercent };
  });

  // Evaluation-level stats
  const studentTotals = results.map((s) => ({
    name: s.name,
    total: s.scores.reduce((a, b) => a + b, 0),
  }));
  const avgScore =
    studentTotals.reduce((a, b) => a + b.total, 0) / studentTotals.length;
  const topper = studentTotals.reduce((a, b) => (a.total > b.total ? a : b));
  const weakest = studentTotals.reduce((a, b) => (a.total < b.total ? a : b));

  res.status(200).json({
    evaluationId: id,
    evaluationName: `Evaluation ${id}`,
    averageScore: avgScore.toFixed(2),
    topper,
    weakest,
    questionStats,
    results,
  });
}
