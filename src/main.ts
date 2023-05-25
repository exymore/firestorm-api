import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'process';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [process.env.APP_URL],
    methods: ['GET', 'POST'],
    credentials: true,
  });
  await app.listen(process.env.PORT);
}

bootstrap();
