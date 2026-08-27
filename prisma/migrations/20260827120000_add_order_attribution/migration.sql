ALTER TABLE "Order"
ADD COLUMN "analyticsSessionId" TEXT,
ADD COLUMN "source" TEXT,
ADD COLUMN "medium" TEXT,
ADD COLUMN "campaign" TEXT,
ADD COLUMN "content" TEXT,
ADD COLUMN "landingPage" TEXT,
ADD COLUMN "paidAt" TIMESTAMP(3);

CREATE INDEX "Order_analyticsSessionId_idx" ON "Order"("analyticsSessionId");
CREATE INDEX "Order_campaign_idx" ON "Order"("campaign");
CREATE INDEX "Order_source_idx" ON "Order"("source");
CREATE INDEX "Order_paidAt_idx" ON "Order"("paidAt");
