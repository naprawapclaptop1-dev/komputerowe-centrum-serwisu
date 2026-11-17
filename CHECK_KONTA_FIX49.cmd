@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo NAUKA OD A DO Z - DIAGNOSTYKA STATUSU KONT FIX49
echo Ten skrypt deleguje diagnostyke do zachowanego kontrolera FIX47.
call "%~dp0CHECK_KONTA_FIX47.cmd"
exit /b %ERRORLEVEL%
