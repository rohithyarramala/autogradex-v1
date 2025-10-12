// lib/ai-evaluation-queue.ts

import { Queue } from 'bullmq';
import { prisma } from './prisma';
import * as crypto from 'crypto'; // ✅ FIX: no default import!

// ----------------------------
// 🔧 Redis Connection Config
// ----------------------------
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
};

// ----------------------------
// 🧩 Utility: Safe Job ID Generator
// ----------------------------
function generateSafeJobId(prefix: string, id: string): string {
  // BullMQ rejects colons (:) in IDs — hash ensures safety
  const hash = crypto.createHash('md5').update(id).digest('hex').slice(0, 8);
  return `${prefix}-${hash}`;
}

// ----------------------------
// 🧠 Queues Setup
// ----------------------------
export const rubricsQueue = new Queue('rubrics-creation', { connection });
export const aiEvaluationQueue = new Queue('ai-evaluation', { connection });

// ----------------------------
// 🎯 Enqueue Rubrics Creation
// ----------------------------
export async function enqueueRubricsCreationJob(evaluationId: string) {
  try {
    // Update evaluation status
    await prisma.evaluation.update({
      where: { id: evaluationId },
      data: { status: 'rubrics-generating' },
    });

    // Queue the job
    await rubricsQueue.add(
      'create-rubrics',
      { evaluationId },
      { jobId: generateSafeJobId('rubrics', evaluationId) }
    );

    console.log(`✅ Rubrics creation job queued for evaluation ${evaluationId}`);
  } catch (err) {
    console.error('❌ Failed to enqueue rubrics creation job:', err);
    throw err;
  }
}

// ----------------------------
// 🤖 Enqueue AI Evaluation Jobs
// ----------------------------
export async function enqueueEvaluationJob(evaluationId: string) {
  try {
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: { submissions: true },
    });

    if (!evaluation) throw new Error(`Evaluation not found: ${evaluationId}`);

    const submissions = evaluation.submissions || [];

    if (submissions.length === 0) {
      // No student submissions → mark directly as evaluated
      await prisma.evaluation.update({
        where: { id: evaluationId },
        data: { status: 'evaluated' },
      });
      console.log(`ℹ️ No submissions found for evaluation ${evaluationId}`);
      return;
    }

    // Prepare jobs
    const jobs = submissions.map((submission) => ({
      name: 'ai-evaluate',
      data: {
        evaluationId,
        submissionId: submission.id,
      },
      opts: {
        jobId: generateSafeJobId('eval', submission.id),
      },
    }));

    // Queue all jobs in bulk
    await aiEvaluationQueue.addBulk(jobs);

    // Update evaluation status
    await prisma.evaluation.update({
      where: { id: evaluationId },
      data: { status: 'evaluating' },
    });

    console.log(
      `✅ Queued ${jobs.length} AI evaluation jobs for evaluation ${evaluationId}`
    );
  } catch (err) {
    console.error('❌ Failed to enqueue AI evaluation jobs:', err);
    throw err;
  }
}
