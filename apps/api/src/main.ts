import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module.js';
import { ApiExceptionFilter } from './common/filters/api-exception.filter.js';
import { RequestIdInterceptor } from './common/interceptors/request-id.interceptor.js';
import { setupSwagger } from './common/swagger/setup-swagger.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
    whitelist: true,
  }));
  app.useGlobalInterceptors(new RequestIdInterceptor());
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks();

  const host = configService.getOrThrow<string>('app.host');
  const nodeEnv = configService.getOrThrow<string>('app.nodeEnv');
  const port = configService.getOrThrow<number>('app.port');
  const swaggerEnabled = setupSwagger(app, nodeEnv);
  await app.listen(port, host);
  Logger.log(`报销助手已启动：http://${host}:${port}`, 'Bootstrap');
  if (swaggerEnabled) Logger.log(`Swagger 文档：http://${host}:${port}/api/docs`, 'Bootstrap');
}

void bootstrap();
