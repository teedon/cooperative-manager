-- AlterTable
ALTER TABLE "Cooperative" ADD COLUMN     "organizationId" TEXT;

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "logoUrl" TEXT,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissions" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terminatedAt" TIMESTAMP(3),
    "employeeCode" TEXT,
    "commission" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffGroupAssignment" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "cooperativeId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffGroupAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionSettings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requireApproval" BOOLEAN NOT NULL DEFAULT true,
    "allowPartialPosting" BOOLEAN NOT NULL DEFAULT false,
    "autoPostAfterHours" INTEGER,
    "minApprovers" INTEGER NOT NULL DEFAULT 1,
    "requireSupervisor" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCollection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "collectionDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectionReason" TEXT,
    "approvalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionTransaction" (
    "id" TEXT NOT NULL,
    "dailyCollectionId" TEXT NOT NULL,
    "cooperativeId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "contributionPaymentId" TEXT,
    "loanRepaymentId" TEXT,
    "ajoPaymentId" TEXT,
    "esusuContributionId" TEXT,
    "status" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Organization_type_idx" ON "Organization"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_userId_key" ON "Staff"("userId");

-- CreateIndex
CREATE INDEX "Staff_organizationId_idx" ON "Staff"("organizationId");

-- CreateIndex
CREATE INDEX "Staff_userId_idx" ON "Staff"("userId");

-- CreateIndex
CREATE INDEX "Staff_isActive_idx" ON "Staff"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_organizationId_employeeCode_key" ON "Staff"("organizationId", "employeeCode");

-- CreateIndex
CREATE INDEX "StaffGroupAssignment_staffId_idx" ON "StaffGroupAssignment"("staffId");

-- CreateIndex
CREATE INDEX "StaffGroupAssignment_cooperativeId_idx" ON "StaffGroupAssignment"("cooperativeId");

-- CreateIndex
CREATE INDEX "StaffGroupAssignment_isActive_idx" ON "StaffGroupAssignment"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "StaffGroupAssignment_staffId_cooperativeId_key" ON "StaffGroupAssignment"("staffId", "cooperativeId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionSettings_organizationId_key" ON "CollectionSettings"("organizationId");

-- CreateIndex
CREATE INDEX "DailyCollection_organizationId_idx" ON "DailyCollection"("organizationId");

-- CreateIndex
CREATE INDEX "DailyCollection_staffId_idx" ON "DailyCollection"("staffId");

-- CreateIndex
CREATE INDEX "DailyCollection_collectionDate_idx" ON "DailyCollection"("collectionDate");

-- CreateIndex
CREATE INDEX "DailyCollection_status_idx" ON "DailyCollection"("status");

-- CreateIndex
CREATE INDEX "DailyCollection_submittedAt_idx" ON "DailyCollection"("submittedAt");

-- CreateIndex
CREATE INDEX "CollectionTransaction_dailyCollectionId_idx" ON "CollectionTransaction"("dailyCollectionId");

-- CreateIndex
CREATE INDEX "CollectionTransaction_cooperativeId_idx" ON "CollectionTransaction"("cooperativeId");

-- CreateIndex
CREATE INDEX "CollectionTransaction_memberId_idx" ON "CollectionTransaction"("memberId");

-- CreateIndex
CREATE INDEX "CollectionTransaction_status_idx" ON "CollectionTransaction"("status");

-- CreateIndex
CREATE INDEX "CollectionTransaction_type_idx" ON "CollectionTransaction"("type");

-- CreateIndex
CREATE INDEX "Cooperative_organizationId_idx" ON "Cooperative"("organizationId");

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffGroupAssignment" ADD CONSTRAINT "StaffGroupAssignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffGroupAssignment" ADD CONSTRAINT "StaffGroupAssignment_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionSettings" ADD CONSTRAINT "CollectionSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCollection" ADD CONSTRAINT "DailyCollection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCollection" ADD CONSTRAINT "DailyCollection_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionTransaction" ADD CONSTRAINT "CollectionTransaction_dailyCollectionId_fkey" FOREIGN KEY ("dailyCollectionId") REFERENCES "DailyCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cooperative" ADD CONSTRAINT "Cooperative_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
