/*
  Warnings:

  - A unique constraint covering the columns `[serviceType]` on the table `ApplicationCharge` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "StripeConnectAccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'PAYMENT_FAILED');

-- CreateEnum
CREATE TYPE "ClubBookingStatus" AS ENUM ('HOLD', 'BOOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "WebhookEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "SellerTransferStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('SCHEDULED', 'PENDING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "TicketPdfStatus" AS ENUM ('PENDING', 'GENERATED', 'FAILED');

-- CreateEnum
CREATE TYPE "EventPurchaseAttendeeType" AS ENUM ('BUYER', 'FRIEND');

-- DropIndex
DROP INDEX "ApplicationCharge_serviceType_idx";

-- CreateTable
CREATE TABLE "StripeConnectAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "status" "StripeConnectAccountStatus" NOT NULL DEFAULT 'PENDING',
    "onboardingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeConnectAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "buyerUserId" TEXT NOT NULL,
    "sellerUserId" TEXT NOT NULL,
    "serviceType" "Service" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "buyerName" TEXT NOT NULL,
    "buyerPhoneNumber" TEXT NOT NULL,
    "buyerDateOfBirth" TIMESTAMP(3),
    "buyerGender" "Gender",
    "buyerImage" TEXT,
    "grossAmount" DECIMAL(10,2) NOT NULL,
    "serviceChargeAmount" DECIMAL(10,2) NOT NULL,
    "buyerTotal" DECIMAL(10,2) NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "commissionAmount" DECIMAL(10,2) NOT NULL,
    "sellerEarnings" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubBooking" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "clubPackageId" TEXT NOT NULL,
    "status" "ClubBookingStatus" NOT NULL DEFAULT 'HOLD',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "holdExpiresAt" TIMESTAMP(3) NOT NULL,
    "guestCount" INTEGER NOT NULL,
    "clubName" TEXT NOT NULL,
    "clubLocation" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "packageCapacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClubBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventPurchase" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "personCount" INTEGER NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventLocation" TEXT NOT NULL,
    "eventStartAt" TIMESTAMP(3) NOT NULL,
    "eventEndAt" TIMESTAMP(3) NOT NULL,
    "pricePerPerson" DECIMAL(10,2) NOT NULL,
    "transferEligibleAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventPurchaseAttendee" (
    "id" TEXT NOT NULL,
    "eventPurchaseId" TEXT NOT NULL,
    "attendeeType" "EventPurchaseAttendeeType" NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "gender" "Gender",
    "age" INTEGER,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventPurchaseAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerTransfer" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stripeTransferId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "status" "SellerTransferStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stripeRefundId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'SCHEDULED',
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketPdf" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "TicketPdfStatus" NOT NULL DEFAULT 'PENDING',
    "storageKey" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketPdf_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StripeConnectAccount_userId_key" ON "StripeConnectAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeConnectAccount_stripeAccountId_key" ON "StripeConnectAccount"("stripeAccountId");

-- CreateIndex
CREATE INDEX "StripeConnectAccount_status_idx" ON "StripeConnectAccount"("status");

-- CreateIndex
CREATE INDEX "Order_buyerUserId_createdAt_idx" ON "Order"("buyerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_sellerUserId_createdAt_idx" ON "Order"("sellerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_serviceType_status_createdAt_idx" ON "Order"("serviceType", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClubBooking_orderId_key" ON "ClubBooking"("orderId");

-- CreateIndex
CREATE INDEX "ClubBooking_clubPackageId_status_startAt_endAt_idx" ON "ClubBooking"("clubPackageId", "status", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "ClubBooking_status_holdExpiresAt_idx" ON "ClubBooking"("status", "holdExpiresAt");

-- CreateIndex
CREATE INDEX "ClubBooking_clubId_startAt_idx" ON "ClubBooking"("clubId", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventPurchase_orderId_key" ON "EventPurchase"("orderId");

-- CreateIndex
CREATE INDEX "EventPurchase_eventId_createdAt_idx" ON "EventPurchase"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "EventPurchase_transferEligibleAt_idx" ON "EventPurchase"("transferEligibleAt");

-- CreateIndex
CREATE INDEX "EventPurchaseAttendee_eventPurchaseId_attendeeType_idx" ON "EventPurchaseAttendee"("eventPurchaseId", "attendeeType");

-- CreateIndex
CREATE UNIQUE INDEX "EventPurchaseAttendee_eventPurchaseId_position_key" ON "EventPurchaseAttendee"("eventPurchaseId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_orderId_key" ON "PaymentTransaction"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_stripePaymentIntentId_key" ON "PaymentTransaction"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_stripeChargeId_key" ON "PaymentTransaction"("stripeChargeId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_idempotencyKey_key" ON "PaymentTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentTransaction_status_createdAt_idx" ON "PaymentTransaction"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_stripeEventId_key" ON "WebhookEvent"("stripeEventId");

-- CreateIndex
CREATE INDEX "WebhookEvent_status_createdAt_idx" ON "WebhookEvent"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SellerTransfer_orderId_key" ON "SellerTransfer"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerTransfer_stripeTransferId_key" ON "SellerTransfer"("stripeTransferId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerTransfer_idempotencyKey_key" ON "SellerTransfer"("idempotencyKey");

-- CreateIndex
CREATE INDEX "SellerTransfer_status_createdAt_idx" ON "SellerTransfer"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_orderId_key" ON "Refund"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_stripeRefundId_key" ON "Refund"("stripeRefundId");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_idempotencyKey_key" ON "Refund"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Refund_status_scheduledFor_idx" ON "Refund"("status", "scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "TicketPdf_orderId_key" ON "TicketPdf"("orderId");

-- CreateIndex
CREATE INDEX "TicketPdf_status_createdAt_idx" ON "TicketPdf"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationCharge_serviceType_key" ON "ApplicationCharge"("serviceType");

-- AddForeignKey
ALTER TABLE "StripeConnectAccount" ADD CONSTRAINT "StripeConnectAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_sellerUserId_fkey" FOREIGN KEY ("sellerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubBooking" ADD CONSTRAINT "ClubBooking_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubBooking" ADD CONSTRAINT "ClubBooking_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubBooking" ADD CONSTRAINT "ClubBooking_clubPackageId_fkey" FOREIGN KEY ("clubPackageId") REFERENCES "ClubPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPurchase" ADD CONSTRAINT "EventPurchase_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPurchase" ADD CONSTRAINT "EventPurchase_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPurchaseAttendee" ADD CONSTRAINT "EventPurchaseAttendee_eventPurchaseId_fkey" FOREIGN KEY ("eventPurchaseId") REFERENCES "EventPurchase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SellerTransfer" ADD CONSTRAINT "SellerTransfer_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketPdf" ADD CONSTRAINT "TicketPdf_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- AddConstraint
ALTER TABLE "Order"
  ADD CONSTRAINT "Order_serviceChargeAmount_positive_check"
    CHECK ("serviceChargeAmount" > 0),
  ADD CONSTRAINT "Order_buyerTotal_check"
    CHECK ("buyerTotal" = "grossAmount" + "serviceChargeAmount"),
  ADD CONSTRAINT "Order_commissionAmount_check"
    CHECK ("commissionAmount" = ROUND(("grossAmount" * "commissionRate"::numeric) / 100, 2)),
  ADD CONSTRAINT "Order_sellerEarnings_check"
    CHECK ("sellerEarnings" = "grossAmount" - "commissionAmount");

ALTER TABLE "ClubBooking"
  ADD CONSTRAINT "ClubBooking_time_range_check"
    CHECK ("startAt" < "endAt"),
  ADD CONSTRAINT "ClubBooking_guest_count_check"
    CHECK ("guestCount" > 0 AND "packageCapacity" > 0 AND "guestCount" <= "packageCapacity");

ALTER TABLE "EventPurchase"
  ADD CONSTRAINT "EventPurchase_person_count_check"
    CHECK ("personCount" BETWEEN 1 AND 5),
  ADD CONSTRAINT "EventPurchase_time_range_check"
    CHECK ("eventStartAt" < "eventEndAt"),
  ADD CONSTRAINT "EventPurchase_transfer_eligible_at_check"
    CHECK ("transferEligibleAt" = "eventStartAt" - INTERVAL '6 hours');

ALTER TABLE "EventPurchaseAttendee"
  ADD CONSTRAINT "EventPurchaseAttendee_position_check"
    CHECK ("position" BETWEEN 1 AND 5),
  ADD CONSTRAINT "EventPurchaseAttendee_age_check"
    CHECK ("age" IS NULL OR "age" > 0),
  ADD CONSTRAINT "EventPurchaseAttendee_friend_details_check"
    CHECK (
      "attendeeType" <> 'FRIEND'
      OR ("gender" IS NOT NULL AND "age" IS NOT NULL)
    );

-- CreateIndex
CREATE UNIQUE INDEX "EventPurchaseAttendee_one_buyer_per_purchase_key"
  ON "EventPurchaseAttendee" ("eventPurchaseId")
  WHERE "attendeeType" = 'BUYER';

-- AddConstraint
ALTER TABLE "ClubBooking"
  ADD CONSTRAINT "ClubBooking_no_overlapping_active_intervals"
  EXCLUDE USING GIST (
    "clubPackageId" WITH =,
    tsrange("startAt", "endAt", '[)') WITH &&
  )
  WHERE ("status" IN ('HOLD', 'BOOKED'));

-- CreateFunction
CREATE FUNCTION "enforce_order_purchase_type"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  order_service_type "Service";
BEGIN
  SELECT "serviceType"
  INTO order_service_type
  FROM "Order"
  WHERE "id" = NEW."orderId";

  IF TG_TABLE_NAME = 'ClubBooking' THEN
    IF order_service_type <> 'CLUB'::"Service"
      OR EXISTS (SELECT 1 FROM "EventPurchase" WHERE "orderId" = NEW."orderId") THEN
      RAISE EXCEPTION 'Order % must have exactly one CLUB purchase', NEW."orderId";
    END IF;
  ELSIF TG_TABLE_NAME = 'EventPurchase' THEN
    IF order_service_type <> 'EVENT'::"Service"
      OR EXISTS (SELECT 1 FROM "ClubBooking" WHERE "orderId" = NEW."orderId") THEN
      RAISE EXCEPTION 'Order % must have exactly one EVENT purchase', NEW."orderId";
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- CreateTrigger
CREATE TRIGGER "ClubBooking_enforce_order_purchase_type_trigger"
BEFORE INSERT OR UPDATE OF "orderId" ON "ClubBooking"
FOR EACH ROW
EXECUTE FUNCTION "enforce_order_purchase_type"();

-- CreateTrigger
CREATE TRIGGER "EventPurchase_enforce_order_purchase_type_trigger"
BEFORE INSERT OR UPDATE OF "orderId" ON "EventPurchase"
FOR EACH ROW
EXECUTE FUNCTION "enforce_order_purchase_type"();

-- CreateFunction
CREATE FUNCTION "validate_order_purchase"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_order_id TEXT;
  order_service_type "Service";
  club_purchase_count INTEGER;
  event_purchase_count INTEGER;
BEGIN
  IF TG_TABLE_NAME = 'Order' THEN
    target_order_id := NEW."id";
  ELSIF TG_OP = 'DELETE' THEN
    target_order_id := OLD."orderId";
  ELSE
    target_order_id := NEW."orderId";
  END IF;

  SELECT "serviceType"
  INTO order_service_type
  FROM "Order"
  WHERE "id" = target_order_id;

  IF order_service_type IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(*) INTO club_purchase_count
  FROM "ClubBooking"
  WHERE "orderId" = target_order_id;

  SELECT COUNT(*) INTO event_purchase_count
  FROM "EventPurchase"
  WHERE "orderId" = target_order_id;

  IF club_purchase_count + event_purchase_count <> 1
    OR (order_service_type = 'CLUB'::"Service" AND club_purchase_count <> 1)
    OR (order_service_type = 'EVENT'::"Service" AND event_purchase_count <> 1) THEN
    RAISE EXCEPTION 'Order % must have exactly one matching purchase record', target_order_id;
  END IF;

  RETURN NULL;
END;
$$;

-- CreateTrigger
CREATE CONSTRAINT TRIGGER "Order_validate_purchase_trigger"
AFTER INSERT OR UPDATE OF "serviceType" ON "Order"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "validate_order_purchase"();

-- CreateTrigger
CREATE CONSTRAINT TRIGGER "ClubBooking_validate_order_trigger"
AFTER INSERT OR UPDATE OR DELETE ON "ClubBooking"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "validate_order_purchase"();

-- CreateTrigger
CREATE CONSTRAINT TRIGGER "EventPurchase_validate_order_trigger"
AFTER INSERT OR UPDATE OR DELETE ON "EventPurchase"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "validate_order_purchase"();

-- CreateFunction
CREATE FUNCTION "validate_event_purchase_attendees"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  purchase_id TEXT;
  expected_person_count INTEGER;
  attendee_count INTEGER;
  buyer_count INTEGER;
BEGIN
  IF TG_TABLE_NAME = 'EventPurchase' THEN
    purchase_id := NEW."id";
  ELSIF TG_OP = 'DELETE' THEN
    purchase_id := OLD."eventPurchaseId";
  ELSE
    purchase_id := NEW."eventPurchaseId";
  END IF;

  SELECT "personCount"
  INTO expected_person_count
  FROM "EventPurchase"
  WHERE "id" = purchase_id;

  IF expected_person_count IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE "attendeeType" = 'BUYER')
  INTO attendee_count, buyer_count
  FROM "EventPurchaseAttendee"
  WHERE "eventPurchaseId" = purchase_id;

  IF attendee_count <> expected_person_count OR buyer_count <> 1 THEN
    RAISE EXCEPTION 'Event purchase % must contain one buyer and exactly % attendees', purchase_id, expected_person_count;
  END IF;

  RETURN NULL;
END;
$$;

-- CreateTrigger
CREATE CONSTRAINT TRIGGER "EventPurchase_validate_attendees_trigger"
AFTER INSERT OR UPDATE OF "personCount" ON "EventPurchase"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "validate_event_purchase_attendees"();

-- CreateTrigger
CREATE CONSTRAINT TRIGGER "EventPurchaseAttendee_validate_purchase_trigger"
AFTER INSERT OR UPDATE OR DELETE ON "EventPurchaseAttendee"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION "validate_event_purchase_attendees"();

-- CreateFunction
CREATE FUNCTION "prevent_order_snapshot_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF ROW(
    OLD."buyerUserId", OLD."sellerUserId", OLD."serviceType", OLD."buyerName",
    OLD."buyerPhoneNumber", OLD."buyerDateOfBirth", OLD."buyerGender", OLD."buyerImage",
    OLD."grossAmount", OLD."serviceChargeAmount", OLD."buyerTotal", OLD."commissionRate",
    OLD."commissionAmount", OLD."sellerEarnings", OLD."currency"
  ) IS DISTINCT FROM ROW(
    NEW."buyerUserId", NEW."sellerUserId", NEW."serviceType", NEW."buyerName",
    NEW."buyerPhoneNumber", NEW."buyerDateOfBirth", NEW."buyerGender", NEW."buyerImage",
    NEW."grossAmount", NEW."serviceChargeAmount", NEW."buyerTotal", NEW."commissionRate",
    NEW."commissionAmount", NEW."sellerEarnings", NEW."currency"
  ) THEN
    RAISE EXCEPTION 'Order snapshots are immutable';
  END IF;

  RETURN NEW;
END;
$$;

-- CreateTrigger
CREATE TRIGGER "Order_prevent_snapshot_mutation_trigger"
BEFORE UPDATE ON "Order"
FOR EACH ROW
EXECUTE FUNCTION "prevent_order_snapshot_mutation"();

-- CreateFunction
CREATE FUNCTION "prevent_club_booking_snapshot_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF ROW(
    OLD."orderId", OLD."clubId", OLD."clubPackageId", OLD."startAt", OLD."endAt",
    OLD."guestCount", OLD."clubName", OLD."clubLocation", OLD."packageName", OLD."packageCapacity"
  ) IS DISTINCT FROM ROW(
    NEW."orderId", NEW."clubId", NEW."clubPackageId", NEW."startAt", NEW."endAt",
    NEW."guestCount", NEW."clubName", NEW."clubLocation", NEW."packageName", NEW."packageCapacity"
  ) THEN
    RAISE EXCEPTION 'Club booking snapshots are immutable';
  END IF;

  RETURN NEW;
END;
$$;

-- CreateTrigger
CREATE TRIGGER "ClubBooking_prevent_snapshot_mutation_trigger"
BEFORE UPDATE ON "ClubBooking"
FOR EACH ROW
EXECUTE FUNCTION "prevent_club_booking_snapshot_mutation"();

-- CreateFunction
CREATE FUNCTION "prevent_event_purchase_snapshot_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF ROW(
    OLD."orderId", OLD."eventId", OLD."personCount", OLD."eventName", OLD."eventLocation",
    OLD."eventStartAt", OLD."eventEndAt", OLD."pricePerPerson", OLD."transferEligibleAt"
  ) IS DISTINCT FROM ROW(
    NEW."orderId", NEW."eventId", NEW."personCount", NEW."eventName", NEW."eventLocation",
    NEW."eventStartAt", NEW."eventEndAt", NEW."pricePerPerson", NEW."transferEligibleAt"
  ) THEN
    RAISE EXCEPTION 'Event purchase snapshots are immutable';
  END IF;

  RETURN NEW;
END;
$$;

-- CreateTrigger
CREATE TRIGGER "EventPurchase_prevent_snapshot_mutation_trigger"
BEFORE UPDATE ON "EventPurchase"
FOR EACH ROW
EXECUTE FUNCTION "prevent_event_purchase_snapshot_mutation"();

-- CreateFunction
CREATE FUNCTION "prevent_event_purchase_attendee_snapshot_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF ROW(
    OLD."eventPurchaseId", OLD."attendeeType", OLD."position", OLD."name", OLD."phoneNumber",
    OLD."gender", OLD."age", OLD."image"
  ) IS DISTINCT FROM ROW(
    NEW."eventPurchaseId", NEW."attendeeType", NEW."position", NEW."name", NEW."phoneNumber",
    NEW."gender", NEW."age", NEW."image"
  ) THEN
    RAISE EXCEPTION 'Event purchase attendee snapshots are immutable';
  END IF;

  RETURN NEW;
END;
$$;

-- CreateTrigger
CREATE TRIGGER "EventPurchaseAttendee_prevent_snapshot_mutation_trigger"
BEFORE UPDATE ON "EventPurchaseAttendee"
FOR EACH ROW
EXECUTE FUNCTION "prevent_event_purchase_attendee_snapshot_mutation"();

-- CreateFunction
CREATE FUNCTION "prevent_payment_transaction_amount_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF ROW(OLD."orderId", OLD."amount", OLD."currency") IS DISTINCT FROM ROW(NEW."orderId", NEW."amount", NEW."currency") THEN
    RAISE EXCEPTION 'Payment transaction amount and currency are immutable';
  END IF;

  RETURN NEW;
END;
$$;

-- CreateTrigger
CREATE TRIGGER "PaymentTransaction_prevent_amount_mutation_trigger"
BEFORE UPDATE ON "PaymentTransaction"
FOR EACH ROW
EXECUTE FUNCTION "prevent_payment_transaction_amount_mutation"();

-- CreateFunction
CREATE FUNCTION "prevent_seller_transfer_amount_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF ROW(OLD."orderId", OLD."amount", OLD."currency") IS DISTINCT FROM ROW(NEW."orderId", NEW."amount", NEW."currency") THEN
    RAISE EXCEPTION 'Seller transfer amount and currency are immutable';
  END IF;

  RETURN NEW;
END;
$$;

-- CreateTrigger
CREATE TRIGGER "SellerTransfer_prevent_amount_mutation_trigger"
BEFORE UPDATE ON "SellerTransfer"
FOR EACH ROW
EXECUTE FUNCTION "prevent_seller_transfer_amount_mutation"();

-- CreateFunction
CREATE FUNCTION "prevent_refund_amount_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF ROW(OLD."orderId", OLD."amount", OLD."currency", OLD."scheduledFor") IS DISTINCT FROM ROW(NEW."orderId", NEW."amount", NEW."currency", NEW."scheduledFor") THEN
    RAISE EXCEPTION 'Refund amount, currency, and schedule are immutable';
  END IF;

  RETURN NEW;
END;
$$;

-- CreateTrigger
CREATE TRIGGER "Refund_prevent_amount_mutation_trigger"
BEFORE UPDATE ON "Refund"
FOR EACH ROW
EXECUTE FUNCTION "prevent_refund_amount_mutation"();
