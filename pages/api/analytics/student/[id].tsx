// pages/api/analytics/student/[id].ts
import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  // Fake evaluations for this student
  const evaluations = Array.from({ length: 5 }).map((_, i) => ({
    id: i + 1,
    name: `Evaluation ${i + 1}`,
    totalMarks: 100,
    obtainedMarks: Math.floor(Math.random() * 41) + 60, // 60-100
    date: `2025-10-${i + 1}`
  }));

  // Weakness analysis: pick 3 random topics/questions the student is weak at
  const weaknesses = Array.from({ length: 3 }).map((_, i) => ({
    topic: `Topic ${Math.floor(Math.random() * 10) + 1}`,
    averageScore: Math.floor(Math.random() * 40) + 30 // 30-70%
  }));

  // Rank among class (randomized for example)
  const rank = Math.floor(Math.random() * 30) + 1;
  const classSize = 30;

  // Heatmap: evaluations × topics (0=poor, 1=moderate, 2=good)
  const topics = Array.from({ length: 10 }).map((_, i) => `Topic ${i + 1}`);
  const heatmap = evaluations.map((e) => ({
    evaluation: e.name,
    scores: topics.map(() => Math.floor(Math.random() * 3)) // 0,1,2
  }));

  res.status(200).json({
    studentId: id,
    studentName: `Student ${id}`,
    evaluations,
    rank,
    classSize,
    weaknesses,
    topics,
    heatmap
  });
}
