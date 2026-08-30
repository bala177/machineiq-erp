#!/usr/bin/env bash
# ============================================================
# MachineIQ — Reset Database
#
# Usage:
#   ./scripts/reset-db.sh           → drop all + seed users only (clean slate)
#   ./scripts/reset-db.sh --demo    → drop all + seed full demo project data
# ============================================================
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR/backend"

echo "============================================"
echo "  MachineIQ — Database Reset"
echo "============================================"

echo ""
echo "Step 1/2 — Recreating PostgreSQL from migrations..."
npm run db:reset

echo ""
if [ "$1" == "--demo" ]; then
  echo "Step 2/2 — Seeding deterministic client demo data..."
  npm run seed
  echo ""
  echo "  Mode: DEMO — includes sample project, tasks, procurement"
else
  echo "Step 2/2 — Seeding master data only (registration remains open)..."
  npm run seed:master
  echo ""
  echo "  Mode: CLEAN — open /setup to create the first administrator"
fi

echo ""
echo "============================================"
if [ "${1:-}" = "--demo" ]; then
  echo "  Client review login: reviewer@machineiq.local / ChangeMe123!"
else
  echo "  No user was seeded. Complete first-user registration at /setup."
fi
echo "============================================"
