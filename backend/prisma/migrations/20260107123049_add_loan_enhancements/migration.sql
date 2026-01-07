-- AlterTable
ALTER TABLE "LoanType" ADD COLUMN     "kycDocumentTypes" TEXT,
ADD COLUMN     "minApprovers" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "requiresKyc" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiresMultipleApprovals" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "LoanGuarantor" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "guarantorMemberId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "respondedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanGuarantor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanKycDocument" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanKycDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanApproval" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "approverUserId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "comments" TEXT,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoanGuarantor_loanId_idx" ON "LoanGuarantor"("loanId");

-- CreateIndex
CREATE INDEX "LoanGuarantor_guarantorMemberId_idx" ON "LoanGuarantor"("guarantorMemberId");

-- CreateIndex
CREATE INDEX "LoanGuarantor_status_idx" ON "LoanGuarantor"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LoanGuarantor_loanId_guarantorMemberId_key" ON "LoanGuarantor"("loanId", "guarantorMemberId");

-- CreateIndex
CREATE INDEX "LoanKycDocument_loanId_idx" ON "LoanKycDocument"("loanId");

-- CreateIndex
CREATE INDEX "LoanKycDocument_status_idx" ON "LoanKycDocument"("status");

-- CreateIndex
CREATE INDEX "LoanApproval_loanId_idx" ON "LoanApproval"("loanId");

-- CreateIndex
CREATE INDEX "LoanApproval_approverUserId_idx" ON "LoanApproval"("approverUserId");

-- CreateIndex
CREATE UNIQUE INDEX "LoanApproval_loanId_approverUserId_key" ON "LoanApproval"("loanId", "approverUserId");

-- AddForeignKey
ALTER TABLE "LoanGuarantor" ADD CONSTRAINT "LoanGuarantor_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanKycDocument" ADD CONSTRAINT "LoanKycDocument_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanApproval" ADD CONSTRAINT "LoanApproval_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
