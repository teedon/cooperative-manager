-- CreateTable
CREATE TABLE "AjoSettings" (
    "id" TEXT NOT NULL,
    "cooperativeId" TEXT NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "interestRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AjoSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ajo" (
    "id" TEXT NOT NULL,
    "cooperativeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" INTEGER NOT NULL,
    "frequency" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isContinuous" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AjoMember" (
    "id" TEXT NOT NULL,
    "ajoId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalPaid" INTEGER NOT NULL DEFAULT 0,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AjoMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AjoPayment" (
    "id" TEXT NOT NULL,
    "ajoId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referenceNumber" TEXT,
    "recordedBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AjoPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AjoSettings_cooperativeId_key" ON "AjoSettings"("cooperativeId");

-- CreateIndex
CREATE INDEX "Ajo_cooperativeId_idx" ON "Ajo"("cooperativeId");

-- CreateIndex
CREATE INDEX "Ajo_status_idx" ON "Ajo"("status");

-- CreateIndex
CREATE INDEX "AjoMember_ajoId_idx" ON "AjoMember"("ajoId");

-- CreateIndex
CREATE INDEX "AjoMember_memberId_idx" ON "AjoMember"("memberId");

-- CreateIndex
CREATE INDEX "AjoMember_status_idx" ON "AjoMember"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AjoMember_ajoId_memberId_key" ON "AjoMember"("ajoId", "memberId");

-- CreateIndex
CREATE INDEX "AjoPayment_ajoId_idx" ON "AjoPayment"("ajoId");

-- CreateIndex
CREATE INDEX "AjoPayment_memberId_idx" ON "AjoPayment"("memberId");

-- CreateIndex
CREATE INDEX "AjoPayment_paymentDate_idx" ON "AjoPayment"("paymentDate");

-- AddForeignKey
ALTER TABLE "AjoSettings" ADD CONSTRAINT "AjoSettings_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ajo" ADD CONSTRAINT "Ajo_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AjoMember" ADD CONSTRAINT "AjoMember_ajoId_fkey" FOREIGN KEY ("ajoId") REFERENCES "Ajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AjoMember" ADD CONSTRAINT "AjoMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AjoPayment" ADD CONSTRAINT "AjoPayment_ajoId_fkey" FOREIGN KEY ("ajoId") REFERENCES "Ajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AjoPayment" ADD CONSTRAINT "AjoPayment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
