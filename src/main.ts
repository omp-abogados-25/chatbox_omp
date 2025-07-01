import { configDotenv } from 'dotenv';
configDotenv();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar CORS para permitir acceso desde cualquier origen
  app.enableCors({
    origin: true, // Permite cualquier origen en desarrollo
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  
  app.setGlobalPrefix('api');
  
  // Configurar validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Documentación de swagger
  const config = new DocumentBuilder()
    .setTitle('OMP Chatbox API')
    .setDescription('API para la aplicación OMP Chatbox')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  // Obtener puerto del entorno o usar 3000 por defecto
  const port = process.env.PORT || 3000;
  const host = process.env.HOST || 'localhost';
  
  await app.listen(port, host);

  console.log(`🚀 Servidor ejecutándose en http://${host}:${port}`);
  console.log(`📚 Documentación disponible en http://${host}:${port}/api`);
}

bootstrap();
