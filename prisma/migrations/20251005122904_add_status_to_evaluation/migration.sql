-- AlterTable
ALTER TABLE "EvaluationResult" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'submitted';

-- AlterTable
ALTER TABLE "EvaluationSubmission" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'submitted';
