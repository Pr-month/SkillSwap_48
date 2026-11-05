import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('SkillSwap API')
  .setDescription('API сервиса обмена навыками SkillSwap')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
