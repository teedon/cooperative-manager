-- CreateTable
CREATE TABLE "AppDownload" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "version" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppDownload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppDownload_platform_idx" ON "AppDownload"("platform");

-- CreateIndex
CREATE INDEX "AppDownload_downloadedAt_idx" ON "AppDownload"("downloadedAt");
