@echo off
REM ============================================================
REM  Kingsware . Dev launcher
REM  1. Stops any service holding the dev ports (3000 / 8000)
REM  2. Starts frontend (and backend, when available) in their
REM     own console windows.
REM  3. Waits until the frontend port accepts TCP connections,
REM     then opens the browser.
REM ============================================================

setlocal
set "ROOT=%~dp0"
set "FRONTEND_PORT=3000"
set "BACKEND_PORT=8000"
set "URL=http://localhost:%FRONTEND_PORT%"

REM -- Stop existing services on the dev ports -----------------
echo [INFO] Stopping any process holding port %FRONTEND_PORT% or %BACKEND_PORT% ...
call :kill_port %FRONTEND_PORT%
call :kill_port %BACKEND_PORT%

REM -- Frontend (Next.js) --------------------------------------
echo [INFO] Starting frontend (Next.js) on port %FRONTEND_PORT% ...
if not exist "%ROOT%kingsware-platform\package.json" (
    echo [ERROR] %ROOT%kingsware-platform\package.json not found. Aborting.
    pause
    exit /b 1
)
start "Kingsware Frontend" cmd /k "cd /d %ROOT%kingsware-platform && pnpm dev"

REM -- Backend (placeholder) -----------------------------------
REM Backend not yet created. When ready, replace the echo line
REM below with one of these examples:
REM   start "Kingsware Backend" cmd /k "cd /d %ROOT%backend && python -m uvicorn main:app --reload --port %BACKEND_PORT%"
REM   start "Kingsware Backend" cmd /k "cd /d %ROOT%backend && pnpm dev"
REM   start "Kingsware Backend" cmd /k "cd /d %ROOT%backend && go run ./cmd/server"
echo [WARN] Backend not configured yet. Edit start-dev.bat to add it.

REM -- Wait for the frontend port (single PowerShell loop) -----
echo [INFO] Waiting up to 120s for %URL% to accept connections ...
powershell -NoProfile -Command "$sw=[System.Diagnostics.Stopwatch]::StartNew(); while ($sw.Elapsed.TotalSeconds -lt 120) { try { (New-Object Net.Sockets.TcpClient('localhost', %FRONTEND_PORT%)).Close(); Write-Host ' OK'; exit 0 } catch { Write-Host -NoNewline '.'; Start-Sleep -Milliseconds 500 } }; Write-Host ' timeout'; exit 1"
if errorlevel 1 (
    echo [WARN] Frontend did not become ready within 120s. Opening browser anyway.
) else (
    echo [INFO] Frontend is ready.
)

REM -- Open URL in default browser (PowerShell Start-Process) --
echo [INFO] Opening %URL% ...
powershell -NoProfile -Command "Start-Process '%URL%'"
if errorlevel 1 (
    echo [WARN] Start-Process failed. Trying fallbacks ...
    start "" "%URL%"
    if errorlevel 1 explorer "%URL%"
)

echo.
echo [DONE] Launcher finished. If the browser did not open, copy this URL:
echo        %URL%
echo        The frontend window stays open with live logs.
echo        Press any key to close this launcher window.
pause >nul
endlocal
goto :eof

REM -- Helper: kill any process listening on the given TCP port
:kill_port
set "PORT=%~1"
set "FOUND="
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
    set "FOUND=1"
    echo   - killing PID %%a on port %PORT%
    taskkill /F /PID %%a >nul 2>&1
)
if not defined FOUND echo   - port %PORT% is free
goto :eof
