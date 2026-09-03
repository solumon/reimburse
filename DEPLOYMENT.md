# 报销助手部署指南

本文档适用于将代码发布到 GitHub 后，由 Linux 服务器从 GitHub 拉取源码、构建并通过 systemd 运行的部署方式。

项目由一个 NestJS 进程提供 API 和构建后的 Vue 页面，默认只监听 `127.0.0.1:8000`，公网流量由 Nginx 或其他反向代理接入。

## 1. 部署约定

示例采用以下目录；如果需要调整，必须同步修改环境变量、systemd 单元和备份命令中的绝对路径。

```text
/root/fanzongling/reimburse/
├── source/                 # GitHub 拉取目录，仅用于获取版本
├── current -> releases/... # 当前运行版本
├── releases/               # 各次不可变发布目录
├── shared/
│   ├── sqlite/             # SQLite 数据库及 WAL/SHM
│   └── files/              # 附件文件
├── config/
│   └── reimburse.env       # 生产环境变量，不进入 Git
└── backups/                # 运行数据备份
```

运行要求：

- Linux 服务器，使用 systemd。
- Node.js `24.15.0` 或更高版本。
- pnpm `10.15.0`，建议通过 Corepack 管理。
- Git、Nginx；使用 `/root` 下的部署目录时还需要 `setfacl`。
- 应用以无登录权限的 `reimburse` 用户运行，禁止以 root 用户运行。
- 生产数据只保存在 `shared/sqlite` 和 `shared/files`，不得放入 `releases` 或 Git 仓库。

## 2. 发布到 GitHub

### 2.1 发布前检查

确保以下文件不会上传到 GitHub：

- `.env`
- `sqlite/`、`files/`
- `node_modules/`、`dist/`、`release/`
- 日志、PID、测试报告和本地备份

执行：

```bash
git status --short --branch
git ls-files .env sqlite files
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`git ls-files .env sqlite files` 应无输出。不要将真实密码、bcrypt 哈希、`SESSION_SECRET`、数据库或附件提交到仓库。

### 2.2 配置 GitHub 远端

在 GitHub 创建空仓库后配置 `origin`，将占位内容替换为真实组织和仓库名：

```bash
git remote add origin git@github.com:<OWNER>/<REPOSITORY>.git
git remote -v
git push -u origin feature/nestjs-migration
```

按照仓库保护规则，通过 Pull Request 将功能分支合入 `main`，不要直接向 `main` 推送。

### 2.3 创建发布版本

服务器部署应使用 Git tag 或明确的提交 SHA，不建议直接部署会持续变化的 `main`。合并完成并通过检查后，可在 GitHub 创建 Release 和 tag，例如 `v2.0.0`。

发布前确认 tag 指向预期提交：

```bash
git fetch origin --prune --tags
git show --no-patch --decorate v2.0.0
```

## 3. 配置服务器访问 GitHub

### 3.1 私有仓库

推荐为服务器创建专用 SSH 密钥，并将公钥添加为 GitHub 仓库的只读 Deploy Key：

```bash
sudo install -d -m 0700 /root/.ssh
sudo ssh-keygen -t ed25519 -C "reimburse-deploy" -f /root/.ssh/reimburse_github
sudo cat /root/.ssh/reimburse_github.pub
```

在 GitHub 仓库的 `Settings -> Deploy keys` 添加公钥，不要启用写权限。为该密钥配置独立 SSH Host，例如 `github-reimburse`，并使用下面的仓库地址：

`/root/.ssh/config` 中对应配置为：

```sshconfig
Host github-reimburse
    HostName github.com
    User git
    IdentityFile /root/.ssh/reimburse_github
    IdentitiesOnly yes
```

配置文件权限应为 `0600`。仓库地址使用：

```text
git@github-reimburse:<OWNER>/<REPOSITORY>.git
```

首次连接时应核对 GitHub 官方公布的主机指纹，禁止关闭主机密钥校验。

### 3.2 公共仓库

公共仓库可以直接使用只读 HTTPS 地址：

```text
https://github.com/<OWNER>/<REPOSITORY>.git
```

## 4. 初始化服务器

先检查基础环境：

```bash
node --version
corepack --version
git --version
nginx -v
df -h
ss -lntp | grep ':8000'
```

确认 Node.js 版本符合要求后启用项目指定的 pnpm：

```bash
sudo corepack enable
corepack pnpm --version
```

创建运行用户和目录。重复执行前先确认已有用户和目录权限，避免覆盖现有部署：

```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin reimburse
sudo install -d -m 0750 /root/fanzongling/reimburse
sudo install -d -m 0750 /root/fanzongling/reimburse/releases
sudo install -d -m 0750 /root/fanzongling/reimburse/config
sudo install -d -m 0750 /root/fanzongling/reimburse/backups
sudo install -d -o reimburse -g reimburse -m 0750 /root/fanzongling/reimburse/shared/sqlite
sudo install -d -o reimburse -g reimburse -m 0750 /root/fanzongling/reimburse/shared/files
```

由于示例目录位于 `/root` 下，只给运行用户增加必要的目录穿越权限：

```bash
sudo setfacl -m u:reimburse:x /root
sudo setfacl -m u:reimburse:x /root/fanzongling
sudo setfacl -m u:reimburse:x /root/fanzongling/reimburse
sudo setfacl -m u:reimburse:rx /root/fanzongling/reimburse/releases
```

不要通过 `chmod 755 /root` 放宽整个 root 主目录权限。

## 5. 首次拉取代码

私有仓库示例：

```bash
sudo git clone git@github-reimburse:<OWNER>/<REPOSITORY>.git /root/fanzongling/reimburse/source
```

公共仓库示例：

```bash
sudo git clone https://github.com/<OWNER>/<REPOSITORY>.git /root/fanzongling/reimburse/source
```

拉取后检查远端和目标版本：

```bash
sudo git -C /root/fanzongling/reimburse/source remote -v
sudo git -C /root/fanzongling/reimburse/source fetch origin --prune --tags
sudo git -C /root/fanzongling/reimburse/source rev-parse 'v2.0.0^{commit}'
sudo git -C /root/fanzongling/reimburse/source show --no-patch --oneline v2.0.0
```

## 6. 生产环境变量

在本地可信终端使用项目脚本生成 bcrypt 哈希：

```bash
node scripts/generate-admin-hash.mjs "至少8位的管理员密码"
```

命令参数可能进入终端历史，因此不要在共享服务器或服务器 AI 的对话里传递管理员明文密码。将生成的哈希通过安全方式写入服务器环境文件。

创建 `/root/fanzongling/reimburse/config/reimburse.env`：

```dotenv
NODE_ENV=production
HOST=127.0.0.1
PORT=8000
APP_SQLITE_DIR=/root/fanzongling/reimburse/shared/sqlite
APP_FILES_DIR=/root/fanzongling/reimburse/shared/files
ADMIN_PASSWORD_HASH=<完整的 bcrypt 哈希>
SESSION_SECRET=<至少32字符的随机密钥>
COOKIE_SECURE=true
```

`SESSION_SECRET` 可以用 `openssl rand -hex 32` 生成。环境文件要求：

```bash
sudo chown root:reimburse /root/fanzongling/reimburse/config/reimburse.env
sudo chmod 0640 /root/fanzongling/reimburse/config/reimburse.env
```

注意：

- bcrypt 哈希中的 `$` 必须原样保留。
- 已有生产环境升级时复用原来的 `SESSION_SECRET` 和密码哈希，不要擅自重新生成。
- 使用 HTTPS 时设置 `COOKIE_SECURE=true`；仅在明确使用 HTTP 的临时内网环境中设置为 `false`。

## 7. 构建一个不可变版本

以下示例发布 tag `v2.0.0`。每次发布都应创建新的版本目录，禁止覆盖旧目录。

```bash
sudo git -C /root/fanzongling/reimburse/source fetch origin --prune --tags
sudo git -C /root/fanzongling/reimburse/source rev-parse 'v2.0.0^{commit}'
sudo install -d -m 0750 /root/fanzongling/reimburse/releases/20260902-200000-v2.0.0
sudo git -C /root/fanzongling/reimburse/source archive v2.0.0 | sudo tar -x -C /root/fanzongling/reimburse/releases/20260902-200000-v2.0.0
cd /root/fanzongling/reimburse/releases/20260902-200000-v2.0.0
sudo corepack pnpm install --frozen-lockfile
sudo corepack pnpm lint
sudo corepack pnpm typecheck
sudo corepack pnpm test
sudo corepack pnpm build
sudo corepack pnpm install --prod --frozen-lockfile
```

将示例时间和 tag 替换为真实值。构建完成后确认：

```bash
test -f apps/api/dist/main.js
test -f apps/web/dist/index.html
test -f packages/shared/dist/index.js
```

设置发布目录只读权限，运行用户只需要读取代码和依赖：

```bash
sudo chown -R root:reimburse /root/fanzongling/reimburse/releases/20260902-200000-v2.0.0
sudo chmod -R o-rwx /root/fanzongling/reimburse/releases/20260902-200000-v2.0.0
sudo find /root/fanzongling/reimburse/releases/20260902-200000-v2.0.0 -type d -exec chmod g+rx {} +
sudo find /root/fanzongling/reimburse/releases/20260902-200000-v2.0.0 -type f -exec chmod g+r {} +
```

服务器从 GitHub 构建时不需要执行 `scripts/build-release.sh`；该脚本主要用于在本地生成可上传的发布压缩包。

## 8. 数据迁移和备份

数据库文件为：

```text
/root/fanzongling/reimburse/shared/sqlite/reimburse.sqlite3
```

首次启动会自动创建数据库表。如果 `shared/sqlite/records.json` 存在且尚未迁移，应用会在启动时迁移旧 JSON，并把附件写入 `shared/files`。

启动前必须确认：

- 旧数据已经完整备份。
- 旧数据库、JSON 和附件确实属于本项目。
- 不要把其他报销项目的数据目录直接指向本项目。
- 数据库中已有附件记录时，对应磁盘文件必须存在，否则应用会因附件完整性检查失败而拒绝启动。

升级前先停止服务，再完整备份 `shared/sqlite` 和 `shared/files`。SQLite 使用 WAL 模式，不得只复制主库或单独处理 `-wal`、`-shm` 文件。

```bash
sudo systemctl stop reimburse
cd /root/fanzongling/reimburse/releases/20260902-200000-v2.0.0
sudo env REIMBURSE_ROOT=/root/fanzongling/reimburse ./scripts/backup-runtime-data.sh /root/fanzongling/reimburse/backups
sudo tar -tzf /root/fanzongling/reimburse/backups/<备份文件名>.tar.gz >/dev/null
```

首次空数据部署不需要停服；如果服务器已经存在来源不明的旧数据，应停止操作并先确认迁移方案。

## 9. 配置 systemd

仓库提供了 `scripts/systemd/reimburse.service`。安装前确认：

```bash
command -v node
/usr/bin/node --version
```

项目默认单元使用 `/usr/bin/node`。如果合格版本的 Node.js 位于其他路径，应修改复制到 `/etc/systemd/system/reimburse.service` 的 `ExecStart`，不能让 systemd 使用旧版 Node.js。

首次发布先把 `current` 指向构建完成的新版本，然后安装单元：

```bash
sudo ln -s /root/fanzongling/reimburse/releases/20260902-200000-v2.0.0 /root/fanzongling/reimburse/current.next
sudo mv -Tf /root/fanzongling/reimburse/current.next /root/fanzongling/reimburse/current
sudo /root/fanzongling/reimburse/current/scripts/install-systemd.sh
sudo systemctl start reimburse
```

检查状态：

```bash
sudo systemctl status reimburse --no-pager
sudo journalctl -u reimburse -n 100 --no-pager
curl --fail --silent --show-error http://127.0.0.1:8000/api/v1/health
```

健康检查成功时应返回 `service: up` 和 `database: up`。

## 10. 配置 Nginx 和 HTTPS

应用同时提供前端页面与 `/api`，因此整个站点都代理到 `127.0.0.1:8000`。以下是基础示例：

```nginx
server {
    listen 80;
    server_name reimburse.example.com;

    client_max_body_size 650m;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

后端限制为单文件最大 10MB、一次最多 60 个文件；如果业务不需要理论最大请求，可以根据实际情况收紧 Nginx 限制，但不能低到导致正常上传返回 `413 Request Entity Too Large`。

替换真实域名后：

1. 备份现有 Nginx 配置。
2. 执行 `sudo nginx -t`。
3. 重载 Nginx。
4. 使用可信证书启用 HTTPS。
5. 确认生产环境 `COOKIE_SECURE=true`。
6. 防火墙不要向公网开放 8000，只开放 80/443。

## 11. 后续升级流程

每次升级使用新的 tag 或明确提交 SHA，流程如下：

1. `source` 执行 `git fetch origin --prune --tags`。
2. 核对目标 tag、提交 SHA 和 GitHub 发布记录。
3. 用 `git archive` 导出到新的 `releases/<时间>-<版本>`。
4. 安装依赖，执行 lint、类型检查、测试和构建。
5. 记录旧 `current` 指向及服务状态。
6. 停止服务并完整备份运行数据。
7. 原子切换 `current` 软链接。
8. 重启服务并执行健康检查。
9. 验证公网首页、登录、提交、附件预览、状态更新和导出。
10. 确认稳定后再清理过旧版本，至少保留最近两个可回滚版本。

切换前记录旧版本：

```bash
readlink -f /root/fanzongling/reimburse/current
```

升级时使用 `current.next` 临时软链接和 `mv -Tf` 完成原子切换，不要直接删除当前运行目录。

## 12. 上线验收

自动检查：

```bash
curl --fail --silent --show-error http://127.0.0.1:8000/api/v1/health
curl --fail --silent --show-error https://<真实域名>/api/v1/health
curl --head https://<真实域名>/
sudo systemctl is-active reimburse
sudo journalctl -u reimburse --since "10 minutes ago" --no-pager
```

生产环境默认不提供 `/api/docs`。还应手工验证：

1. `/submit` 提交报销记录，并上传打卡图片及凭证图片/PDF。
2. 未登录访问 `/admin/summary` 会跳转登录页。
3. 管理员登录、筛选、详情、附件预览、状态更新和删除确认正常。
4. CSV、Excel、ZIP、Word 和打印导出正常。
5. 桌面端与移动端布局正常。

升级前后应对比：

- `records` 表记录数。
- `attachments` 表记录数。
- `shared/files` 实际文件数。
- `PRAGMA integrity_check` 结果为 `ok`。
- `PRAGMA foreign_key_check` 无结果。

不要为了自动验收擅自新增或删除正式数据；业务写入测试应由管理员明确执行。

## 13. 回滚

程序异常时只回滚代码版本：

```bash
sudo systemctl stop reimburse
sudo ln -s /root/fanzongling/reimburse/releases/<上一版本> /root/fanzongling/reimburse/current.rollback
sudo mv -Tf /root/fanzongling/reimburse/current.rollback /root/fanzongling/reimburse/current
sudo systemctl start reimburse
curl --fail --silent --show-error http://127.0.0.1:8000/api/v1/health
```

回滚后检查服务日志和公网访问。禁止自动用旧备份覆盖当前 `shared` 数据；只有确认数据损坏并获得明确授权后，才允许恢复数据库和附件备份。

## 14. 常见故障

- `node:sqlite` 不可用：systemd 使用了过旧或错误路径的 Node.js。
- systemd 报权限错误：检查 `/root` 父目录 ACL、发布目录组权限以及 `shared` 所有权。
- 启动时报附件完整性失败：数据库存在附件记录，但 `shared/files` 缺少对应文件；不要绕过检查，应从备份恢复或核对迁移数据。
- 登录成功但浏览器没有会话：检查 HTTPS、`COOKIE_SECURE`、域名和反向代理协议头。
- 上传返回 413：调整 Nginx 的 `client_max_body_size`。
- 页面显示 502：先检查 `systemctl status reimburse` 和 `journalctl -u reimburse`，再检查端口及 Nginx upstream。
- 服务启动后没有 `/api/docs`：这是生产环境的预期行为。

## 15. 交给服务器 AI 的执行边界

服务器 AI 可以执行安装、拉取、构建、配置和切换，但必须遵守：

- 先检查再修改，并报告检测到的旧服务、旧目录、端口和数据。
- 不得将明文密码或生产密钥写入对话和日志。
- 不得猜测来源不明的数据目录或数据库迁移方式。
- 不得直接覆盖旧发布目录。
- 停服后完整备份 SQLite 目录和附件目录，并验证备份可读取。
- 构建或健康检查失败时不得切换版本；切换后失败则立即回滚代码。
- 未经明确授权不得删除发布版本、数据库、附件或备份。
- 最终报告目标 tag、提交 SHA、版本目录、备份位置、服务状态、健康检查和仍需人工验收的项目。
