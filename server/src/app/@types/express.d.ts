import { Profile, User, Device } from '@prisma/client';
import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      fileLimit?: number;
      fieldName?: string;
      requireAtLeastOne?: boolean;
      allOptional?: boolean;
      fieldConfig?: FieldConfig[];
      fileRequired: boolean;
      files?: { [fieldname: string]: Express.Multer.File[] };
      user: JwtPayload | User;
      jwtPayload?: JwtPayload;
      profile:Profile
      device?: Device;
      validatedQuery?: unknown;
    }
  }
}
