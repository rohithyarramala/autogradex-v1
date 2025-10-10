import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  const students = Array.from({ length: 20 }).map((_, i) => ({
    id: i + 1,
    name: `Student ${i + 1}`,
    score: Math.floor(Math.random() * 41) + 60, // 60-100
  }));

  const questions = Array.from({ length: 10 }).map((_, i) => ({
    id: i + 1,
    text: `Question ${i + 1}`,
    correctPercent: Math.floor(Math.random() * 100), // 0-100
  }));

  const classAverage = (
    students.reduce((acc, s) => acc + s.score, 0) / students.length
  ).toFixed(2);

  const topper = students.reduce((a, b) => (a.score > b.score ? a : b));
  const weakest = students.reduce((a, b) => (a.score < b.score ? a : b));

  // Heatmap: Students x Questions
  const heatmap = students.map((s) => ({
    student: s.name,
    scores: questions.map(() => Math.floor(Math.random() * 101)), // 0-100
  }));

  res.status(200).json({
    classId: id,
    className: `Class ${id}`,
    classAverage,
    topper,
    weakest,
    students,
    questions,
    heatmap,
  });
}
