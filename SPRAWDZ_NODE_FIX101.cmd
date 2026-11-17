@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul 2>&1
cd /d "%~dp0"
echo ======================================================
echo NAUKA OD A DO Z - DIAGNOSTYKA NODE.JS FIX101
echo ======================================================
call "%~dp0RESOLVE_NODE_FIX101.cmd"
if errorlevel 1 goto no_node
echo [OK] Znaleziono dzialajacy Node.js.
echo Plik: %NODE_EXE%
echo Wersja: %NODE_VERSION%
echo Katalog zostal dopisany do PATH tylko dla tego procesu i jego dzieci.
echo Sciezka zostala zapisana w NODE_EXE.path, aby kolejne starty nie pytaly ponownie.
echo.
echo Uruchom teraz WYKONAJ_TESTY_FIX101.cmd.
echo.
pause
exit /b 0
:no_node
echo [BLAD] Node.js nie zostal wybrany ani wykryty. Nie zmieniono systemowego PATH.
echo Uruchom ponownie i wybierz rzeczywisty plik node.exe.
echo.
pause
exit /b 10
