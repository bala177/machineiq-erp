#!/usr/bin/env bash
# ============================================================
# MachineIQ — Dev Servers (backend + frontend)
# Runs both servers concurrently — auto-restarts on crash
# Ctrl+C stops both cleanly
# ============================================================

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPTS_DIR="$ROOT_DIR/scripts"
LOG_DIR="$ROOT_DIR/logs"
STOP_FILE="$LOG_DIR/.stopping"
PID_FILE="$LOG_DIR/dev.pid"
SKIP_PORT_STOP=false

case "${1:-}" in
  --skip-port-stop|--skip-stop)
    SKIP_PORT_STOP=true
    shift
    ;;
esac

if [ "$#" -gt 0 ]; then
  echo "Unknown argument: $1"
  echo "Usage: ./scripts/dev.sh [--skip-port-stop]"
  exit 1
fi

mkdir -p "$LOG_DIR"

if ! command -v pg_isready >/dev/null 2>&1 || ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
  echo "PostgreSQL is not ready on localhost:5432."
  echo "Run ./scripts/postgres-setup.sh, then start development again."
  exit 1
fi

if [ "$SKIP_PORT_STOP" != true ]; then
  "$SCRIPTS_DIR/stop.sh"
  echo ""
fi

rm -f "$STOP_FILE"
echo "$$" > "$PID_FILE"

: > "$LOG_DIR/backend.log"
: > "$LOG_DIR/backend.err.log"
: > "$LOG_DIR/frontend.log"
: > "$LOG_DIR/frontend.err.log"

cleanup() {
  echo ""
  echo "Shutting down dev servers..."
  touch "$STOP_FILE"
  # Kill the restart-loop subshells; stop.sh handles port listeners across shells.
  jobs -p | xargs -r kill 2>/dev/null || true
  wait 2>/dev/null || true
  "$SCRIPTS_DIR/stop.sh" >/dev/null 2>&1 || true
  rm -f "$PID_FILE" "$STOP_FILE"
  echo "Done."
}
trap cleanup EXIT INT TERM

# Runs a service in a loop, restarting on crash until STOP_FILE appears
watch_and_restart() {
  local name="$1" dir="$2" cmd="$3" log="$4" errlog="$5"
  while true; do
    (cd "$dir" && bash -c "$cmd") >>"$log" 2>>"$errlog" &
    local pid=$!
    wait "$pid" 2>/dev/null || true
    [ -f "$STOP_FILE" ] && break
    local ts; ts=$(date '+%H:%M:%S')
    echo "" | tee -a "$log"
    echo "[$ts] [$name] process exited — restarting in 3s..." | tee -a "$log"
    sleep 3
    [ -f "$STOP_FILE" ] && break
  done
}

echo "============================================"
echo "  MachineIQ — Starting Dev Servers"
echo "============================================"
echo "  Logs: $LOG_DIR"
echo "============================================"

echo "→ Starting backend on :4051..."
watch_and_restart \
  "backend" \
  "$ROOT_DIR/backend" \
  "npm run start:dev" \
  "$LOG_DIR/backend.log" \
  "$LOG_DIR/backend.err.log" &

echo "→ Starting frontend on :4050..."
watch_and_restart \
  "frontend" \
  "$ROOT_DIR/frontend" \
  "CHOKIDAR_USEPOLLING=1 npm run dev" \
  "$LOG_DIR/frontend.log" \
  "$LOG_DIR/frontend.err.log" &

echo ""
echo "  Backend:  http://localhost:4051/api"
echo "  Frontend: http://localhost:4050"
echo "  Run ./scripts/logs.sh to watch live logs"
echo "  Press Ctrl+C to stop both"
echo "============================================"

wait
