/*
  Warnings:

  - You are about to drop the column `active` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `cancelAt` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `customerId` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `priceId` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Subscription` table. All the data in the column will be lost.
  - Added the required column `organizationId` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `planId` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Subscription_customerId_idx";

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "currentUsageId" TEXT,
ADD COLUMN     "planId" TEXT,
ADD COLUMN     "subscriptionId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT DEFAULT 'inactive';

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "limits" JSONB;

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "active",
DROP COLUMN "cancelAt",
DROP COLUMN "customerId",
DROP COLUMN "endDate",
DROP COLUMN "priceId",
DROP COLUMN "startDate",
ADD COLUMN     "currentEnd" TIMESTAMP(3),
ADD COLUMN     "currentStart" TIMESTAMP(3),
ADD COLUMN     "notes" JSONB,
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "planId" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'created';

-- CreateTable
CREATE TABLE "Usage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "usedTeachers" INTEGER NOT NULL DEFAULT 0,
    "usedStudents" INTEGER NOT NULL DEFAULT 0,
    "usedEvaluations" INTEGER NOT NULL DEFAULT 0,
    "usedAIEvaluations" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usage_organizationId_key" ON "Usage"("organizationId");

-- CreateIndex
CREATE INDEX "Usage_organizationId_idx" ON "Usage"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Usage_organizationId_periodStart_key" ON "Usage"("organizationId", "periodStart");

-- CreateIndex
CREATE INDEX "Subscription_organizationId_idx" ON "Subscription"("organizationId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usage" ADD CONSTRAINT "Usage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
