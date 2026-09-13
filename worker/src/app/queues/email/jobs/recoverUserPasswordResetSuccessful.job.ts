import { Job } from 'bullmq';
import { IJobHandler } from '@/app/@types/queue.types';
import { IRecoverUserPasswordResetSuccessful } from '@/app/queues/email/email.types';
import { companyInformation, QUEUE_JOBS } from '@/const';
import logger from '@/app/configs/logger.configs';
import mailTransporter from '@/app/configs/nodemailer.config';
import passwordResetSuccessTemplate from '@/app/templates/passwordResetSuccess.template';
import { compile } from 'handlebars';
import { mailOption } from '@/app/utils/system.utils';

const handler: IJobHandler<IRecoverUserPasswordResetSuccessful> = {
  name: QUEUE_JOBS.RECOVER_USER_PASSWORD_RESET_SUCCESSFUL,
  handler: async (data: IRecoverUserPasswordResetSuccessful, job: Job) => {
    const { email, name, traceId } = data;
    try {
      const template = compile(passwordResetSuccessTemplate);
      const personalizedTemplate = template({ name, email });
      const mailOptions = mailOption({
        to: email,
        subject: `Your password has been reset successfully - Bookdianight`,
        html: personalizedTemplate,
        replyTo: companyInformation.email,
      });
      await mailTransporter.sendMail(mailOptions);
    } catch (error) {
      logger.error('Failed to send Account recover verification otp email:', {
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
