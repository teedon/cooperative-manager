-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "applicationFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "interestDeductedUpfront" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "netDisbursementAmount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "LoanType" ADD COLUMN     "applicationFee" INTEGER,
ADD COLUMN     "deductInterestUpfront" BOOLEAN NOT NULL DEFAULT false;
