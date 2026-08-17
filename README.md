# Smart Restaurant Management System (RestoPro)

Full-stack restaurant management platform: **NestJS** API, **React + Vite** frontend, **MongoDB** database. Three portals — Customer, Branch Manager, and Superadmin.

---

## Quick Start (no terminal needed)

**One-time setup**

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and open it. Wait until the menu bar / system tray says **“Docker Desktop is running”** (can take 30 seconds the first time).
2. Create your config file (required once):
   - Copy `backend/.env.example` → `backend/.env`
   - Open `backend/.env` in any text editor and replace the placeholder values (see [Required `.env` setup](#required-env-setup-first-time-only) below).

**Every time you want to run RestoPro**

| Platform | Start (opens browser automatically) | Stop |
|----------|-------------------------------------|------|
| **Windows** | Double-click **`start.bat`** | Double-click **`stop.bat`** |
| **Mac** | Double-click **`start.command`** | Double-click **`stop.command`** |

- The **first run** builds everything — allow **3–5 minutes**. You’ll see “Still starting…” messages; that’s normal.
- Your browser opens to **http://localhost:5173** when ready.
- **To stop:** double-click `stop.bat` / `stop.command`, or quit Docker Desktop.
- **Double-clicking Start twice** is safe — Docker Compose won’t create duplicate containers; it refreshes what’s already running.

**Mac note:** `start.command` and `stop.command` are committed with execute permission. If double-click doesn’t work after downloading a ZIP, run once in Terminal:

```bash
chmod +x start.command stop.command
```

Right-click → Open the first time if macOS blocks unsigned scripts.

### Required `.env` setup (first time only)

Create `backend/.env` from `backend/.env.example` and set:

| Variable | What to put |
|----------|-------------|
| `JWT_SECRET` | Any long random string (e.g. 32+ characters) |
| `MASTER_ENCRYPTION_KEY` | Exactly **64 hex characters** (see example in `.env.example`) |
| `EMAIL_USER` | Your Gmail address (for customer signup OTP emails) |
| `EMAIL_APP_PASSWORD` | Gmail [App Password](https://support.google.com/accounts/answer/185833) (16 chars, no spaces) |

You can leave `MONGO_URI` as in the example — Docker uses its own MongoDB automatically.  
For OTP email without editing `.env`, a Superadmin can configure SMTP later in the app under **Email Settings**.

**Never commit `backend/.env` or `frontend/frontend/.env`.** Copy from the `.env.example` files only. Real secrets stay on your machine (they are gitignored).

---

## Project layout

| Path | Description |
|------|-------------|
| `backend/` | NestJS API (port **5001**) |
| `frontend/frontend/` | React + Vite SPA (dev port **5173**) |
| `docker-compose.yml` | One-command containerized stack |

---

## Run with Docker (recommended for deployment / demo)

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose v2)

### 1. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set at minimum:

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | **Yes** | Long random string for staff + customer JWT signing |
| `MASTER_ENCRYPTION_KEY` | **Yes** | 64-character hex string (32 bytes) — encrypts SMTP passwords saved in MongoDB |
| `EMAIL_USER` | For OTP email | Gmail address (or configure SMTP later in Superadmin → Email Settings) |
| `EMAIL_APP_PASSWORD` | For OTP email | Gmail [App Password](https://support.google.com/accounts/answer/185833) (16 chars, no spaces) |
| `MONGO_URI` | Local dev only | `mongodb://localhost:27017/smart_restaurant` — **Docker Compose overrides this** to `mongodb://mongodb:27017/smart_restaurant` |
| `PORT` | No | Default `5001` |
| `CORS_ORIGINS` | No | Comma-separated browser origins; Docker sets `http://localhost:5173,http://localhost:4173` automatically |

Optional seed-only vars (not used by the running API):

| Variable | Default | Description |
|----------|---------|-------------|
| `SUPERADMIN_SEED_USERNAME` | `admin` | Used by `npm run seed` |
| `SUPERADMIN_SEED_PASSWORD` | `admin123` | Used by `npm run seed` |

### 2. Start the stack

**Easy way:** double-click `start.bat` (Windows) or `start.command` (Mac) in the project root.

**Terminal way** — from the **repository root**:

```bash
docker compose up --build
```

### 3. Access the app

| Service | URL |
|---------|-----|
| **Frontend (React)** | http://localhost:5173 |
| **Backend API** | http://localhost:5001 |
| **Swagger docs** | http://localhost:5001/api/docs |
| **MongoDB** (optional Compass) | `mongodb://localhost:27017/smart_restaurant` |

### 4. Seed superadmin (first run)

The one-click scripts (`start.bat` / `start.command`) run the seeder automatically after containers start. If the user already exists, the seed is a no-op.

You can also seed manually with the stack running:

```bash
docker compose exec backend node dist/seed/run-seed.js
```

Or locally without Docker:

```bash
cd backend
npm install
npm run seed
```

Default credentials: `admin` / `admin123` (override via `SUPERADMIN_SEED_USERNAME` / `SUPERADMIN_SEED_PASSWORD`).

### Docker notes

- **MongoDB data** persists in the `mongodb_data` volume across restarts.
- **Uploads** (customer profile pictures) persist in the `backend_uploads` volume.
- **Frontend API URL**: `VITE_API_URL` is passed as a **build arg** (`http://localhost:5001`) because Vite embeds env vars at build time. The browser calls the host-mapped backend port, not the internal Docker service name.
- **SMTP / OTP**: Uses Gmail SMTP via `EMAIL_USER` / `EMAIL_APP_PASSWORD` or in-app Superadmin email settings. No `localhost` assumptions — works inside containers as long as outbound internet is available.

Stop the stack: double-click `stop.bat` / `stop.command`, or `docker compose down` (add `-v` to wipe volumes).

---

## Startup scripts

| File | Platform | Purpose |
|------|----------|---------|
| `start.bat` | Windows | Check Docker → `docker compose up --build -d` → open browser |
| `stop.bat` | Windows | `docker compose down` |
| `start.command` | Mac | Same as `start.bat` |
| `stop.command` | Mac | Same as `stop.bat` |
| `scripts/start-restopro.sh` | Mac/Linux | **Local dev only** (npm, no Docker) |
| `scripts/stop-restopro.sh` | Mac/Linux | **Local dev only** |

---

## Run locally without Docker (development)

Unchanged from before — Docker is additive.

### Backend

```bash
cd backend
cp .env.example .env   # set MONGO_URI, JWT_SECRET, MASTER_ENCRYPTION_KEY, email vars
npm install
npm run start:dev      # http://localhost:5001
```

Use your own MongoDB instance or Atlas URI in `MONGO_URI`.

### Frontend

```bash
cd frontend/frontend
cp .env.example .env   # VITE_API_URL=http://localhost:5001
npm install
npm run dev            # http://localhost:5173
```

---

## Scripts reference

### Backend (`backend/package.json`)

| Script | Purpose |
|--------|---------|
| `npm run start:dev` | Watch mode development |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run compiled app (`node dist/main`) |
| `npm run seed` | Create initial superadmin user |

### Frontend (`frontend/frontend/package.json`)

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server (:5173) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build (:4173) |

---

## Infrastructure files

| File | Purpose |
|------|---------|
| `backend/Dockerfile` | Multi-stage NestJS production image |
| `backend/.dockerignore` | Exclude node_modules, secrets, dev artifacts |
| `frontend/frontend/Dockerfile` | Vite build + nginx:alpine |
| `frontend/frontend/nginx.conf` | SPA fallback routing for React Router |
| `frontend/frontend/.dockerignore` | Exclude node_modules, secrets |
| `docker-compose.yml` | MongoDB + backend + frontend services |
| `start.bat` / `start.command` | One-click Docker startup |
| `stop.bat` / `stop.command` | One-click Docker shutdown |
