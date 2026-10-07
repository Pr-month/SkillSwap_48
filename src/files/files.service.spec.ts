import { Test, TestingModule } from '@nestjs/testing';
import { rm } from 'fs/promises';
import { join } from 'path';
import { UPLOADS_DIR } from './files.constants';
import { FilesService } from './files.service';

jest.mock('fs/promises', () => ({ rm: jest.fn() }));

const rmMock = rm as jest.Mock;

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
