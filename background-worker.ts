'use strict';

import { Queue, Worker } from 'bullmq';
import { GoogleGenAI, Type } from '@google/genai';
import { prisma } from './lib/prisma';
import * as path from 'path';

import 'dotenv/config';

// Redis connection configuration
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
};

// Initialize Google GenAI
const genAI = new GoogleGenAI({});

// Define the structured schema for the evaluation output
const evaluationSchema = {
  type: Type.OBJECT,
  properties: {
    ai_data: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          image_index: { type: Type.INTEGER },
          section: { type: Type.STRING },
          question_id: { type: Type.STRING },
          question: { type: Type.STRING },
          marks: { type: Type.INTEGER },
          marks_awarded: { type: Type.INTEGER },
          feedback: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          blooms_level: { type: Type.STRING },
          topic: { type: Type.STRING },
          co: { type: Type.STRING },
          po: { type: Type.STRING },
          pso: { type: Type.STRING },
          ai_confidence: { type: Type.INTEGER },
          teacher_intervention_required: { type: Type.BOOLEAN },
          marking_scheme: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                point: { type: Type.STRING },
                mark: { type: Type.INTEGER },
                status: { type: Type.BOOLEAN },
              },
              required: ['point', 'mark', 'status'],
            },
          },
        },
        required: [
          'image_index',
          'section',
          'question_id',
          'question',
          'marks',
          'marks_awarded',
          'feedback',
          'difficulty',
          'blooms_level',
          'topic',
          'co',
          'po',
          'pso',
          'ai_confidence',
          'teacher_intervention_required',
          'marking_scheme',
        ],
      },
    },
    totalMarkAwarded: { type: Type.INTEGER },
    totalMarks: { type: Type.INTEGER },
  },
  required: ['ai_data', 'totalMarkAwarded', 'totalMarks'],
  propertyOrdering: ['ai_data', 'totalMarkAwarded', 'totalMarks'],
};

// Interface for job data
interface AIEvaluationJobData {
  evaluationId: string;
  studentId: string;
  submissionId: string;
  questionPaperPath: string;
  keyScriptPaths: string[];
  studentAnswerPath: string;
  totalMarks: number;
}

// Helper: safe file path conversion
const toUploadsPath = (file?: string | null): string => {
  if (!file || typeof file !== 'string') return '';
  const cleanFile = file.replace(/^\/?api\/pdf\//, '');
  // Absolute path to avoid worker issues
  return path.join(process.cwd(), 'uploads', 'pdfs', cleanFile);
};

// Function to upload a file and return its URI and MIME type
async function uploadFile(filePath: string, mimeType: string) {
  const myfile = await genAI.files.upload({ file: filePath, config: { mimeType } });
  return myfile;
}

// Function to delete a file
async function deleteFile(fileUri: { name?: string } | undefined) {
  if (!fileUri?.name) return;
  await genAI.files.delete({ name: fileUri.name });
}

// Function to evaluate student answers
async function evaluateStudentAnswers(
  questionPaperPath: string,
  keyScriptPaths: string[] = [],
  studentAnswerPath: string,
  totalMarks: number
): Promise<any> {
  if (!questionPaperPath || !studentAnswerPath) {
    throw new Error('Missing required file paths for evaluation');
  }

  console.log('Uploading question paper:', questionPaperPath);
  const questionPaper = await uploadFile(questionPaperPath, 'application/pdf');

  const keyScripts = await Promise.all(
    keyScriptPaths.map((ks) => uploadFile(ks, 'application/pdf'))
  );

  const studentAnswer = await uploadFile(studentAnswerPath, 'application/pdf');

  const contents = {
    role: 'user',
    parts: [
      { fileData: { fileUri: questionPaper.uri, mimeType: questionPaper.mimeType } },
      ...keyScripts.map((ks) => ({ fileData: { fileUri: ks.uri, mimeType: ks.mimeType } })),
      { fileData: { fileUri: studentAnswer.uri, mimeType: studentAnswer.mimeType } },
      {
        text: `
GOAL: Fully evaluate the Student Answer Script against the Question Paper and Key Scripts, generating a final output that is strictly a single JSON object following the defined schema.

INPUT REQUIREMENTS:

Question Paper, Student Answer Script (PDF with page indexing), Key Scripts, and the total marks for the exam (${totalMarks}).

EVALUATION RULES (Lenient/Favorable Marking):

Marking Standard: Adopt a lenient and favorable marking policy ("in favorision only not much strict"). Award partial credit generously based on demonstrated effort and understanding.

Extraction: Extract and include ALL questions from the Question Paper in the output, regardless of whether they were attempted.

Referencing: Accurately match each question to the student's answer using the specific image_index (PDF page reference/s).

FEEDBACK & SCORING PROTOCOL:

Attempted Questions: Provide detailed, specific feedback on the content. Do not state "Not Attempted."

Unattempted Questions:

Set the marks_awarded to 0.

The feedback must explicitly state "Not Attempted" or "Strike Off."

REQUIRED METADATA & FINAL CALCULATION:

AI Confidence: Set AI_Conficence to a value between 0 and 100, reflecting the certainty of the evaluation.

Intervention Flag: Set teacher_intervention_required to true if there is any doubt regarding the correctness of the answer or the assigned marks.

Final Tally: Calculate totalMarkAwarded as the precise sum of all individual marks_awarded.

OUTPUT CONSTRAINT: Verify the accuracy of all questions and awarded marks. The final output must be strictly in JSON format without any additional introductory or concluding text.
`,
      },
    ],
  };

  const response: any = await genAI.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [contents],
    config: { responseMimeType: 'application/json', responseSchema: evaluationSchema },
  });

  const evaluation = JSON.parse(response.text);

  await Promise.all([deleteFile(questionPaper), ...keyScripts.map(deleteFile), deleteFile(studentAnswer)]);

  return evaluation;
}

// Create the BullMQ queue
export const aiEvaluationQueue = new Queue<AIEvaluationJobData>('ai-evaluation', { connection });

// Create the BullMQ worker
const worker = new Worker<AIEvaluationJobData>(
  'ai-evaluation',
  async (job) => {
    console.log(`Processing job ${job.id} for submission ${job.data}`);
    console.log('Job data:', job.data);
    const { evaluationId, submissionId } = job.data;

    try {
      const evaluation = await prisma.evaluation.findUnique({ where: { id: evaluationId } });
      const submission = await prisma.evaluationSubmission.findUnique({ where: { id: submissionId } });

      const questionPaperPath = toUploadsPath(evaluation?.questionPdf);
      const keyScriptPaths = evaluation?.answerKey ? [toUploadsPath(evaluation.answerKey)] : [];
      const studentAnswerPath = toUploadsPath(submission?.scriptPdf);

      const totalMarks = evaluation?.maxMarks ?? 0;

      if (!questionPaperPath || !studentAnswerPath) throw new Error('Missing file paths for evaluation');

      const result = await evaluateStudentAnswers(questionPaperPath, keyScriptPaths, studentAnswerPath, totalMarks);

      await prisma.evaluationSubmission.update({
        where: { id: submissionId },
        data: {
          aiResult: result,
          totalMark: result.totalMarkAwarded,
          feedback: result.ai_data?.map((q: any) => q.feedback).join('\n') ?? '',
          status: 'evaluated',
        },
      });

      const submissions = await prisma.evaluationSubmission.findMany({
        where: { evaluationId },
      });

      const allEvaluated = submissions.every((sub) => sub.status === 'evaluated');

      if (allEvaluated) {
        // Update the evaluation status to 'evaluated'
        await prisma.evaluation.update({
          where: { id: evaluationId },
          data: { status: 'evaluated' },
        });
        console.log(`Evaluation ${evaluationId} status updated to 'evaluated'`);
      } else {
        console.log(`Evaluation ${evaluationId} has pending submissions; status not updated`);
      }
      

      console.log(`Processed AI evaluation for submission ${submissionId}`);
      return result;
    } catch (error) {
      console.error(`Error processing job ${job.id} for submission ${submissionId}:`, error);
      throw error;
    }
  },
  { connection }
);

// Worker events
worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed', (job, err: Error) => console.error(`Job ${job?.id} failed:`, err));

// Function to add a job to the queue
export async function enqueueAiEvaluation({
  evaluationId,
  studentId,
  submissionId,
  questionPdf,
  keyScripts,
  answerScript,
  totalMarks,
}: {
  evaluationId: string;
  studentId: string;
  submissionId: string;
  questionPdf: string;
  keyScripts: string[];
  answerScript: string;
  totalMarks: number;
}) {
  await aiEvaluationQueue.add('evaluate', {
    evaluationId,
    studentId,
    submissionId,
    questionPaperPath: path.resolve(questionPdf),
    keyScriptPaths: keyScripts.map((ks) => path.resolve(ks)),
    studentAnswerPath: path.resolve(answerScript),
    totalMarks,
  });
  console.log(`Enqueued AI evaluation for submission ${submissionId}`);
}

console.log('AI Evaluation Worker started. Waiting for jobs...');
