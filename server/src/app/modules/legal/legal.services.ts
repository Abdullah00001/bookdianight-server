import prisma from '@/app/configs/db.configs';
import {
  IGetLegalContentService,
  IUpdateLegalContentService,
} from '@/app/modules/legal/legal.types';

export const getLegalContentService = async ({
  legalContentType,
}: IGetLegalContentService): Promise<Record<string, unknown> | null> => {
  const legalContent = await prisma.legalContent.findFirst({
    where: { legalContentType },
  });

  if (!legalContent) {
    return null;
  }

  return { legalContent };
};

export const updateLegalContentService = async ({
  legalContentType,
  payload,
}: IUpdateLegalContentService): Promise<Record<string, unknown> | null> => {
  const existing = await prisma.legalContent.findFirst({
    where: { legalContentType },
  });

  if (!existing) {
    return null;
  }

  const updatedLegalContent = await prisma.legalContent.update({
    where: { id: existing.id },
    data: { content: payload.content },
  });

  return { legalContent: updatedLegalContent };
};
