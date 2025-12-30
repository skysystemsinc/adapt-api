import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Enable CORS
  app.enableCors({
    origin: [
      'https://adapt.demoprojects.co',
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL || 'http://localhost:3000' || 'https://adapt.demoprojects.co'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });


  // Enable global validation pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  if (process.env.NODE_ENV == 'UAT' || process.env.NODE_ENV == 'production') {
    app.setGlobalPrefix('gateway');
  } else {
    app.setGlobalPrefix('api');
  }

  const config = new DocumentBuilder()
    .setTitle('NCMCL API')
    .setDescription('The NCMCL API')
    .setVersion('1.0')
    .addTag('NCMCL')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT-auth',
      description: 'JWT Authorization header using the Bearer scheme',
      in: 'header',
    }, 'JWT-auth')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-doc', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
