-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" INTEGER NOT NULL DEFAULT 0,
    "yearlyPrice" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "maxMembers" INTEGER NOT NULL DEFAULT 20,
    "maxContributionPlans" INTEGER NOT NULL DEFAULT 1,
    "maxLoansPerMonth" INTEGER NOT NULL DEFAULT 0,
    "maxGroupBuys" INTEGER NOT NULL DEFAULT 0,
    "features" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "cooperativeId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "trialEndsAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "paystackCustomerCode" TEXT,
    "paystackSubscriptionCode" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paystackReference" TEXT NOT NULL,
    "paystackTransactionId" TEXT,
    "paystackPaidAt" TIMESTAMP(3),
    "paystackChannel" TEXT,
    "cardLast4" TEXT,
    "cardBrand" TEXT,
    "cardExpMonth" TEXT,
    "cardExpYear" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaystackWebhookEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaystackWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON "SubscriptionPlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_cooperativeId_key" ON "Subscription"("cooperativeId");

-- CreateIndex
CREATE INDEX "Subscription_cooperativeId_idx" ON "Subscription"("cooperativeId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPayment_paystackReference_key" ON "SubscriptionPayment"("paystackReference");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_subscriptionId_idx" ON "SubscriptionPayment"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_paystackReference_idx" ON "SubscriptionPayment"("paystackReference");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_status_idx" ON "SubscriptionPayment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PaystackWebhookEvent_eventId_key" ON "PaystackWebhookEvent"("eventId");

-- CreateIndex
CREATE INDEX "PaystackWebhookEvent_eventType_idx" ON "PaystackWebhookEvent"("eventType");

-- CreateIndex
CREATE INDEX "PaystackWebhookEvent_processed_idx" ON "PaystackWebhookEvent"("processed");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
