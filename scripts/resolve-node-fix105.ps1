param(
  [Parameter(Mandatory=$true)][ValidateNotNullOrEmpty()][string]$Root,
  [Parameter(Mandatory=$true)][ValidateNotNullOrEmpty()][string]$NodePathFile,
  [Parameter(Mandatory=$true)][ValidateNotNullOrEmpty()][string]$VersionFile
)

$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($Root)) { throw 'FIX105: pusty katalog projektu.' }
$Root = [IO.Path]::GetFullPath($Root.Trim().Trim('\'))
$NodePathFile = [IO.Path]::GetFullPath($NodePathFile)
$VersionFile = [IO.Path]::GetFullPath($VersionFile)
if ([string]::IsNullOrWhiteSpace($NodePathFile) -or [string]::IsNullOrWhiteSpace($VersionFile)) { throw 'FIX105: nie przekazano pelnych sciezek plikow wynikowych.' }
if (-not (Test-Path -LiteralPath $Root -PathType Container)) { throw ('FIX105: katalog projektu nie istnieje: ' + $Root) }

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$candidates = New-Object 'System.Collections.Generic.List[string]'

function Add-NodeCandidate {
  param([AllowNull()][string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) { return }
  $candidate = [Environment]::ExpandEnvironmentVariables($Value.Trim().Trim('"'))
  if ([string]::IsNullOrWhiteSpace($candidate)) { return }
  if (Test-Path -LiteralPath $candidate -PathType Container) {
    $candidate = Join-Path $candidate 'node.exe'
  }
  if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) { return }
  try { $candidate = [IO.Path]::GetFullPath($candidate) } catch { return }
  if (-not ($candidates | Where-Object { $_ -ieq $candidate })) {
    [void]$candidates.Add($candidate)
  }
}

function Add-NodeDirectory {
  param([AllowNull()][string]$Directory)
  if ([string]::IsNullOrWhiteSpace($Directory)) { return }
  $expanded = [Environment]::ExpandEnvironmentVariables($Directory.Trim().Trim('"'))
  if ([string]::IsNullOrWhiteSpace($expanded)) { return }
  Add-NodeCandidate (Join-Path $expanded 'node.exe')
}

function Add-PathEntries {
  param([AllowNull()][string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) { return }
  foreach ($entry in ($Value -split ';')) {
    if (-not [string]::IsNullOrWhiteSpace($entry)) { Add-NodeDirectory $entry }
  }
}

function Add-ChildDirectories {
  param([AllowNull()][string]$Parent, [string]$Filter='*')
  if ([string]::IsNullOrWhiteSpace($Parent) -or -not (Test-Path -LiteralPath $Parent -PathType Container)) { return @() }
  try { return @(Get-ChildItem -LiteralPath $Parent -Directory -Filter $Filter -ErrorAction SilentlyContinue) } catch { return @() }
}

function Test-NodeCandidate {
  param([string]$Candidate)
  try {
    $output = & $Candidate --version 2>$null
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) { return $null }
    $versionText = ([string]($output | Select-Object -First 1)).Trim()
    $match = [regex]::Match($versionText, '^v?(\d+)\.(\d+)\.(\d+)$')
    if (-not $match.Success) { return $null }
    $version = [version]::new([int]$match.Groups[1].Value, [int]$match.Groups[2].Value, [int]$match.Groups[3].Value)
    if ($version -lt [version]'20.0.0') { return $null }
    return [pscustomobject]@{ Path=$Candidate; Version=$versionText; Parsed=$version }
  } catch { return $null }
}

# 1. Project-local remembered selection and explicit overrides.
$savedPath = Join-Path $Root 'NODE_EXE.path'
if (Test-Path -LiteralPath $savedPath -PathType Leaf) {
  try { Add-NodeCandidate ([IO.File]::ReadAllText($savedPath).Trim()) } catch { }
}
Add-NodeCandidate $env:NODE_EXE
Add-NodeDirectory $env:NODE_HOME
Add-NodeDirectory $env:NODEJS_HOME
Add-NodeDirectory $env:NVM_SYMLINK
Add-NodeDirectory $env:FNM_MULTISHELL_PATH
if ($env:VOLTA_HOME) { Add-NodeDirectory (Join-Path $env:VOLTA_HOME 'bin') }

# 2. Current PATH and persisted user/machine PATH, split into entries (no long CMD expansion).
Add-PathEntries $env:Path
foreach ($key in @(
  'HKCU:\Environment',
  'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Environment'
)) {
  try {
    $item = Get-ItemProperty -LiteralPath $key -ErrorAction Stop
    if ($item.Path) { Add-PathEntries ([string]$item.Path) }
  } catch { }
}

# 3. Common official installer locations.
Add-NodeDirectory (Join-Path $env:ProgramFiles 'nodejs')
if (${env:ProgramFiles(x86)}) { Add-NodeDirectory (Join-Path ${env:ProgramFiles(x86)} 'nodejs') }
Add-NodeDirectory (Join-Path $env:ProgramData 'nodejs')
Add-NodeDirectory (Join-Path $env:LOCALAPPDATA 'Programs\nodejs')
Add-NodeDirectory (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links')
Add-NodeDirectory (Join-Path $env:ProgramData 'chocolatey\bin')
Add-NodeDirectory (Join-Path $env:USERPROFILE 'nodejs')
Add-NodeDirectory (Join-Path $env:USERPROFILE 'bin')
Add-NodeDirectory (Join-Path $env:USERPROFILE 'tools\nodejs')
Add-NodeDirectory 'C:\nodejs'
Add-NodeDirectory 'C:\tools\nodejs'
Add-NodeDirectory 'D:\nodejs'

# 4. Version managers: NVM, FNM, NVS, Volta and Scoop.
$nvmRoots = @($env:NVM_HOME, (Join-Path $env:APPDATA 'nvm'), (Join-Path $env:LOCALAPPDATA 'nvm')) | Where-Object { $_ }
foreach ($nvmRoot in $nvmRoots) {
  Add-NodeDirectory $nvmRoot
  foreach ($versionDir in (Add-ChildDirectories $nvmRoot 'v*')) { Add-NodeDirectory $versionDir.FullName }
  $settings = Join-Path $nvmRoot 'settings.txt'
  if (Test-Path -LiteralPath $settings -PathType Leaf) {
    foreach ($line in (Get-Content -LiteralPath $settings -ErrorAction SilentlyContinue)) {
      if ($line -match '^root:\s*(.+)$') {
        $rootFromSettings = $Matches[1].Trim()
        Add-NodeDirectory $rootFromSettings
        foreach ($versionDir in (Add-ChildDirectories $rootFromSettings 'v*')) { Add-NodeDirectory $versionDir.FullName }
      }
      if ($line -match '^path:\s*(.+)$') { Add-NodeDirectory $Matches[1].Trim() }
    }
  }
}
$fnmRoots = @($env:FNM_DIR, (Join-Path $env:LOCALAPPDATA 'fnm'), (Join-Path $env:APPDATA 'fnm'), (Join-Path $env:USERPROFILE '.fnm')) | Where-Object { $_ }
foreach ($fnmRoot in $fnmRoots) {
  $versionsRoot = Join-Path $fnmRoot 'node-versions'
  foreach ($versionDir in (Add-ChildDirectories $versionsRoot)) { Add-NodeDirectory (Join-Path $versionDir.FullName 'installation') }
}
foreach ($nvsRoot in @((Join-Path $env:LOCALAPPDATA 'nvs\node'), (Join-Path $env:APPDATA 'nvs\node'))) {
  foreach ($versionDir in (Add-ChildDirectories $nvsRoot)) {
    foreach ($archDir in (Add-ChildDirectories $versionDir.FullName)) { Add-NodeDirectory $archDir.FullName }
  }
}
Add-NodeDirectory (Join-Path $env:LOCALAPPDATA 'Volta\bin')
Add-NodeDirectory (Join-Path $env:USERPROFILE '.volta\bin')
foreach ($scoopRoot in @((Join-Path $env:USERPROFILE 'scoop\apps'), (Join-Path $env:ProgramData 'scoop\apps'))) {
  foreach ($appDir in (Add-ChildDirectories $scoopRoot 'nodejs*')) { Add-NodeDirectory (Join-Path $appDir.FullName 'current') }
}
$wingetRoot = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages'
foreach ($appDir in (Add-ChildDirectories $wingetRoot 'OpenJS.NodeJS*')) {
  Add-NodeDirectory $appDir.FullName
  foreach ($subDir in (Add-ChildDirectories $appDir.FullName)) { Add-NodeDirectory $subDir.FullName }
}

# 5. Registry App Paths and Node.js install keys.
foreach ($key in @(
  'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\node.exe',
  'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\node.exe',
  'HKLM:\SOFTWARE\Node.js',
  'HKLM:\SOFTWARE\WOW6432Node\Node.js',
  'HKCU:\SOFTWARE\Node.js'
)) {
  try {
    $regKey = Get-Item -LiteralPath $key -ErrorAction Stop
    Add-NodeCandidate ([string]$regKey.GetValue(''))
    $regItem = Get-ItemProperty -LiteralPath $key -ErrorAction SilentlyContinue
    Add-NodeDirectory ([string]$regItem.Path)
    Add-NodeDirectory ([string]$regItem.InstallPath)
    Add-NodeDirectory ([string]$regItem.InstallLocation)
  } catch { }
}
try {
  $whereExe = Join-Path $env:SystemRoot 'System32\where.exe'
  if (Test-Path -LiteralPath $whereExe) {
    foreach ($found in (& $whereExe node.exe 2>$null)) { Add-NodeCandidate ([string]$found) }
  }
} catch { }

# Validate each candidate by actually executing it; select the highest valid version.
$valid = @()
foreach ($candidate in $candidates) {
  $result = Test-NodeCandidate $candidate
  if ($null -ne $result) { $valid += $result }
}
$selected = $valid | Sort-Object { $_.Parsed } -Descending | Select-Object -First 1

# 6. If automatic discovery fails, show a real Windows file picker; allow manual path too.
if ($null -eq $selected) {
  Write-Host ''
  Write-Host '[INFO] FIX105: automatyczne wykrywanie nie znalazlo dzialajacego Node.js.'
  try {
    Add-Type -AssemblyName System.Windows.Forms -ErrorAction Stop
    $dialog = New-Object System.Windows.Forms.OpenFileDialog
    $dialog.Title = 'Wybierz plik node.exe z instalacji Node.js'
    $dialog.Filter = 'Node.js runtime (node.exe)|node.exe|Wszystkie pliki (*.*)|*.*'
    $dialog.CheckFileExists = $true
    $dialog.Multiselect = $false
    $dialog.InitialDirectory = $env:ProgramFiles
    if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
      Add-NodeCandidate $dialog.FileName
      $selected = Test-NodeCandidate $dialog.FileName
    }
    $dialog.Dispose()
  } catch {
    Write-Host '[INFO] Okno wyboru pliku jest niedostepne; mozna podac sciezke recznie.'
  }
}
if ($null -eq $selected) {
  try {
    $manual = Read-Host 'Wklej pelna sciezke do node.exe (ENTER = anuluj)'
    if (-not [string]::IsNullOrWhiteSpace($manual)) {
      $manual = $manual.Trim().Trim('"')
      Add-NodeCandidate $manual
      $selected = Test-NodeCandidate $manual
    }
  } catch { }
}

if ($null -eq $selected) {
  Write-Host '[BLAD] FIX105: nie znaleziono dzialajacego node.exe (wymagany Node.js 20 lub nowszy).' 
  exit 10
}

$selectedPath = [IO.Path]::GetFullPath($selected.Path)
$nodeOutputDirectory = Split-Path -Parent $NodePathFile
$versionOutputDirectory = Split-Path -Parent $VersionFile
if (-not (Test-Path -LiteralPath $nodeOutputDirectory -PathType Container)) { New-Item -ItemType Directory -Path $nodeOutputDirectory -Force | Out-Null }
if (-not (Test-Path -LiteralPath $versionOutputDirectory -PathType Container)) { New-Item -ItemType Directory -Path $versionOutputDirectory -Force | Out-Null }
[IO.File]::WriteAllText($NodePathFile, $selectedPath, $utf8NoBom)
[IO.File]::WriteAllText($VersionFile, $selected.Version, $utf8NoBom)
if (-not (Test-Path -LiteralPath $NodePathFile -PathType Leaf)) { throw ('FIX105: nie zapisano pliku: ' + $NodePathFile) }
if (-not (Test-Path -LiteralPath $VersionFile -PathType Leaf)) { throw ('FIX105: nie zapisano pliku: ' + $VersionFile) }
$savedNodePath = [IO.File]::ReadAllText($NodePathFile).Trim()
$savedNodeVersion = [IO.File]::ReadAllText($VersionFile).Trim()
if ($savedNodePath -ine $selectedPath) { throw 'FIX105: kontrola odczytu NODE_EXE.path nie powiodla sie.' }
if ($savedNodeVersion -ne $selected.Version) { throw 'FIX105: kontrola odczytu NODE_EXE.version nie powiodla sie.' }
Write-Host ('[OK] Node.js: ' + $selected.Version)
Write-Host ('[OK] Plik: ' + $selectedPath)
Write-Host ('[OK] Zapisano sciezke: ' + $NodePathFile)
Write-Host ('[OK] Zapisano wersje: ' + $VersionFile)
exit 0
