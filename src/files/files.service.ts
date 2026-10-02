import { Injectable } from '@nestjs/common';

@Injectable()
export class FilesService {
  getFileUrl(filename: string): { url: string } {
    return { url: `/public/uploads/${filename}` };
  }
}