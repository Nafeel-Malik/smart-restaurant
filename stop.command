#!/bin/bash
# RestoPro — one-click Docker shutdown (macOS)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "===================================================="
echo "   RestoPro - Stopping..."
echo "===================================================="
echo ""

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed. Nothing to stop."
  read -r -p "Press Enter to close..." _
  exit 0
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker Desktop is not running. Containers are already stopped."
  read -r -p "Press Enter to close..." _
  exit 0
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "Docker Compose not found."
  read -r -p "Press Enter to close..." _
  exit 1
fi

if ! "${COMPOSE[@]}" down; then
  printf "${YELLOW}!${NC} docker compose down reported an error.\n"
  echo "You can also quit Docker Desktop to stop everything."
  read -r -p "Press Enter to close..." _
  exit 1
fi

printf "${GREEN}✓${NC} RestoPro has been stopped. All containers are down.\n"
echo "Your data is saved — next start.command will pick up where you left off."
echo ""
read -r -p "Press Enter to close..." _
