#!/bin/zsh
# LOCAL DEV ONLY (npm) — for Docker one-click startup use ../start.command (Mac) or ../start.bat (Windows)
# Start RestoPro: free ports, then run backend + frontend (+ local Mongo if needed).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend/frontend"
LOG_DIR="$ROOT/.run"
BACKEND_PORT="${BACKEND_PORT:-5001}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
MONGO_PORT="${MONGO_PORT:-27017}"

mkdir -p "$LOG_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { print -P "${CYAN}▸${NC} $*"; }
ok()    { print -P "${GREEN}✓${NC} $*"; }
warn()  { print -P "${YELLOW}!${NC} $*"; }
fail()  { print -P "${RED}✗${NC} $*"; exit 1; }

load_node() {
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [[ -s "$NVM_DIR/nvm.sh" ]]; then
    # shellcheck disable=SC1090
    . "$NVM_DIR/nvm.sh"
    nvm use default >/dev/null 2>&1 || true
  fi
  export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
  command -v node >/dev/null 2>&1 || fail "Node.js not found. Install Node or nvm first."
  command -v npm >/dev/null 2>&1 || fail "npm not found."
}

pids_on_port() {
  lsof -ti tcp:"$1" -sTCP:LISTEN 2>/dev/null || true
}

free_port() {
  local port="$1"
  local label="${2:-port $1}"
  local pids
  pids="$(pids_on_port "$port")"
  if [[ -n "$pids" ]]; then
    info "Freeing $label (PIDs: ${pids//$'\n'/, })"
    print -r -- "$pids" | xargs kill -TERM 2>/dev/null || true
    sleep 0.6
    pids="$(pids_on_port "$port")"
    if [[ -n "$pids" ]]; then
      print -r -- "$pids" | xargs kill -KILL 2>/dev/null || true
      sleep 0.2
    fi
    ok "Released $label"
  else
    ok "$label is free"
  fi
}

kill_project_node() {
  local pids
  pids="$(
    {
      pgrep -f "$ROOT/backend" || true
      pgrep -f "$ROOT/frontend" || true
    } | sort -u | grep -v "^$$\$" || true
  )"
  if [[ -n "$pids" ]]; then
    info "Stopping leftover RestoPro node processes"
    print -r -- "$pids" | xargs kill -TERM 2>/dev/null || true
    sleep 0.4
    pids="$(
      {
        pgrep -f "$ROOT/backend" || true
        pgrep -f "$ROOT/frontend" || true
      } | sort -u | grep -v "^$$\$" || true
    )"
    if [[ -n "$pids" ]]; then
      print -r -- "$pids" | xargs kill -KILL 2>/dev/null || true
    fi
  fi
}

read_env_value() {
  local file="$1" key="$2"
  [[ -f "$file" ]] || return 0
  grep -E "^${key}=" "$file" | tail -n 1 | cut -d= -f2- | tr -d '\r'
}

ensure_deps() {
  local dir="$1" name="$2"
  if [[ ! -d "$dir/node_modules" ]]; then
    info "Installing $name dependencies…"
    (cd "$dir" && npm install)
    ok "$name dependencies installed"
  else
    ok "$name dependencies ready"
  fi
}

wait_for_http() {
  local url="$1" label="$2" seconds="${3:-40}"
  local i
  for i in $(seq 1 "$seconds"); do
    if curl -sf -o /dev/null --max-time 1 "$url" 2>/dev/null; then
      ok "$label is up → $url"
      return 0
    fi
    sleep 1
  done
  warn "$label did not respond yet ($url). Check $LOG_DIR logs."
  return 1
}

ensure_mongo() {
  local uri
  uri="$(read_env_value "$BACKEND/.env" MONGO_URI)"
  if [[ -z "$uri" ]]; then
    warn "No MONGO_URI in backend/.env — backend may fail to start"
    return 0
  fi

  if [[ "$uri" == mongodb+srv://* ]] || [[ "$uri" == *"mongodb.net"* ]]; then
    ok "MongoDB Atlas (cloud) — no local mongod needed"
    return 0
  fi

  if [[ "$uri" == *"localhost"* ]] || [[ "$uri" == *"127.0.0.1"* ]]; then
    if nc -z 127.0.0.1 "$MONGO_PORT" >/dev/null 2>&1; then
      ok "Local MongoDB already listening on $MONGO_PORT"
      return 0
    fi

    info "Starting local MongoDB…"
    if command -v brew >/dev/null 2>&1 && brew services list 2>/dev/null | grep -Eq 'mongodb-community|mongodb-community@'; then
      brew services start mongodb-community >/dev/null 2>&1 \
        || brew services start mongodb-community@7.0 >/dev/null 2>&1 \
        || true
    elif command -v docker >/dev/null 2>&1; then
      if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -qx 'restopro-mongo'; then
        docker start restopro-mongo >/dev/null
      else
        docker run -d --name restopro-mongo -p "${MONGO_PORT}:27017" mongo:7 >/dev/null
      fi
    elif command -v mongod >/dev/null 2>&1; then
      mkdir -p "$LOG_DIR/mongo-data"
      mongod --dbpath "$LOG_DIR/mongo-data" --port "$MONGO_PORT" --fork \
        --logpath "$LOG_DIR/mongo.log" >/dev/null
    else
      fail "Local MongoDB is not running and no mongod/docker/brew service was found."
    fi

    local i
    for i in $(seq 1 20); do
      if nc -z 127.0.0.1 "$MONGO_PORT" >/dev/null 2>&1; then
        ok "Local MongoDB is ready on $MONGO_PORT"
        return 0
      fi
      sleep 0.5
    done
    fail "Could not start local MongoDB on port $MONGO_PORT"
  else
    ok "Using remote MongoDB from backend/.env"
  fi
}

CLEANED=0
cleanup() {
  [[ "$CLEANED" -eq 1 ]] && return
  CLEANED=1
  print ""
  info "Stopping RestoPro…"
  free_port "$BACKEND_PORT" "backend :$BACKEND_PORT"
  free_port "$FRONTEND_PORT" "frontend :$FRONTEND_PORT"
  kill_project_node
  ok "All RestoPro processes stopped"
}

trap cleanup INT TERM HUP

clear 2>/dev/null || true
print ""
print -P "${GREEN}══════════════════════════════════════${NC}"
print -P "${GREEN}   RestoPro — start stack${NC}"
print -P "${GREEN}══════════════════════════════════════${NC}"
print ""

load_node
ok "Node $(node -v) · npm $(npm -v | head -n1)"

info "Freeing required ports and leftover processes…"
kill_project_node
free_port "$BACKEND_PORT" "backend :$BACKEND_PORT"
free_port "$FRONTEND_PORT" "frontend :$FRONTEND_PORT"

ensure_mongo
ensure_deps "$BACKEND" "backend"
ensure_deps "$FRONTEND" "frontend"

: > "$LOG_DIR/backend.log"
: > "$LOG_DIR/frontend.log"

info "Starting backend on :$BACKEND_PORT…"
(
  cd "$BACKEND"
  npm run start:dev
) >> "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!

info "Starting frontend on :$FRONTEND_PORT…"
(
  cd "$FRONTEND"
  npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT"
) >> "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!

wait_for_http "http://127.0.0.1:${BACKEND_PORT}/api/docs" "Backend / Swagger" 50 || \
  wait_for_http "http://127.0.0.1:${BACKEND_PORT}" "Backend" 10 || true
wait_for_http "http://127.0.0.1:${FRONTEND_PORT}" "Frontend" 40 || true

open "http://localhost:${FRONTEND_PORT}" >/dev/null 2>&1 || true

print ""
ok "RestoPro is running"
print "   Frontend  http://localhost:${FRONTEND_PORT}"
print "   Backend   http://localhost:${BACKEND_PORT}"
print "   Swagger   http://localhost:${BACKEND_PORT}/api/docs"
print "   Logs      $LOG_DIR"
print ""
warn "Leave this window open. Press Ctrl+C to stop everything."
print ""

tail -n +1 -f "$LOG_DIR/backend.log" "$LOG_DIR/frontend.log" &
TAIL_PID=$!
wait "$BACKEND_PID" "$FRONTEND_PID" || true
kill "$TAIL_PID" 2>/dev/null || true
cleanup
