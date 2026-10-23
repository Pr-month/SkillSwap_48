import { INestApplication } from '@nestjs/common';
import { mkdir, readdir, readFile, rm } from 'fs/promises';
import { basename, join } from 'path';
import { App } from 'supertest/types';
import { UPLOADS_DIR } from '../src/files/files.constants';
import { createTestApp, testRequest } from './test-app';

describe('Files (e2e)', () => {
  let app: INestApplication<App>;
  let filesBefore: Set<string>;

  const MAX_SIZE = 2 * 1024 * 1024;

  beforeAll(async () => {
    await mkdir(UPLOADS_DIR, { recursive: true });
    filesBefore = new Set(await readdir(UPLOADS_DIR));
    app = await createTestApp();
  });

  afterAll(async () => {
    const filesAfter = await readdir(UPLOADS_DIR);
    await Promise.all(
      filesAfter
        .filter((name) => !filesBefore.has(name))
        .map((name) => rm(join(UPLOADS_DIR, name), { force: true })),
    );
    await app.close();
  });

  describe('POST /files/upload', () => {
    it('сохраняет файл и возвращает ссылку на него', async () => {
      const content = Buffer.from('fake png content');

      const response = await testRequest(app)
        .post('/files/upload')
        .attach('file', content, 'avatar.png');

      expect(response.status).toBe(201);
      const { url } = response.body as { url: string };
      expect(url).toMatch(/^\/public\/uploads\/[0-9a-f-]{36}\.png$/);
      const saved = await readFile(join(UPLOADS_DIR, basename(url)));
      expect(saved.equals(content)).toBe(true);
    });

    it('даёт файлам уникальные имена', async () => {
      const upload = () =>
        testRequest(app)
          .post('/files/upload')
          .attach('file', Buffer.from('photo'), 'photo.jpg');

      const [first, second] = await Promise.all([upload(), upload()]);

      expect(first.status).toBe(201);
      expect(second.status).toBe(201);
      expect((first.body as { url: string }).url).not.toBe(
        (second.body as { url: string }).url,
      );
    });

    it('принимает файл чуть меньше 2 МБ', async () => {
      const response = await testRequest(app)
        .post('/files/upload')
        .attach('file', Buffer.alloc(MAX_SIZE - 1), 'big.bin');

      expect(response.status).toBe(201);
    });

    it('возвращает 400 для файла больше 2 МБ', async () => {
      const response = await testRequest(app)
        .post('/files/upload')
        .attach('file', Buffer.alloc(MAX_SIZE + 1), 'huge.bin');

      expect(response.status).toBe(400);
    });

    it('возвращает 400 без файла', async () => {
      const response = await testRequest(app).post('/files/upload');

      expect(response.status).toBe(400);
    });
  });
});
