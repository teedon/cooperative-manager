/*
  Warnings:

  - You are about to drop the column `amount` on the `ContributionPlan` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `ContributionPlan` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `ContributionPlan` table. All the data in the column will be lost.
  - Added the required column `amountType` to the `ContributionPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `ContributionPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contributionType` to the `ContributionPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `ContributionPlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ContributionPlan" DROP COLUMN "amount",
DROP COLUMN "duration",
DROP COLUMN "type",
ADD COLUMN     "amountType" TEXT NOT NULL,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "contributionType" TEXT NOT NULL,
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "fixedAmount" INTEGER,
ADD COLUMN     "maxAmount" INTEGER,
ADD COLUMN     "minAmount" INTEGER,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ContributionSubscription" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pausedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContributionSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContributionSubscription_planId_memberId_key" ON "ContributionSubscription"("planId", "memberId");

-- AddForeignKey
ALTER TABLE "ContributionSubscription" ADD CONSTRAINT "ContributionSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ContributionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionSubscription" ADD CONSTRAINT "ContributionSubscription_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
