-- Add durable request idempotency for pre-payment purchase creation.
ALTER TABLE "Order" ADD COLUMN "idempotencyKey" TEXT;
UPDATE "Order" SET "idempotencyKey" = "id" WHERE "idempotencyKey" IS NULL;
ALTER TABLE "Order" ALTER COLUMN "idempotencyKey" SET NOT NULL;

CREATE UNIQUE INDEX "Order_buyerUserId_idempotencyKey_key"
  ON "Order"("buyerUserId", "idempotencyKey");

CREATE OR REPLACE FUNCTION "prevent_order_snapshot_mutation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF ROW(
    OLD."buyerUserId", OLD."sellerUserId", OLD."serviceType", OLD."buyerName",
    OLD."buyerPhoneNumber", OLD."buyerDateOfBirth", OLD."buyerGender", OLD."buyerImage",
    OLD."grossAmount", OLD."serviceChargeAmount", OLD."buyerTotal", OLD."commissionRate",
    OLD."commissionAmount", OLD."sellerEarnings", OLD."currency", OLD."idempotencyKey"
  ) IS DISTINCT FROM ROW(
    NEW."buyerUserId", NEW."sellerUserId", NEW."serviceType", NEW."buyerName",
    NEW."buyerPhoneNumber", NEW."buyerDateOfBirth", NEW."buyerGender", NEW."buyerImage",
    NEW."grossAmount", NEW."serviceChargeAmount", NEW."buyerTotal", NEW."commissionRate",
    NEW."commissionAmount", NEW."sellerEarnings", NEW."currency", NEW."idempotencyKey"
  ) THEN
    RAISE EXCEPTION 'Order snapshots are immutable';
  END IF;
  RETURN NEW;
END;
$$;
