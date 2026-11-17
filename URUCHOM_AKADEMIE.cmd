@echo off

setlocal EnableExtensions DisableDelayedExpansion

chcp 65001 >nul 2>&1

title NAUKA OD A DO Z - DLA WSZYSTKICH

cd /d "%~dp0"

set "ROOT=%CD%"

set "RUN_RESULT=0"



echo ======================================================

echo NAUKA OD A DO Z - DLA WSZYSTKICH

echo PLATFORMA EDUKACYJNA - KONTROLA I PUBLIKACJA

echo ======================================================

echo.



rem Historical FIX101 resolver remains bundled: RESOLVE_NODE_FIX101.cmd.
rem Compatibility marker for the old FIX102 command: call "%ROOT%\RESOLVE_NODE_FIX102.cmd".
rem Active launcher uses FIX105: canonical project root and explicit result paths.
call "%ROOT%\RESOLVE_NODE_FIX105.cmd"
if errorlevel 1 goto no_node

if not exist "%ROOT%\WEB_PUBLISH\index.html" goto no_web

if not exist "%ROOT%\ONECLICK_AKADEMIA.js" goto no_script

if not exist "%ROOT%\TOOLS_CLOUDFLARE\node_modules\wrangler\bin\wrangler.js" (
  echo [INFO] Przygotowuje brakujacy lokalny Wrangler...
  call "%ROOT%\PRZYGOTUJ_WRANGLER_FIX18.cmd" /quiet
  if errorlevel 1 goto no_wrangler
)

if not exist "%ROOT%\scripts\configure-gemini-secret.js" goto no_ai_setup
if not exist "%ROOT%\scripts\configure-gemini-secret.ps1" goto no_ai_setup



echo [OK] Node.js:

echo %NODE_VERSION%

echo.

echo [1/2] Sprawdzam konfiguracje klucza Gemini...

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%\scripts\configure-gemini-secret.ps1" -NodeExe "%NODE_EXE%"

if errorlevel 1 goto ai_setup_failed



echo.

echo [2/2] Uruchamiam publikacje i obserwator platformy Nauka od A do Z...

"%NODE_EXE%" "%ROOT%\ONECLICK_AKADEMIA.js"

set "RUN_RESULT=%ERRORLEVEL%"

if not "%RUN_RESULT%"=="0" goto publish_failed

goto finish



:no_node
echo [BLAD] Nie wykryto dzialajacego Node.js ani nie wskazano pliku node.exe.
echo Resolver FIX105 sprawdzil Node.js i jawne pliki wynikowe NODE_EXE.path oraz NODE_EXE.version.
echo Uruchom SPRAWDZ_NODE_FIX105.cmd; poprawna sciezka zostanie zapisana w NODE_EXE.path.

set "RUN_RESULT=10"

goto finish



:no_web

echo [BLAD] Brak WEB_PUBLISH\index.html. Rozpakuj pelny ZIP z zachowaniem folderow.

set "RUN_RESULT=11"

goto finish



:no_script

echo [BLAD] Brak ONECLICK_AKADEMIA.js.

set "RUN_RESULT=12"

goto finish



:no_wrangler

echo [BLAD] Nie znaleziono lokalnego Wrangler w TOOLS_CLOUDFLARE. Zachowaj katalog narzedzi z poprzedniego projektu.

set "RUN_RESULT=13"

goto finish



:no_ai_setup

echo [BLAD] Brak scripts\configure-gemini-secret.js. Rozpakuj pelny pakiet.

set "RUN_RESULT=14"

goto finish



:ai_setup_failed

echo [BLAD] Konfiguracja klucza Gemini nie powiodla sie. Publikacja zatrzymana.

set "RUN_RESULT=20"

goto finish



:publish_failed

echo [BLAD] Proces publikacji zakonczyl sie bledem. Sprawdz log powyzej.

goto finish



:finish

echo.

echo ======================================================

echo Kod zakonczenia: %RUN_RESULT%

echo Nacisnij dowolny klawisz, aby zamknac okno.

echo ======================================================

if not defined NPA_KEEP_CONSOLE pause >nul

endlocal & exit /b %RUN_RESULT%

