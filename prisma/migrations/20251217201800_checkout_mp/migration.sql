/*
  Warnings:

  - A unique constraint covering the columns `[mpPreferenceId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "confirmationEmailSentAt" TIMESTAMP(3),
ADD COLUMN     "mpPaymentId" TEXT,
ADD COLUMN     "mpPaymentStatus" TEXT,
ADD COLUMN     "mpPreferenceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_mpPreferenceId_key" ON "Order"("mpPreferenceId");
