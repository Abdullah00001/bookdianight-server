import { Job } from 'bullmq';
import { compile } from 'handlebars';
import { IJobHandler } from '@/app/@types/queue.types';
import { ISignupSuccessEmailJobData } from '@/app/queues/email/email.types';
import signupTemplate from '@/app/templates/signup.template';
import mailTransporter from '@/app/configs/nodemailer.config';
import { mailOption } from '@/app/utils/system.utils';
import { companyInformation } from '@/const';
import logger from '@/app/configs/logger.configs';

const handler: IJobHandler<ISignupSuccessEmailJobData> = {
  name: 'send-signup-success-email',
  handler: async (data: ISignupSuccessEmailJobData, job: Job) => {
    const { email, name, otp, otpExpireAt, traceId } = data;
    try {
      const template = compile(signupTemplate);
      const personalizedTemplate = template({ name, email, otp, otpExpireAt });
      const mail = mailOption({
        to: email,
        subject: 'Verify Your Email Address',
        html: personalizedTemplate,
        replyTo: companyInformation.email,
      });
      await mailTransporter.sendMail(mail);
    } catch (error) {
      logger.error('Failed to send signup success email:', {
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
