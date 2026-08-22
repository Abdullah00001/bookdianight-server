import { Router } from 'express';
import { uploadMediaController } from '@/app/modules/media/media.controllers';
import {
  handleAttachmentMulterError,
  uploadAttachmentArray,
} from '@/app/middlewares/multer.middlewares';

const router = Router();

router
  .route('/media/upload')
  .post(
    uploadAttachmentArray('files', 10, true),
    handleAttachmentMulterError,
    uploadMediaController
  );

export default router;
