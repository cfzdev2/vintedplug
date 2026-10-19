@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
if not exist "node_modules\vinext\dist\cli.js" (
  echo Najpierw uruchom 01-instalacja.cmd
  pause
  exit /b 1
)
echo Panel otworzysz pod adresem http://127.0.0.1:5173
echo Zostaw to okno otwarte. Ctrl+C zatrzymuje serwer.
call npm.cmd run dev
if errorlevel 1 pause
