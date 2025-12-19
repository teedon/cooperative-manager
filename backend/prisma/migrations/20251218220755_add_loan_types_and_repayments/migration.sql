/*
  Warnings:

  - Added the required column `initiatedBy` to the `Loan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `interestAmount` to the `Loan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "amountDisbursed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "amountRepaid" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "deductionStartDate" TIMESTAMP(3),
ADD COLUMN     "initiatedBy" TEXT NOT NULL,
ADD COLUMN     "initiatedByUserId" TEXT,
ADD COLUMN     "interestAmount" INTEGER NOT NULL,
ADD COLUMN     "loanTypeId" TEXT,
ADD COLUMN     "outstandingBalance" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rejectionReason" TEXT,
ALTER COLUMN "interestRate" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "LoanType" (
    "id" TEXT NOT NULL,
    "cooperativeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "minAmount" INTEGER NOT NULL,
    "maxAmount" INTEGER NOT NULL,
    "minDuration" INTEGER NOT NULL,
    "maxDuration" INTEGER NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "interestType" TEXT NOT NULL,
    "minMembershipDuration" INTEGER,
    "minSavingsBalance" INTEGER,
    "maxActiveLoans" INTEGER NOT NULL DEFAULT 1,
    "requiresGuarantor" BOOLEAN NOT NULL DEFAULT false,
    "minGuarantors" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanRepaymentSchedule" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "principalAmount" INTEGER NOT NULL,
    "interestAmount" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanRepaymentSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoanType_cooperativeId_idx" ON "LoanType"("cooperativeId");

-- CreateIndex
CREATE UNIQUE INDEX "LoanType_cooperativeId_name_key" ON "LoanType"("cooperativeId", "name");

-- CreateIndex
CREATE INDEX "LoanRepaymentSchedule_loanId_idx" ON "LoanRepaymentSchedule"("loanId");

-- CreateIndex
CREATE INDEX "LoanRepaymentSchedule_dueDate_idx" ON "LoanRepaymentSchedule"("dueDate");

-- CreateIndex
CREATE INDEX "LoanRepaymentSchedule_status_idx" ON "LoanRepaymentSchedule"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LoanRepaymentSchedule_loanId_installmentNumber_key" ON "LoanRepaymentSchedule"("loanId", "installmentNumber");

-- CreateIndex
CREATE INDEX "Loan_cooperativeId_idx" ON "Loan"("cooperativeId");

-- CreateIndex
CREATE INDEX "Loan_memberId_idx" ON "Loan"("memberId");

-- CreateIndex
CREATE INDEX "Loan_status_idx" ON "Loan"("status");

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_loanTypeId_fkey" FOREIGN KEY ("loanTypeId") REFERENCES "LoanType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanRepaymentSchedule" ADD CONSTRAINT "LoanRepaymentSchedule_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
