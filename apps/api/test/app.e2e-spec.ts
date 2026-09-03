import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import cookieParser from 'cookie-parser';
import request from 'supertest';

describe('报销 API (e2e)', () => {
  let app: INestApplication;
  let runtimeDirectory: string;

  beforeAll(async () => {
    runtimeDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'reimburse-e2e-'));
    process.env.ADMIN_PASSWORD_HASH = await hash('correct-password', 4);
    process.env.SESSION_SECRET = 'e2e-session-secret-with-at-least-32-characters';
    process.env.APP_SQLITE_DIR = path.join(runtimeDirectory, 'sqlite');
    process.env.APP_FILES_DIR = path.join(runtimeDirectory, 'files');
    process.env.NODE_ENV = 'test';
    const { AppModule } = await import('../src/app.module.js');
    const { setupSwagger } = await import('../src/common/swagger/setup-swagger.js');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ forbidNonWhitelisted: true, transform: true, whitelist: true }));
    setupSwagger(app, 'test');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    fs.rmSync(runtimeDirectory, { force: true, recursive: true });
  });

  it('完成健康检查、公开提交与管理员处理主流程', async () => {
    await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    await request(app.getHttpServer()).get('/api/v1/reimbursements').expect(401);
    await request(app.getHttpServer()).post('/api/v1/auth/login')
      .send({ password: 'wrong-password' }).expect(401);

    const login = await request(app.getHttpServer()).post('/api/v1/auth/login')
      .send({ password: 'correct-password' }).expect(204);
    const cookie = login.headers['set-cookie'] as unknown as string[];
    expect(cookie[0]).toContain('reimburse_admin_session=');
    expect(cookie[0]).toContain('HttpOnly');

    const created = await request(app.getHttpServer()).post('/api/v1/reimbursements')
      .field('name', '测试用户')
      .field('amount', '88.50')
      .field('note', '项目紧急上线')
      .field('clockMetadata', JSON.stringify([{ workDate: '2026-09-01', earliest: '09:00', latest: '23:10', hours: 14.1 }]))
      .attach('clockFiles', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]), { contentType: 'image/jpeg', filename: 'clock.jpg' })
      .attach('voucherFiles', Buffer.from('%PDF-1.4\n%%EOF'), { contentType: 'application/pdf', filename: 'voucher.pdf' });
    if (created.status !== 201) throw new Error(JSON.stringify(created.body));
    expect(created.body.record.id).toMatch(/^[0-9a-f]{32}$/);

    const list = await request(app.getHttpServer()).get('/api/v1/reimbursements').set('Cookie', cookie).expect(200);
    expect(list.body).toHaveLength(1);
    const id = created.body.record.id as string;
    const detail = await request(app.getHttpServer()).get(`/api/v1/reimbursements/${id}`).set('Cookie', cookie).expect(200);
    expect(detail.body.attachments).toHaveLength(2);
    expect(JSON.stringify(detail.body)).not.toContain('base64');

    await request(app.getHttpServer()).patch(`/api/v1/reimbursements/${id}/status`)
      .set('Cookie', cookie).send({ status: 'done' }).expect(200).expect(({ body }) => {
        expect(body.status).toBe('done');
      });
    await request(app.getHttpServer()).delete(`/api/v1/reimbursements/${id}`).set('Cookie', cookie).expect(204);
  });

  it('生成包含全部业务接口和 Cookie 鉴权的 OpenAPI 文档', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs/openapi.json').expect(200);
    expect(response.body.openapi).toBe('3.0.0');
    expect(response.body.paths['/api/v1/health']).toBeDefined();
    expect(response.body.paths['/api/v1/reimbursements/{id}/status']).toBeDefined();
    expect(response.body.components.securitySchemes['admin-session']).toMatchObject({
      in: 'cookie',
      name: 'reimburse_admin_session',
      type: 'apiKey',
    });
  });

  it('保持登录接口每分钟最多五次的限流', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/login')
      .send({ password: 'wrong-password' }).expect(401);
    await request(app.getHttpServer()).post('/api/v1/auth/login')
      .send({ password: 'wrong-password' }).expect(401);
    await request(app.getHttpServer()).post('/api/v1/auth/login')
      .send({ password: 'wrong-password' }).expect(401);
    await request(app.getHttpServer()).post('/api/v1/auth/login')
      .send({ password: 'wrong-password' }).expect(429);
  });
});
