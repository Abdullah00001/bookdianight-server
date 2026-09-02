// Types specific to the email queue can be defined here
export interface ISignupSuccessEmailJobData {
  name: string;
  email: string;
  otp: string;
  otpExpireAt: string;
  traceId: string;
}
