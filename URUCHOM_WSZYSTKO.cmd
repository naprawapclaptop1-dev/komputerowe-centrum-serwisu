@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
title KOMPUTEROWE CENTRUM SERWISU FIX069 - GITHUB RELEASES
pushd "%~dp0"
set "ROOT=%~dp0"
set "LOGDIR=%~dp0dist\build-logs"
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
set "LOG=%LOGDIR%\00-URUCHOM-Wszystko.log"
set "STATUS=%LOGDIR%\FULL_RELEASE.status"
if exist "%STATUS%" del /q "%STATUS%" >nul 2>&1

if not exist "%ROOT%GITHUB_REPOSITORY.txt" goto :configure_repo
set "GHREPO="
set /p "GHREPO="<"%ROOT%GITHUB_REPOSITORY.txt"
goto :validate_repo

:configure_repo
echo.
echo Podaj publiczne repozytorium GitHub w formacie: wlasciciel/nazwa-repo
echo Przyklad: serwis-rj/komputerowe-centrum-serwisu
set "GHREPO="
set /p "GHREPO=Repozytorium: "

:validate_repo
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "$r=$env:GHREPO; if($r -notmatch '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$'){exit 1}else{exit 0}"
if errorlevel 1 goto :config_fail
>"%ROOT%GITHUB_REPOSITORY.txt" echo %GHREPO%
>>"%LOG%" echo FIX069 start %DATE% %TIME%
>>"%LOG%" echo Repozytorium: %GHREPO%

echo ============================================================
echo KOMPUTEROWE CENTRUM SERWISU FIX069
echo JEDEN CMD: BUILD + GITHUB RELEASES + WERYFIKACJA
echo ============================================================
echo.
echo [1/2] Budowanie programu i instalatora...
call "%ROOT%BUILD_ALL.cmd" /nopause
if errorlevel 1 goto :build_fail

echo.
echo [2/2] Logowanie GitHub i publikacja...
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%PUBLISH_GITHUB_RELEASES.ps1" -Channel both
if errorlevel 1 goto :publish_fail
>"%STATUS%" echo PASS
>>"%LOG%" echo [PASS] FIX069 build + GitHub Release + public asset verification.
echo.
echo [PASS] Publikacja zakonczona. Log: %LOG%
echo https://github.com/%GHREPO%/releases/latest
if /i not "%~1"=="/nopause" pause
popd
exit /b 0

:config_fail
echo [FAIL] Nieprawidlowy format repozytorium. Wymagany: wlasciciel/nazwa-repo
if /i not "%~1"=="/nopause" pause
popd
exit /b 3

:build_fail
>"%STATUS%" echo FAIL_BUILD
echo [FAIL] Budowanie nie powiodlo sie. Szczegoly: %LOGDIR%
if /i not "%~1"=="/nopause" pause
popd
exit /b 1

:publish_fail
>"%STATUS%" echo FAIL_GITHUB_PUBLISH
echo [FAIL] Publikacja GitHub nie powiodla sie. Log: %LOGDIR%\01-github-publish.log
if /i not "%~1"=="/nopause" pause
popd
exit /b 2
