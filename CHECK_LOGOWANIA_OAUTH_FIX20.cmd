@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo ==============================================
echo NAUKA OD A DO Z - STATUS OAUTH + FIX20
echo ==============================================
node scripts\check-oauth-production.js
if errorlevel 1 (echo. & echo Diagnostyka wykazala problem. & pause & exit /b 1)
node scripts\check-account-production-fix20.mjs
if errorlevel 1 (echo. & echo Kontrola kont wykazala problem. & pause & exit /b 1)
pause
endlocal
