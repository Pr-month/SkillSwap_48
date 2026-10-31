import {
  BadRequestException,
  FileTypeValidator,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, rm, writeFile } from 'fs/promises';
import { basename, join } from 'path';
import {
  IMAGE_TYPES,
  MAX_UPLOAD_SIZE,
  UPLOADS_DIR,
  UPLOADS_URL_PREFIX,
} from './files.constants';

@Injectable()
export class FilesService {
  async saveImage(file: Express.Multer.File): Promise<{ url: string }> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Передайте непустое изображение');
    }
    if (file.buffer.length > MAX_UPLOAD_SIZE) {
      throw new PayloadTooLargeException(
        'Размер файла не должен превышать 2 МБ',
      );
    }

    const type = Object.values(IMAGE_TYPES).find(
      (type) => type.mime === file.mimetype,
    );
    if (
      !type ||
      !this.hasCompleteImage(file.buffer, type.extension) ||
      !(await new FileTypeValidator({ fileType: `^${type.mime}$` }).isValid(
        file,
      ))
    ) {
      throw new BadRequestException(
        'Разрешены только JPEG, PNG и WebP с соответствующим содержимым',
      );
    }

    const filename = `${randomUUID()}.${type.extension}`;
    await mkdir(UPLOADS_DIR, { recursive: true });
    await writeFile(join(UPLOADS_DIR, filename), file.buffer, { flag: 'wx' });
    return this.getFileUrl(filename);
  }

  private hasCompleteImage(buffer: Buffer, extension: string): boolean {
    if (extension === 'png') {
      return (
        buffer.length >= 45 &&
        buffer.readUInt32BE(8) === 13 &&
        buffer.toString('ascii', 12, 16) === 'IHDR' &&
        buffer
          .subarray(-12)
          .equals(Buffer.from('0000000049454e44ae426082', 'hex'))
      );
    }
    if (extension === 'jpg') {
      return (
        buffer.length >= 4 &&
        buffer.subarray(-2).equals(Buffer.from('ffd9', 'hex'))
      );
    }
    return buffer.length >= 12 && buffer.readUInt32LE(4) + 8 === buffer.length;
  }

  getFileUrl(filename: string): { url: string } {
    return { url: `${UPLOADS_URL_PREFIX}${filename}` };
  }

  async removeFiles(urls: string[]): Promise<void> {
    const names = urls
      .filter((url) => url.startsWith(UPLOADS_URL_PREFIX))
      // basename отбрасывает путь целиком, поэтому ../ в ссылке не выведет за UPLOADS_DIR
      .map((url) => basename(url))
      .filter((name) => name !== '.' && name !== '..');

    await Promise.all(
      names.map((name) => rm(join(UPLOADS_DIR, name), { force: true })),
    );
  }
}
