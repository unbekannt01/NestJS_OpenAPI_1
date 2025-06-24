/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import * as compression from 'compression';
import helmet from 'helmet';

config();

/**
 * bootstrap
 * This function initializes the NestJS application.
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  const configService = app.get(ConfigService);
  const PORT = configService.get<number>('PORT') || 3001;
  const cors = require('cors');

  app.useGlobalPipes(new ValidationPipe());
  app.use(helmet());
  app.use(compression());
  app.use(cors());
  // app.useGlobalFilters(new AllExceptionsFilter());

  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Only for local environment
  if (process.env.STORAGE_DRIVER === 'local') {
    app.useStaticAssets(path.join(__dirname, '..', 'uploads'), {
      prefix: '/uploads/',
    });
  }

  // Configure CORS
  // app.enableCors({
  //   origin: [
  //     'http://localhost:5173',
  //     'http://localhost:3001',
  //     'http://192.168.1.33:5173',
  //   ],
  //   credentials: true,
  //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  //   allowedHeaders: [
  //     'Content-Type',
  //     'Authorization',
  //     'X-Requested-With',
  //     'Accept',
  //   ],
  //   exposedHeaders: ['Set-Cookie'],
  // });

  app.enableCors({
    origin: ['file://'],
    // methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    // allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
      },
    }),
  );
  // if (helmet) {
  //   app.use(
  //     helmet({
  //       crossOriginResourcePolicy: { policy: 'cross-origin' }, // This is crucial
  //       crossOriginEmbedderPolicy: false, // Disable if causing issues
  //     }),
  //   );
  // }

  // app.use(
  //   session({
  //     secret: 'hello-how-are-you',
  //     resave: true,
  //     saveUninitialized: false,
  //     cookie: {
  //       maxAge: 60 * 60 * 1000, // 1 hour
  //       secure: process.env.NODE_ENV === 'development',
  //       httpOnly: true,
  //     },
  //   }),
  // );

  app.use(cookieParser());

  // // Uncomment this if you want Swagger API documentation
  // const config = new DocumentBuilder()
  //   .setTitle('Open API')
  //   .setDescription('The Open API description')
  //   .setVersion('1.0')
  //   .addBearerAuth()
  //   .build();
  // const document = SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api', app, document);

  await app.listen(PORT, '0.0.0.0');
  const env = process.env.NODE_ENV || 'local';

  if (env === 'local') {
    console.log(`Server is running on PORT ${PORT} and Local Environment`);
  } else if (env === 'development') {
    console.log(
      `Server is running on PORT ${PORT} and Development Environment`,
    );
  } else {
    console.log(`Running in ${env.toUpperCase()} environment`);
  }

  console.log(`Storage Driver :`, process.env.STORAGE_DRIVER);
}
bootstrap();
