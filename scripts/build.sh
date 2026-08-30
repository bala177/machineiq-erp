#!/usr/bin/env bash
# ============================================================
# MachineIQ — Production Build
# Builds both backend and frontend for deployment
# ============================================================
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "============================================"
echo "  MachineIQ — Building for Production"
echo "============================================"

# Backend
echo ""
echo "→ Building backend..."
cd "$ROOT_DIR/backend"
npm run build
echo "  Backend build → backend/dist/"

# Frontend
echo ""
echo "→ Building frontend..."
cd "$ROOT_DIR/frontend"
npm run build
echo "  Frontend build → frontend/.next/"

echo ""
echo "============================================"
echo "  Build complete!"
echo "  Backend:  cd backend && npm run start:prod"
echo "  Frontend: cd frontend && npm start"
echo "============================================"
