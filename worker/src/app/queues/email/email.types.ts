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

export interface IRecoverUserVerificationOtp {
  // Add properties here
  name: string;
  email: string;
  otp: string;
  otpExpireAt: number;
  traceId: string;
}

export interface IRecoverUserPasswordResetSuccessful {
  // Add properties here
  name: string;
  email: string;
  traceId: string;
}

export interface IRecoverUserVerificationOtpResend {
  // Add properties here
  name: string;
  email: string;
  otp: string;
  otpExpireAt: number;
  traceId: string;
}

export interface ISendEventCancellationEmailJobData {
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  eventName: string;
  eventLocation: string;
  eventStartAt: string;
  refundAmount: string;
  refundCurrency: string;
  refundScheduledFor: string;
  traceId: string;
}
