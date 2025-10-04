import { GoogleGenAI, Type } from '@google/genai';

const genAI = new GoogleGenAI({});

// Define the structured schema for the output based on the provided sample
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

// Function to upload a file and return its URI and MIME type
async function uploadFile(filePath: string, mimeType: string) {
  const myfile = await genAI.files.upload({
    file: filePath,
    config: { mimeType: mimeType },
  });

  return myfile;
}

async function deleteFile(fileUri) {
  await genAI.files.delete({ name: fileUri.name });
}

// Main function to process files and generate evaluation
export async function evaluateStudentAnswers(
  questionPaperPath: string,
  keyScriptPaths: string[] = [], // Optional key scripts
  studentAnswerPath: string,
  totalMarks: number // Provided total marks
): Promise<any> {
  // Upload question paper
  console.log('Uploading question paper:', questionPaperPath);
  const questionPaper = await uploadFile(questionPaperPath, 'application/pdf');

  // Upload optional key scripts
  const keyScripts = await Promise.all(
    keyScriptPaths.map((path) => uploadFile(path, 'application/pdf'))
  );

  // Upload student answer script
  const studentAnswer = await uploadFile(studentAnswerPath, 'application/pdf');

  // Prepare the content parts
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
        fileData: {
          fileUri: ks.uri,
          mimeType: ks.mimeType,
        },
      })),
      {
        fileData: {
          fileUri: studentAnswer.uri,
          mimeType: studentAnswer.mimeType,
        },
      },
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

  // Generate content with structured output
  const response : any = await genAI.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [contents],
    config: {
      responseMimeType: 'application/json',
      responseSchema: evaluationSchema,
    },
  });

  // Parse the JSON response
  const evaluation = JSON.parse(response.text);
  return evaluation;
}

// Example usage
async function main() {
  const questionPaper = '';
  const keyScripts = []; // Optional
  const studentAnswer = '';
  const totalMarks = 100; // As per sample

  try {
    const result = await evaluateStudentAnswers(
      questionPaper,
      keyScripts,
      studentAnswer,
      totalMarks
    );
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error);
