-- CreateTable
CREATE TABLE "PaymentSchedule" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "periodNumber" INTEGER NOT NULL,
    "periodLabel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidAmount" INTEGER NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentSchedule_subscriptionId_idx" ON "PaymentSchedule"("subscriptionId");

-- CreateIndex
CREATE INDEX "PaymentSchedule_dueDate_idx" ON "PaymentSchedule"("dueDate");

-- CreateIndex
CREATE INDEX "PaymentSchedule_status_idx" ON "PaymentSchedule"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentSchedule_subscriptionId_periodNumber_key" ON "PaymentSchedule"("subscriptionId", "periodNumber");

-- AddForeignKey
ALTER TABLE "PaymentSchedule" ADD CONSTRAINT "PaymentSchedule_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "ContributionSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSchedule" ADD CONSTRAINT "PaymentSchedule_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "ContributionPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
