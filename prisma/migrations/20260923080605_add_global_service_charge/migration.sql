-- CreateTable
CREATE TABLE "ServiceCharge" (
    "id" TEXT NOT NULL DEFAULT 'GLOBAL',
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCharge_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ServiceCharge_global_id_check" CHECK ("id" = 'GLOBAL'),
    CONSTRAINT "ServiceCharge_amount_positive_check" CHECK ("amount" > 0)
);
