#!/bin/zsh
# LOCAL DEV ONLY (npm) — for Docker shutdown use ../stop.command (Mac) or ../stop.bat (Windows)
# Stop RestoPro and free backend/frontend ports.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_PORT="${BACKEND_PORT:-5001}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

info() { print -P "${CYAN}▸${NC} $*"; }
ok()   { print -P "${GREEN}✓${NC} $*"; }

free_port() {
  local port="$1"
  local label="${2:-port $1}"
  local pids
  pids="$(lsof -ti tcp:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    info "Freeing $label (PIDs: ${pids//$'\n'/, })"
    print -r -- "$pids" | xargs kill -TERM 2>/dev/null || true
    sleep 0.5
    pids="$(lsof -ti tcp:"$port" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -n "$pids" ]]; then
      print -r -- "$pids" | xargs kill -KILL 2>/dev/null || true
    fi
    ok "Released $label"
  else
    ok "$label already free"
  fi
}

kill_project_node() {
  local pids
  pids="$(
    {
      pgrep -f "$ROOT/backend" || true
      pgrep -f "$ROOT/frontend" || true
    } | sort -u || true
  )"
  if [[ -n "$pids" ]]; then
    info "Stopping leftover RestoPro node processes"
    print -r -- "$pids" | xargs kill -KILL 2>/dev/null || true
  fi
}

print ""
print -P "${GREEN}RestoPro — stop stack${NC}"
print ""
free_port "$BACKEND_PORT" "backend :$BACKEND_PORT"
free_port "$FRONTEND_PORT" "frontend :$FRONTEND_PORT"
kill_project_node
ok "Done"
print ""
