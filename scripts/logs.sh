#!/usr/bin/env bash
# ============================================================
# MachineIQ — Live Logs
# Streams backend and frontend logs from the logs/ directory
# ============================================================
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs"

mkdir -p "$LOG_DIR"
touch \
  "$LOG_DIR/backend.log" \
  "$LOG_DIR/backend.err.log" \
  "$LOG_DIR/backend-prod.out.log" \
  "$LOG_DIR/backend-prod.err.log" \
  "$LOG_DIR/frontend.log" \
  "$LOG_DIR/frontend.err.log" \
  "$LOG_DIR/frontend-prod.out.log" \
  "$LOG_DIR/frontend-prod.err.log"

echo "============================================"
echo "  MachineIQ — Live Logs"
echo "============================================"
echo "  Watching:"
echo "  - logs/backend.log"
echo "  - logs/backend.err.log"
echo "  - logs/backend-prod.out.log"
echo "  - logs/backend-prod.err.log"
echo "  - logs/frontend.log"
echo "  - logs/frontend.err.log"
echo "  - logs/frontend-prod.out.log"
echo "  - logs/frontend-prod.err.log"
echo "  Press Ctrl+C to stop"
echo "============================================"

tail -n 50 -F \
  "$LOG_DIR/backend.log" \
  "$LOG_DIR/backend.err.log" \
  "$LOG_DIR/backend-prod.out.log" \
  "$LOG_DIR/backend-prod.err.log" \
  "$LOG_DIR/frontend.log" \
  "$LOG_DIR/frontend.err.log" \
  "$LOG_DIR/frontend-prod.out.log" \
  "$LOG_DIR/frontend-prod.err.log"
