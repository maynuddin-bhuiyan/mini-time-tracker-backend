/* eslint-disable @typescript-eslint/no-unsafe-call */
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const app = await NestFactory.create(AppModule);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
