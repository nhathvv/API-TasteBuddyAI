import { config } from 'dotenv';
config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvService } from './configs/envs/env-service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SeedService } from './database/seeds/seed.service';

async function bootstrap() {
  EnvService.getInstance().validate(process.env);
  const app = await NestFactory.create(AppModule);

  const seedService = app.get(SeedService);
  await seedService.seed();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DEVFEST API')
    .setDescription('API documentation for DEVFEST')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(EnvService.getInstance().getPort());
}

void bootstrap();
