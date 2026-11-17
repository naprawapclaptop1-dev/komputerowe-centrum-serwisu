# FIX101 secondary resolver. CMD performs PATH and known-folder checks first.
# This script scans persisted registry paths and manager-specific directories.
$ErrorActionPreference = 'SilentlyContinue'
$candidates = New-Object 'System.Collections.Generic.List[string]'
function Add-Candidate([string]$Path) {
  if ([string]::IsNullOrWhiteSpace($Path)) { return }
  $p = [Environment]::ExpandEnvironmentVariables($Path.Trim().Trim('"'))
  if (Test-Path -LiteralPath $p -PathType Container) { $p = Join-Path $p 'node.exe' }
  if ((Test-Path -LiteralPath $p -PathType Leaf) -and -not ($candidates | Where-Object { $_ -ieq $p })) { [void]$candidates.Add($p) }
}
function Add-Directory([string]$Directory) {
  if (-not [string]::IsNullOrWhiteSpace($Directory)) { Add-Candidate (Join-Path ([Environment]::ExpandEnvironmentVariables($Directory.Trim().Trim('"'))) 'node.exe') }
}
# Current and persisted PATH values.
foreach ($value in @([string]$env:Path)) { foreach ($part in ($value -split ';')) { Add-Directory $part } }
foreach ($key in @('HKCU:\Environment','HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Environment')) {
  $item = Get-ItemProperty -LiteralPath $key
  if ($item.Path) { foreach ($part in ([Environment]::ExpandEnvironmentVariables([string]$item.Path) -split ';')) { Add-Directory $part } }
}
# Explicit and known user paths.
foreach ($dir in @($env:NODE_HOME,$env:NODEJS_HOME,$env:NVM_SYMLINK,$env:FNM_MULTISHELL_PATH,$env:VOLTA_HOME,(Join-Path $env:ProgramFiles 'nodejs'),(Join-Path ${env:ProgramFiles(x86)} 'nodejs'),(Join-Path $env:LOCALAPPDATA 'Programs\nodejs'),(Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links'),(Join-Path $env:LOCALAPPDATA 'Volta\bin'),(Join-Path $env:USERPROFILE '.volta\bin'),(Join-Path $env:USERPROFILE 'bin'),(Join-Path $env:USERPROFILE 'nodejs'))) { Add-Directory $dir }
# Read nvm-windows settings when environment variables were not inherited.
foreach ($settings in @((Join-Path $env:APPDATA 'nvm\settings.txt'),(Join-Path $env:LOCALAPPDATA 'nvm\settings.txt'))) {
  if (Test-Path -LiteralPath $settings) {
    $content = Get-Content -LiteralPath $settings
    foreach ($line in $content) {
      if ($line -match '^root:\s*(.+)$') { $nvmRoot = $Matches[1].Trim(); Add-Directory $nvmRoot; foreach ($v in (Get-ChildItem -LiteralPath $nvmRoot -Directory -Filter 'v*')) { Add-Directory $v.FullName } }
      if ($line -match '^path:\s*(.+)$') { Add-Directory $Matches[1].Trim() }
    }
  }
}
# FNM version storage and multishells.
foreach ($root in @($env:FNM_DIR,(Join-Path $env:LOCALAPPDATA 'fnm'),(Join-Path $env:APPDATA 'fnm'),(Join-Path $env:USERPROFILE '.fnm'))) {
  if ($root) {
    Add-Directory (Join-Path $root 'node-versions')
    foreach ($v in (Get-ChildItem -LiteralPath (Join-Path $root 'node-versions') -Directory)) { Add-Directory (Join-Path $v.FullName 'installation') }
  }
}
# NVS, Scoop, WinGet and Chocolatey.
foreach ($root in @((Join-Path $env:LOCALAPPDATA 'nvs\node'),(Join-Path $env:APPDATA 'nvs\node'))) {
  foreach ($v in (Get-ChildItem -LiteralPath $root -Directory)) { foreach ($arch in (Get-ChildItem -LiteralPath $v.FullName -Directory)) { Add-Directory $arch.FullName } }
}
foreach ($root in @((Join-Path $env:USERPROFILE 'scoop\apps'),(Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages'))) {
  foreach ($app in (Get-ChildItem -LiteralPath $root -Directory | Where-Object { $_.Name -match '^(nodejs|OpenJS\.NodeJS)' })) {
    Add-Directory (Join-Path $app.FullName 'current')
    Add-Directory $app.FullName
  }
}
Add-Directory (Join-Path $env:ProgramData 'chocolatey\bin')
# Registry App Paths and installer keys.
foreach ($key in @('HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\node.exe','HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\node.exe','HKLM:\SOFTWARE\Node.js','HKLM:\SOFTWARE\WOW6432Node\Node.js','HKCU:\SOFTWARE\Node.js')) {
  try {
    $rk = Get-Item -LiteralPath $key
    Add-Candidate ([string]$rk.GetValue(''))
    $p = Get-ItemProperty -LiteralPath $key
    Add-Directory ([string]$p.Path); Add-Directory ([string]$p.InstallPath); Add-Directory ([string]$p.InstallLocation)
  } catch { }
}
# Try every candidate. Only emit a path after a real successful --version call.
$valid = foreach ($candidate in $candidates) {
  try {
    $output = & $candidate --version 2>$null
    if ($LASTEXITCODE -eq 0 -and ([string]$output -match '^v?(\d+\.\d+\.\d+)')) { $v=[version]$Matches[1]; if($v -ge [version]'20.0.0'){[pscustomobject]@{Path=$candidate;Version=$v}} }
  } catch { }
}
if ($valid) { $valid | Sort-Object Version -Descending | Select-Object -First 1 -ExpandProperty Path }
