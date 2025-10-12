'use strict';

import { Worker, Queue } from 'bullmq';
import { GoogleGenAI, Type } from '@google/genai';
import { prisma } from './lib/prisma'; // Adjust path to your prisma instance
import * as path from 'path';

import 'dotenv/config';

// Import job chaining function
import {
  enqueueEvaluationJob,
  rubricsQueue,
  aiEvaluationQueue,
} from './lib/ai-evaluation-queue';

// Redis connection configuration
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
};

// Initialize Google GenAI
const genAI = new GoogleGenAI({});

// ----------------------------------------------------------------------
// 1. SCHEMAS AND INTERFACES
// ----------------------------------------------------------------------

// Schema for Rubrics Output (Question-wise marking scheme)
const rubricsSchema = {
  type: Type.OBJECT,
  properties: {
    rubrics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question_id: { type: Type.STRING },
          question: { type: Type.STRING },
          section: { type: Type.STRING },
          marks: { type: Type.INTEGER },
          key_points: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          difficulty: { type: Type.STRING },
          blooms_level: { type: Type.STRING },
          topic: { type: Type.STRING },
          co: { type: Type.STRING },
          po: { type: Type.STRING },
          pso: { type: Type.STRING },
        },
        required: ['question_id', 'question', 'section', 'marks', 'key_points'],
      },
    },
    exam_total_marks: { type: Type.INTEGER },
  },
  required: ['rubrics', 'exam_total_marks'],
};

// Schema for Student Evaluation Output (Provided in prompt - kept as is)
const evaluationSchema = {
  /* ... (The extensive evaluationSchema from the prompt) ... */
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

// Interface for Rubrics job data
interface RubricsCreationJobData {
  evaluationId: string;
}
// Interface for Student Evaluation job data (simplified, worker will fetch file paths)
interface AIEvaluationJobData {
  evaluationId: string;
  submissionId: string;
}

// ----------------------------------------------------------------------
// 2. FILE HELPERS
// ----------------------------------------------------------------------

// Helper: safe file path conversion (Kept as is)
const toUploadsPath = (file?: string | null): string => {
  if (!file || typeof file !== 'string') return '';
  const cleanFile = file.replace(/^\/?api\/pdf\//, '');
  return path.join(process.cwd(), 'uploads', 'pdfs', cleanFile);
};

// Function to upload a file and return its URI and MIME type (Kept as is)
async function uploadFile(filePath: string, mimeType: string) {
  const myfile = await genAI.files.upload({
    file: filePath,
    config: { mimeType },
  });
  return myfile;
}

// Function to delete a file (Kept as is)
async function deleteFile(fileUri: { name?: string } | undefined) {
  if (!fileUri?.name) return;
  await genAI.files.delete({ name: fileUri.name });
}

// ----------------------------------------------------------------------
// 3. CORE AI FUNCTIONS
// ----------------------------------------------------------------------

/**
 * AI function to generate the question-wise rubrics JSON.
 */
async function generateRubrics(
  questionPaperPath: string,
  keyScriptPaths: string[],
  totalMarks: number
): Promise<any> {
  if (!questionPaperPath) throw new Error('Missing question paper path.');

  console.log('Uploading question paper for rubrics:', questionPaperPath);
  const questionPaper = await uploadFile(questionPaperPath, 'application/pdf');

  const keyScripts = await Promise.all(
    keyScriptPaths.map((ks) => uploadFile(ks, 'application/pdf'))
  );

  const contents = {
    role: 'user',
    parts: [
      {
        fileData: {
          fileUri: questionPaper.uri,
          mimeType: questionPaper.mimeType,
        },
      },
      ...keyScripts.map((ks) => ({
        fileData: { fileUri: ks.uri, mimeType: ks.mimeType },
      })),
      {
        text: `
GOAL: Analyze the Question Paper (and optional Key Scripts) to generate a detailed, question-wise marking scheme (rubric). Output must STRICTLY follow the JSON schema provided.

INPUTS: Question Paper, Key Scripts, and total exam marks (${totalMarks}).

ANALYSIS:
1. Extract ALL questions and their max marks.
2. For each question, list essential 'key_points' required for a full-mark answer.
3. Estimate Difficulty, Bloom's Level, Topic, CO, PO, and PSO if not explicit.

OUTPUT CONSTRAINT: Strictly JSON format, no preamble/postamble text.
`,
      },
    ],
  };

  try {
    const response: any = await genAI.models.generateContent({
      model: 'gemini-2.5-pro', // Pro model for complex reasoning tasks like rubrics
      contents: [contents],
      config: {
        responseMimeType: 'application/json',
        responseSchema: rubricsSchema,
      },
    });
    console.log(response);
    return JSON.parse(response.text);
  } finally {
    await Promise.all([
      deleteFile(questionPaper),
      ...keyScripts.map(deleteFile),
    ]);
  }
}

/**
 * AI function to evaluate student answers using pre-generated rubrics.
 */
async function evaluateStudentAnswers(
  rubricsJson: any,
  questionPaperPath: string,
  studentAnswerPath: string,
  totalMarks: number
): Promise<any> {
  if (!questionPaperPath || !studentAnswerPath)
    throw new Error('Missing file paths for evaluation');

  console.log('Uploading files for student scoring...');
  const questionPaper = await uploadFile(questionPaperPath, 'application/pdf');
  const studentAnswer = await uploadFile(studentAnswerPath, 'application/pdf');

  const contents = {
    role: 'user',
    parts: [
      {
        fileData: {
          fileUri: questionPaper.uri,
          mimeType: questionPaper.mimeType,
        },
      },
      {
        fileData: {
          fileUri: studentAnswer.uri,
          mimeType: studentAnswer.mimeType,
        },
      },
      // Send the generated rubrics as a JSON string
      { text: `Pre-Generated Rubrics (JSON): ${JSON.stringify(rubricsJson)}` },
      {
        text: `
GOAL: Evaluate the Student Answer Script against the Question Paper and the provided Pre-Generated Rubrics (Marking Scheme JSON). Output must STRICTLY follow the JSON schema provided.

EVALUATION RULES (Lenient Marking):
1. Score strictly based on the 'key_points' in the Rubrics JSON.
2. Award partial credit generously.
3. Mark ALL questions (attempted or unattempted).
4. ai_confidence need to be betweeen 20% to 100%.
5. image_index from 0 to length of pdf of student script, # please match the question id need to be in image index ( pdf page number ) # make attention here.

FEEDBACK & SCORING:
- Attempted: Provide detailed feedback. Populate the 'marking_scheme' array based on covered 'key_points'.
- Unattempted: Set marks_awarded to 0. Feedback must state "Not Attempted" or "Strike Off."

METADATA: Calculate totalMarkAwarded. Set AI_Confidence and teacher_intervention_required as per doubt.

OUTPUT CONSTRAINT: Strictly JSON format, no preamble/postamble text.
`,
      },
    ],
  };

  try {
    const response: any = await genAI.models.generateContent({
      model: 'gemini-2.5-flash', // Flash model is sufficient for scoring based on a provided rubric
      contents: [contents],
      config: {
        responseMimeType: 'application/json',
        responseSchema: evaluationSchema,
      },
    });
    return JSON.parse(response.text);
  } finally {
    await Promise.all([deleteFile(questionPaper), deleteFile(studentAnswer)]);
  }
}

// ----------------------------------------------------------------------
// 4. WORKER DEFINITIONS
// ----------------------------------------------------------------------

// A. RUBRICS WORKER (Job 1)
const rubricsWorker = new Worker<RubricsCreationJobData>(
  'rubrics-creation',
  async (job) => {
    console.log(
      `[RUBRICS] Processing job ${job.id} for evaluation ${job.data.evaluationId}`
    );
    const { evaluationId } = job.data;

    try {
      const evaluation = await prisma.evaluation.findUnique({
        where: { id: evaluationId },
      });
      if (!evaluation) throw new Error(`Evaluation ${evaluationId} not found`);

      const questionPaperPath = toUploadsPath(evaluation.questionPdf);
      const keyScriptPaths = evaluation.answerKey
        ? [toUploadsPath(evaluation.answerKey)]
        : [];
      const totalMarks = evaluation.maxMarks;

      if (!questionPaperPath)
        throw new Error('Question Paper not found for rubrics generation.');

      // 1. Generate Rubrics
      const rubricsResult = await generateRubrics(
        questionPaperPath,
        keyScriptPaths,
        totalMarks
      );

      // 2. Save Rubrics to DB and update status
      await prisma.evaluation.update({
        where: { id: evaluationId },
        data: {
          rubrics: rubricsResult, // Save the generated JSON rubrics
          rubricsGenerated: true,
          status: 'upload-pending', // Signal that scoring can begin
        },
      });

      // 3. Enqueue the individual evaluation jobs (Job Chaining)
      // await enqueueEvaluationJob(evaluationId);

      console.log(
        `[RUBRICS] Generated, saved, and scoring jobs enqueued for ${evaluationId}`
      );
      return rubricsResult;
    } catch (error) {
      console.error(`[RUBRICS] Error processing job ${job.id}:`, error);
      // Fail status for manual review
      await prisma.evaluation.update({
        where: { id: evaluationId },
        data: { status: 'rubrics-failed' },
      });
      throw error;
    }
  },
  { connection }
);

// B. AI EVALUATION WORKER (Job 2)
const aiEvaluationWorker = new Worker<AIEvaluationJobData>(
  'ai-evaluation',
  async (job) => {
    console.log(
      `[EVAL] Processing job ${job.id} for submission ${job.data.submissionId}`
    );
    const { evaluationId, submissionId } = job.data;

    try {
      const evaluation = await prisma.evaluation.findUnique({
        where: { id: evaluationId },
      });
      const submission = await prisma.evaluationSubmission.findUnique({
        where: { id: submissionId },
      });

      // === Pre-checks ===
      if (!evaluation || !submission)
        throw new Error('Evaluation or Submission not found.');
      if (!evaluation.rubricsGenerated || !evaluation.rubrics) {
        throw new Error('Rubrics not ready. This job should not have started.');
      }

      // 🟡 If marked absent, skip evaluation
      if (submission.status === 'absent') {
        console.log(`[EVAL] Skipping submission ${submissionId} (absent).`);

        await prisma.evaluationSubmission.update({
          where: { id: submissionId },
          data: { status: 'skipped' },
        });
      } else {
        // === Run Evaluation ===
        const questionPaperPath = toUploadsPath(evaluation.questionPdf);
        const studentAnswerPath = toUploadsPath(submission.scriptPdf);
        const rubricsJson = evaluation.rubrics;
        const totalMarks = evaluation.maxMarks ?? 0;

        // 1️⃣ Evaluate Student Answer using Rubrics
        const result = await evaluateStudentAnswers(
          rubricsJson,
          questionPaperPath,
          studentAnswerPath,
          totalMarks
        );

        // 2️⃣ Update Submission in DB
        await prisma.evaluationSubmission.update({
          where: { id: submissionId },
          data: {
            aiResult: result,
            totalMark: result.totalMarkAwarded,
            feedback:
              result.ai_data?.map((q: any) => q.feedback).join('\n') ?? '',
            status: 'evaluated',
          },
        });

        console.log(`[EVAL] Evaluated submission ${submissionId}`);
      }

      // 3️⃣ Check if all submissions are done (evaluated/skipped/absent)
      const pendingCount = await prisma.evaluationSubmission.count({
        where: {
          evaluationId,
          status: { notIn: ['evaluated', 'skipped', 'absent'] },
        },
      });

      if (pendingCount === 0) {
        await prisma.evaluation.update({
          where: { id: evaluationId },
          data: { status: 'evaluated' },
        });
        console.log(
          `[EVAL] ✅ Final evaluation ${evaluationId} marked as evaluated.`
        );
      }

      return { success: true };
    } catch (error) {
      console.error(`[EVAL] ❌ Error processing job ${job.id}:`, error);

      // ❗ Set submission to failed only if not absent
      await prisma.evaluationSubmission.update({
        where: { id: submissionId },
        data: { status: 'failed' },
      });

      throw error;
    }
  },
  { connection }
);

// Worker events (Kept as is)
rubricsWorker.on('completed', (job) =>
  console.log(`[RUBRICS] Job ${job.id} completed`)
);
rubricsWorker.on('failed', (job, err: Error) =>
  console.error(`[RUBRICS] Job ${job?.id} failed:`, err)
);

aiEvaluationWorker.on('completed', (job) =>
  console.log(`[EVAL] Job ${job.id} completed`)
);
aiEvaluationWorker.on('failed', (job, err: Error) =>
  console.error(`[EVAL] Job ${job?.id} failed:`, err)
);

console.log('AI Evaluation Workers started. Waiting for jobs...');
