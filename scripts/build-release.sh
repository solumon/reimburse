#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE_ROOT="${PROJECT_ROOT}/release"
RELEASE_DIR="${RELEASE_ROOT}/reimburse-$(date +%Y%m%d-%H%M%S)"

cd "${PROJECT_ROOT}"
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build

mkdir -p "${RELEASE_DIR}/apps/api" "${RELEASE_DIR}/apps/web" "${RELEASE_DIR}/packages/shared"
cp -a apps/api/dist apps/api/package.json apps/api/nest-cli.json "${RELEASE_DIR}/apps/api/"
cp -a apps/web/dist apps/web/package.json "${RELEASE_DIR}/apps/web/"
cp -a packages/shared/dist packages/shared/package.json "${RELEASE_DIR}/packages/shared/"
cp -a package.json pnpm-workspace.yaml pnpm-lock.yaml .node-version "${RELEASE_DIR}/"
tar -C "${RELEASE_ROOT}" -czf "${RELEASE_DIR}.tar.gz" "$(basename "${RELEASE_DIR}")"
echo "发布包已生成：${RELEASE_DIR}.tar.gz"
