#!/usr/bin/env bash
# ============================================================
# MachineIQ — Project Setup
# Installs all dependencies and prepares env files
# ============================================================
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "============================================"
echo "  MachineIQ — Installing Dependencies"
echo "============================================"

# Backend
echo ""
echo "→ Installing backend dependencies..."
cd "$ROOT_DIR/backend"
npm install --legacy-peer-deps

# Frontend
echo ""
echo "→ Installing frontend dependencies..."
cd "$ROOT_DIR/frontend"
npm install --legacy-peer-deps

# Env files
echo ""
echo "→ Checking .env files..."

if [ ! -f "$ROOT_DIR/backend/.env" ]; then
  cp "$ROOT_DIR/backend/.env.example" "$ROOT_DIR/backend/.env"
  echo "  Created backend/.env from .env.example"
else
  echo "  backend/.env already exists — skipping"
fi

if [ ! -f "$ROOT_DIR/frontend/.env.local" ]; then
  cp "$ROOT_DIR/frontend/.env.example" "$ROOT_DIR/frontend/.env.local"
  echo "  Created frontend/.env.local from .env.example"
else
  echo "  frontend/.env.local already exists — skipping"
fi

echo ""
echo "============================================"
echo "  Setup complete!"
echo "  Next: ./scripts/postgres-setup.sh"
echo "        ./scripts/reset-db.sh"
echo "        ./scripts/dev.sh"
echo "============================================"
