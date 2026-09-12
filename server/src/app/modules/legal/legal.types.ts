import { LegalContentType } from '@prisma/client';
import { TUpdateLegalContentPayload } from '@/app/modules/legal/legal.schema';

export interface IGetLegalContentService {
  legalContentType: LegalContentType;
}

export interface IUpdateLegalContentService {
  legalContentType: LegalContentType;
  payload: TUpdateLegalContentPayload;
}
