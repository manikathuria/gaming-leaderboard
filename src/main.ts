import 'newrelic';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { collectDefaultMetrics, Registry } from 'prom-client';
import * as express from 'express';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { VersioningType } from '@nestjs/common';
import { WinstonLogger } from './common/logger/winston-logger.service';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

async function bootstrap() {
  // bootstrap app with bufferLogs so Winston can capture early logs
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Winston logger
  const logger = app.get(WinstonLogger);
  app.useLogger(logger);

  // Apply middleware for request logging
  // app.use(new LoggerMiddleware(logger).use);

  // Security
  app.use(helmet());

  // Enable CORS for all origins
  app.enableCors({
    origin: '*', // allow all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: false,
  });

  // Global prefix and versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI, // /api/v1/...
    defaultVersion: '1',
  });

  // Global filter and interceptor
  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Gaming Leaderboard API')
    .setDescription('APIs for gaming leaderboard')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/docs', app, document);

  // Prometheus metrics
  const register = new Registry();
  collectDefaultMetrics({ register });

  const expressApp = app.getHttpAdapter().getInstance() as express.Express;
  expressApp.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  // Start app
  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 Server running on http://localhost:${port}`);
  logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
  logger.log(`Metrics: http://localhost:${port}/metrics`);
}
bootstrap();
