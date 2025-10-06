// lib/process-ai-evaluation.ts
import * as path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from './prisma.js';
import { evaluateStudentAnswers } from '../background_tasks/worker.js';

// ESM-safe __dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function processAIEvaluation(submissionId, evaluationId) {
  // Fetch submission and evaluation
  const submission = await prisma.evaluationSubmission.findUnique({ where: { id: submissionId } });
  if (!submission) throw new Error('Submission not found');

  const evaluation = await prisma.evaluation.findUnique({ where: { id: evaluationId } });
  if (!evaluation) throw new Error('Evaluation not found');

  // Resolve /public directory from project root
  const FILE_DIR = path.resolve(__dirname, '../public');

  const questionPaperPath = evaluation.questionPdf
    ? path.join(FILE_DIR, evaluation.questionPdf)
    : '';
  const keyScriptPaths = evaluation.answerKey
    ? [path.join(FILE_DIR, evaluation.answerKey)]
    : [];
  const studentAnswerPath = submission.scriptPdf
    ? path.join(FILE_DIR, submission.scriptPdf)
    : '';
  const totalMarks = evaluation.maxMarks || 100;

  const aiResult = await evaluateStudentAnswers(
    questionPaperPath,
    keyScriptPaths,
    studentAnswerPath,
    totalMarks
  );

  await prisma.evaluationSubmission.update({
    where: { id: submissionId },
    data: { aiResult, status: 'evaluated' },
  });

  return aiResult;
}
