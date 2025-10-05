/*
  Warnings:

  - Made the column `aiResult` on table `EvaluationSubmission` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "EvaluationSubmission" ALTER COLUMN "aiResult" SET NOT NULL;
