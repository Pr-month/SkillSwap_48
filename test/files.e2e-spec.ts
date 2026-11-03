import type { INestApplication } from '@nestjs/common';
import { mkdir, readdir, readFile, rm } from 'fs/promises';
import { basename, join } from 'path';
import type { App } from 'supertest/types';
import {
  IMAGE_TYPES,
  MAX_UPLOAD_SIZE,
  UPLOADS_DIR,
} from '../src/files/files.constants';
import { createTestApp, testRequest } from './test-app';

describe('Files (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  const images = {
    jpeg: Buffer.from(
      '/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAACAAIDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAABgj/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABykX//Z',
      'base64',
    ),
    png: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAE0lEQVQImWP4z8DwnwGM/zMwAAAf7gP9qS/A4gAAAABJRU5ErkJggg==',
      'base64',
    ),
    webp: Buffer.from(
      'UklGRjwAAABXRUJQVlA4IDAAAADQAQCdASoCAAIAAUAmJaACdLoB+AADsAD+8ut//NgVzXPv9//S4P0uD9Lg/9KQAAA=',
      'base64',
    ),
  };
  const createdFiles: string[] = [];

  beforeAll(async () => {
    await mkdir(UPLOADS_DIR, { recursive: true });
    app = await createTestApp();
    const response = await testRequest(app)
      .post('/auth/login')
      .send({ email: 'user1@example.com', password: 'user1234' })
      .expect(200);
    accessToken = (response.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    await Promise.all(
      createdFiles.map((name) => rm(join(UPLOADS_DIR, name), { force: true })),
    );
    await app?.close();
  });

  const upload = (content: Buffer, filename: string, contentType: string) =>
    testRequest(app)
      .post('/files/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', content, { filename, contentType });

  function trackFile(body: unknown): string {
    const { url } = body as { url: string };
    expect(url).toMatch(/^\/public\/uploads\/[0-9a-f-]{36}\.(jpg|png|webp)$/);
    const name = basename(url);
    createdFiles.push(name);
    return name;
  }

  describe('POST /files/upload', () => {
    it.each(['jpeg', 'png', 'webp'] as const)(
      'сохраняет настоящее изображение %s после авторизации',
      async (format) => {
        const type = IMAGE_TYPES[format];
        const response = await upload(
          images[format],
          `avatar.${type.extension}`,
          type.mime,
        ).expect(201);
        const name = trackFile(response.body);
        expect(name.endsWith(`.${type.extension}`)).toBe(true);
        const saved = await readFile(join(UPLOADS_DIR, name));
        expect(saved.equals(images[format])).toBe(true);
      },
    );

    it('возвращает 401 без токена и не сохраняет файл', async () => {
      const before = await readdir(UPLOADS_DIR);
      await testRequest(app)
        .post('/files/upload')
        .attach('file', images.png, {
          filename: 'avatar.png',
          contentType: 'image/png',
        })
        .expect(401);
      expect((await readdir(UPLOADS_DIR)).sort()).toEqual(before.sort());
    });

    it('возвращает 401 с неверным токеном и не сохраняет файл', async () => {
      const before = await readdir(UPLOADS_DIR);
      await testRequest(app)
        .post('/files/upload')
        .set('Authorization', 'Bearer invalid-token')
        .attach('file', images.png, {
          filename: 'avatar.png',
          contentType: 'image/png',
        })
        .expect(401);
      expect((await readdir(UPLOADS_DIR)).sort()).toEqual(before.sort());
    });

    it.each([
      [
        'HTML',
        '<!doctype html><script>alert(1)</script>',
        'page.html',
        'text/html',
      ],
      [
        'SVG со скриптом',
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
        'image.svg',
        'image/svg+xml',
      ],
      [
        'HTML под видом PNG',
        '<!doctype html><script>alert(1)</script>',
        'avatar.png',
        'image/png',
      ],
      [
        'SVG под видом PNG',
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
        'avatar.png',
        'image/png',
      ],
      [
        'поддельную сигнатуру PNG',
        '\u0089PNG\r\n\u001a\n<script>alert(1)</script>',
        'avatar.png',
        'image/png',
      ],
    ])(
      'отклоняет %s и не пишет его в public/uploads',
      async (_description, content, name, mime) => {
        const before = await readdir(UPLOADS_DIR);
        await upload(Buffer.from(content, 'latin1'), name, mime).expect(400);
        expect((await readdir(UPLOADS_DIR)).sort()).toEqual(before.sort());
      },
    );

    it('отклоняет MIME-тип, который не совпадает с содержимым', async () => {
      const before = await readdir(UPLOADS_DIR);
      await upload(images.png, 'avatar.jpg', 'image/jpeg').expect(400);
      expect((await readdir(UPLOADS_DIR)).sort()).toEqual(before.sort());
    });

    it('отклоняет повреждённое изображение', async () => {
      const before = await readdir(UPLOADS_DIR);
      await upload(
        images.png.subarray(0, 33),
        'avatar.png',
        'image/png',
      ).expect(400);
      expect((await readdir(UPLOADS_DIR)).sort()).toEqual(before.sort());
    });

    it('создаёт безопасное расширение по содержимому вместо имени клиента', async () => {
      const response = await upload(
        images.png,
        'avatar.html',
        'image/png',
      ).expect(201);
      const name = trackFile(response.body);
      expect(name.endsWith('.png')).toBe(true);
    });

    it('отклоняет HTML после окончания PNG и ничего не сохраняет', async () => {
      const before = await readdir(UPLOADS_DIR);
      const content = Buffer.concat([
        images.png,
        Buffer.from('<script>alert(1)</script>'),
      ]);
      await upload(content, 'avatar.png', 'image/png').expect(400);
      expect((await readdir(UPLOADS_DIR)).sort()).toEqual(before.sort());
    });

    it('даёт файлам уникальные имена', async () => {
      const first = await upload(images.png, 'photo.png', 'image/png').expect(
        201,
      );
      const second = await upload(images.png, 'photo.png', 'image/png').expect(
        201,
      );
      expect(trackFile(first.body)).not.toBe(trackFile(second.body));
    });

    it('возвращает 413 для файла больше 2 МБ и не сохраняет его', async () => {
      const before = await readdir(UPLOADS_DIR);
      await upload(
        Buffer.alloc(MAX_UPLOAD_SIZE + 1),
        'huge.png',
        'image/png',
      ).expect(413);
      expect((await readdir(UPLOADS_DIR)).sort()).toEqual(before.sort());
    });

    it('возвращает 400 без файла', async () => {
      await testRequest(app)
        .post('/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('отклоняет несколько файлов за один запрос и ничего не сохраняет', async () => {
      const before = await readdir(UPLOADS_DIR);
      await upload(images.png, 'first.png', 'image/png')
        .attach('file', images.png, {
          filename: 'second.png',
          contentType: 'image/png',
        })
        .expect(400);
      expect((await readdir(UPLOADS_DIR)).sort()).toEqual(before.sort());
    });
  });
});
