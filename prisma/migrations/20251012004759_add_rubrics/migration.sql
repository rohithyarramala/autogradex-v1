-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN     "rubrics" JSONB,
ADD COLUMN     "rubricsGenerated" BOOLEAN;
