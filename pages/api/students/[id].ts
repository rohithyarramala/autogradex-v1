// pages/api/analytics/student/[id].ts
import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const numEvaluations = 6;
  const numTopics = 10;
  const classSize = 30;

  // Generate evaluations
  const evaluations = Array.from({ length: numEvaluations }).map((_, i) => ({
    id: i + 1,
    name: `Evaluation ${i + 1}`,
    totalMarks: 100,
    obtainedMarks: Math.floor(Math.random() * 41) + 60, // 60–100
    classAverage: Math.floor(Math.random() * 21) + 70,   // 70–90 class average
    date: `2025-10-${i + 1}`,
  }));

  // Topics
  const topics = Array.from({ length: numTopics }).map((_, i) => `Topic ${i + 1}`);

  // Heatmap with smooth randomization
  const heatmap: { evaluation: string; scores: number[] }[] = [];
  evaluations.forEach((evalObj, evalIndex) => {
    const scores = topics.map((_, topicIndex) => {
      let base =
        evalIndex === 0
          ? Math.floor(Math.random() * 31) + 60 // 60–90 first eval
          : heatmap[evalIndex - 1].scores[topicIndex];
      const change = Math.floor(Math.random() * 21) - 10; // ±10 change
      return Math.max(0, Math.min(100, base + change));
    });
    heatmap.push({ evaluation: evalObj.name, scores });
  });

  // Weaknesses
  const weaknesses = topics
    .map((t, i) => {
      const avgScore = Math.floor(Math.random() * 51) + 50; // 50–100
      return { topic: t, averageScore: avgScore };
    })
    .filter((t) => t.averageScore < 70);

  // Grades
  const grades = {
    A: Math.floor(Math.random() * 3) + 2,
    B: Math.floor(Math.random() * 4) + 3,
    C: Math.floor(Math.random() * 3) + 1,
    D: Math.floor(Math.random() * 2),
    F: Math.floor(Math.random() * 2),
  };

  // High/Medium/Low flags for frontend
  const avgScore =
    Math.round(evaluations.reduce((a, b) => a + b.obtainedMarks, 0) / evaluations.length);
  const highestScore = Math.max(...evaluations.map((e) => e.obtainedMarks));
  const lowestScore = Math.min(...evaluations.map((e) => e.obtainedMarks));

  // Consistency = low variation in scores
  const consistency = Math.round(
    100 - (Math.max(...evaluations.map((e) => e.obtainedMarks)) -
      Math.min(...evaluations.map((e) => e.obtainedMarks)))
  );

  const rank = Math.floor(Math.random() * classSize) + 1;

  res.status(200).json({
    studentId: id,
    studentName: `Student ${id}`,
    evaluations,
    topics,
    heatmap,
    weaknesses,
    grades,
    avgScore,
    highestScore,
    lowestScore,
    consistency,
    rank,
    classSize,
  });
}
