import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { mkdir, rm, writeFile } from 'fs/promises';
import { basename, join } from 'path';
import { IMAGE_TYPES, MAX_UPLOAD_SIZE, UPLOADS_DIR } from './files.constants';
import { FilesService } from './files.service';

jest.mock('fs/promises', () => ({
  rm: jest.fn(),
  mkdir: jest.fn(),
  writeFile: jest.fn(),
}));

const rmMock = rm as jest.Mock;
const writeFileMock = writeFile as jest.Mock;

describe('FilesService', () => {
  let service: FilesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [FilesService],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  it('getFileUrl builds a public url for the uploaded file', () => {
    expect(service.getFileUrl('a.png')).toEqual({
      url: '/public/uploads/a.png',
    });
  });

  describe('saveImage', () => {
    const images = {
      jpeg: '/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAACAAIDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAABgj/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABykX//Z',
      png: 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAE0lEQVQImWP4z8DwnwGM/zMwAAAf7gP9qS/A4gAAAABJRU5ErkJggg==',
      webp: 'UklGRjwAAABXRUJQVlA4IDAAAADQAQCdASoCAAIAAUAmJaACdLoB+AADsAD+8ut//NgVzXPv9//S4P0uD9Lg/9KQAAA=',
    };
    const image = (format: keyof typeof IMAGE_TYPES) =>
      Buffer.from(images[format], 'base64');
    const file = (buffer: Buffer, mimetype = 'image/png') =>
      ({
        buffer,
        mimetype,
        originalname: 'avatar.html',
        size: buffer.length,
      }) as Express.Multer.File;

    it.each(['jpeg', 'png', 'webp'] as const)(
      'checks the %s signature and saves it with a trusted extension',
      async (format) => {
        const result = await service.saveImage(
          file(image(format), IMAGE_TYPES[format].mime),
        );
        const [path, content, options] = writeFileMock.mock.calls[0] as [
          string,
          Buffer,
          { flag: string },
        ];
        expect(path).toBe(join(UPLOADS_DIR, basename(result.url)));
        expect(result.url).toMatch(
          new RegExp(
            `^/public/uploads/[0-9a-f-]{36}\\.${IMAGE_TYPES[format].extension}$`,
          ),
        );
        expect(content.equals(image(format))).toBe(true);
        expect(options).toEqual({ flag: 'wx' });
      },
    );

    it.each([
      ['HTML', '<!doctype html><script>alert(1)</script>'],
      [
        'SVG',
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      ],
      [
        'a false PNG signature',
        '\u0089PNG\r\n\u001a\n<script>alert(1)</script>',
      ],
    ])(
      'rejects %s disguised as PNG before writing to disk',
      async (_name, content) => {
        await expect(
          service.saveImage(file(Buffer.from(content, 'latin1'))),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(writeFile).not.toHaveBeenCalled();
        expect(mkdir).not.toHaveBeenCalled();
      },
    );

    it('rejects a MIME type that does not match the actual image', async () => {
      await expect(
        service.saveImage(file(image('png'), 'image/jpeg')),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(writeFile).not.toHaveBeenCalled();
    });

    it('rejects a truncated PNG before writing to disk', async () => {
      const png = image('png');
      await expect(
        service.saveImage(file(png.subarray(0, 33))),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(writeFile).not.toHaveBeenCalled();
    });

    it('rejects HTML appended after the PNG ending', async () => {
      const buffer = Buffer.concat([
        image('png'),
        Buffer.from('<script>alert(1)</script>'),
      ]);
      await expect(service.saveImage(file(buffer))).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(writeFile).not.toHaveBeenCalled();
    });

    it('rejects oversized input before validating or writing', async () => {
      await expect(
        service.saveImage(file(Buffer.alloc(MAX_UPLOAD_SIZE + 1))),
      ).rejects.toBeInstanceOf(PayloadTooLargeException);
      expect(writeFile).not.toHaveBeenCalled();
    });
  });

  describe('removeFiles', () => {
    it('deletes every uploaded file', async () => {
      await service.removeFiles([
        '/public/uploads/a.png',
        '/public/uploads/b.png',
      ]);

      expect(rmMock).toHaveBeenCalledTimes(2);
      expect(rmMock).toHaveBeenCalledWith(join(UPLOADS_DIR, 'a.png'), {
        force: true,
      });
      expect(rmMock).toHaveBeenCalledWith(join(UPLOADS_DIR, 'b.png'), {
        force: true,
      });
    });

    it('does nothing when there are no images', async () => {
      await service.removeFiles([]);

      expect(rmMock).not.toHaveBeenCalled();
    });

    it('skips urls that do not point to the uploads folder', async () => {
      await service.removeFiles([
        'https://cdn.example.com/a.png',
        '/etc/hosts',
      ]);

      expect(rmMock).not.toHaveBeenCalled();
    });

    it('keeps traversal attempts inside the uploads folder', async () => {
      await service.removeFiles([
        '/public/uploads/../../../.env',
        '/public/uploads/..',
      ]);

      expect(rmMock).toHaveBeenCalledTimes(1);
      expect(rmMock).toHaveBeenCalledWith(join(UPLOADS_DIR, '.env'), {
        force: true,
      });
    });
  });
});
