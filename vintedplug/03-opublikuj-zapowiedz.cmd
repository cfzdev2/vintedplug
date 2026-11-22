@echo off
setlocal DisableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 goto node_missing
echo Publikacja zapowiedzi VintedPlug na Firebase Hosting.
echo Uzyj osobnego projektu na planie Spark. Skrypt publikuje strone glowna
echo tego projektu, bez panelu, logowania i platnosci. Nie wlacza Blaze.
set "VP_FIREBASE_TARGET="
set /p "VP_FIREBASE_TARGET=Project ID z konsoli Firebase: "
node -e "if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(process.env.VP_FIREBASE_TARGET || '')) process.exit(1)"
if errorlevel 1 goto invalid_id
set "VP_PUBLIC_RELEASE=preview"
set "VP_PUBLIC_APP_ORIGIN="
if exist "node_modules\vite\package.json" goto login
call npx.cmd --yes pnpm@11.25.0 install --frozen-lockfile
if errorlevel 1 goto failed
:login
call npx.cmd --yes firebase-tools@15.37.0 login
if errorlevel 1 goto failed
call npx.cmd --yes firebase-tools@15.37.0 deploy --only hosting --project "%VP_FIREBASE_TARGET%"
if errorlevel 1 goto failed
echo Gotowe. Publiczny adres to Hosting URL pokazany powyzej.
pause
exit /b 0
:node_missing
echo Zainstaluj Node.js 24 LTS: https://nodejs.org/
goto failed
:invalid_id
echo Podaj identyfikator projektu, nie nazwe wyswietlana ani caly adres.
:failed
echo Publikacja nie zostala zakonczona. Sprawdz komunikat powyzej.
pause
exit /b 1
