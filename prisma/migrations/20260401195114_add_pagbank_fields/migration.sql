/*
  Warnings:

  - A unique constraint covering the columns `[pagbankCheckoutId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "pagbankCheckoutId" TEXT,
ADD COLUMN     "pagbankPaymentId" TEXT,
ADD COLUMN     "pagbankPaymentStatus" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_pagbankCheckoutId_key" ON "Order"("pagbankCheckoutId");
