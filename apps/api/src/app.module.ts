import path from 'node:path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';

import { RateLimitGuard } from './common/guards/rate-limit.guard.js';
import { SessionAuthGuard } from './common/guards/session-auth.guard.js';
import { appConfig } from './config/configuration.js';
import { envValidationSchema } from './config/env.validation.js';
import { DatabaseModule } from './database/database.module.js';
import { AttachmentModule } from './modules/attachments/attachment.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ReimbursementModule } from './modules/reimbursements/reimbursement.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      // pnpm workspace 会以 apps/api 为工作目录，因此显式读取仓库根目录的统一环境文件。
      envFilePath: path.resolve(import.meta.dirname, '../../../.env'),
      // bcrypt 哈希包含 `$`，开启变量展开会破坏密码哈希。
      expandVariables: false,
      isGlobal: true,
      load: [appConfig],
      validationSchema: envValidationSchema,
    }),
    ServeStaticModule.forRoot({
      exclude: ['/api/{*path}'],
      rootPath: path.resolve(import.meta.dirname, '../../web/dist'),
    }),
    DatabaseModule,
    AuthModule,
    AttachmentModule,
    ReimbursementModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: SessionAuthGuard },
  ],
})
export class AppModule {}
