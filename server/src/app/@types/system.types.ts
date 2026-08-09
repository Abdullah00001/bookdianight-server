export type TEnv = {
  NODE_ENV: string;
  DATABASE_URL: string;
  REDIS_HOST: string;
  REDIS_PASSWORD: string;
  REDIS_PORT: number;
  PORT:number,
  S3_ACCESS_KEY: string;
  S3_SECRET_KEY: string;
  S3_REGION: string;
  S3_BUCKET_NAME: string;
  JWT_ACCESS_TOKEN_SECRET_KEY: string;
  JWT_REFRESH_TOKEN_SECRET_KEY: string;
  JWT_VERIFY_OTP_PAGE_SECRET_KEY: string;
  OTP_HASH_SECRET: string;
};


