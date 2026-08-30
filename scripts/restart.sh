#!/usr/bin/env bash
# ============================================================
# MachineIQ — Restart Dev Servers
# Kills any processes on ports 4050/4051, then starts fresh
# with auto-restart on crash and live log streaming
# ============================================================
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPTS_DIR="$ROOT_DIR/scripts"

echo "============================================"
echo "  MachineIQ — Restart"
echo "============================================"

# 1. Stop anything currently running on the ports
"$SCRIPTS_DIR/stop.sh"
echo ""

# 2. Start both servers (with auto-restart loops) in background
"$SCRIPTS_DIR/dev.sh" --skip-port-stop &
DEV_PID=$!

cleanup() {
  kill "$DEV_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# 3. Give servers a moment to initialize before streaming logs
sleep 3

# 4. Stream live logs (Ctrl+C here also kills the dev servers via trap)
"$SCRIPTS_DIR/logs.sh"
