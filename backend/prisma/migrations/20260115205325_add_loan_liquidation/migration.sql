-- CreateTable
CREATE TABLE "LoanLiquidation" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "liquidationType" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "requestedAmount" INTEGER NOT NULL,
    "outstandingBalance" INTEGER NOT NULL,
    "principalAmount" INTEGER NOT NULL,
    "interestAmount" INTEGER NOT NULL,
    "earlyPaymentDiscount" INTEGER NOT NULL DEFAULT 0,
    "processingFee" INTEGER NOT NULL DEFAULT 0,
    "finalAmount" INTEGER NOT NULL,
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "receiptUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanLiquidation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoanLiquidation_loanId_idx" ON "LoanLiquidation"("loanId");

-- CreateIndex
CREATE INDEX "LoanLiquidation_status_idx" ON "LoanLiquidation"("status");

-- CreateIndex
CREATE INDEX "LoanLiquidation_requestedByUserId_idx" ON "LoanLiquidation"("requestedByUserId");

-- AddForeignKey
ALTER TABLE "LoanLiquidation" ADD CONSTRAINT "LoanLiquidation_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
