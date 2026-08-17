import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import type { Request } from 'express';

export const CUSTOMER_UPLOAD_DIR = join(process.cwd(), 'uploads', 'customers');
export const MAX_PROFILE_PICTURE_BYTES = 2 * 1024 * 1024;
export const ALLOWED_PICTURE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

function ensureUploadDir() {
  if (!existsSync(CUSTOMER_UPLOAD_DIR)) {
    mkdirSync(CUSTOMER_UPLOAD_DIR, { recursive: true });
  }
}

export const customerPictureMulterOptions = {
  storage: diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
      ensureUploadDir();
      cb(null, CUSTOMER_UPLOAD_DIR);
    },
    filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: MAX_PROFILE_PICTURE_BYTES },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!ALLOWED_PICTURE_TYPES.includes(file.mimetype)) {
      return cb(new BadRequestException('Only JPEG, PNG, and WebP images are allowed') as unknown as Error, false);
    }
    cb(null, true);
  },
};
