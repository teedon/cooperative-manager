-- AlterTable
ALTER TABLE "Cooperative" ADD COLUMN     "totalExpenses" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "LedgerEntry" ALTER COLUMN "memberId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "cooperativeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "cooperativeId" TEXT NOT NULL,
    "categoryId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" INTEGER NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "vendorName" TEXT,
    "vendorContact" TEXT,
    "receiptUrl" TEXT,
    "receiptNumber" TEXT,
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ledgerEntryId" TEXT,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpenseCategory_cooperativeId_idx" ON "ExpenseCategory"("cooperativeId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_cooperativeId_name_key" ON "ExpenseCategory"("cooperativeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_ledgerEntryId_key" ON "Expense"("ledgerEntryId");

-- CreateIndex
CREATE INDEX "Expense_cooperativeId_idx" ON "Expense"("cooperativeId");

-- CreateIndex
CREATE INDEX "Expense_categoryId_idx" ON "Expense"("categoryId");

-- CreateIndex
CREATE INDEX "Expense_status_idx" ON "Expense"("status");

-- CreateIndex
CREATE INDEX "Expense_expenseDate_idx" ON "Expense"("expenseDate");

-- CreateIndex
CREATE INDEX "Expense_createdBy_idx" ON "Expense"("createdBy");

-- AddForeignKey
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_ledgerEntryId_fkey" FOREIGN KEY ("ledgerEntryId") REFERENCES "LedgerEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
