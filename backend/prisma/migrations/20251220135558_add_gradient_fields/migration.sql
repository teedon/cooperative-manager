-- AlterTable
ALTER TABLE "Cooperative" ADD COLUMN     "gradientPreset" TEXT NOT NULL DEFAULT 'ocean',
ADD COLUMN     "useGradient" BOOLEAN NOT NULL DEFAULT true;
