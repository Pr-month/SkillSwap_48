import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';
import type { TAppConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<TAppConfig>(appConfig.KEY);

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const publicDir = join(process.cwd(), 'public');
  const uploadsDir = join(publicDir, 'uploads');
  mkdirSync(uploadsDir, { recursive: true });

  app.useStaticAssets(publicDir, {
    prefix: '/public/',
  });

  await app.listen(config.port);
}
void bootstrap();