CREATE TABLE "RegistrationInvite" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "modalityId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "orderId" TEXT,
    CONSTRAINT "RegistrationInvite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RegistrationInvite_tokenHash_key" ON "RegistrationInvite"("tokenHash");
CREATE UNIQUE INDEX "RegistrationInvite_orderId_key" ON "RegistrationInvite"("orderId");
ALTER TABLE "RegistrationInvite" ADD CONSTRAINT "RegistrationInvite_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
