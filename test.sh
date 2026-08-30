#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

npm --prefix "$ROOT_DIR/backend" test -- --runInBand
npm --prefix "$ROOT_DIR/backend" run build
npm --prefix "$ROOT_DIR/frontend" run build#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  echo "Dependencies not installed. Running npm install..."
  npm install
fi

npm test
