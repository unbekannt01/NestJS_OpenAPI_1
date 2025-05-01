/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';

dotenv.config(); // Load .env file
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.use(cookieParser())
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  // const config1 = new DocumentBuilder()
  //   .setTitle('API')
  //   .setDescription('This is Open API')
  //   .setVersion('1.0')
  //   .build();
  // const documentFactory = () => SwaggerModule.createDocument(app, config1);
  // SwaggerModule.setup('api', app, documentFactory);

  await app.listen(config.get<number>('PORT') || 3001, () => {
    console.log(`Server is running on port ${config.get('PORT') || 3001}`);
  });
}
bootstrap();