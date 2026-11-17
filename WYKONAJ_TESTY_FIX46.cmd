@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo Zgodnosc starej nazwy uruchamiacza — przekazuje do pelnych testow FIX47.
call WYKONAJ_TESTY_FIX47.cmd
exit /b %errorlevel%
