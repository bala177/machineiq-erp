#!/usr/bin/env bash
# ============================================================
# MachineIQ — Stop Dev Servers
# Stops processes listening on the frontend/backend ports
# Works on macOS/Linux (lsof) and Windows Git Bash (netstat+taskkill)
# ============================================================

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs"
STOP_FILE="$LOG_DIR/.stopping"
PID_FILE="$LOG_DIR/dev.pid"

mkdir -p "$LOG_DIR"
touch "$STOP_FILE"

echo "============================================"
echo "  MachineIQ — Stopping Dev Servers"
echo "============================================"
echo "  Ports: 4050, 4051"
echo "============================================"
echo "Signaled dev restart loops to stop."

# Detect Windows (Git Bash / MSYS2 / Cygwin)
is_windows() {
  case "$OSTYPE" in msys*|cygwin*|win32*) return 0 ;; esac
  return 1
}

get_port_pids() {
  local port="$1"
  if is_windows; then
    netstat -ano 2>/dev/null \
      | awk -v port="$port" '$0 ~ /LISTENING/ && $2 ~ ":" port "$" { gsub(/\r/, "", $NF); print $NF }' \
      | sort -u
  else
    lsof -ti:"$port" 2>/dev/null || true
  fi
}

kill_pid() {
  local pid="$1"
  if is_windows; then
    MSYS_NO_PATHCONV=1 taskkill.exe /F /T /PID "$pid" >/dev/null 2>&1 ||
      kill -f "$pid" >/dev/null 2>&1 ||
      kill "$pid" >/dev/null 2>&1 ||
      true
  else
    kill -9 "$pid" 2>/dev/null || true
  fi
}

port_free() {
  local port="$1"
  [ -z "$(get_port_pids "$port")" ]
}

stop_dev_wrapper() {
  [ -f "$PID_FILE" ] || return 0

  local wrapper_pid
  wrapper_pid="$(tr -d '\r\n' < "$PID_FILE")"
  [ -n "$wrapper_pid" ] || return 0
  [ "$wrapper_pid" != "$$" ] || return 0
  [ "$wrapper_pid" != "${PPID:-}" ] || return 0

  local process_name
  process_name="$(ps -p "$wrapper_pid" -o comm= 2>/dev/null | tr -d '\r\n')"
  case "$process_name" in
    *bash*|*sh*)
      echo "Stopping dev wrapper PID $wrapper_pid..."
      kill "$wrapper_pid" 2>/dev/null || true
      ;;
  esac
}

stop_dev_wrapper

FOUND=false
for PORT in 4050 4051; do
  PIDS=$(get_port_pids "$PORT")
  if [ -n "$PIDS" ]; then
    FOUND=true
    for PID in $PIDS; do
      [ -z "$PID" ] && continue
      echo "Stopping PID $PID on port $PORT..."
      kill_pid "$PID"
    done
  fi
done

if [ "$FOUND" = false ]; then
  echo "No processes found on ports 4050 or 4051."
fi

# Wait until both ports are actually free before returning
echo "Waiting for ports to be released..."
STABLE_TICKS=0
for i in $(seq 1 40); do
  ACTIVE_PIDS=""
  for PORT in 4050 4051; do
    PIDS=$(get_port_pids "$PORT")
    [ -n "$PIDS" ] && ACTIVE_PIDS="$ACTIVE_PIDS $PIDS"
  done

  if [ -z "$ACTIVE_PIDS" ]; then
    STABLE_TICKS=$((STABLE_TICKS + 1))
    if [ "$STABLE_TICKS" -ge 14 ]; then
      break
    fi
    sleep 0.3
    continue
  fi

  STABLE_TICKS=0
  for PID in $(printf '%s\n' $ACTIVE_PIDS | sort -u); do
    [ -z "$PID" ] && continue
    echo "Stopping restarted PID $PID..."
    kill_pid "$PID"
  done
  sleep 0.3
done

for PORT in 4050 4051; do
  if ! port_free "$PORT"; then
    echo "Warning: port $PORT is still in use after waiting."
  fi
done

echo "Done."
