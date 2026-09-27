-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'NEW_EVENT_NEARBY';
ALTER TYPE "NotificationType" ADD VALUE 'NEW_CLUB_NEARBY';
ALTER TYPE "NotificationType" ADD VALUE 'WISHLIST_EVENT_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_FAILED';
ALTER TYPE "NotificationType" ADD VALUE 'TICKET_AVAILABLE';
ALTER TYPE "NotificationType" ADD VALUE 'CLUB_BOOKING_CONFIRMED';
ALTER TYPE "NotificationType" ADD VALUE 'CLUB_BOOKING_EXPIRED';
ALTER TYPE "NotificationType" ADD VALUE 'EVENT_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'CLUB_BOOKING_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'EVENT_CANCELED';
ALTER TYPE "NotificationType" ADD VALUE 'REFUND_SCHEDULED';
ALTER TYPE "NotificationType" ADD VALUE 'REFUND_PROCESSED';
ALTER TYPE "NotificationType" ADD VALUE 'REFUND_FAILED';
ALTER TYPE "NotificationType" ADD VALUE 'PASSWORD_RESET_SUCCESS';
ALTER TYPE "NotificationType" ADD VALUE 'NEW_TICKET_SALE';
ALTER TYPE "NotificationType" ADD VALUE 'NEW_CLUB_BOOKING';
ALTER TYPE "NotificationType" ADD VALUE 'NEW_CLUB_REVIEW';
ALTER TYPE "NotificationType" ADD VALUE 'STRIPE_CONNECT_SUCCESS';
ALTER TYPE "NotificationType" ADD VALUE 'STRIPE_CONNECT_RESTRICTED';
ALTER TYPE "NotificationType" ADD VALUE 'SELLER_TRANSFER_SUCCESS';
ALTER TYPE "NotificationType" ADD VALUE 'SELLER_TRANSFER_FAILED';
ALTER TYPE "NotificationType" ADD VALUE 'EVENT_CANCELED_SUCCESS';
