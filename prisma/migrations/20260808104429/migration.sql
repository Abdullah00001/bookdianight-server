/*
  Warnings:

  - The values [user,admin] on the enum `AccountRole` will be removed. If these variants are still used in the database, this will fail.
  - The values [active,inactive,blocked] on the enum `AccountStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AccountRole_new" AS ENUM ('USER', 'ADMIN');
ALTER TABLE "public"."User" ALTER COLUMN "accountRole" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "accountRole" TYPE "AccountRole_new" USING ("accountRole"::text::"AccountRole_new");
ALTER TYPE "AccountRole" RENAME TO "AccountRole_old";
ALTER TYPE "AccountRole_new" RENAME TO "AccountRole";
DROP TYPE "public"."AccountRole_old";
ALTER TABLE "User" ALTER COLUMN "accountRole" SET DEFAULT 'USER';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "AccountStatus_new" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');
ALTER TABLE "public"."User" ALTER COLUMN "accountStatus" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "accountStatus" TYPE "AccountStatus_new" USING ("accountStatus"::text::"AccountStatus_new");
ALTER TYPE "AccountStatus" RENAME TO "AccountStatus_old";
ALTER TYPE "AccountStatus_new" RENAME TO "AccountStatus";
DROP TYPE "public"."AccountStatus_old";
ALTER TABLE "User" ALTER COLUMN "accountStatus" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "accountStatus" SET DEFAULT 'ACTIVE',
ALTER COLUMN "accountRole" SET DEFAULT 'USER';
