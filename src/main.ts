/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';

dotenv.config(); // Load .env file
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.enableCors();
  // const config1 = new DocumentBuilder()
  //   .setTitle('API')
  //   .setDescription('This is Open API')
  //   .setVersion('1.0')
  //   .build();
  // const documentFactory = () => SwaggerModule.createDocument(app, config1);
  // SwaggerModule.setup('api', app, documentFactory);
  await app.listen(config.get('PORT') || 3000, () => {
    console.log(`Server is running on port ${config.get('PORT') || 3000}`);
  });
}
bootstrap();