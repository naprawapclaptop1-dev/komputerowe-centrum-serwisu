@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul 2>&1
cd /d "%~dp0"
title NAUKA OD A DO Z - START FIX105

set "START_LOG=%~dp0LOGI\START_FIX105.log"
if not exist "%~dp0LOGI" md "%~dp0LOGI" >nul 2>&1

 echo ======================================================
 echo NAUKA OD A DO Z - BEZPIECZNY START FIX105
 echo Okno CMD pozostanie otwarte do nacisniecia klawisza.
 echo ======================================================
 echo.

if not exist "%~dp0URUCHOM_AKADEMIE.cmd" goto missing_main

>>"%START_LOG%" echo ======================================================
>>"%START_LOG%" echo START FIX105: %date% %time%
>>"%START_LOG%" echo Folder projektu: %~dp0

rem FIX102: keep the parent console alive even if a child CMD exits early.
set "NPA_KEEP_CONSOLE=1"
cmd.exe /d /c ""%~dp0URUCHOM_AKADEMIE.cmd" %*"
set "START_RC=%ERRORLEVEL%"
set "NPA_KEEP_CONSOLE="

>>"%START_LOG%" echo KONIEC FIX105: %date% %time%
>>"%START_LOG%" echo Kod zakonczenia: %START_RC%

goto summary

:missing_main
set "START_RC=11"
echo [BLAD] Nie znaleziono URUCHOM_AKADEMIE.cmd w folderze projektu.
echo Rozpakuj pelne archiwum ZIP, a nie sam pojedynczy plik CMD.
>>"%START_LOG%" echo [BLAD] Brak URUCHOM_AKADEMIE.cmd: %date% %time%

:summary
echo.
echo ======================================================
echo START FIX105 - ZAKONCZONO
echo Kod zakonczenia: %START_RC%
echo Log: LOGI\START_FIX105.log
echo Okno zostaje otwarte. Nacisnij dowolny klawisz, aby zamknac.
echo ======================================================
pause
endlocal & exit /b %START_RC%
