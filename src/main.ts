import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import * as session from 'express-session';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
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
