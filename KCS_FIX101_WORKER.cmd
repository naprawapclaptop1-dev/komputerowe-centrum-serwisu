@echo off
rem FIX135 worker: runs inside the persistent cmd.exe /K host; build manager is isolated in a child cmd.exe.
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
title KOMPUTEROWE CENTRUM SERWISU - AUTOMATYCZNY START FIX135
set "ROOT=%~dp0"
pushd "%ROOT%" >nul 2>&1
if errorlevel 1 goto :path_fail
set "GHREPO=naprawapclaptop1-dev/komputerowe-centrum-serwisu"
set "GHURL=https://github.com/%GHREPO%"
set "PAGEURL=https://naprawapclaptop1-dev.github.io/komputerowe-centrum-serwisu/"
set "LOGDIR=%ROOT%dist\build-logs"
if not exist "%LOGDIR%" mkdir "%LOGDIR%" >nul 2>&1
set "LOG=%LOGDIR%\00-AUTOMATYCZNY-START.log"
set "STATUS=%LOGDIR%\FULL_RELEASE.status"
set "RC=0"
set "CHECKSTEP=initialization"
>"%LOG%" echo KOMPUTEROWE CENTRUM SERWISU FIX135
>>"%LOG%" echo Folder: %ROOT%
>>"%LOG%" echo Repozytorium: %GHREPO%
>>"%LOG%" echo Start: %DATE% %TIME%
if exist "%STATUS%" del /q "%STATUS%" >nul 2>&1
if exist "%ROOT%PUBLICATION_VERIFICATION.status" del /q "%ROOT%PUBLICATION_VERIFICATION.status" >nul 2>&1
echo ============================================================
echo KOMPUTEROWE CENTRUM SERWISU - FIX135
echo AUTOMATYCZNA BUDOWA + PUBLIKACJA + INSTALACJA
echo ============================================================
echo Repozytorium: %GHREPO%
echo Strona globalna: %PAGEURL%
echo Uruchamiaj tylko ten plik CMD. Nie wpisuj repozytorium recznie.
echo Aktywny folder: %ROOT%
echo.

set "CHECKSTEP=walidacja pakietu"
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%VALIDATE_FIX100_PACKAGE.ps1" >>"%LOG%" 2>&1
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" goto :validation_fail

>"%ROOT%GITHUB_REPOSITORY.txt" echo %GHREPO%

set "CHECKSTEP=bramka testow CHECK_SOURCE"
call "%ROOT%CHECK_SOURCE.cmd" /nopause >>"%LOG%" 2>&1
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" goto :validation_fail

echo.
echo [CLEAN] tymczasowe pliki tylko wewnatrz folderu programu...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%CLEAN_SAFE_TEMP.ps1"
set "CLEAN_RC=%ERRORLEVEL%"
if not "%CLEAN_RC%"=="0" echo [WARN] Czyszczenie folderu programu niepelne - kod %CLEAN_RC%; budowa bedzie kontynuowana; raport czyszczenia zostal zachowany. Raport: dist\build-logs\SAFE_TEMP_CLEANUP.log.

echo.
echo [0/5] Automatyczne przygotowanie narzedzi...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%BOOTSTRAP_BUILD_TOOLS.ps1" >>"%LOG%" 2>&1
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" goto :tools_fail
if not exist "%LOGDIR%\TOOLS_PATHS.txt" goto :tools_fail
for /f "usebackq tokens=1,* delims==" %%A in ("%LOGDIR%\TOOLS_PATHS.txt") do (
  if /I "%%A"=="GH" set "GH_EXE=%%B"
  if /I "%%A"=="GIT" set "GIT_EXE=%%B"
  if /I "%%A"=="ISCC" set "INNO_MODERN_ISCC=%%B"
)
if defined GH_EXE for %%G in ("%GH_EXE%") do set "PATH=%%~dpG;%PATH%"
if defined GIT_EXE for %%G in ("%GIT_EXE%") do set "PATH=%%~dpG;%PATH%"

echo.
echo [1/5] Synchronizacja kodu i strony WWW...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%PUBLISH_GITHUB_SOURCE.ps1"
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" goto :source_fail

echo.
echo [2/5] Kompilacja aplikacji, wersji portable i instalatora...
rem FIX135: isolate legacy batch build manager in a child CMD process.
rem This prevents an EXIT issued by any nested build script from terminating this worker.
set "BUILD_LOG=%LOGDIR%\02-build-all.log"
if exist "%BUILD_LOG%" del /q "%BUILD_LOG%" >nul 2>&1
"%ComSpec%" /d /c ""%ROOT%BUILD_ALL.cmd" /nopause /skip-source-check" >"%BUILD_LOG%" 2>&1
set "RC=%ERRORLEVEL%"
if exist "%BUILD_LOG%" (
  type "%BUILD_LOG%"
  type "%BUILD_LOG%" >>"%LOG%"
)
>>"%LOG%" echo [INFO] BUILD_ALL child CMD exit code: %RC%
if not "%RC%"=="0" goto :build_fail

echo.
echo [3/5] Publikacja instalatora, portable, Stable/Beta, manifestow i SHA-256...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%PUBLISH_GITHUB_RELEASES.ps1" -Channel both >>"%LOG%" 2>&1
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" goto :publish_fail

echo.
echo [4/5] Publiczna weryfikacja strony, wydania, manifestow i pobierania...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%VERIFY_PUBLIC_DEPLOYMENT.ps1" >>"%LOG%" 2>&1
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" goto :online_verify_fail

echo.
echo [5/5] Instalacja i kontrola lokalnej aplikacji...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%INSTALL_PUBLISHED_BUILD.ps1" >>"%LOG%" 2>&1
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" goto :install_fail

>"%STATUS%" echo PASS
>>"%LOG%" echo [PASS] Build, release, manifesty, HTTP i instalacja zakonczone.
echo.
echo [PASS] GOTOWE: aplikacja, instalator i strona zostaly zweryfikowane.
echo Repozytorium: %GHURL%
echo Strona globalna: %PAGEURL%
echo Wersja produktu: 1.0.0.72
echo Log: %LOG%
echo.
popd
exit /b 0

:validation_fail
>>"%LOG%" echo [FAIL] Walidacja: %CHECKSTEP% kod=%RC%
echo [BLAD] Walidacja nie przeszla: %CHECKSTEP% (kod=%RC%).
powershell.exe -NoLogo -NoProfile -Command "Get-Content -LiteralPath '%LOG%' -Tail 100 | Out-Host"
if /I "%CHECKSTEP%"=="bramka testow CHECK_SOURCE" (
  echo.
  echo ============================================================
  echo SZCZEGOLOWA DIAGNOSTYKA CHECK_SOURCE FIX135
  echo ============================================================
  if exist "%LOGDIR%\CHECK_SOURCE_FIX135.log" (
    >>"%LOG%" echo ============================================================
    >>"%LOG%" echo SZCZEGOLOWA DIAGNOSTYKA CHECK_SOURCE FIX135
    type "%LOGDIR%\CHECK_SOURCE_FIX135.log"
    type "%LOGDIR%\CHECK_SOURCE_FIX135.log" >>"%LOG%"
  ) else (
    echo [WARN] Brak pliku CHECK_SOURCE_FIX135.log. Nie mozna ustalic testu, ktory zakonczyl sie bledem.
    >>"%LOG%" echo [WARN] Brak pliku CHECK_SOURCE_FIX135.log.
  )
)
goto :end_fail
:tools_fail
>>"%LOG%" echo [FAIL] Przygotowanie narzedzi kod=%RC%
echo [BLAD] Nie przygotowano narzedzi:
powershell.exe -NoLogo -NoProfile -Command "Get-Content -LiteralPath '%LOG%' -Tail 100 | Out-Host"
goto :end_fail
:source_fail
>>"%LOG%" echo [FAIL] Synchronizacja zrodel kod=%RC%
echo [BLAD] Synchronizacja zrodel nie powiodla sie:
if exist "%LOGDIR%\01-github-source-sync-and-pages.log" powershell.exe -NoLogo -NoProfile -Command "Get-Content -LiteralPath '%LOGDIR%\01-github-source-sync-and-pages.log' -Tail 100 | Out-Host"
goto :end_fail
:build_fail
>>"%LOG%" echo [FAIL] Budowanie kod=%RC%
echo [BLAD] Budowanie aplikacji lub instalatora nie powiodlo sie. Podsumowanie:
if exist "%LOGDIR%\02-build-all.log" type "%LOGDIR%\02-build-all.log"
if exist "%LOGDIR%\02-build-all.log" type "%LOGDIR%\02-build-all.log"
if exist "%LOGDIR%\BUILD_SUMMARY.txt" type "%LOGDIR%\BUILD_SUMMARY.txt"
echo --- PORTABLE ---
if exist "%LOGDIR%\stage-portable-output.log" powershell.exe -NoLogo -NoProfile -Command "Get-Content -LiteralPath '%LOGDIR%\stage-portable-output.log' -Tail 80 | Out-Host"
echo --- INSTALLER ---
if exist "%LOGDIR%\stage-modern-output.log" powershell.exe -NoLogo -NoProfile -Command "Get-Content -LiteralPath '%LOGDIR%\stage-modern-output.log' -Tail 100 | Out-Host"
goto :end_fail
:publish_fail
>>"%LOG%" echo [FAIL] Publikacja GitHub Release kod=%RC%
echo [BLAD] Publikacja GitHub Release nie powiodla sie:
if exist "%LOGDIR%\02-github-publish.log" powershell.exe -NoLogo -NoProfile -Command "Get-Content -LiteralPath '%LOGDIR%\02-github-publish.log' -Tail 100 | Out-Host"
goto :end_fail
:online_verify_fail
>>"%LOG%" echo [FAIL] Weryfikacja publiczna kod=%RC%
echo [BLAD] Weryfikacja strony lub plikow publicznych nie powiodla sie:
if exist "%LOGDIR%\03-public-deployment-verification.log" powershell.exe -NoLogo -NoProfile -Command "Get-Content -LiteralPath '%LOGDIR%\03-public-deployment-verification.log' -Tail 100 | Out-Host"
goto :end_fail
:install_fail
>>"%LOG%" echo [FAIL] Instalacja kod=%RC%
echo [BLAD] Instalacja lokalna nie powiodla sie:
powershell.exe -NoLogo -NoProfile -Command "Get-Content -LiteralPath '%LOG%' -Tail 100 | Out-Host"
goto :end_fail
:path_fail
echo [BLAD] Nie mozna ustawic katalogu pakietu.
exit /b 2
:end_fail
echo.
echo Pelny log: %LOG%
echo Blad zapisano w logu. Sterowanie wraca do stalego okna CMD.
popd
exit /b 1
