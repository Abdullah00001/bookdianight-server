/*
  Warnings:

  - Made the column `fcmToken` on table `Device` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Device_fcmToken_key";

-- AlterTable
ALTER TABLE "Device" ALTER COLUMN "fcmToken" SET NOT NULL;
