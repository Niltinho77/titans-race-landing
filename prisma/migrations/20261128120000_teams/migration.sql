-- Ranking de equipes: tabela nova e coluna opcional no participante (migração só aditiva).
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "instagram" TEXT,
    "city" TEXT,
    "logoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "mergedIntoId" TEXT,
    "isIndependent" BOOLEAN NOT NULL DEFAULT false,
    "couponCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Team_normalizedName_key" ON "Team"("normalizedName");
CREATE UNIQUE INDEX "Team_couponCode_key" ON "Team"("couponCode");
CREATE INDEX "Team_status_idx" ON "Team"("status");

ALTER TABLE "Participant" ADD COLUMN "teamId" TEXT;
ALTER TABLE "Participant" ADD COLUMN "teamJoinedAt" TIMESTAMP(3);
CREATE INDEX "Participant_teamId_idx" ON "Participant"("teamId");

ALTER TABLE "Participant" ADD CONSTRAINT "Participant_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
