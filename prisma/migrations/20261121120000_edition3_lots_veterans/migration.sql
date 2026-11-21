-- AlterTable
ALTER TABLE "Order" ADD COLUMN "lotId" TEXT,
ADD COLUMN "veteranDiscountAmount" INTEGER;

-- CreateTable
CREATE TABLE "VeteranAthlete" (
    "cpf" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VeteranAthlete_pkey" PRIMARY KEY ("cpf")
);
