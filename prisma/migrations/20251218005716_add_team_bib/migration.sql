-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "bibNumber" INTEGER,
ADD COLUMN     "teamIndex" INTEGER;

-- CreateTable
CREATE TABLE "BibCounter" (
    "id" TEXT NOT NULL,
    "nextNumber" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BibCounter_pkey" PRIMARY KEY ("id")
);
