CREATE TABLE "LeagueParticipant" (
    "id" TEXT NOT NULL,
    "instagram" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeagueParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LeagueParticipant_instagram_key" ON "LeagueParticipant"("instagram");
