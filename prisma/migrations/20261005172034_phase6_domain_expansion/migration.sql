-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SOURCING_MANAGER', 'SOURCING_AGENT', 'VERIFICATION_ANALYST', 'COMMERCIAL_MANAGER', 'VIEWER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SupplierOutreachStatus" AS ENUM ('NOT_CONTACTED', 'OUTREACH_SENT', 'AWAITING_RESPONSE', 'RESPONDED', 'FOLLOW_UP_REQUIRED', 'IN_DISCUSSION', 'NO_RESPONSE', 'DECLINED');

-- CreateEnum
CREATE TYPE "CommunicationType" AS ENUM ('EMAIL', 'PHONE', 'WHATSAPP', 'MEETING', 'OTHER');

-- CreateEnum
CREATE TYPE "CommunicationDirection" AS ENUM ('OUTBOUND', 'INBOUND');

-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FollowUpPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "InformationItemStatus" AS ENUM ('NOT_REQUESTED', 'REQUESTED', 'RECEIVED', 'NOT_AVAILABLE');

-- CreateEnum
CREATE TYPE "VerificationCheckStatus" AS ENUM ('VERIFIED', 'PENDING', 'MISSING', 'REJECTED');

-- CreateEnum
CREATE TYPE "SupplierActivityType" AS ENUM ('SUPPLIER_CREATED', 'CONTACT_ADDED', 'PRODUCT_ADDED', 'ASSAY_RECEIVED', 'DOCUMENT_RECORDED', 'DOCUMENT_VERIFIED', 'CHECK_UPDATED', 'VERIFICATION_CHANGED', 'VERIFICATION_STARTED', 'VERIFICATION_COMPLETED', 'SUPPLIER_REJECTED', 'PIPELINE_CHANGED', 'SUPPLIER_CONTACTED', 'DOCUMENTS_REQUESTED', 'SUPPLIER_QUALIFIED', 'PIPELINE_REJECTED', 'BUYER_MATCH_PERFORMED', 'COMMUNICATION_LOGGED', 'FOLLOW_UP_SCHEDULED', 'FOLLOW_UP_COMPLETED', 'FOLLOW_UP_CANCELLED', 'INFORMATION_REQUESTED', 'INFORMATION_RECEIVED', 'INFORMATION_STATUS_CHANGED', 'OUTREACH_STATUS_CHANGED');

-- CreateEnum
CREATE TYPE "DealSupplyType" AS ENUM ('TRIAL', 'RECURRING');

-- CreateEnum
CREATE TYPE "CommercialValueState" AS ENUM ('INDICATIVE', 'AGREED', 'ACTUAL');

-- CreateEnum
CREATE TYPE "InspectionAgency" AS ENUM ('SGS', 'CCIC', 'OTHER');

-- CreateEnum
CREATE TYPE "NegotiationParty" AS ENUM ('SUPPLIER', 'BUYER', 'INTERNAL');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PLANNED', 'READY_FOR_LOADING', 'LOADED', 'IN_TRANSIT', 'ARRIVED', 'INSPECTION_PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('PLANNED', 'PENDING', 'COMPLETED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "InspectionPoint" AS ENUM ('LOADING_PORT', 'ARRIVAL_FINAL');

-- CreateEnum
CREATE TYPE "PaymentMilestoneStatus" AS ENUM ('NOT_DUE', 'DUE', 'PENDING', 'PAID', 'PARTIALLY_PAID', 'ADJUSTMENT_REQUIRED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('NOT_AGREED', 'AGREED', 'EARNED', 'INVOICED', 'PAID');

-- CreateEnum
CREATE TYPE "DealActivityType" AS ENUM ('DEAL_CREATED', 'STAGE_CHANGED', 'OFFER_RECORDED', 'COUNTEROFFER_RECORDED', 'BUYER_INTRODUCED', 'CONTRACT_MILESTONE', 'SHIPMENT_CREATED', 'SHIPMENT_UPDATED', 'INSPECTION_RECORDED', 'PAYMENT_MILESTONE_UPDATED', 'COMMISSION_UPDATED', 'DEAL_CLOSED');

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "availableForExport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDemoFixture" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "loadingLocation" TEXT,
ADD COLUMN     "outreachStatus" "SupplierOutreachStatus" NOT NULL DEFAULT 'NOT_CONTACTED',
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'Unspecified',
ADD COLUMN     "supplyCountry" TEXT;

-- AlterTable
ALTER TABLE "SupplierDocument" ADD COLUMN     "status" "VerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN     "storageState" TEXT NOT NULL DEFAULT 'METADATA_ONLY',
ALTER COLUMN "fileUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "createdFromMatch" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "destination" TEXT,
ADD COLUMN     "isDemoFixture" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "matchEvidenceSource" TEXT,
ADD COLUMN     "matchResult" JSONB,
ADD COLUMN     "supplyType" "DealSupplyType" NOT NULL DEFAULT 'RECURRING';

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierActivity" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "type" "SupplierActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierVerificationCheck" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "checkKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" "VerificationCheckStatus" NOT NULL DEFAULT 'MISSING',
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierVerificationCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierCommunication" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "type" "CommunicationType" NOT NULL,
    "direction" "CommunicationDirection" NOT NULL,
    "contactId" TEXT,
    "requirementId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "subject" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "outcome" TEXT,
    "nextAction" TEXT,
    "followUpDate" TEXT,
    "internalNotes" TEXT,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'NOT_SENT',
    "isDemoFixture" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierCommunication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierFollowUp" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "communicationId" TEXT,
    "informationRequestId" TEXT,
    "contactId" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "priority" "FollowUpPriority" NOT NULL DEFAULT 'MEDIUM',
    "owner" TEXT NOT NULL DEFAULT 'Unassigned',
    "action" TEXT NOT NULL,
    "status" "FollowUpStatus" NOT NULL DEFAULT 'OPEN',
    "completedAt" TIMESTAMP(3),
    "isDemoFixture" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierInformationRequest" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "contactId" TEXT,
    "requirementId" TEXT,
    "itemIds" TEXT[],
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "dueAt" TEXT,
    "internalNote" TEXT,
    "draftMessage" TEXT NOT NULL,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'NOT_SENT',
    "isDemoFixture" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierInformationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierInformationItemStatus" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "status" "InformationItemStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierInformationItemStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealCommercialTerms" (
    "dealId" TEXT NOT NULL,
    "quantityMt" DECIMAL(14,3),
    "pricePerMt" DECIMAL(18,2),
    "currency" TEXT,
    "incoterm" "Incoterm",
    "loadingLocation" TEXT,
    "destinationPort" TEXT,
    "inspectionAgency" "InspectionAgency",
    "paymentMethod" "PaymentMethod",
    "paymentTerms" TEXT,
    "offerValidity" TEXT,
    "deliverySchedule" TEXT,
    "packing" TEXT,
    "particleSizeMm" DECIMAL(10,3),
    "commercialNotes" TEXT,
    "valueState" "CommercialValueState" NOT NULL DEFAULT 'INDICATIVE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealCommercialTerms_pkey" PRIMARY KEY ("dealId")
);

-- CreateTable
CREATE TABLE "DealNegotiationRound" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "party" "NegotiationParty" NOT NULL,
    "quantityMt" DECIMAL(14,3),
    "pricePerMt" DECIMAL(18,2),
    "currency" TEXT,
    "incoterm" "Incoterm",
    "paymentMethod" "PaymentMethod",
    "paymentTerms" TEXT,
    "destination" TEXT,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealNegotiationRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerIntroduction" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "introducedAt" TEXT NOT NULL,
    "supplierContactId" TEXT,
    "buyerContactName" TEXT,
    "buyerContactEmail" TEXT,
    "requirementId" TEXT NOT NULL,
    "introducedBy" TEXT NOT NULL,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerIntroduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealShipment" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "plannedQuantityMt" DECIMAL(14,3),
    "actualQuantityMt" DECIMAL(14,3),
    "loadingLocation" TEXT,
    "destinationPort" TEXT,
    "etd" TEXT,
    "eta" TEXT,
    "packing" TEXT,
    "inspectionCompany" "InspectionAgency",
    "inspectionReference" TEXT,
    "billOfLadingReference" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT,
    "isDemoFixture" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealShipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealInspectionMilestone" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "shipmentId" TEXT,
    "point" "InspectionPoint" NOT NULL,
    "agency" "InspectionAgency" NOT NULL,
    "reference" TEXT,
    "date" TEXT,
    "status" "InspectionStatus" NOT NULL DEFAULT 'PLANNED',
    "resultNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealInspectionMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealPaymentMilestone" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "milestone" TEXT NOT NULL,
    "expectedPercentage" DECIMAL(8,4),
    "expectedAmount" DECIMAL(18,2),
    "currency" TEXT,
    "dueDate" TEXT,
    "status" "PaymentMilestoneStatus" NOT NULL DEFAULT 'NOT_DUE',
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealPaymentMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealCommission" (
    "dealId" TEXT NOT NULL,
    "type" "CommissionType" NOT NULL DEFAULT 'PERCENTAGE',
    "percentage" DECIMAL(8,4),
    "fixedAmount" DECIMAL(18,2),
    "currency" TEXT,
    "status" "CommissionStatus" NOT NULL DEFAULT 'NOT_AGREED',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealCommission_pkey" PRIMARY KEY ("dealId")
);

-- CreateTable
CREATE TABLE "DealActivity" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "type" "DealActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "SupplierActivity_supplierId_createdAt_idx" ON "SupplierActivity"("supplierId", "createdAt");

-- CreateIndex
CREATE INDEX "SupplierActivity_type_idx" ON "SupplierActivity"("type");

-- CreateIndex
CREATE INDEX "SupplierVerificationCheck_status_idx" ON "SupplierVerificationCheck"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierVerificationCheck_supplierId_checkKey_key" ON "SupplierVerificationCheck"("supplierId", "checkKey");

-- CreateIndex
CREATE INDEX "SupplierCommunication_supplierId_occurredAt_idx" ON "SupplierCommunication"("supplierId", "occurredAt");

-- CreateIndex
CREATE INDEX "SupplierCommunication_direction_idx" ON "SupplierCommunication"("direction");

-- CreateIndex
CREATE INDEX "SupplierFollowUp_supplierId_dueAt_idx" ON "SupplierFollowUp"("supplierId", "dueAt");

-- CreateIndex
CREATE INDEX "SupplierFollowUp_status_idx" ON "SupplierFollowUp"("status");

-- CreateIndex
CREATE INDEX "SupplierInformationRequest_supplierId_idx" ON "SupplierInformationRequest"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierInformationItemStatus_supplierId_itemId_key" ON "SupplierInformationItemStatus"("supplierId", "itemId");

-- CreateIndex
CREATE INDEX "DealNegotiationRound_dealId_date_idx" ON "DealNegotiationRound"("dealId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerIntroduction_dealId_key" ON "BuyerIntroduction"("dealId");

-- CreateIndex
CREATE INDEX "BuyerIntroduction_dealId_idx" ON "BuyerIntroduction"("dealId");

-- CreateIndex
CREATE INDEX "BuyerIntroduction_requirementId_idx" ON "BuyerIntroduction"("requirementId");

-- CreateIndex
CREATE INDEX "DealShipment_dealId_idx" ON "DealShipment"("dealId");

-- CreateIndex
CREATE INDEX "DealShipment_status_idx" ON "DealShipment"("status");

-- CreateIndex
CREATE INDEX "DealInspectionMilestone_dealId_idx" ON "DealInspectionMilestone"("dealId");

-- CreateIndex
CREATE INDEX "DealPaymentMilestone_dealId_idx" ON "DealPaymentMilestone"("dealId");

-- CreateIndex
CREATE INDEX "DealPaymentMilestone_status_idx" ON "DealPaymentMilestone"("status");

-- CreateIndex
CREATE INDEX "DealActivity_dealId_createdAt_idx" ON "DealActivity"("dealId", "createdAt");

-- CreateIndex
CREATE INDEX "DealActivity_type_idx" ON "DealActivity"("type");

-- CreateIndex
CREATE INDEX "Supplier_outreachStatus_idx" ON "Supplier"("outreachStatus");

-- AddForeignKey
ALTER TABLE "SupplierActivity" ADD CONSTRAINT "SupplierActivity_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierVerificationCheck" ADD CONSTRAINT "SupplierVerificationCheck_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierCommunication" ADD CONSTRAINT "SupplierCommunication_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierFollowUp" ADD CONSTRAINT "SupplierFollowUp_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInformationRequest" ADD CONSTRAINT "SupplierInformationRequest_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInformationItemStatus" ADD CONSTRAINT "SupplierInformationItemStatus_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealCommercialTerms" ADD CONSTRAINT "DealCommercialTerms_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealNegotiationRound" ADD CONSTRAINT "DealNegotiationRound_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerIntroduction" ADD CONSTRAINT "BuyerIntroduction_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealShipment" ADD CONSTRAINT "DealShipment_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealInspectionMilestone" ADD CONSTRAINT "DealInspectionMilestone_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealPaymentMilestone" ADD CONSTRAINT "DealPaymentMilestone_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealCommission" ADD CONSTRAINT "DealCommission_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealActivity" ADD CONSTRAINT "DealActivity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
