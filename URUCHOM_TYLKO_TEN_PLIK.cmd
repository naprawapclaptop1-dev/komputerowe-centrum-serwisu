@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
title KOMPUTEROWE CENTRUM SERWISU - AUTOMATYCZNY START FIX085
set "ROOT=%~dp0"
pushd "%ROOT%" >nul 2>&1
if errorlevel 1 goto :path_fail

rem Validate the extracted package with PowerShell. This handles CRLF/LF and paths with spaces/parentheses.
if not exist "%ROOT%VALIDATE_FIX085_PACKAGE.ps1" goto :wrong_package
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%VALIDATE_FIX085_PACKAGE.ps1"
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" goto :wrong_package
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%CHECK_FIX084_CMD_ENCODING.ps1"
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" goto :wrong_package
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%CHECK_FIX084_PAGES_CONFIGURATION.ps1"
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" goto :wrong_package
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%CHECK_FIX084_SOURCE_CACHE_EXCLUSIONS.ps1"
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" goto :wrong_package
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%CHECK_FIX085_GIT_CLONE_LONGPATHS.ps1"
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" goto :wrong_package

set "LOGDIR=%ROOT%dist\build-logs"
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
set "LOG=%LOGDIR%\00-AUTOMATYCZNY-START.log"
set "STATUS=%LOGDIR%\FULL_RELEASE.status"
set "GHREPO=naprawapclaptop1-dev/komputerowe-centrum-serwisu"
set "GHURL=https://github.com/%GHREPO%"
set "PAGEURL=https://naprawapclaptop1-dev.github.io/komputerowe-centrum-serwisu/"
>"%ROOT%GITHUB_REPOSITORY.txt" echo %GHREPO%
if exist "%STATUS%" del /q "%STATUS%" >nul 2>&1
if exist "%ROOT%PUBLICATION_VERIFICATION.status" del /q "%ROOT%PUBLICATION_VERIFICATION.status" >nul 2>&1
>"%LOG%" echo ============================================================
>>"%LOG%" echo KOMPUTEROWE CENTRUM SERWISU - FIX085 AUTOMAT
>>"%LOG%" echo Pakiet: FIX085
>>"%LOG%" echo Folder startowy: %ROOT%
>>"%LOG%" echo Repozytorium: %GHREPO%
>>"%LOG%" echo Data: %DATE% %TIME%
echo ============================================================
echo KOMPUTEROWE CENTRUM SERWISU - FIX085
echo AUTOMATYCZNA NAPRAWA PUBLIKACJI + BEZPLATNA STRONA GLOBALNA
echo ============================================================
echo Repozytorium przypisane automatycznie: %GHREPO%
echo Jedyny punkt startowy: ten plik CMD.
echo Nie wpisuj adresu repozytorium i nie uruchamiaj innych skryptow.
echo Folder aktywnego pakietu: %ROOT%
echo Przy pierwszym uruchomieniu automat sam otworzy logowanie GitHub w przegladarce.
echo Wpisz kod z CMD na stronie https://github.com/login/device i zatwierdz dostep.
echo Nie zamykaj okna CMD - proces czeka na zatwierdzenie i sam bedzie kontynuowany.
echo.

echo [0/5] Automatyczne przygotowanie narzedzi...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%BOOTSTRAP_BUILD_TOOLS.ps1" >> "%LOG%" 2>&1
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
echo [1/5] Synchronizacja kodu i uruchomienie wdrazania bezplatnej strony WWW...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%PUBLISH_GITHUB_SOURCE.ps1"
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" goto :source_fail

echo.
echo [2/5] Kontrola zrodel, kompilacja programu i instalatora...
call "%ROOT%BUILD_ALL.cmd" /nopause >> "%LOG%" 2>&1
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" goto :build_fail

echo.
echo [3/5] Publikacja pierwszego / kolejnego wydania z instalatorem, portable i manifestami...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%PUBLISH_GITHUB_RELEASES.ps1" -Channel both >> "%LOG%" 2>&1
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" goto :publish_fail

echo.
echo [4/5] Publiczny test pobierania, manifestow, SHA-256 i strony globalnej...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%VERIFY_PUBLIC_DEPLOYMENT.ps1" >> "%LOG%" 2>&1
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" goto :online_verify_fail

echo.
echo [5/5] Instalacja i lokalna kontrola nowej wersji...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%INSTALL_PUBLISHED_BUILD.ps1" >> "%LOG%" 2>&1
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" goto :install_fail

>"%STATUS%" echo PASS
>>"%LOG%" echo [PASS] Build, publikacja zrodel, strona, GitHub Release, weryfikacja HTTP i instalacja zakonczone.
echo.
echo [PASS] ZAKONCZONO: aplikacja i bezplatna strona globalna zostaly zweryfikowane.
echo Repozytorium: %GHURL%
echo Strona na calym swiecie: %PAGEURL%
echo Pobieranie: darmowe, bez abonamentu i konta platnego.
echo Wersja aplikacji: 1.0.0.69
echo Szczegoly: %LOG%
echo.
pause
popd
exit /b 0

:wrong_package
echo [BLAD] Ten folder nie zawiera kompletnego pakietu FIX085.
echo Rozpakuj caly ZIP FIX085 i uruchom URUCHOM_TYLKO_TEN_PLIK.cmd z jego folderu.
echo Nazwa folderu nadrzednego nie ma znaczenia. Szczegoly walidacji sa powyzej.
pause
popd
exit /b 1

:path_fail
echo [BLAD] Nie mozna ustawic katalogu roboczego pakietu.
pause
exit /b 1

:tools_fail
>"%STATUS%" echo FAIL_TOOLS
>>"%LOG%" echo [FAIL] Nie przygotowano narzedzi. Kod: %RC%
echo [BLAD] Nie udalo sie automatycznie przygotowac narzedzi. Szczegoly: %LOG%
goto :end_fail
:source_fail
>"%STATUS%" echo FAIL_SOURCE_SYNC
>>"%LOG%" echo [FAIL] Synchronizacja zrodel GitHub nie powiodla sie. Kod: %RC%
echo [BLAD] Synchronizacja zrodel do GitHub nie powiodla sie.
echo --- SZCZEGOLOWY LOG SYNCHRONIZACJI ---
if exist "%LOGDIR%\01-github-source-sync-and-pages.log" powershell.exe -NoLogo -NoProfile -Command "$x=Get-Content -LiteralPath '%LOGDIR%\01-github-source-sync-and-pages.log' -Tail 100; $x | Tee-Object -FilePath '%LOG%' -Append | Out-Host"
if not exist "%LOGDIR%\01-github-source-sync-and-pages.log" echo Brak szczegolowego logu 01-github-source-sync-and-pages.log.
echo --- KONIEC SZCZEGOLOWEGO LOGU ---
echo Pelny log: %LOG%
goto :end_fail
:build_fail
>"%STATUS%" echo FAIL_BUILD
>>"%LOG%" echo [FAIL] Budowanie nie powiodlo sie. Kod: %RC%
echo [BLAD] Budowanie nie powiodlo sie. Szczegoly: %LOG%
goto :end_fail
:publish_fail
>"%STATUS%" echo FAIL_PUBLISH
>>"%LOG%" echo [FAIL] Publikacja GitHub nie powiodla sie. Kod: %RC%
echo [BLAD] Publikacja instalatora / manifestow nie powiodla sie. Szczegoly: %LOG%
echo Pierwsze wydanie zostanie wznowione bez nadpisywania istniejacych plikow.
goto :end_fail
:online_verify_fail
>"%STATUS%" echo FAIL_ONLINE_VERIFY
>>"%LOG%" echo [FAIL] Publiczna weryfikacja nie powiodla sie. Kod: %RC%
echo [BLAD] Wydanie moglo zostac opublikowane, ale nie wszystkie adresy / zasoby zwrocily HTTP 200.
echo Szczegoly: %LOG%
echo Sprawdz GitHub Actions i uruchom ponownie ten sam CMD po zakonczeniu wdrazania strony.
goto :end_fail
:install_fail
>"%STATUS%" echo FAIL_INSTALL
>>"%LOG%" echo [FAIL] Instalacja po publikacji nie powiodla sie. Kod: %RC%
echo [BLAD] Release i strona zostaly zweryfikowane, ale instalacja lokalna nie zakonczyla sie poprawnie. Szczegoly: %LOG%
goto :end_fail
:end_fail
pause
popd
exit /b 1

