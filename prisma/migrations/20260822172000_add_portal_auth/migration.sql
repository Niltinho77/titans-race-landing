-- CreateEnum
CREATE TYPE "PortalRole" AS ENUM ('PARTICIPANT', 'ADMIN');

-- CreateTable
CREATE TABLE "PortalUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "role" "PortalRole" NOT NULL DEFAULT 'PARTICIPANT',
    "requiresPasswordSetup" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortalSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalPasswordToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortalPasswordToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipantChangeLog" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParticipantChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PortalUser_email_key" ON "PortalUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PortalSession_tokenHash_key" ON "PortalSession"("tokenHash");

-- CreateIndex
CREATE INDEX "PortalSession_userId_idx" ON "PortalSession"("userId");

-- CreateIndex
CREATE INDEX "PortalSession_expiresAt_idx" ON "PortalSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PortalPasswordToken_tokenHash_key" ON "PortalPasswordToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PortalPasswordToken_userId_idx" ON "PortalPasswordToken"("userId");

-- CreateIndex
CREATE INDEX "PortalPasswordToken_expiresAt_idx" ON "PortalPasswordToken"("expiresAt");

-- CreateIndex
CREATE INDEX "ParticipantChangeLog_participantId_idx" ON "ParticipantChangeLog"("participantId");

-- CreateIndex
CREATE INDEX "ParticipantChangeLog_actorUserId_idx" ON "ParticipantChangeLog"("actorUserId");

-- CreateIndex
CREATE INDEX "ParticipantChangeLog_action_idx" ON "ParticipantChangeLog"("action");

-- AddForeignKey
ALTER TABLE "PortalSession" ADD CONSTRAINT "PortalSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PortalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortalPasswordToken" ADD CONSTRAINT "PortalPasswordToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "PortalUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantChangeLog" ADD CONSTRAINT "ParticipantChangeLog_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipantChangeLog" ADD CONSTRAINT "ParticipantChangeLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "PortalUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
