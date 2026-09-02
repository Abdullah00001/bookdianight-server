import { Job } from 'bullmq';
import { IJobHandler } from '@/app/@types/queue.types';
import { ISignupUserVerificationSuccessful } from '@/app/queues/email/email.types';
import { companyInformation, QUEUE_JOBS } from '@/const';
import logger from '@/app/configs/logger.configs';
import { compile } from 'handlebars';
import signupSuccessTemplate from '@/app/templates/signupSuccess.template';
import { mailOption } from '@/app/utils/system.utils';
import mailTransporter from '@/app/configs/nodemailer.config';

/**
 * This job will send email to user that user account verification successful
 * @param data ISignupUserVerificationSuccessful
 * @param job Job
 */
const handler: IJobHandler<ISignupUserVerificationSuccessful> = {
  name: QUEUE_JOBS.SIGNUP_USER_VERIFICATION_SUCCESSFUL,
  handler: async (data: ISignupUserVerificationSuccessful, job: Job) => {
    const { email, name, traceId } = data;
    try {
      const template = compile(signupSuccessTemplate);
      const personalizedTemplate = template({
        name,
        email,
      });
      const mailOptions = mailOption({
        to: email,
        subject: 'Account Verification Successful',
        html: personalizedTemplate,
        replyTo: companyInformation.email,
      });
      await mailTransporter.sendMail(mailOptions);
    } catch (error) {
      logger.error('Failed to send signup user verification success email:', {
        data,
        jobId: job.id,
        error,
        traceId,
      });
      throw error;
    }
  },
};

export default handler;
