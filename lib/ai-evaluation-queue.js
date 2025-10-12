"use strict";
// lib/ai-evaluation-queue.ts
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiEvaluationQueue = exports.rubricsQueue = void 0;
exports.enqueueRubricsCreationJob = enqueueRubricsCreationJob;
exports.enqueueEvaluationJob = enqueueEvaluationJob;
var bullmq_1 = require("bullmq");
var prisma_1 = require("./prisma");
var crypto = require("crypto"); // ✅ FIX: no default import!
// ----------------------------
// 🔧 Redis Connection Config
// ----------------------------
var connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
};
// ----------------------------
// 🧩 Utility: Safe Job ID Generator
// ----------------------------
function generateSafeJobId(prefix, id) {
    // BullMQ rejects colons (:) in IDs — hash ensures safety
    var hash = crypto.createHash('md5').update(id).digest('hex').slice(0, 8);
    return "".concat(prefix, "-").concat(hash);
}
// ----------------------------
// 🧠 Queues Setup
// ----------------------------
exports.rubricsQueue = new bullmq_1.Queue('rubrics-creation', { connection: connection });
exports.aiEvaluationQueue = new bullmq_1.Queue('ai-evaluation', { connection: connection });
// ----------------------------
// 🎯 Enqueue Rubrics Creation
// ----------------------------
function enqueueRubricsCreationJob(evaluationId) {
    return __awaiter(this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    // Update evaluation status
                    return [4 /*yield*/, prisma_1.prisma.evaluation.update({
                            where: { id: evaluationId },
                            data: { status: 'rubrics-generating' },
                        })];
                case 1:
                    // Update evaluation status
                    _a.sent();
                    // Queue the job
                    return [4 /*yield*/, exports.rubricsQueue.add('create-rubrics', { evaluationId: evaluationId }, { jobId: generateSafeJobId('rubrics', evaluationId) })];
                case 2:
                    // Queue the job
                    _a.sent();
                    console.log("\u2705 Rubrics creation job queued for evaluation ".concat(evaluationId));
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.error('❌ Failed to enqueue rubrics creation job:', err_1);
                    throw err_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
// ----------------------------
// 🤖 Enqueue AI Evaluation Jobs
// ----------------------------
function enqueueEvaluationJob(evaluationId) {
    return __awaiter(this, void 0, void 0, function () {
        var evaluation, submissions, jobs, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, prisma_1.prisma.evaluation.findUnique({
                            where: { id: evaluationId },
                            include: { submissions: true },
                        })];
                case 1:
                    evaluation = _a.sent();
                    if (!evaluation)
                        throw new Error("Evaluation not found: ".concat(evaluationId));
                    submissions = evaluation.submissions || [];
                    if (!(submissions.length === 0)) return [3 /*break*/, 3];
                    // No student submissions → mark directly as evaluated
                    return [4 /*yield*/, prisma_1.prisma.evaluation.update({
                            where: { id: evaluationId },
                            data: { status: 'evaluated' },
                        })];
                case 2:
                    // No student submissions → mark directly as evaluated
                    _a.sent();
                    console.log("\u2139\uFE0F No submissions found for evaluation ".concat(evaluationId));
                    return [2 /*return*/];
                case 3:
                    jobs = submissions.map(function (submission) { return ({
                        name: 'ai-evaluate',
                        data: {
                            evaluationId: evaluationId,
                            submissionId: submission.id,
                        },
                        opts: {
                            jobId: generateSafeJobId('eval', submission.id),
                        },
                    }); });
                    // Queue all jobs in bulk
                    return [4 /*yield*/, exports.aiEvaluationQueue.addBulk(jobs)];
                case 4:
                    // Queue all jobs in bulk
                    _a.sent();
                    // Update evaluation status
                    return [4 /*yield*/, prisma_1.prisma.evaluation.update({
                            where: { id: evaluationId },
                            data: { status: 'evaluating' },
                        })];
                case 5:
                    // Update evaluation status
                    _a.sent();
                    console.log("\u2705 Queued ".concat(jobs.length, " AI evaluation jobs for evaluation ").concat(evaluationId));
                    return [3 /*break*/, 7];
                case 6:
                    err_2 = _a.sent();
                    console.error('❌ Failed to enqueue AI evaluation jobs:', err_2);
                    throw err_2;
                case 7: return [2 /*return*/];
            }
        });
    });
}
