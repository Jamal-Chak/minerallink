-- CreateEnum
CREATE TYPE "SupplierType" AS ENUM ('MINE', 'PRODUCER', 'PROCESSOR', 'TRADER', 'AGGREGATOR');

-- CreateEnum
CREATE TYPE "ProductionStatus" AS ENUM ('OPERATING', 'DEVELOPMENT', 'EXPLORATION', 'SUSPENDED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SupplierPipelineStatus" AS ENUM ('NEW', 'CONTACTED', 'RESPONDED', 'DOCUMENTS_REQUESTED', 'UNDER_VERIFICATION', 'QUALIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Commodity" AS ENUM ('COPPER', 'LEAD', 'ZINC', 'NICKEL');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('ORE', 'CONCENTRATE', 'SLAG');

-- CreateEnum
CREATE TYPE "MineralForm" AS ENUM ('SULPHIDE', 'OXIDE', 'MIXED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ASSAY_CERTIFICATE', 'MINING_LICENSE', 'EXPORT_LICENSE', 'COMPANY_REGISTRATION', 'SGS_REPORT', 'CCIC_REPORT', 'PRODUCT_PHOTO', 'STOCK_PHOTO', 'OTHER');

-- CreateEnum
CREATE TYPE "AssaySource" AS ENUM ('SUPPLIER', 'SGS', 'CCIC', 'LABORATORY', 'OTHER');

-- CreateEnum
CREATE TYPE "Incoterm" AS ENUM ('FOB', 'CIF');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('TT', 'DLC');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('NEW', 'SUPPLIER_CONTACTED', 'DOCUMENTS_REQUESTED', 'QUALIFICATION', 'BUYER_INTRODUCTION', 'NEGOTIATION', 'CONTRACT', 'TRIAL_SHIPMENT', 'ACTIVE_CONTRACT', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "tradingName" TEXT,
    "country" TEXT NOT NULL,
    "supplierType" "SupplierType" NOT NULL,
    "productionStatus" "ProductionStatus" NOT NULL DEFAULT 'UNKNOWN',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "pipelineStatus" "SupplierPipelineStatus" NOT NULL DEFAULT 'NEW',
    "mineOrProjectName" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierContact" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jobTitle" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MineralProduct" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "commodity" "Commodity" NOT NULL,
    "productType" "ProductType" NOT NULL,
    "mineralForm" "MineralForm",
    "availableQuantityMt" DECIMAL(14,3),
    "monthlyCapacityMt" DECIMAL(14,3),
    "trialQuantityMt" DECIMAL(14,3),
    "loadingCountry" TEXT NOT NULL,
    "loadingLocation" TEXT,
    "availableForExport" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MineralProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assay" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "source" "AssaySource" NOT NULL DEFAULT 'SUPPLIER',
    "gradePercent" DECIMAL(8,4) NOT NULL,
    "sulphurPercent" DECIMAL(8,4),
    "arsenicPercent" DECIMAL(8,4),
    "chlorinePercent" DECIMAL(8,4),
    "cadmiumPercent" DECIMAL(8,4),
    "mercuryPercent" DECIMAL(8,4),
    "fluorinePercent" DECIMAL(8,4),
    "leadPercent" DECIMAL(8,4),
    "zincPercent" DECIMAL(8,4),
    "particleSizeMm" DECIMAL(10,3),
    "laboratoryName" TEXT,
    "certificateRef" TEXT,
    "testedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierDocument" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "reference" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Buyer" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "website" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Buyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerContact" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jobTitle" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerRequirement" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "commodity" "Commodity" NOT NULL,
    "productType" "ProductType" NOT NULL,
    "minimumGradePercent" DECIMAL(8,4) NOT NULL,
    "minimumSulphurPercent" DECIMAL(8,4),
    "maxArsenicPercent" DECIMAL(8,4),
    "maxChlorinePercent" DECIMAL(8,4),
    "maxCadmiumPercent" DECIMAL(8,4),
    "maxMercuryPercent" DECIMAL(8,4),
    "maxFluorinePercent" DECIMAL(8,4),
    "maxLeadPercent" DECIMAL(8,4),
    "maxZincPercent" DECIMAL(8,4),
    "maxLeadPlusZincPercent" DECIMAL(8,4),
    "maximumParticleSizeMm" DECIMAL(10,3),
    "acceptedMineralForms" "MineralForm"[],
    "trialQuantityMinMt" DECIMAL(14,3),
    "trialQuantityMaxMt" DECIMAL(14,3),
    "monthlyQuantityMt" DECIMAL(14,3) NOT NULL,
    "destinationCountry" TEXT NOT NULL,
    "destinationPorts" TEXT[],
    "incoterms" "Incoterm"[],
    "paymentMethods" "PaymentMethod"[],
    "inspectionAgencies" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" "DealStatus" NOT NULL DEFAULT 'NEW',
    "quantityMt" DECIMAL(14,3),
    "currency" TEXT,
    "pricePerMt" DECIMAL(18,2),
    "commissionPercent" DECIMAL(8,4),
    "commissionAmount" DECIMAL(18,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Supplier_country_idx" ON "Supplier"("country");

-- CreateIndex
CREATE INDEX "Supplier_supplierType_idx" ON "Supplier"("supplierType");

-- CreateIndex
CREATE INDEX "Supplier_verificationStatus_idx" ON "Supplier"("verificationStatus");

-- CreateIndex
CREATE INDEX "Supplier_pipelineStatus_idx" ON "Supplier"("pipelineStatus");

-- CreateIndex
CREATE INDEX "SupplierContact_supplierId_idx" ON "SupplierContact"("supplierId");

-- CreateIndex
CREATE INDEX "MineralProduct_supplierId_idx" ON "MineralProduct"("supplierId");

-- CreateIndex
CREATE INDEX "MineralProduct_commodity_productType_idx" ON "MineralProduct"("commodity", "productType");

-- CreateIndex
CREATE INDEX "MineralProduct_loadingCountry_idx" ON "MineralProduct"("loadingCountry");

-- CreateIndex
CREATE INDEX "Assay_productId_idx" ON "Assay"("productId");

-- CreateIndex
CREATE INDEX "Assay_testedAt_idx" ON "Assay"("testedAt");

-- CreateIndex
CREATE INDEX "SupplierDocument_supplierId_idx" ON "SupplierDocument"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierDocument_type_idx" ON "SupplierDocument"("type");

-- CreateIndex
CREATE INDEX "BuyerContact_buyerId_idx" ON "BuyerContact"("buyerId");

-- CreateIndex
CREATE INDEX "BuyerRequirement_buyerId_idx" ON "BuyerRequirement"("buyerId");

-- CreateIndex
CREATE INDEX "BuyerRequirement_commodity_productType_idx" ON "BuyerRequirement"("commodity", "productType");

-- CreateIndex
CREATE INDEX "BuyerRequirement_active_idx" ON "BuyerRequirement"("active");

-- CreateIndex
CREATE INDEX "Deal_buyerId_idx" ON "Deal"("buyerId");

-- CreateIndex
CREATE INDEX "Deal_supplierId_idx" ON "Deal"("supplierId");

-- CreateIndex
CREATE INDEX "Deal_requirementId_idx" ON "Deal"("requirementId");

-- CreateIndex
CREATE INDEX "Deal_productId_idx" ON "Deal"("productId");

-- CreateIndex
CREATE INDEX "Deal_status_idx" ON "Deal"("status");

-- AddForeignKey
ALTER TABLE "SupplierContact" ADD CONSTRAINT "SupplierContact_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MineralProduct" ADD CONSTRAINT "MineralProduct_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assay" ADD CONSTRAINT "Assay_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MineralProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierDocument" ADD CONSTRAINT "SupplierDocument_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerContact" ADD CONSTRAINT "BuyerContact_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerRequirement" ADD CONSTRAINT "BuyerRequirement_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "BuyerRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_productId_fkey" FOREIGN KEY ("productId") REFERENCES "MineralProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
