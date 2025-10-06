'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiEvaluationQueue = void 0;
exports.enqueueAiEvaluation = enqueueAiEvaluation;
var bullmq_1 = require("bullmq");
var genai_1 = require("@google/genai");
var prisma_1 = require("./lib/prisma");
var path = require("path");
require("dotenv/config");
// Redis connection configuration
var connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
};
// Initialize Google GenAI
var genAI = new genai_1.GoogleGenAI({});
// Define the structured schema for the evaluation output
var evaluationSchema = {
    type: genai_1.Type.OBJECT,
    properties: {
        ai_data: {
            type: genai_1.Type.ARRAY,
            items: {
                type: genai_1.Type.OBJECT,
                properties: {
                    image_index: { type: genai_1.Type.INTEGER },
                    section: { type: genai_1.Type.STRING },
                    question_id: { type: genai_1.Type.STRING },
                    question: { type: genai_1.Type.STRING },
                    marks: { type: genai_1.Type.INTEGER },
                    marks_awarded: { type: genai_1.Type.INTEGER },
                    feedback: { type: genai_1.Type.STRING },
                    difficulty: { type: genai_1.Type.STRING },
                    blooms_level: { type: genai_1.Type.STRING },
                    topic: { type: genai_1.Type.STRING },
                    co: { type: genai_1.Type.STRING },
                    po: { type: genai_1.Type.STRING },
                    pso: { type: genai_1.Type.STRING },
                    ai_confidence: { type: genai_1.Type.INTEGER },
                    teacher_intervention_required: { type: genai_1.Type.BOOLEAN },
                    marking_scheme: {
                        type: genai_1.Type.ARRAY,
                        items: {
                            type: genai_1.Type.OBJECT,
                            properties: {
                                point: { type: genai_1.Type.STRING },
                                mark: { type: genai_1.Type.INTEGER },
                                status: { type: genai_1.Type.BOOLEAN },
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
        totalMarkAwarded: { type: genai_1.Type.INTEGER },
        totalMarks: { type: genai_1.Type.INTEGER },
    },
    required: ['ai_data', 'totalMarkAwarded', 'totalMarks'],
    propertyOrdering: ['ai_data', 'totalMarkAwarded', 'totalMarks'],
};
// Helper: safe file path conversion
var toUploadsPath = function (file) {
    if (!file || typeof file !== 'string')
        return '';
    var cleanFile = file.replace(/^\/?api\/pdf\//, '');
    // Absolute path to avoid worker issues
    return path.join(process.cwd(), 'uploads', 'pdfs', cleanFile);
};
// Function to upload a file and return its URI and MIME type
function uploadFile(filePath, mimeType) {
    return __awaiter(this, void 0, void 0, function () {
        var myfile;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, genAI.files.upload({ file: filePath, config: { mimeType: mimeType } })];
                case 1:
                    myfile = _a.sent();
                    return [2 /*return*/, myfile];
            }
        });
    });
}
// Function to delete a file
function deleteFile(fileUri) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(fileUri === null || fileUri === void 0 ? void 0 : fileUri.name))
                        return [2 /*return*/];
                    return [4 /*yield*/, genAI.files.delete({ name: fileUri.name })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Function to evaluate student answers
function evaluateStudentAnswers(questionPaperPath_1) {
    return __awaiter(this, arguments, void 0, function (questionPaperPath, keyScriptPaths, studentAnswerPath, totalMarks) {
        var questionPaper, keyScripts, studentAnswer, contents, response, evaluation;
        if (keyScriptPaths === void 0) { keyScriptPaths = []; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!questionPaperPath || !studentAnswerPath) {
                        throw new Error('Missing required file paths for evaluation');
                    }
                    console.log('Uploading question paper:', questionPaperPath);
                    return [4 /*yield*/, uploadFile(questionPaperPath, 'application/pdf')];
                case 1:
                    questionPaper = _a.sent();
                    return [4 /*yield*/, Promise.all(keyScriptPaths.map(function (ks) { return uploadFile(ks, 'application/pdf'); }))];
                case 2:
                    keyScripts = _a.sent();
                    return [4 /*yield*/, uploadFile(studentAnswerPath, 'application/pdf')];
                case 3:
                    studentAnswer = _a.sent();
                    contents = {
                        role: 'user',
                        parts: __spreadArray(__spreadArray([
                            { fileData: { fileUri: questionPaper.uri, mimeType: questionPaper.mimeType } }
                        ], keyScripts.map(function (ks) { return ({ fileData: { fileUri: ks.uri, mimeType: ks.mimeType } }); }), true), [
                            { fileData: { fileUri: studentAnswer.uri, mimeType: studentAnswer.mimeType } },
                            {
                                text: "\nGOAL: Fully evaluate the Student Answer Script against the Question Paper and Key Scripts, generating a final output that is strictly a single JSON object following the defined schema.\n\nINPUT REQUIREMENTS:\n\nQuestion Paper, Student Answer Script (PDF with page indexing), Key Scripts, and the total marks for the exam (".concat(totalMarks, ").\n\nEVALUATION RULES (Lenient/Favorable Marking):\n\nMarking Standard: Adopt a lenient and favorable marking policy (\"in favorision only not much strict\"). Award partial credit generously based on demonstrated effort and understanding.\n\nExtraction: Extract and include ALL questions from the Question Paper in the output, regardless of whether they were attempted.\n\nReferencing: Accurately match each question to the student's answer using the specific image_index (PDF page reference/s).\n\nFEEDBACK & SCORING PROTOCOL:\n\nAttempted Questions: Provide detailed, specific feedback on the content. Do not state \"Not Attempted.\"\n\nUnattempted Questions:\n\nSet the marks_awarded to 0.\n\nThe feedback must explicitly state \"Not Attempted\" or \"Strike Off.\"\n\nREQUIRED METADATA & FINAL CALCULATION:\n\nAI Confidence: Set AI_Conficence to a value between 0 and 100, reflecting the certainty of the evaluation.\n\nIntervention Flag: Set teacher_intervention_required to true if there is any doubt regarding the correctness of the answer or the assigned marks.\n\nFinal Tally: Calculate totalMarkAwarded as the precise sum of all individual marks_awarded.\n\nOUTPUT CONSTRAINT: Verify the accuracy of all questions and awarded marks. The final output must be strictly in JSON format without any additional introductory or concluding text.\n"),
                            },
                        ], false),
                    };
                    return [4 /*yield*/, genAI.models.generateContent({
                            model: 'gemini-2.0-flash',
                            contents: [contents],
                            config: { responseMimeType: 'application/json', responseSchema: evaluationSchema },
                        })];
                case 4:
                    response = _a.sent();
                    evaluation = JSON.parse(response.text);
                    return [4 /*yield*/, Promise.all(__spreadArray(__spreadArray([deleteFile(questionPaper)], keyScripts.map(deleteFile), true), [deleteFile(studentAnswer)], false))];
                case 5:
                    _a.sent();
                    return [2 /*return*/, evaluation];
            }
        });
    });
}
// Create the BullMQ queue
exports.aiEvaluationQueue = new bullmq_1.Queue('ai-evaluation', { connection: connection });
// Create the BullMQ worker
var worker = new bullmq_1.Worker('ai-evaluation', function (job) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, evaluationId, submissionId, evaluation, submission, questionPaperPath, keyScriptPaths, studentAnswerPath, totalMarks, result, submissions, allEvaluated, error_1;
    var _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                console.log("Processing job ".concat(job.id, " for submission ").concat(job.data));
                console.log('Job data:', job.data);
                _a = job.data, evaluationId = _a.evaluationId, submissionId = _a.submissionId;
                _e.label = 1;
            case 1:
                _e.trys.push([1, 10, , 11]);
                return [4 /*yield*/, prisma_1.prisma.evaluation.findUnique({ where: { id: evaluationId } })];
            case 2:
                evaluation = _e.sent();
                return [4 /*yield*/, prisma_1.prisma.evaluationSubmission.findUnique({ where: { id: submissionId } })];
            case 3:
                submission = _e.sent();
                questionPaperPath = toUploadsPath(evaluation === null || evaluation === void 0 ? void 0 : evaluation.questionPdf);
                keyScriptPaths = (evaluation === null || evaluation === void 0 ? void 0 : evaluation.answerKey) ? [toUploadsPath(evaluation.answerKey)] : [];
                studentAnswerPath = toUploadsPath(submission === null || submission === void 0 ? void 0 : submission.scriptPdf);
                totalMarks = (_b = evaluation === null || evaluation === void 0 ? void 0 : evaluation.maxMarks) !== null && _b !== void 0 ? _b : 0;
                if (!questionPaperPath || !studentAnswerPath)
                    throw new Error('Missing file paths for evaluation');
                return [4 /*yield*/, evaluateStudentAnswers(questionPaperPath, keyScriptPaths, studentAnswerPath, totalMarks)];
            case 4:
                result = _e.sent();
                return [4 /*yield*/, prisma_1.prisma.evaluationSubmission.update({
                        where: { id: submissionId },
                        data: {
                            aiResult: result,
                            totalMark: result.totalMarkAwarded,
                            feedback: (_d = (_c = result.ai_data) === null || _c === void 0 ? void 0 : _c.map(function (q) { return q.feedback; }).join('\n')) !== null && _d !== void 0 ? _d : '',
                            status: 'evaluated',
                        },
                    })];
            case 5:
                _e.sent();
                return [4 /*yield*/, prisma_1.prisma.evaluationSubmission.findMany({
                        where: { evaluationId: evaluationId },
                    })];
            case 6:
                submissions = _e.sent();
                allEvaluated = submissions.every(function (sub) { return sub.status === 'evaluated'; });
                if (!allEvaluated) return [3 /*break*/, 8];
                // Update the evaluation status to 'evaluated'
                return [4 /*yield*/, prisma_1.prisma.evaluation.update({
                        where: { id: evaluationId },
                        data: { status: 'evaluated' },
                    })];
            case 7:
                // Update the evaluation status to 'evaluated'
                _e.sent();
                console.log("Evaluation ".concat(evaluationId, " status updated to 'evaluated'"));
                return [3 /*break*/, 9];
            case 8:
                console.log("Evaluation ".concat(evaluationId, " has pending submissions; status not updated"));
                _e.label = 9;
            case 9:
                console.log("Processed AI evaluation for submission ".concat(submissionId));
                return [2 /*return*/, result];
            case 10:
                error_1 = _e.sent();
                console.error("Error processing job ".concat(job.id, " for submission ").concat(submissionId, ":"), error_1);
                throw error_1;
            case 11: return [2 /*return*/];
        }
    });
}); }, { connection: connection });
// Worker events
worker.on('completed', function (job) { return console.log("Job ".concat(job.id, " completed")); });
worker.on('failed', function (job, err) { return console.error("Job ".concat(job === null || job === void 0 ? void 0 : job.id, " failed:"), err); });
// Function to add a job to the queue
function enqueueAiEvaluation(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var evaluationId = _b.evaluationId, studentId = _b.studentId, submissionId = _b.submissionId, questionPdf = _b.questionPdf, keyScripts = _b.keyScripts, answerScript = _b.answerScript, totalMarks = _b.totalMarks;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, exports.aiEvaluationQueue.add('evaluate', {
                        evaluationId: evaluationId,
                        studentId: studentId,
                        submissionId: submissionId,
                        questionPaperPath: path.resolve(questionPdf),
                        keyScriptPaths: keyScripts.map(function (ks) { return path.resolve(ks); }),
                        studentAnswerPath: path.resolve(answerScript),
                        totalMarks: totalMarks,
                    })];
                case 1:
                    _c.sent();
                    console.log("Enqueued AI evaluation for submission ".concat(submissionId));
                    return [2 /*return*/];
            }
        });
    });
}
console.log('AI Evaluation Worker started. Waiting for jobs...');
