import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { config } from 'dotenv';

async function bootstrap() {
  // dotenv
  config();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    bodyParser: true,
  });
  app.useBodyParser('json', { limit: '2mb' });
  app.enableCors({ credentials: true, origin: true });

  await app.listen(process.env.PORT || 3000);
}

bootstrap();
