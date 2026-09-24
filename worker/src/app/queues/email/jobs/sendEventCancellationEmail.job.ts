import { Job } from 'bullmq';
import { compile } from 'handlebars';
import { IJobHandler } from '@/app/@types/queue.types';
import { ISendEventCancellationEmailJobData } from '@/app/queues/email/email.types';
import eventCancellationTemplate from '@/app/templates/eventCancellation.template';
import mailTransporter from '@/app/configs/nodemailer.config';
import { mailOption } from '@/app/utils/system.utils';
import { companyInformation, QUEUE_JOBS } from '@/const';
import logger from '@/app/configs/logger.configs';

/**
 * Worker for sending Event Cancellation emails to affected buyers.
 *
 * WHY THIS JOB EXISTS:
 * When an Event is canceled, all paid buyers must be notified that the event is canceled,
 * their tickets are voided, and a refund has been scheduled (with a 6-day delay).
 *
 * WHY THE PERSISTED REFUND AMOUNT IS USED:
 * It ensures the buyer sees exactly what will be refunded (Order.grossAmount), making it clear
 * that the Service Charge is excluded/retained.
 *
 * WHY THE EMAIL WORKER DOES NOT EXECUTE REFUNDS:
 * This is purely a notification. Actual refund execution is handled by PROCESS_REFUND to maintain
 * strict financial isolation and correct lifecycle execution on its 6-day delayed schedule.
 */
const handler: IJobHandler<ISendEventCancellationEmailJobData> = {
  name: QUEUE_JOBS.SEND_EVENT_CANCELLATION_EMAIL,
  handler: async (data: ISendEventCancellationEmailJobData, job: Job) => {
    const {
      buyerName,
      buyerEmail,
      eventName,
      eventLocation,
      eventStartAt,
      refundAmount,
      refundCurrency,
      refundScheduledFor,
      traceId,
    } = data;

    try {
      const template = compile(eventCancellationTemplate);
      const personalizedTemplate = template({
        buyerName,
        eventName,
        eventLocation,
        eventStartAt,
        refundAmount,
        refundCurrency,
        refundScheduledFor,
      });

      const mail = mailOption({
        to: buyerEmail,
        subject: `Event Canceled: ${eventName}`,
        html: personalizedTemplate,
        replyTo: companyInformation.email,
      });

      await mailTransporter.sendMail(mail);

      logger.info(
        `[sendEventCancellationEmail] Successfully sent cancellation email to ${buyerEmail} for event ${eventName}`
      );
    } catch (error) {
      logger.error(
        '[sendEventCancellationEmail] Failed to send event cancellation email:',
        {
          data,
          jobId: job.id,
          error,
          traceId,
        }
      );
      // WHY: Rethrowing ensures BullMQ can safely retry the job in case of transient SMTP/delivery failures.
      throw error;
    }
  },
};

export default handler;
