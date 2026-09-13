import { Job } from 'bullmq';
import { IJobHandler } from '@/app/@types/queue.types';
import { IRecoverUserVerificationOtp } from '@/app/queues/email/email.types';
import { companyInformation, QUEUE_JOBS } from '@/const';
import logger from '@/app/configs/logger.configs';
import { compile } from 'handlebars';
import forgotPasswordTemplate from '@/app/templates/forgotPassword.template';
import { mailOption } from '@/app/utils/system.utils';
import mailTransporter from '@/app/configs/nodemailer.config';

const handler: IJobHandler<IRecoverUserVerificationOtp> = {
  name: QUEUE_JOBS.RECOVER_USER_VERIFICATION_OTP,
  handler: async (data: IRecoverUserVerificationOtp, job: Job) => {
    const { email, name, otp, otpExpireAt, traceId } = data;
    try {
      const template = compile(forgotPasswordTemplate);
      const personalizedTemplate = template({ name, email, otp, otpExpireAt });
      const mailOptions = mailOption({
        to: email,
        subject: `Your account recovery verification code is ${otp} - Bookdianight`,
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
