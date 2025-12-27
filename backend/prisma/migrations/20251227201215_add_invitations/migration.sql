-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "cooperativeId" TEXT NOT NULL,
    "inviterId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "message" TEXT,
    "code" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "acceptedBy" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");

-- CreateIndex
CREATE INDEX "Invitation_cooperativeId_idx" ON "Invitation"("cooperativeId");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
