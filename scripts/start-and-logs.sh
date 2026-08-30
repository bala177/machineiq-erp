#!/usr/bin/env bash
# ============================================================
# MachineIQ — Start And Logs
# Stops any running servers, starts fresh, then streams live logs
# ============================================================
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPTS_DIR="$ROOT_DIR/scripts"

# Always stop first so ports are guaranteed free
"$SCRIPTS_DIR/stop.sh"

"$SCRIPTS_DIR/dev.sh" --skip-port-stop &
DEV_WRAPPER_PID=$!

cleanup() {
  kill "$DEV_WRAPPER_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

sleep 3

"$SCRIPTS_DIR/logs.sh"
