/*
  Warnings:

  - You are about to alter the column `chargePercentage` on the `ApplicationCharge` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `commissionRate` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.

*/
-- AlterTable
ALTER TABLE "ApplicationCharge"
  ALTER COLUMN "chargePercentage" SET DATA TYPE DECIMAL(5,2)
  USING "chargePercentage"::numeric(5,2);

-- AlterTable
ALTER TABLE "Order"
  DROP CONSTRAINT "Order_commissionAmount_check",
  ALTER COLUMN "commissionRate" SET DATA TYPE DECIMAL(5,2)
  USING "commissionRate"::numeric(5,2),
  ADD CONSTRAINT "Order_commissionAmount_check"
    CHECK ("commissionAmount" = ROUND(("grossAmount" * "commissionRate") / 100, 2));
