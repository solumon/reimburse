import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const SESSION_COOKIE = 'reimburse_admin_session';

export function setupSwagger(app: INestApplication, nodeEnv: string): boolean {
  if (nodeEnv === 'production') return false;

  const config = new DocumentBuilder()
    .setTitle('报销助手 API')
    .setDescription('报销提交、管理员处理及附件访问接口')
    .setVersion('2.0')
    .addCookieAuth(
      SESSION_COOKIE,
      {
        description: '管理员登录后由服务端写入的 HttpOnly 会话 Cookie',
        in: 'cookie',
        type: 'apiKey',
      },
      'admin-session',
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config, {
    operationIdFactory: (_controllerKey, methodKey) => methodKey,
  });

  SwaggerModule.setup('docs', app, documentFactory, {
    customSiteTitle: '报销助手 API 文档',
    jsonDocumentUrl: 'docs/openapi.json',
    raw: ['json', 'yaml'],
    swaggerOptions: {
      persistAuthorization: true,
      withCredentials: true,
    },
    useGlobalPrefix: true,
    yamlDocumentUrl: 'docs/openapi.yaml',
  });
  return true;
}
