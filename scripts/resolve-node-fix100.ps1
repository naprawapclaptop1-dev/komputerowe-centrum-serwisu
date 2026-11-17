# FIX100: Resolve a working node.exe even when the parent CMD did not inherit the updated PATH.
# Compatible with Windows PowerShell 5.1; emits exactly one line (absolute node.exe path) on success.
$ErrorActionPreference = 'SilentlyContinue'
$script:NodeCandidates = New-Object 'System.Collections.Generic.List[object]'

function Add-NodeCandidate {
    param([string]$Path, [int]$Priority = 3)
    if ([string]::IsNullOrWhiteSpace($Path)) { return }
    $expanded = [Environment]::ExpandEnvironmentVariables($Path.Trim().Trim('"'))
    if ([string]::IsNullOrWhiteSpace($expanded)) { return }
    if (Test-Path -LiteralPath $expanded -PathType Container) {
        $expanded = Join-Path $expanded 'node.exe'
    }
    if (-not (Test-Path -LiteralPath $expanded -PathType Leaf)) { return }
    try { $full = [IO.Path]::GetFullPath($expanded) } catch { return }
    foreach ($item in $script:NodeCandidates) {
        if ($item.Path -ieq $full) {
            if ($Priority -lt $item.Priority) { $item.Priority = $Priority }
            return
        }
    }
    [void]$script:NodeCandidates.Add([pscustomobject]@{ Path = $full; Priority = $Priority })
}

function Add-NodeDirectory {
    param([string]$Directory, [int]$Priority = 3)
    if ([string]::IsNullOrWhiteSpace($Directory)) { return }
    Add-NodeCandidate -Path (Join-Path ([Environment]::ExpandEnvironmentVariables($Directory.Trim().Trim('"'))) 'node.exe') -Priority $Priority
}

# 1. Respect the Node executable already active in this process.
$command = Get-Command 'node.exe' -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
if ($command -and $command.Source) { Add-NodeCandidate -Path $command.Source -Priority 0 }
$command = Get-Command 'node' -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
if ($command -and $command.Source) { Add-NodeCandidate -Path $command.Source -Priority 0 }

$whereExe = Join-Path $env:SystemRoot 'System32\where.exe'
if (Test-Path -LiteralPath $whereExe) {
    foreach ($line in @(& $whereExe node.exe 2>$null)) { Add-NodeCandidate -Path ([string]$line) -Priority 0 }
}

# 2. Search all PATH directories, then the persisted user/machine PATH values.
foreach ($pathValue in @([string]$env:Path)) {
    foreach ($directory in ($pathValue -split ';')) { Add-NodeDirectory -Directory $directory -Priority 0 }
}
$registryPathKeys = @(
    'HKCU:\Environment',
    'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager\Environment'
)
foreach ($key in $registryPathKeys) {
    $entry = Get-ItemProperty -LiteralPath $key -ErrorAction SilentlyContinue
    if ($entry -and $entry.Path) {
        $persistedPath = [Environment]::ExpandEnvironmentVariables([string]$entry.Path)
        foreach ($directory in ($persistedPath -split ';')) { Add-NodeDirectory -Directory $directory -Priority 1 }
    }
}

# 3. Standard installer locations and package-manager shims.
$knownDirectories = @(
    (Join-Path $env:ProgramFiles 'nodejs'),
    (Join-Path ${env:ProgramFiles(x86)} 'nodejs'),
    (Join-Path $env:LOCALAPPDATA 'Programs\nodejs'),
    (Join-Path $env:APPDATA 'npm'),
    (Join-Path $env:ProgramData 'chocolatey\bin'),
    (Join-Path $env:LOCALAPPDATA 'Volta\bin'),
    (Join-Path $env:USERPROFILE '.volta\bin'),
    (Join-Path $env:USERPROFILE 'scoop\apps\nodejs\current'),
    (Join-Path $env:USERPROFILE 'scoop\apps\nodejs-lts\current')
)
foreach ($directory in $knownDirectories) { Add-NodeDirectory -Directory $directory -Priority 2 }

# 4. NVM for Windows: active symlink first, then installed versions (newest valid version wins).
Add-NodeDirectory -Directory $env:NVM_SYMLINK -Priority 1
Add-NodeDirectory -Directory $env:NVM_HOME -Priority 4
if ($env:NVM_HOME -and (Test-Path -LiteralPath $env:NVM_HOME)) {
    foreach ($versionDirectory in (Get-ChildItem -LiteralPath $env:NVM_HOME -Directory -Filter 'v*' -ErrorAction SilentlyContinue)) {
        Add-NodeDirectory -Directory $versionDirectory.FullName -Priority 4
    }
}

# 5. FNM, Volta, NVS and Scoop version-managed installations.
Add-NodeDirectory -Directory $env:FNM_MULTISHELL_PATH -Priority 1
$fnmRoots = @($env:FNM_DIR, (Join-Path $env:LOCALAPPDATA 'fnm'), (Join-Path $env:APPDATA 'fnm'), (Join-Path $env:USERPROFILE '.fnm')) | Where-Object { $_ }
foreach ($root in $fnmRoots) {
    $versionsRoot = Join-Path $root 'node-versions'
    if (Test-Path -LiteralPath $versionsRoot) {
        foreach ($versionDirectory in (Get-ChildItem -LiteralPath $versionsRoot -Directory -ErrorAction SilentlyContinue)) {
            Add-NodeDirectory -Directory (Join-Path $versionDirectory.FullName 'installation') -Priority 4
        }
    }
}
$nvsRoots = @($env:NVS_HOME, (Join-Path $env:LOCALAPPDATA 'nvs'), (Join-Path $env:APPDATA 'nvs')) | Where-Object { $_ }
foreach ($root in $nvsRoots) {
    $nodeRoot = Join-Path $root 'node'
    if (Test-Path -LiteralPath $nodeRoot) {
        foreach ($versionDirectory in (Get-ChildItem -LiteralPath $nodeRoot -Directory -ErrorAction SilentlyContinue)) {
            foreach ($archDirectory in (Get-ChildItem -LiteralPath $versionDirectory.FullName -Directory -ErrorAction SilentlyContinue)) {
                Add-NodeDirectory -Directory $archDirectory.FullName -Priority 4
            }
        }
    }
}
$scoopRoot = Join-Path $env:USERPROFILE 'scoop\apps'
if (Test-Path -LiteralPath $scoopRoot) {
    foreach ($appDirectory in (Get-ChildItem -LiteralPath $scoopRoot -Directory -Filter 'nodejs*' -ErrorAction SilentlyContinue)) {
        Add-NodeDirectory -Directory (Join-Path $appDirectory.FullName 'current') -Priority 3
    }
}

# 6. App Paths and Node.js installer registry entries (including 32-bit registry view).
$appPathKeys = @(
    'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\node.exe',
    'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\node.exe'
)
foreach ($key in $appPathKeys) {
    try {
        $registryKey = Get-Item -LiteralPath $key -ErrorAction SilentlyContinue
        if ($registryKey) {
            $defaultValue = [string]$registryKey.GetValue('')
            Add-NodeCandidate -Path $defaultValue -Priority 2
            Add-NodeDirectory -Directory $registryKey.GetValue('Path') -Priority 2
        }
    } catch { }
}
$nodeRegistryKeys = @(
    'HKLM:\SOFTWARE\Node.js',
    'HKLM:\SOFTWARE\WOW6432Node\Node.js',
    'HKCU:\SOFTWARE\Node.js'
)
foreach ($key in $nodeRegistryKeys) {
    $entry = Get-ItemProperty -LiteralPath $key -ErrorAction SilentlyContinue
    if ($entry) {
        Add-NodeDirectory -Directory ([string]$entry.InstallPath) -Priority 2
        Add-NodeDirectory -Directory ([string]$entry.InstallLocation) -Priority 2
    }
}
$uninstallRoots = @(
    'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall',
    'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall',
    'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall'
)
foreach ($root in $uninstallRoots) {
    foreach ($subkey in (Get-ChildItem -LiteralPath $root -ErrorAction SilentlyContinue)) {
        $entry = Get-ItemProperty -LiteralPath $subkey.PSPath -ErrorAction SilentlyContinue
        if ($entry -and ([string]$entry.DisplayName -match '^Node\.js')) {
            Add-NodeDirectory -Directory ([string]$entry.InstallLocation) -Priority 2
        }
    }
}

# Verify candidates by executing them, then prefer the current PATH and highest installed version.
$valid = @()
foreach ($candidate in $script:NodeCandidates) {
    try {
        $output = & $candidate.Path --version 2>$null
        $exitCode = $LASTEXITCODE
        if ($exitCode -ne 0) { continue }
        $text = [string]($output | Select-Object -First 1)
        if ($text -match 'v?(\d+)\.(\d+)\.(\d+)') {
            $version = [version]::new([int]$Matches[1], [int]$Matches[2], [int]$Matches[3])
            $valid += [pscustomobject]@{ Path = $candidate.Path; Priority = $candidate.Priority; Version = $version }
        }
    } catch { }
}
if ($valid.Count -gt 0) {
    $selected = $valid | Sort-Object -Property @{ Expression = 'Priority'; Descending = $false }, @{ Expression = 'Version'; Descending = $true } | Select-Object -First 1
    [Console]::Out.WriteLine($selected.Path)
    exit 0
}
exit 10
