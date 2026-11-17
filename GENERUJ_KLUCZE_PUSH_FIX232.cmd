@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z - LOKALNE KLUCZE WEB PUSH FIX232
echo ======================================================
node scripts\generate-vapid-keys-fix232.mjs
set RC=%ERRORLEVEL%
if not "%RC%"=="0" goto :done
echo.
echo Plik config\VAPID_KEYS_LOCAL_ONLY.txt jest lokalny i ignorowany przy publikacji.
echo Dodaj trzy wartosci jako sekrety Cloudflare Pages Production:
echo VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY_PKCS8, VAPID_SUBJECT
echo Nigdy nie umieszczaj klucza prywatnego w kodzie WWW ani w ZIP.
:done
echo Kod zakonczenia: %RC%
pause
exit /b %RC%
