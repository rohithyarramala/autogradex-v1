/*
  Warnings:

  - Added the required column `maxMarks` to the `Evaluation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN     "maxMarks" INTEGER NOT NULL;
