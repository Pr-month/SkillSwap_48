import { join } from 'path';

export const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads');

export const UPLOADS_URL_PREFIX = '/public/uploads/';

export const MAX_UPLOAD_SIZE = 2 * 1024 * 1024;

export const IMAGE_TYPES = {
  jpeg: { mime: 'image/jpeg', extension: 'jpg' },
  png: { mime: 'image/png', extension: 'png' },
  webp: { mime: 'image/webp', extension: 'webp' },
} as const;
