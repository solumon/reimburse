# 报销助手

报销助手已迁移为 pnpm Monorepo：前端使用 Vue 3 + Vite + TypeScript + Pinia + Sass，后端使用 NestJS + Express + `node:sqlite`。

## 本地开发

1. 安装 Node.js 24.15+ 和 pnpm 10。
2. 执行 `pnpm install --frozen-lockfile`。
3. 复制 `.env.example` 为 `.env`，填写真实的 `ADMIN_PASSWORD_HASH` 和不少于 32 字符的 `SESSION_SECRET`。
4. 执行 `node scripts/generate-admin-hash.mjs "你的管理员密码"` 生成 bcrypt 哈希。
5. 执行 `pnpm dev`。前端地址为 `http://127.0.0.1:5173`，Vite 会把 `/api` 代理到 NestJS `8000` 端口。

开发和测试环境会在 `http://127.0.0.1:8000/api/docs` 提供 Swagger UI，同时提供
`/api/docs/openapi.json` 和 `/api/docs/openapi.yaml`。生产环境默认不注册文档路由。

`sqlite/` 和 `files/` 是运行时数据，不再纳入 Git。请勿在日常开发、清理构建产物或部署时删除这两个目录。

## 常用命令

- `pnpm typecheck`：前后端与共享合约类型检查。
- `pnpm lint`：检查 TypeScript、Vue 和脚本编码规范。
- `pnpm test`：运行单元测试和 API E2E 测试。
- `pnpm test:e2e:web`：在隔离数据库中运行桌面端和移动端 Playwright 主流程。
- `pnpm build`：生成 `apps/web/dist` 和 `apps/api/dist`。
- `scripts/backup-runtime-data.sh [备份根目录]`：备份 SQLite（包含 WAL/SHM）和附件；自动兼容本地目录和生产环境的 `shared/` 目录。
- `scripts/build-release.sh`：完成锁定安装、校验、测试、构建和发布包生成。

## 开发验收

首次运行浏览器自动化前安装 Chromium：

```bash
pnpm --filter @reimburse/web exec playwright install chromium
```

以下命令可完成一次不读写正式 `sqlite/` 和 `files/` 的自动验收：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e:web
pnpm build
```

Playwright 会启动独立的临时 API、数据库和附件目录，覆盖提交、登录、汇总和详情流程；不会污染现有运行数据。

手工验收时执行 `pnpm dev`，然后依次检查：

1. 在 `/submit` 上传打卡图片与凭证图片/PDF，手工填写日期、时间和工时并提交。
2. 未登录访问 `/admin/summary` 应跳转 `/login`；登录后验证筛选、详情、附件预览、状态切换和删除确认。
3. 在 `/admin/export` 分别验证 CSV、三类 Excel、ZIP、Word 和打印预览。
4. 以桌面和手机宽度检查布局，并确认浏览器控制台无异常。

## 生产部署

服务器从 GitHub 拉取源码、构建、配置 systemd/Nginx、升级和回滚的完整流程见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

建议目录：

```text
/root/fanzongling/reimburse/
├── current -> releases/<当前版本>
├── releases/
├── shared/
│   ├── sqlite/
│   └── files/
├── config/
│   └── reimburse.env
├── scripts/
└── backups/
```

`/root/fanzongling/reimburse/config/reimburse.env` 中的 `APP_SQLITE_DIR` 和 `APP_FILES_DIR` 应分别设置为 `/root/fanzongling/reimburse/shared/sqlite` 和 `/root/fanzongling/reimburse/shared/files`，HTTPS 反向代理后设置 `COOKIE_SECURE=true`。运行用户 `reimburse` 必须拥有两个运行时目录的读写权限，并通过 ACL 获得穿越 `/root` 的最小权限；服务本身不得以 root 用户运行。

上线步骤：

1. 记录上线前的记录数、附件行数和磁盘文件数。
2. 停止旧服务，执行完整备份并验证 tar 包可读。
3. 将新发布包解压到新的 `releases/<版本>` 目录。
4. 将 `current` 软链接原子切换到新目录，执行 `systemctl restart reimburse`。
5. 请求 `GET /api/v1/health`，再执行登录、提交、查询、附件预览和导出冒烟测试。
6. 重新统计记录、附件行和磁盘文件，与上线前对比。

日志查看：`journalctl -u reimburse -f`。首次安装单元可以执行 `sudo scripts/install-systemd.sh`。

## 回滚

停止新服务，将 `current` 切回上一发布目录或启动独立备份中的旧服务。新系统仍使用原有 `records` / `attachments` / `app_meta` 表和相对附件路径，因此新提交记录可由旧版本读取。除非已确认新数据无需保留，禁止用旧备份直接覆盖当前运行时数据。

## 安全约束

- 管理员密码只以 bcrypt 哈希形式出现在服务端环境变量中。
- 管理员会话是 8 小时签名 JWT，存放于 HttpOnly、SameSite=Strict Cookie。
- API 不接收或返回 Base64 附件；文件使用 multipart 上传和文件流下载。
- 新版不包含 OCR、JSON 离线导入导出或外部 CDN 依赖。
