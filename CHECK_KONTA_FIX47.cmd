@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo NAUKA OD A DO Z - DIAGNOSTYKA STATUSU KONT FIX47
echo Uwaga: skrypt odpytuje produkcyjne API i wykonuje probe nieudanego logowania na adresie .invalid.
node scripts\check-account-production-fix40.mjs
if errorlevel 1 pause
