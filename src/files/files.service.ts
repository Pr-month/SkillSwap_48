import { Injectable } from '@nestjs/common';
import { rm } from 'fs/promises';
import { basename, join } from 'path';
import { UPLOADS_DIR, UPLOADS_URL_PREFIX } from './files.constants';

@Injectable()
export class FilesService {
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
