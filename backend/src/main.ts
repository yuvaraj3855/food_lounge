import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 10 * 1024 * 1024, // 10MB limit
    }),
  );
  
  // Enable CORS - Allow all origins
  await app.register(require('@fastify/cors'), {
    origin: (origin, callback) => {
      // Allow all origins
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Register multipart for file uploads (must be registered before routes)
  await app.register(require('@fastify/multipart'), {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    attachFieldsToBody: false, // Don't attach to body, use request.file() instead
  });

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('MedMentor.AI API')
    .setDescription(
      'AI-Driven Medication Adherence & Risk Alert System API Documentation',
    )
    .setVersion('1.0')
    .addTag('patients', 'Patient management endpoints')
    .addTag('alerts', 'Real-time alert endpoints')
    .addTag('messages', 'Doctor-patient communication')
    .addTag('doctor', 'Doctor actions')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'MedMentor.AI API Docs',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`Swagger documentation: http://localhost:${process.env.PORT ?? 3000}/api`);
}
bootstrap();
