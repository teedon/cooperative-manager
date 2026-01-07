/*
  Warnings:

  - The `kycDocumentTypes` column on the `LoanType` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "LoanType" DROP COLUMN "kycDocumentTypes",
ADD COLUMN     "kycDocumentTypes" TEXT[] DEFAULT ARRAY[]::TEXT[];
