/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import { VersioningType } from '@nestjs/common';
import { AuthExceptionFilter } from './common/filters/http-exception.filter';

dotenv.config();

/**
 * bootstrap
 * This function initializes the NestJS application.
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const PORT = configService.get<number>('PORT') || 3001;

  const reflector = app.get(Reflector);

  app.useGlobalFilters(new AuthExceptionFilter());

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useStaticAssets(path.resolve('uploads'), { prefix: '/uploads' });

  // Configure CORS
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3001',
      'http://192.168.1.33:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
    ],
    exposedHeaders: ['Set-Cookie'],
  });

  // // Add custom security headers
  // app.use((req, res, next) => {
  //   res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  //   res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  //   res.setHeader('Access-Control-Allow-Credentials', 'true');
  //   next();
  // });

  app.use(cookieParser());

  // Uncomment this if you want Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Open API')
    .setDescription('The Open API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(PORT, '0.0.0.0');
  console.log(`🚀 Server is running on PORT ${PORT}`);
}
bootstrap();
