#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "请使用 root 权限执行此脚本。" >&2
  exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
install -m 0644 "${PROJECT_ROOT}/scripts/systemd/reimburse.service" /etc/systemd/system/reimburse.service
systemctl daemon-reload
systemctl enable reimburse.service
echo "systemd 单元已安装。确认 /root/fanzongling/reimburse/config/reimburse.env 后执行 systemctl start reimburse。"
