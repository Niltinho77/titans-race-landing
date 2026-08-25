CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "url" TEXT,
    "instagram" TEXT,
    "category" TEXT NOT NULL,
    "value" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "property" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SponsorshipProperty" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "image" TEXT,
    "type" TEXT NOT NULL,
    "exposure" TEXT,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'available',
    "currentSponsor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorshipProperty_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SponsorshipLead" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "responsibleName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "instagram" TEXT,
    "city" TEXT,
    "selectedPackages" JSONB NOT NULL,
    "selectedProperties" JSONB NOT NULL,
    "selectedItems" JSONB NOT NULL,
    "estimatedValue" INTEGER NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'novo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorshipLead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SponsorshipProperty_slug_key" ON "SponsorshipProperty"("slug");
CREATE INDEX "Sponsor_status_idx" ON "Sponsor"("status");
CREATE INDEX "Sponsor_category_idx" ON "Sponsor"("category");
CREATE INDEX "Sponsor_order_idx" ON "Sponsor"("order");
CREATE INDEX "SponsorshipProperty_status_idx" ON "SponsorshipProperty"("status");
CREATE INDEX "SponsorshipProperty_available_idx" ON "SponsorshipProperty"("available");
CREATE INDEX "SponsorshipProperty_type_idx" ON "SponsorshipProperty"("type");
CREATE INDEX "SponsorshipLead_status_idx" ON "SponsorshipLead"("status");
CREATE INDEX "SponsorshipLead_createdAt_idx" ON "SponsorshipLead"("createdAt");
CREATE INDEX "SponsorshipLead_company_idx" ON "SponsorshipLead"("company");
