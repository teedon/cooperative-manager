/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,userId]` on the table `Staff` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Staff_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Staff_organizationId_userId_key" ON "Staff"("organizationId", "userId");
