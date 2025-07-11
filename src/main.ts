import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import * as session from 'express-session';
import * as express from 'express';
import { BadRequestException } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    stopAtFirstError: true,
    disableErrorMessages: false,
    exceptionFactory: (errors) => {
      console.log('Validation errors:', errors);
      return new BadRequestException(errors);
    },
  }));

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  app.setGlobalPrefix('api/v1');


  app.use(
    session({
      secret: "Session223456",  // Replace with a real secret from config
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 60000 * 60 // 1 hour
      }
    }),
  );

  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('GO-MINT-BE')
    .setDescription('GG-MINT-BE API')
    .setVersion('1.0')
    .addTag('go-mint')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/docs', app, documentFactory);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
