-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "employeeCode" TEXT,
ADD COLUMN     "invitationType" TEXT NOT NULL DEFAULT 'cooperative',
ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "role" TEXT;

-- CreateIndex
CREATE INDEX "Invitation_organizationId_idx" ON "Invitation"("organizationId");

-- CreateIndex
CREATE INDEX "Invitation_invitationType_idx" ON "Invitation"("invitationType");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
