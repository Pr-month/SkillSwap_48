import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { IMAGE_TYPES, MAX_UPLOAD_SIZE } from './files.constants';
import { AccessTokenGuard } from '../auth/guards/accessToken.guard';
import { FilesService } from './files.service';
import { ApiUploadFile } from './decorators/files-swagger.decorator';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @ApiUploadFile()
  @UseGuards(AccessTokenGuard)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_SIZE, files: 1, fields: 0 },
      fileFilter: (_req, file, callback) => {
        const allowed = Object.values(IMAGE_TYPES).some(
          (type) => type.mime === file.mimetype,
        );
        if (!allowed) {
          return callback(
            new BadRequestException('Разрешены только JPEG, PNG и WebP'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  uploadFile(
    @UploadedFile(new ParseFilePipe())
    file: Express.Multer.File,
  ) {
    return this.filesService.saveImage(file);
  }
}
