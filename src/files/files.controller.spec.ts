import { Test, TestingModule } from '@nestjs/testing';

import { FilesController } from './files.controller';
import { FilesService } from './files.service';

describe('FilesController', () => {
  let controller: FilesController;

  const filesService = {
    getFileUrl: jest.fn(),
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

  it('passes the uploaded filename to the service and returns its url', () => {
    const file = {
      filename: 'image.png',
    } as Express.Multer.File;

    const result = {
      url: '/public/uploads/image.png',
    };

    filesService.getFileUrl.mockReturnValue(result);

    expect(controller.uploadFile(file)).toEqual(result);
    expect(filesService.getFileUrl).toHaveBeenCalledWith('image.png');
  });
});
