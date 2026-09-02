// Types specific to the email queue can be defined here
export interface ISignupSuccessEmailJobData {
  name: string;
  email: string;
  otp: string;
  otpExpireAt: string;
  traceId: string;
}

export interface ISignupUserVerificationSuccessful {
  name: string;
  email: string;
  traceId: string;
}

export interface IResendVerificationOtp {
  name: string;
  email: string;
  otp: string;
  otpExpireAt: number;
  traceId: string;
}
