#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SYSTEM_ROOT="${REIMBURSE_ROOT:-${PROJECT_ROOT}}"
RUNTIME_ROOT="${SYSTEM_ROOT}/shared"
if [[ ! -d "${RUNTIME_ROOT}/sqlite" && -d "${SYSTEM_ROOT}/sqlite" ]]; then
  RUNTIME_ROOT="${SYSTEM_ROOT}"
fi

SQLITE_DIR="${RUNTIME_ROOT}/sqlite"
FILES_DIR="${RUNTIME_ROOT}/files"
BACKUP_ROOT="${1:-${SYSTEM_ROOT}/backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${BACKUP_ROOT}/reimburse-${TIMESTAMP}"

if [[ ! -d "${SQLITE_DIR}" || ! -d "${FILES_DIR}" ]]; then
  echo "运行数据目录不存在：${SQLITE_DIR} 或 ${FILES_DIR}" >&2
  exit 1
fi

mkdir -p "${BACKUP_DIR}"

# SQLite 备份必须同时包含 WAL/SHM，避免丢掉尚未 checkpoint 的提交。
cp -a "${SQLITE_DIR}" "${BACKUP_DIR}/sqlite"
cp -a "${FILES_DIR}" "${BACKUP_DIR}/files"

tar -C "${BACKUP_ROOT}" -czf "${BACKUP_DIR}.tar.gz" "$(basename "${BACKUP_DIR}")"
echo "备份已生成：${BACKUP_DIR}.tar.gz"
