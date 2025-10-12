/*
  Warnings:

  - You are about to drop the column `status` on the `EvaluationResult` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Evaluation" ALTER COLUMN "status" SET DEFAULT 'rubrics-not-generated';

-- AlterTable
ALTER TABLE "EvaluationResult" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "EvaluationSubmission" ALTER COLUMN "status" SET DEFAULT 'not-uploaded';
