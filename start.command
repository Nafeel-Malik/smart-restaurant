#!/bin/bash
# RestoPro — one-click Docker startup (macOS)
# Double-click in Finder, or run: ./start.command

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:5001"
MAX_WAIT=120

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { printf "${CYAN}▸${NC} %s\n" "$*"; }
ok()    { printf "${GREEN}✓${NC} %s\n" "$*"; }
warn()  { printf "${YELLOW}!${NC} %s\n" "$*"; }
fail()  { printf "${RED}✗${NC} %s\n" "$*"; echo ""; read -r -p "Press Enter to close..." _; exit 1; }

clear 2>/dev/null || true
echo ""
echo "===================================================="
echo "   RestoPro - Smart Restaurant Management System"
echo "===================================================="
echo ""

# ---- Docker installed? ----
if ! command -v docker >/dev/null 2>&1; then
  fail "Docker is not installed.

Please install Docker Desktop for Mac:
  https://www.docker.com/products/docker-desktop/

After installing, open Docker Desktop once and wait until
it says \"Docker Desktop is running\", then run this file again."
fi

# ---- Docker running? (retry) ----
TRIES=0
until docker info >/dev/null 2>&1; do
  TRIES=$((TRIES + 1))
  if [[ "$TRIES" -ge 8 ]]; then
    fail "Docker Desktop is not running.

Please open Docker Desktop from Applications, wait until
it shows \"Docker Desktop is running\" (can take 30 seconds),
then double-click start.command again."
  fi
  info "Waiting for Docker Desktop to start... attempt $TRIES of 8"
  sleep 5
done
ok "Docker is ready."
echo ""

# ---- backend/.env required ----
if [[ ! -f "$ROOT/backend/.env" ]]; then
  fail "backend/.env is missing.

Before RestoPro can start:
  1. Copy  backend/.env.example  to  backend/.env
  2. Open backend/.env in TextEdit and replace placeholder values:
       - JWT_SECRET             (any long random string)
       - MASTER_ENCRYPTION_KEY  (64 hex characters — see .env.example)
       - EMAIL_USER             (Gmail — needed for customer OTP emails)
       - EMAIL_APP_PASSWORD     (Gmail App Password — 16 characters)

MONGO_URI can stay as-is — Docker overrides it automatically.
See README.md for full details."
fi

# ---- docker compose vs docker-compose ----
if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  fail "Docker Compose not found. Update Docker Desktop to the latest version."
fi

info "Starting RestoPro containers..."
warn "First run builds images — this can take 3-5 minutes. Please wait."
echo ""

if ! "${COMPOSE[@]}" up --build -d; then
  fail "Failed to start containers. Try in Terminal: docker compose up --build"
fi

info "Ensuring default super admin account exists (first-run seed)…"
"${COMPOSE[@]}" exec -T backend node dist/seed/run-seed.js >/dev/null 2>&1 || true
ok "Seed step complete (admin / admin123 if newly created)"

echo ""
info "Waiting for the app to respond on $FRONTEND_URL ..."
echo ""

ATTEMPT=0
while [[ "$ATTEMPT" -lt "$MAX_WAIT" ]]; do
  ATTEMPT=$((ATTEMPT + 1))
  if curl -sf -o /dev/null --max-time 4 "$FRONTEND_URL" 2>/dev/null; then
    break
  fi
  if (( ATTEMPT % 6 == 0 )); then
    info "Still starting... ($ATTEMPT checks — first build takes longer)"
  fi
  sleep 5
done

if ! curl -sf -o /dev/null --max-time 4 "$FRONTEND_URL" 2>/dev/null; then
  warn "Timed out after ~10 minutes, but containers may still be starting."
  echo "  Check status:  ${COMPOSE[*]} ps"
  echo "  View logs:     ${COMPOSE[*]} logs -f"
  echo "  Then open:     $FRONTEND_URL"
  echo ""
  read -r -p "Press Enter to close..." _
  exit 1
fi

ok "App is ready!"
echo ""
open "$FRONTEND_URL" 2>/dev/null || true

echo "===================================================="
echo "   RestoPro is running!"
echo "===================================================="
echo ""
echo "   Frontend  $FRONTEND_URL"
echo "   Backend   $BACKEND_URL"
echo "   API docs  $BACKEND_URL/api/docs"
echo ""
echo "Your browser should open automatically."
echo ""
echo "To STOP: double-click stop.command"
echo "  (or run: ${COMPOSE[*]} down)"
echo ""
echo "Double-clicking start.command again is safe — Docker"
echo "will refresh containers without creating duplicates."
echo ""
read -r -p "Press Enter to close this window..." _
