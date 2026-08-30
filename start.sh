#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ ! -d "$ROOT_DIR/backend/node_modules" || ! -d "$ROOT_DIR/frontend/node_modules" ]]; then
  "$ROOT_DIR/scripts/setup.sh"
fi

exec "$ROOT_DIR/scripts/dev.sh" "$@"
