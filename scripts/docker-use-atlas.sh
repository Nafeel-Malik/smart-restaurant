#!/bin/bash
# Restart Docker backend using Atlas MONGO_URI from backend/.env (real dev data).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [[ ! -f backend/.env ]]; then
  echo "backend/.env is missing." >&2
  exit 1
fi
MONGO_URI="$(grep -E '^MONGO_URI=' backend/.env | head -1 | cut -d= -f2- | tr -d '\r')"
if [[ -z "${MONGO_URI}" ]]; then
  echo "MONGO_URI is not set in backend/.env" >&2
  exit 1
fi
export MONGO_URI
docker compose -f docker-compose.yml -f docker-compose.atlas.yml up -d backend
echo "Backend now uses Atlas from backend/.env (login with your ADMIN account)."
