import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { config } from 'dotenv';
import { CheckENV } from './static/functions/env-checker.function';

async function bootstrap() {
  // dotenv
  config();

  const envErrors = CheckENV(process.env);
  if (envErrors.length > 0) {
    let str = `Required ENV\`\s:`;
    envErrors.forEach((err, index) => {
      str += `\n${index + 1}. ${err}`;
    });
    throw new Error(str);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    bodyParser: true,
  });
  app.useBodyParser('json', { limit: '2mb' });
  app.enableCors({ credentials: true, origin: true });

  await app.listen(process.env.PORT || 80);
}

bootstrap();
