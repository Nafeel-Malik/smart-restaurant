@echo off
setlocal

REM RestoPro — one-click Docker shutdown (Windows)
cd /d "%~dp0"

echo.
echo ====================================================
echo   RestoPro - Stopping...
echo ====================================================
echo.

where docker >nul 2>&1
if errorlevel 1 (
    echo Docker is not installed. Nothing to stop.
    pause
    exit /b 0
)

docker info >nul 2>&1
if errorlevel 1 (
    echo Docker Desktop is not running. Containers are already stopped.
    pause
    exit /b 0
)

set "COMPOSE=docker compose"
docker compose version >nul 2>&1
if errorlevel 1 set "COMPOSE=docker-compose"

%COMPOSE% down
if errorlevel 1 (
    echo.
    echo [WARNING] docker compose down reported an error.
    echo You can also quit Docker Desktop to stop everything.
    echo.
    pause
    exit /b 1
)

echo.
echo RestoPro has been stopped. All containers are down.
echo Your data is saved — next start.bat will pick up where you left off.
echo.
pause
endlocal
