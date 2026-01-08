-- CreateTable
CREATE TABLE "EsusuSettings" (
    "id" TEXT NOT NULL,
    "cooperativeId" TEXT NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultFrequency" TEXT NOT NULL DEFAULT 'monthly',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EsusuSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Esusu" (
    "id" TEXT NOT NULL,
    "cooperativeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "contributionAmount" INTEGER NOT NULL,
    "frequency" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "totalCycles" INTEGER NOT NULL,
    "currentCycle" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "invitationDeadline" TIMESTAMP(3) NOT NULL,
    "isOrderDetermined" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Esusu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EsusuMember" (
    "id" TEXT NOT NULL,
    "esusuId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "collectionOrder" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "hasCollected" BOOLEAN NOT NULL DEFAULT false,
    "collectionCycle" INTEGER,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EsusuMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EsusuContribution" (
    "id" TEXT NOT NULL,
    "esusuId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "cycleNumber" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referenceNumber" TEXT,
    "recordedBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EsusuContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EsusuCollection" (
    "id" TEXT NOT NULL,
    "esusuId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "cycleNumber" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "commission" INTEGER NOT NULL DEFAULT 0,
    "netAmount" INTEGER NOT NULL,
    "collectionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disbursedBy" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EsusuCollection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EsusuSettings_cooperativeId_key" ON "EsusuSettings"("cooperativeId");

-- CreateIndex
CREATE INDEX "Esusu_cooperativeId_idx" ON "Esusu"("cooperativeId");

-- CreateIndex
CREATE INDEX "Esusu_status_idx" ON "Esusu"("status");

-- CreateIndex
CREATE INDEX "EsusuMember_esusuId_idx" ON "EsusuMember"("esusuId");

-- CreateIndex
CREATE INDEX "EsusuMember_memberId_idx" ON "EsusuMember"("memberId");

-- CreateIndex
CREATE INDEX "EsusuMember_status_idx" ON "EsusuMember"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EsusuMember_esusuId_memberId_key" ON "EsusuMember"("esusuId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "EsusuMember_esusuId_collectionOrder_key" ON "EsusuMember"("esusuId", "collectionOrder");

-- CreateIndex
CREATE INDEX "EsusuContribution_esusuId_idx" ON "EsusuContribution"("esusuId");

-- CreateIndex
CREATE INDEX "EsusuContribution_memberId_idx" ON "EsusuContribution"("memberId");

-- CreateIndex
CREATE INDEX "EsusuContribution_cycleNumber_idx" ON "EsusuContribution"("cycleNumber");

-- CreateIndex
CREATE UNIQUE INDEX "EsusuContribution_esusuId_memberId_cycleNumber_key" ON "EsusuContribution"("esusuId", "memberId", "cycleNumber");

-- CreateIndex
CREATE INDEX "EsusuCollection_esusuId_idx" ON "EsusuCollection"("esusuId");

-- CreateIndex
CREATE INDEX "EsusuCollection_memberId_idx" ON "EsusuCollection"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "EsusuCollection_esusuId_cycleNumber_key" ON "EsusuCollection"("esusuId", "cycleNumber");

-- AddForeignKey
ALTER TABLE "EsusuSettings" ADD CONSTRAINT "EsusuSettings_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Esusu" ADD CONSTRAINT "Esusu_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EsusuMember" ADD CONSTRAINT "EsusuMember_esusuId_fkey" FOREIGN KEY ("esusuId") REFERENCES "Esusu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EsusuMember" ADD CONSTRAINT "EsusuMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EsusuContribution" ADD CONSTRAINT "EsusuContribution_esusuId_fkey" FOREIGN KEY ("esusuId") REFERENCES "Esusu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EsusuContribution" ADD CONSTRAINT "EsusuContribution_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EsusuCollection" ADD CONSTRAINT "EsusuCollection_esusuId_fkey" FOREIGN KEY ("esusuId") REFERENCES "Esusu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EsusuCollection" ADD CONSTRAINT "EsusuCollection_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "EsusuMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
