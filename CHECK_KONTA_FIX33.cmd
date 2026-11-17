@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo Zgodnosc starej nazwy kontroli — przekazuje do aktualnej diagnostyki FIX47.
call CHECK_KONTA_FIX47.cmd
exit /b %errorlevel%
