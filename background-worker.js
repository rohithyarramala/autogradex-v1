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
var bullmq_1 = require("bullmq");
var genai_1 = require("@google/genai");
var prisma_1 = require("./lib/prisma"); // Adjust path to your prisma instance
var path = require("path");
require("dotenv/config");
// Redis connection configuration
var connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
};
// Initialize Google GenAI
var genAI = new genai_1.GoogleGenAI({});
// ----------------------------------------------------------------------
// 1. SCHEMAS AND INTERFACES
// ----------------------------------------------------------------------
// Schema for Rubrics Output (Question-wise marking scheme)
var rubricsSchema = {
    type: genai_1.Type.OBJECT,
    properties: {
        rubrics: {
            type: genai_1.Type.ARRAY,
            items: {
                type: genai_1.Type.OBJECT,
                properties: {
                    question_id: { type: genai_1.Type.STRING },
                    question: { type: genai_1.Type.STRING },
                    section: { type: genai_1.Type.STRING },
                    marks: { type: genai_1.Type.INTEGER },
                    key_points: {
                        type: genai_1.Type.ARRAY,
                        items: { type: genai_1.Type.STRING },
                    },
                    difficulty: { type: genai_1.Type.STRING },
                    blooms_level: { type: genai_1.Type.STRING },
                    topic: { type: genai_1.Type.STRING },
                    co: { type: genai_1.Type.STRING },
                    po: { type: genai_1.Type.STRING },
                    pso: { type: genai_1.Type.STRING },
                },
                required: ['question_id', 'question', 'section', 'marks', 'key_points'],
            },
        },
        exam_total_marks: { type: genai_1.Type.INTEGER },
    },
    required: ['rubrics', 'exam_total_marks'],
};
// Schema for Student Evaluation Output (Provided in prompt - kept as is)
var evaluationSchema = {
    /* ... (The extensive evaluationSchema from the prompt) ... */
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
// ----------------------------------------------------------------------
// 2. FILE HELPERS
// ----------------------------------------------------------------------
// Helper: safe file path conversion (Kept as is)
var toUploadsPath = function (file) {
    if (!file || typeof file !== 'string')
        return '';
    var cleanFile = file.replace(/^\/?api\/pdf\//, '');
    return path.join(process.cwd(), 'uploads', 'pdfs', cleanFile);
};
// Function to upload a file and return its URI and MIME type (Kept as is)
function uploadFile(filePath, mimeType) {
    return __awaiter(this, void 0, void 0, function () {
        var myfile;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, genAI.files.upload({
                        file: filePath,
                        config: { mimeType: mimeType },
                    })];
                case 1:
                    myfile = _a.sent();
                    return [2 /*return*/, myfile];
            }
        });
    });
}
// Function to delete a file (Kept as is)
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
// ----------------------------------------------------------------------
// 3. CORE AI FUNCTIONS
// ----------------------------------------------------------------------
/**
 * AI function to generate the question-wise rubrics JSON.
 */
function generateRubrics(questionPaperPath, keyScriptPaths, totalMarks) {
    return __awaiter(this, void 0, void 0, function () {
        var questionPaper, keyScripts, contents, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!questionPaperPath)
                        throw new Error('Missing question paper path.');
                    console.log('Uploading question paper for rubrics:', questionPaperPath);
                    return [4 /*yield*/, uploadFile(questionPaperPath, 'application/pdf')];
                case 1:
                    questionPaper = _a.sent();
                    return [4 /*yield*/, Promise.all(keyScriptPaths.map(function (ks) { return uploadFile(ks, 'application/pdf'); }))];
                case 2:
                    keyScripts = _a.sent();
                    contents = {
                        role: 'user',
                        parts: __spreadArray(__spreadArray([
                            {
                                fileData: {
                                    fileUri: questionPaper.uri,
                                    mimeType: questionPaper.mimeType,
                                },
                            }
                        ], keyScripts.map(function (ks) { return ({
                            fileData: { fileUri: ks.uri, mimeType: ks.mimeType },
                        }); }), true), [
                            {
                                text: "\nGOAL: Analyze the Question Paper (and optional Key Scripts) to generate a detailed, question-wise marking scheme (rubric). Output must STRICTLY follow the JSON schema provided.\n\nINPUTS: Question Paper, Key Scripts, and total exam marks (".concat(totalMarks, ").\n\nANALYSIS:\n1. Extract ALL questions and their max marks.\n2. For each question, list essential 'key_points' required for a full-mark answer.\n3. Estimate Difficulty, Bloom's Level, Topic, CO, PO, and PSO if not explicit.\n\nOUTPUT CONSTRAINT: Strictly JSON format, no preamble/postamble text.\n"),
                            },
                        ], false),
                    };
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, , 5, 7]);
                    return [4 /*yield*/, genAI.models.generateContent({
                            model: 'gemini-2.5-pro', // Pro model for complex reasoning tasks like rubrics
                            contents: [contents],
                            config: {
                                responseMimeType: 'application/json',
                                responseSchema: rubricsSchema,
                            },
                        })];
                case 4:
                    response = _a.sent();
                    console.log(response);
                    return [2 /*return*/, JSON.parse(response.text)];
                case 5: return [4 /*yield*/, Promise.all(__spreadArray([
                        deleteFile(questionPaper)
                    ], keyScripts.map(deleteFile), true))];
                case 6:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
/**
 * AI function to evaluate student answers using pre-generated rubrics.
 */
function evaluateStudentAnswers(rubricsJson, questionPaperPath, studentAnswerPath, totalMarks) {
    return __awaiter(this, void 0, void 0, function () {
        var questionPaper, studentAnswer, contents, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!questionPaperPath || !studentAnswerPath)
                        throw new Error('Missing file paths for evaluation');
                    console.log('Uploading files for student scoring...');
                    return [4 /*yield*/, uploadFile(questionPaperPath, 'application/pdf')];
                case 1:
                    questionPaper = _a.sent();
                    return [4 /*yield*/, uploadFile(studentAnswerPath, 'application/pdf')];
                case 2:
                    studentAnswer = _a.sent();
                    contents = {
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
                            { text: "Pre-Generated Rubrics (JSON): ".concat(JSON.stringify(rubricsJson)) },
                            {
                                text: "\nGOAL: Evaluate the Student Answer Script against the Question Paper and the provided Pre-Generated Rubrics (Marking Scheme JSON). Output must STRICTLY follow the JSON schema provided.\n\nEVALUATION RULES (Lenient Marking):\n1. Score strictly based on the 'key_points' in the Rubrics JSON.\n2. Award partial credit generously.\n3. Mark ALL questions (attempted or unattempted).\n4. ai_confidence need to be betweeen 20% to 100%.\n5. image_index from 0 to length of pdf of student script, # please match the question id need to be in image index ( pdf page number ) # make attention here.\n\nFEEDBACK & SCORING:\n- Attempted: Provide detailed feedback. Populate the 'marking_scheme' array based on covered 'key_points'.\n- Unattempted: Set marks_awarded to 0. Feedback must state \"Not Attempted\" or \"Strike Off.\"\n\nMETADATA: Calculate totalMarkAwarded. Set AI_Confidence and teacher_intervention_required as per doubt.\n\nOUTPUT CONSTRAINT: Strictly JSON format, no preamble/postamble text.\n",
                            },
                        ],
                    };
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, , 5, 7]);
                    return [4 /*yield*/, genAI.models.generateContent({
                            model: 'gemini-2.5-flash', // Flash model is sufficient for scoring based on a provided rubric
                            contents: [contents],
                            config: {
                                responseMimeType: 'application/json',
                                responseSchema: evaluationSchema,
                            },
                        })];
                case 4:
                    response = _a.sent();
                    return [2 /*return*/, JSON.parse(response.text)];
                case 5: return [4 /*yield*/, Promise.all([deleteFile(questionPaper), deleteFile(studentAnswer)])];
                case 6:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// ----------------------------------------------------------------------
// 4. WORKER DEFINITIONS
// ----------------------------------------------------------------------
// A. RUBRICS WORKER (Job 1)
var rubricsWorker = new bullmq_1.Worker('rubrics-creation', function (job) { return __awaiter(void 0, void 0, void 0, function () {
    var evaluationId, evaluation, questionPaperPath, keyScriptPaths, totalMarks, rubricsResult, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("[RUBRICS] Processing job ".concat(job.id, " for evaluation ").concat(job.data.evaluationId));
                evaluationId = job.data.evaluationId;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, , 7]);
                return [4 /*yield*/, prisma_1.prisma.evaluation.findUnique({
                        where: { id: evaluationId },
                    })];
            case 2:
                evaluation = _a.sent();
                if (!evaluation)
                    throw new Error("Evaluation ".concat(evaluationId, " not found"));
                questionPaperPath = toUploadsPath(evaluation.questionPdf);
                keyScriptPaths = evaluation.answerKey
                    ? [toUploadsPath(evaluation.answerKey)]
                    : [];
                totalMarks = evaluation.maxMarks;
                if (!questionPaperPath)
                    throw new Error('Question Paper not found for rubrics generation.');
                return [4 /*yield*/, generateRubrics(questionPaperPath, keyScriptPaths, totalMarks)];
            case 3:
                rubricsResult = _a.sent();
                // 2. Save Rubrics to DB and update status
                return [4 /*yield*/, prisma_1.prisma.evaluation.update({
                        where: { id: evaluationId },
                        data: {
                            rubrics: rubricsResult, // Save the generated JSON rubrics
                            rubricsGenerated: true,
                            status: 'upload-pending', // Signal that scoring can begin
                        },
                    })];
            case 4:
                // 2. Save Rubrics to DB and update status
                _a.sent();
                // 3. Enqueue the individual evaluation jobs (Job Chaining)
                // await enqueueEvaluationJob(evaluationId);
                console.log("[RUBRICS] Generated, saved, and scoring jobs enqueued for ".concat(evaluationId));
                return [2 /*return*/, rubricsResult];
            case 5:
                error_1 = _a.sent();
                console.error("[RUBRICS] Error processing job ".concat(job.id, ":"), error_1);
                // Fail status for manual review
                return [4 /*yield*/, prisma_1.prisma.evaluation.update({
                        where: { id: evaluationId },
                        data: { status: 'rubrics-failed' },
                    })];
            case 6:
                // Fail status for manual review
                _a.sent();
                throw error_1;
            case 7: return [2 /*return*/];
        }
    });
}); }, { connection: connection });
// B. AI EVALUATION WORKER (Job 2)
var aiEvaluationWorker = new bullmq_1.Worker('ai-evaluation', function (job) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, evaluationId, submissionId, evaluation, submission, questionPaperPath, studentAnswerPath, rubricsJson, totalMarks, result, pendingCount, error_2;
    var _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                console.log("[EVAL] Processing job ".concat(job.id, " for submission ").concat(job.data.submissionId));
                _a = job.data, evaluationId = _a.evaluationId, submissionId = _a.submissionId;
                _e.label = 1;
            case 1:
                _e.trys.push([1, 12, , 14]);
                return [4 /*yield*/, prisma_1.prisma.evaluation.findUnique({
                        where: { id: evaluationId },
                    })];
            case 2:
                evaluation = _e.sent();
                return [4 /*yield*/, prisma_1.prisma.evaluationSubmission.findUnique({
                        where: { id: submissionId },
                    })];
            case 3:
                submission = _e.sent();
                // === Pre-checks ===
                if (!evaluation || !submission)
                    throw new Error('Evaluation or Submission not found.');
                if (!evaluation.rubricsGenerated || !evaluation.rubrics) {
                    throw new Error('Rubrics not ready. This job should not have started.');
                }
                if (!(submission.status === 'absent')) return [3 /*break*/, 5];
                console.log("[EVAL] Skipping submission ".concat(submissionId, " (absent)."));
                return [4 /*yield*/, prisma_1.prisma.evaluationSubmission.update({
                        where: { id: submissionId },
                        data: { status: 'skipped' },
                    })];
            case 4:
                _e.sent();
                return [3 /*break*/, 8];
            case 5:
                questionPaperPath = toUploadsPath(evaluation.questionPdf);
                studentAnswerPath = toUploadsPath(submission.scriptPdf);
                rubricsJson = evaluation.rubrics;
                totalMarks = (_b = evaluation.maxMarks) !== null && _b !== void 0 ? _b : 0;
                return [4 /*yield*/, evaluateStudentAnswers(rubricsJson, questionPaperPath, studentAnswerPath, totalMarks)];
            case 6:
                result = _e.sent();
                // 2️⃣ Update Submission in DB
                return [4 /*yield*/, prisma_1.prisma.evaluationSubmission.update({
                        where: { id: submissionId },
                        data: {
                            aiResult: result,
                            totalMark: result.totalMarkAwarded,
                            feedback: (_d = (_c = result.ai_data) === null || _c === void 0 ? void 0 : _c.map(function (q) { return q.feedback; }).join('\n')) !== null && _d !== void 0 ? _d : '',
                            status: 'evaluated',
                        },
                    })];
            case 7:
                // 2️⃣ Update Submission in DB
                _e.sent();
                console.log("[EVAL] Evaluated submission ".concat(submissionId));
                _e.label = 8;
            case 8: return [4 /*yield*/, prisma_1.prisma.evaluationSubmission.count({
                    where: {
                        evaluationId: evaluationId,
                        status: { notIn: ['evaluated', 'skipped', 'absent'] },
                    },
                })];
            case 9:
                pendingCount = _e.sent();
                if (!(pendingCount === 0)) return [3 /*break*/, 11];
                return [4 /*yield*/, prisma_1.prisma.evaluation.update({
                        where: { id: evaluationId },
                        data: { status: 'evaluated' },
                    })];
            case 10:
                _e.sent();
                console.log("[EVAL] \u2705 Final evaluation ".concat(evaluationId, " marked as evaluated."));
                _e.label = 11;
            case 11: return [2 /*return*/, { success: true }];
            case 12:
                error_2 = _e.sent();
                console.error("[EVAL] \u274C Error processing job ".concat(job.id, ":"), error_2);
                // ❗ Set submission to failed only if not absent
                return [4 /*yield*/, prisma_1.prisma.evaluationSubmission.update({
                        where: { id: submissionId },
                        data: { status: 'failed' },
                    })];
            case 13:
                // ❗ Set submission to failed only if not absent
                _e.sent();
                throw error_2;
            case 14: return [2 /*return*/];
        }
    });
}); }, { connection: connection });
// Worker events (Kept as is)
rubricsWorker.on('completed', function (job) {
    return console.log("[RUBRICS] Job ".concat(job.id, " completed"));
});
rubricsWorker.on('failed', function (job, err) {
    return console.error("[RUBRICS] Job ".concat(job === null || job === void 0 ? void 0 : job.id, " failed:"), err);
});
aiEvaluationWorker.on('completed', function (job) {
    return console.log("[EVAL] Job ".concat(job.id, " completed"));
});
aiEvaluationWorker.on('failed', function (job, err) {
    return console.error("[EVAL] Job ".concat(job === null || job === void 0 ? void 0 : job.id, " failed:"), err);
});
console.log('AI Evaluation Workers started. Waiting for jobs...');
