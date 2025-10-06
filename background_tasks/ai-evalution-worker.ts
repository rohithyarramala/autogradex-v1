"use strict";

import { Worker } from 'bullmq';
import { processAIEvaluation } from '../lib/process-ai-evaluation';

// Define the job data interface
interface AIEvaluationJobData {
  submissionId: string;
  evaluationId: string;
}

// BullMQ worker for processing AI evaluation jobs
const worker = new Worker<AIEvaluationJobData>(
  'ai-evaluation',
  async (job: { data: AIEvaluationJobData }) => {
    const { submissionId, evaluationId } = job.data;
    // Run the AI evaluation for this submission
    await processAIEvaluation(submissionId, evaluationId);
    console.log(`Processed AI evaluation for submission ${submissionId}`);
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      // password: process.env.REDIS_PASSWORD,a
    },
  }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err: Error) => {
  console.error(`Job ${job?.id} failed:`, err);
});

export {};