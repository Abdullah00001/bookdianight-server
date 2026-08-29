import { createReadStream } from 'fs';

import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { lookup } from 'mime-types';

import s3Client from '@/app/configs/s3Client.configs';
import { env } from '@/env';
import { unlinkFile } from '@/app/utils/system.utils';

const bucketName = env.S3_BUCKET_NAME;



export async function singleUploadToS3({
  filePath,
  key,
  mimeType,
}: {
  filePath: string;
  mimeType: string;
  key: string;
}): Promise<string> {
  try {
    const contentType = lookup(filePath);
    const stream = createReadStream(filePath);
    const command = new PutObjectCommand({
      Key: key,
      Bucket: bucketName,
      ContentType: contentType || `image/${mimeType.replace(/^\./, '')}`,
      Body: stream,
    });
    await s3Client.send(command);
    stream.destroy();
    await unlinkFile({ filePath });
    return `${env.S3_PUBLIC_URL}/${key}`;
  } catch (error) {
    await unlinkFile({ filePath });
    if (error instanceof Error) throw error;
    throw new Error('Unknown Error Occurred In S3 Single File Upload Utility');
  }
}

export async function singleDeleteToS3({ key }: { key: string }): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Unknown Error Occurred In S3 Single File Delete Utility');
  }
}
