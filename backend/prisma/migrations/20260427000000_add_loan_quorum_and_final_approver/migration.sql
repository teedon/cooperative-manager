-- AlterTable: Loan - add quorum rejection and final approver fields
ALTER TABLE "Loan" ADD COLUMN "finalApproverUserId" TEXT;
ALTER TABLE "Loan" ADD COLUMN "counterOfferedAmount" INTEGER;
ALTER TABLE "Loan" ADD COLUMN "counterOfferedAt" TIMESTAMP(3);
ALTER TABLE "Loan" ADD COLUMN "counterOfferNotes" TEXT;
ALTER TABLE "Loan" ADD COLUMN "memberCounterOfferResponse" TEXT;
ALTER TABLE "Loan" ADD COLUMN "memberCounterOfferRespondedAt" TIMESTAMP(3);

-- AlterTable: LoanType - add final approver workflow fields
ALTER TABLE "LoanType" ADD COLUMN "requiresFinalApprover" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LoanType" ADD COLUMN "finalApproverUserId" TEXT;
