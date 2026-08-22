import { singleUploadToS3 } from '@/app/utils/s3.utils';
import { v4 as uuidv4 } from 'uuid';

export const uploadMediaService = async ({
  files,
}: {
  files: Express.Multer.File[];
}): Promise<
  {
    originalName: string;
    url: string;
    key: string;
  }[]
> => {
  try {
    const uploadPromises = files.map(async (file) => {
      // Generate a unique S3 key
      const extension = file.originalname.split('.').pop();
      const key = `attachments/${uuidv4()}-${Date.now()}.${extension}`;

      const url = await singleUploadToS3({
        filePath: file.path,
        key,
        mimeType: file.mimetype,
      });

      return {
        originalName: file.originalname,
        url,
        key: key,
      };
    });

    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    throw error;
  }
};
