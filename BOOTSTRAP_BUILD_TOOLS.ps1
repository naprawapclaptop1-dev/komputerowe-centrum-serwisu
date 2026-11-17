$ErrorActionPreference="Stop"
$ProgressPreference="SilentlyContinue"
function Refresh-Path {
  $env:Path=[Environment]::GetEnvironmentVariable("Path","Machine")+";"+[Environment]::GetEnvironmentVariable("Path","User")
  $extras=@("$env:LOCALAPPDATA\Microsoft\WinGet\Links","$env:ProgramFiles\GitHub CLI","${env:ProgramFiles(x86)}\GitHub CLI")
  foreach($x in $extras){if(Test-Path $x){$env:Path+=";"+$x}}
}
function Find-Iscc {
  $candidates=@()
  foreach($base in @($env:ProgramFiles,${env:ProgramFiles(x86)},$env:LOCALAPPDATA+"\Programs")){
    if($base -and (Test-Path $base)){$candidates+=Get-ChildItem -Path (Join-Path $base "Inno Setup*\ISCC.exe") -ErrorAction SilentlyContinue}
  }
  $candidates | Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
}
Refresh-Path
$winget=Get-Command winget.exe -ErrorAction SilentlyContinue
if(!(Get-Command gh.exe -ErrorAction SilentlyContinue)){
  if(!$winget){throw "Nie wykryto GitHub CLI ani WinGet. Zainstaluj App Installer (WinGet) i uruchom ponownie ten sam CMD."}
  Write-Host "[AUTO] Instaluję GitHub CLI..."
  & $winget.Source install --id GitHub.cli --exact --source winget --silent --accept-source-agreements --accept-package-agreements
  if($LASTEXITCODE -ne 0){throw "Automatyczna instalacja GitHub CLI nie powiodła się (kod $LASTEXITCODE)."}
  Refresh-Path
}
$gh=Get-Command gh.exe -ErrorAction SilentlyContinue
if(!$gh){throw "GitHub CLI zainstalowano, ale gh.exe nie jest dostępny w PATH. Zamknij inne procesy i uruchom ponownie główny CMD."}
Write-Host "[PASS] GitHub CLI: $(& $gh.Source --version | Select-Object -First 1)"
if(!(Get-Command git.exe -ErrorAction SilentlyContinue)){
  if(!$winget){throw "Brak Git for Windows i WinGet. Nie można zsynchronizować źródeł do GitHub."}
  Write-Host "[AUTO] Instaluję Git for Windows..."
  & $winget.Source install --id Git.Git --exact --source winget --silent --accept-source-agreements --accept-package-agreements
  if($LASTEXITCODE -ne 0){throw "Automatyczna instalacja Git for Windows nie powiodła się (kod $LASTEXITCODE)."}
  Refresh-Path
}
$git=Get-Command git.exe -ErrorAction SilentlyContinue
if(!$git){throw "Git for Windows zainstalowano, ale git.exe nie jest dostępny."}
Write-Host "[PASS] Git: $(& $git.Source --version)"
$iscc=Find-Iscc
if(!$iscc){
  if(!$winget){throw "Nie wykryto Inno Setup ani WinGet. Nie można zbudować instalatora."}
  Write-Host "[AUTO] Instaluję kompilator instalatora Inno Setup 7..."
  & $winget.Source install --id JRSoftware.InnoSetup.7 --exact --source winget --silent --accept-source-agreements --accept-package-agreements
  if($LASTEXITCODE -ne 0){
    Write-Warning "Inno Setup 7 nie został zainstalowany. Próba stabilnego Inno Setup 6..."
    & $winget.Source install --id JRSoftware.InnoSetup --exact --source winget --silent --accept-source-agreements --accept-package-agreements
    if($LASTEXITCODE -ne 0){throw "Nie udało się automatycznie zainstalować Inno Setup 6/7."}
  }
  $iscc=Find-Iscc
}
if(!$iscc){throw "Inno Setup zainstalowano, ale nie znaleziono ISCC.exe w standardowej lokalizacji."}
$env:INNO_MODERN_ISCC=$iscc
Write-Host "[PASS] Inno Setup: $iscc"
$csc="$env:WINDIR\Microsoft.NET\Framework\v4.0.30319\csc.exe"
if(!(Test-Path $csc)){$csc="$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe"}
if(!(Test-Path $csc)){throw "Brak kompilatora .NET Framework csc.exe. Włącz .NET Framework 4.x w systemie Windows."}
Write-Host "[PASS] C# compiler: $csc"
$toolLog=Join-Path $PSScriptRoot "dist\build-logs\TOOLS_PATHS.txt"
New-Item -ItemType Directory -Force -Path (Split-Path $toolLog -Parent) | Out-Null
@("GH=$($gh.Source)","GIT=$($git.Source)","ISCC=$iscc") | Set-Content -LiteralPath $toolLog -Encoding ASCII
Write-Host "[PASS] Wymagane narzędzia są gotowe."
