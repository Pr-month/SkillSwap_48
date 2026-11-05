import { Test, TestingModule } from '@nestjs/testing';

import { FilesController } from './files.controller';
import { FilesService } from './files.service';

describe('FilesController', () => {
  let controller: FilesController;

  const filesService = {
    saveImage: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: filesService,
        },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes the in-memory file to validation and storage', async () => {
    const file = {
      buffer: Buffer.from('image'),
      mimetype: 'image/png',
    } as Express.Multer.File;

    const result = {
      url: '/public/uploads/image.png',
    };

    filesService.saveImage.mockResolvedValue(result);

    await expect(controller.uploadFile(file)).resolves.toEqual(result);
    expect(filesService.saveImage).toHaveBeenCalledWith(file);
  });
});
