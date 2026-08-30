#!/usr/bin/env bash
# ============================================================
# MachineIQ — Clean
# Removes node_modules and build artifacts
# ============================================================
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "============================================"
echo "  MachineIQ — Cleaning Build Artifacts"
echo "============================================"

echo "→ Cleaning backend..."
rm -rf "$ROOT_DIR/backend/node_modules" "$ROOT_DIR/backend/dist"

echo "→ Cleaning frontend..."
rm -rf "$ROOT_DIR/frontend/node_modules" "$ROOT_DIR/frontend/.next"

echo ""
echo "  Done. Run ./scripts/setup.sh to reinstall."
echo "============================================"
