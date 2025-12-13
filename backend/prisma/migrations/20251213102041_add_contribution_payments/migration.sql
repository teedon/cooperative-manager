-- AlterTable
ALTER TABLE "ContributionSubscription" ADD COLUMN     "totalPaid" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ContributionPayment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContributionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContributionPayment_subscriptionId_idx" ON "ContributionPayment"("subscriptionId");

-- CreateIndex
CREATE INDEX "ContributionPayment_memberId_idx" ON "ContributionPayment"("memberId");

-- CreateIndex
CREATE INDEX "ContributionPayment_status_idx" ON "ContributionPayment"("status");

-- AddForeignKey
ALTER TABLE "ContributionPayment" ADD CONSTRAINT "ContributionPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "ContributionSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionPayment" ADD CONSTRAINT "ContributionPayment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
