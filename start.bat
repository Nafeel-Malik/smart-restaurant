@echo off
setlocal EnableDelayedExpansion

REM RestoPro — one-click Docker startup (Windows)
cd /d "%~dp0"

set "FRONTEND_URL=http://localhost:5173"
set "BACKEND_URL=http://localhost:5001"
set "MAX_WAIT=120"

echo.
echo ====================================================
echo   RestoPro - Smart Restaurant Management System
echo ====================================================
echo.

REM ---- Docker installed? ----
where docker >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or not on your PATH.
    echo.
    echo Please install Docker Desktop for Windows:
    echo   https://www.docker.com/products/docker-desktop/
    echo.
    echo After installing, open Docker Desktop once and wait until
    echo it says "Docker Desktop is running", then run this file again.
    echo.
    pause
    exit /b 1
)

REM ---- Docker running? (retry — Desktop can take 10-30 seconds) ----
set "TRIES=0"
:wait_docker
docker info >nul 2>&1
if not errorlevel 1 goto docker_ready

set /a TRIES+=1
if !TRIES! geq 8 (
    echo [ERROR] Docker Desktop is not running.
    echo.
    echo Please start Docker Desktop from the Start menu, wait until
    echo it shows "Docker Desktop is running" ^(this can take 30 seconds^),
    echo then double-click start.bat again.
    echo.
    pause
    exit /b 1
)

echo Waiting for Docker Desktop to start... attempt !TRIES! of 8
timeout /t 5 /nobreak >nul
goto wait_docker

:docker_ready
echo Docker is ready.
echo.

REM ---- backend/.env required ----
if not exist "backend\.env" (
    echo [SETUP REQUIRED] backend\.env is missing.
    echo.
    echo Before RestoPro can start, you need a config file:
    echo   1. Copy  backend\.env.example  to  backend\.env
    echo   2. Open backend\.env in Notepad and replace the placeholder values:
    echo        - JWT_SECRET          ^(any long random string^)
    echo        - MASTER_ENCRYPTION_KEY ^(64 hex characters — see .env.example^)
    echo        - EMAIL_USER          ^(Gmail address — needed for customer OTP^)
    echo        - EMAIL_APP_PASSWORD  ^(Gmail App Password — 16 characters^)
    echo.
    echo MONGO_URI can stay as-is — Docker overrides it automatically.
    echo See README.md for full details.
    echo.
    pause
    exit /b 1
)

REM ---- docker compose vs docker-compose ----
set "COMPOSE=docker compose"
docker compose version >nul 2>&1
if errorlevel 1 (
    set "COMPOSE=docker-compose"
    docker-compose version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Docker Compose not found. Update Docker Desktop to the latest version.
        pause
        exit /b 1
    )
)

echo Starting RestoPro containers...
echo ^(First run builds images — this can take 3-5 minutes. Please wait.^)
echo.

%COMPOSE% up --build -d
if errorlevel 1 (
    echo.
    echo [ERROR] Failed to start containers. See messages above.
    echo Try running in a terminal: docker compose up --build
    echo.
    pause
    exit /b 1
)

echo Ensuring default super admin account exists (first-run seed)...
%COMPOSE% exec -T backend node dist/seed/run-seed.js >nul 2>&1
echo Seed step complete (admin / admin123 if newly created).

echo.
echo Waiting for the app to respond on %FRONTEND_URL% ...
echo.

set "ATTEMPT=0"
:wait_frontend
set /a ATTEMPT+=1

powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri '%FRONTEND_URL%' -UseBasicParsing -TimeoutSec 4; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 goto app_ready

if !ATTEMPT! geq %MAX_WAIT% (
    echo.
    echo [WARNING] Timed out after ~10 minutes, but containers may still be starting.
    echo Check status:  %COMPOSE% ps
    echo View logs:     %COMPOSE% logs -f
    echo Then open:     %FRONTEND_URL%
    echo.
    pause
    exit /b 1
)

set /a MOD=!ATTEMPT! %% 6
if !MOD! equ 0 (
    echo   Still starting... ^(!ATTEMPT! checks — first build takes longer^)
)

timeout /t 5 /nobreak >nul
goto wait_frontend

:app_ready
echo App is ready!
echo.
start "" "%FRONTEND_URL%"

echo ====================================================
echo   RestoPro is running!
echo ====================================================
echo.
echo   Frontend  %FRONTEND_URL%
echo   Backend   %BACKEND_URL%
echo   API docs  %BACKEND_URL%/api/docs
echo.
echo Your browser should open automatically.
echo.
echo To STOP the app: double-click stop.bat
echo   ^(or run: %COMPOSE% down^)
echo.
echo If you double-click start.bat again while already running,
echo Docker will refresh containers safely — no duplicates.
echo.
pause
endlocal
