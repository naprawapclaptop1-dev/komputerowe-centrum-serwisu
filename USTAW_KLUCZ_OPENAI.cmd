@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul 2>&1
echo [INFO] Asystent Akademii korzysta teraz wylacznie z Google Gemini.
echo [INFO] Uruchamiam konfigurator Gemini. Stara nazwa pliku pozostaje tylko dla zgodnosci.
call "%~dp0USTAW_KLUCZ_GEMINI.cmd"
exit /b %ERRORLEVEL%
