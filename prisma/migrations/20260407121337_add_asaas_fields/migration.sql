/*
  Warnings:

  - A unique constraint covering the columns `[asaasCheckoutId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "asaasCheckoutId" TEXT,
ADD COLUMN     "asaasCustomerId" TEXT,
ADD COLUMN     "asaasInvoiceUrl" TEXT,
ADD COLUMN     "asaasPaymentId" TEXT,
ADD COLUMN     "asaasPaymentStatus" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_asaasCheckoutId_key" ON "Order"("asaasCheckoutId");
