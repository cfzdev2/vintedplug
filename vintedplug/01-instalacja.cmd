@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Zainstaluj Node.js 24 LTS z https://nodejs.org/en/download
  pause
  exit /b 1
)
echo Instalacja vintedplug. Pierwsze uruchomienie wymaga internetu.
call npx.cmd --yes pnpm@11.25.0 install --frozen-lockfile
if errorlevel 1 goto blad
node scripts\local-setup.mjs
if errorlevel 1 goto blad
echo.
echo Gotowe. Uruchom teraz 02-uruchom.cmd
pause
exit /b 0
:blad
echo.
echo Instalacja zatrzymana. Sprawdz komunikat bledu powyzej.
pause
exit /b 1
