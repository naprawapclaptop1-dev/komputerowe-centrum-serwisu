@echo off
setlocal EnableExtensions
cd /d "%~dp0"
node --version || exit /b 1
start "NAUKA OD A DO Z FIX51 - PODGLAD" cmd /k "node scripts\serve-fix51-preview.mjs"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8765/"
