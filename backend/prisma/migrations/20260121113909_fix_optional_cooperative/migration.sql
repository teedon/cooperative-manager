-- DropForeignKey
ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_cooperativeId_fkey";

-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "cooperativeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE SET NULL ON UPDATE CASCADE;
