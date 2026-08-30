#!/usr/bin/env bash
# ============================================================
# MachineIQ — Seed Database
# Populates PostgreSQL with deterministic client-review data
# ============================================================
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "============================================"
echo "  MachineIQ — Seeding Database"
echo "============================================"

cd "$ROOT_DIR/backend"
npm run seed

echo ""
echo "============================================"
echo "  Seed complete!"
echo "  Login: reviewer@machineiq.local / ChangeMe123!"
echo "============================================"
