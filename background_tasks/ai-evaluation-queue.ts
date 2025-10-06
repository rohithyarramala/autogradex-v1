import { Queue, Worker } from 'bullmq';
import { evaluateStudentAnswers } from './worker';
import { prisma } from '@/lib/prisma';
import path from 'path';

const connection = {
  host: 'localhost',
  port: 6379,
};

export const aiEvaluationQueue = new Queue('ai-evaluation', { connection });

// Worker to process jobs
export const aiEvaluationWorker = new Worker(
  'ai-evaluation',
  async (job) => {
    const { evaluationId, studentId, questionPaperPath, keyScriptPaths, studentAnswerPath, totalMarks } = job.data;
    // Run AI evaluation
    const result = await evaluateStudentAnswers(
      questionPaperPath,
      keyScriptPaths,
      studentAnswerPath,
      totalMarks
    );
    // Save result to DB
    await prisma.evaluationSubmission.update({
      where: {
        id: job.data.submissionId,
      },
      data: {
        aiResult: result,
        totalMark: result.totalMarkAwarded,
        feedback: result.ai_data.map((q: any) => q.feedback).join('\n'),
        status: 'evaluated',
      },
    });
    return result;
  },
  { connection }
);

// Function to add a job to the queue
export async function enqueueAiEvaluation({ evaluationId, studentId, submissionId, questionPdf, keyScripts, answerScript, totalMarks }) {
  await aiEvaluationQueue.add('evaluate', {
    evaluationId,
    studentId,
    submissionId,
    questionPaperPath: path.resolve(questionPdf),
    keyScriptPaths: keyScripts.map((ks: string) => path.resolve(ks)),
    studentAnswerPath: path.resolve(answerScript),
    totalMarks,
  });
}
