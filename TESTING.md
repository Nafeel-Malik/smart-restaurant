# Testing & E2E verification

RestoPro uses **two separate MongoDB targets**. Automated Docker E2E tests must never write to your real development data.

## Databases (read this first)

| Target | When it is used | Superadmin login | Your real data |
|--------|-----------------|------------------|----------------|
| **Atlas** (`MONGO_URI` in `backend/.env`) | Local dev: `npm run start:dev` | `ADMIN` (your account) | **Savour Foods**, **nafeel**, Nafeel customer, etc. |
| **Docker dev DB** (`smart_restaurant` on bundled MongoDB) | `start.command` / `docker compose up` | `admin` / `admin123` (one-time seed) | Empty by default — **not** Atlas |
| **Docker E2E DB** (`smart_restaurant_e2e`) | `npm run test:docker-e2e` only | Temporary seed in E2E DB | Never used for real work |

Docker Compose **overrides** `MONGO_URI` to the bundled local MongoDB. That is why the Superadmin dashboard after Docker startup does **not** show Atlas data unless you opt in (see below).

The earlier E2E pollution (`Docker E2E …`, `e2e_mgr_…`) happened because tests wrote to Docker’s **`smart_restaurant`** database. That has been cleaned up and is now prevented.

---

## Docker E2E tests (isolated)

```bash
# Stack must already be running (start.command or docker compose up)
npm run test:docker-e2e
```

What happens:

1. Backend is restarted with `docker-compose.e2e.yml` → database **`smart_restaurant_e2e`**
2. API flows run (restaurant, manager, customer, order, …)
3. **Automatic teardown** deletes all E2E records from `smart_restaurant_e2e`
4. Backend is restored to **`smart_restaurant`** (Docker dev DB)

Manual cleanup (if needed):

```bash
# E2E database (default for cleanup script when E2E_MONGO_DB unset in older runs)
E2E_MONGO_DB=smart_restaurant_e2e node scripts/docker-e2e-cleanup.mjs

# Legacy pollution in Docker dev DB (should stay empty)
E2E_MONGO_DB=smart_restaurant node scripts/docker-e2e-cleanup.mjs
```

Audit only (no deletes):

```bash
cd backend && npm run audit:e2e              # Atlas / backend/.env
cd backend && MONGO_URI=mongodb://127.0.0.1:27017/smart_restaurant?directConnection=true npm run audit:e2e
```

---

## Use Atlas data with the Docker frontend (optional)

If you want **http://localhost:5173** (Docker nginx) but **Atlas** data (Savour Foods, `ADMIN` login):

```bash
./scripts/docker-use-atlas.sh
```

This restarts only the backend container with `MONGO_URI` from `backend/.env`. To go back to the isolated local MongoDB:

```bash
docker compose up -d backend
```

---

## Rules for future QA / automation

1. **Never** point E2E scripts at `smart_restaurant` or Atlas without an explicit, reviewed override.
2. Docker E2E **must** use `docker-compose.e2e.yml` (`smart_restaurant_e2e`).
3. Every E2E run **must** teardown in a `finally` block (already enforced in `scripts/docker-e2e-test.mjs`).
4. Do not add seed-on-startup that creates fake restaurants/managers/customers.
5. NestJS Jest E2E (`backend/test`) should use a separate in-memory or test URI — not production Atlas.

---

## NestJS unit / integration tests

```bash
cd backend
npm test
npm run test:e2e
```

These use Jest configs under `backend/test/` and must not share the Atlas URI used for manual development.
