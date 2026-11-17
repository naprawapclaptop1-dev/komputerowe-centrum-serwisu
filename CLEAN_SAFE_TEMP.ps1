param(
    [int]$GenericTempAgeDays = 14,
    [int]$KcsCloneAgeHours = 24
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

try {
    $ProjectRoot = [IO.Path]::GetFullPath($PSScriptRoot)
    $markerPath = Join-Path $ProjectRoot 'FIX093_PACKAGE_MARKER.txt'
    if (-not (Test-Path -LiteralPath $markerPath -PathType Leaf)) {
        throw 'FIX093 package marker is missing next to CLEAN_SAFE_TEMP.ps1.'
    }
    $markerLines = @(Get-Content -LiteralPath $markerPath -ErrorAction Stop)
    if ($markerLines -notcontains 'PACKAGE=FIX093') {
        throw 'The cleanup script is not running from the active FIX093 package root.'
    }

    $logDir = Join-Path $ProjectRoot 'dist\build-logs'
    New-Item -ItemType Directory -Force -Path $logDir -ErrorAction Stop | Out-Null
    $log = Join-Path $logDir 'SAFE_TEMP_CLEANUP.log'
    "=== SAFE TEMP CLEANUP $(Get-Date -Format o) ===" | Set-Content -LiteralPath $log -Encoding UTF8 -ErrorAction Stop

    $removedFiles = 0
    $removedDirs = 0
    [long]$removedBytes = 0
    $warnings = 0

    function Write-CleanLog([string]$Message) {
        Add-Content -LiteralPath $script:log -Value $Message -Encoding UTF8 -ErrorAction Stop
        Write-Host $Message
    }

    function Get-NormalPath([string]$Path) {
        return [IO.Path]::GetFullPath($Path).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
    }

    $tempRoots = New-Object System.Collections.Generic.List[string]
    $userTempRoot = ''
    if (-not [string]::IsNullOrWhiteSpace($env:TEMP)) {
        $candidate = Get-NormalPath $env:TEMP.Trim().Trim([char]34)
        if (Test-Path -LiteralPath $candidate -PathType Container) {
            $userTempRoot = $candidate
            [void]$tempRoots.Add($candidate)
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($env:WINDIR)) {
        $windowsTemp = Join-Path $env:WINDIR 'Temp'
        if (Test-Path -LiteralPath $windowsTemp -PathType Container) {
            $normalizedWindowsTemp = Get-NormalPath $windowsTemp
            if (-not $tempRoots.Contains($normalizedWindowsTemp)) {
                [void]$tempRoots.Add($normalizedWindowsTemp)
            }
        }
    }

    $cloneCutoff = (Get-Date).ToUniversalTime().AddHours(-[Math]::Max(1, $KcsCloneAgeHours))
    $genericCutoff = (Get-Date).ToUniversalTime().AddDays(-[Math]::Max(1, $GenericTempAgeDays))

    foreach ($tempRoot in $tempRoots) {
        # Remove only stale temporary clones created by this product, directly under TEMP.
        if ($userTempRoot -and $tempRoot -eq $userTempRoot) {
            Get-ChildItem -LiteralPath $tempRoot -Directory -Force -ErrorAction SilentlyContinue |
                Where-Object {
                    $_.Name -match '^KCS_FIX[0-9]{3}_SourceSync_[0-9a-f]{32}$' -and
                    $_.LastWriteTimeUtc -lt $cloneCutoff -and
                    -not ($_.Attributes -band [IO.FileAttributes]::ReparsePoint)
                } |
                ForEach-Object {
                    try {
                        $full = Get-NormalPath $_.FullName
                        if ($full.StartsWith($tempRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
                            $size = (Get-ChildItem -LiteralPath $full -File -Recurse -Force -ErrorAction SilentlyContinue |
                                Measure-Object -Property Length -Sum).Sum
                            Remove-Item -LiteralPath $full -Recurse -Force -ErrorAction Stop
                            $removedDirs++
                            if ($size) { $removedBytes += [long]$size }
                            Write-CleanLog ('[CLEAN] Removed stale KCS temporary clone: ' + $full)
                        }
                    }
                    catch {
                        $warnings++
                        Write-CleanLog ('[WARN] KCS temp clone skipped: ' + $_.Exception.Message)
                    }
                }
        }

        # Clean only old *.tmp/*.temp files inside approved TEMP roots.
        # Profiles, AppData, ProgramData, Downloads, application folders, and project outputs are untouched.
        Get-ChildItem -LiteralPath $tempRoot -File -Recurse -Force -ErrorAction SilentlyContinue |
            Where-Object {
                $_.Extension -in @('.tmp', '.temp') -and
                $_.LastWriteTimeUtc -lt $genericCutoff -and
                -not ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -and
                -not ($_.Attributes -band [IO.FileAttributes]::System)
            } |
            ForEach-Object {
                $stream = $null
                try {
                    $full = Get-NormalPath $_.FullName
                    if ($full.StartsWith($tempRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
                        # Exclusive open skips files currently held by another process.
                        $stream = [IO.File]::Open($full, [IO.FileMode]::Open, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
                        $stream.Dispose()
                        $stream = $null
                        $size = [long]$_.Length
                        Remove-Item -LiteralPath $full -Force -ErrorAction Stop
                        $removedFiles++
                        $removedBytes += $size
                        Write-CleanLog ('[CLEAN] Removed old unused application temp file: ' + $full)
                    }
                }
                catch {
                    $warnings++
                    Write-CleanLog ('[WARN] Temp file preserved (locked/protected/unavailable): ' + $_.Exception.Message)
                }
                finally {
                    if ($stream) { $stream.Dispose() }
                }
            }
    }

    if ($warnings -eq 0) {
        Write-CleanLog ("[PASS] Safe cleanup completed: files=$removedFiles; KCS temp folders=$removedDirs; bytes=$removedBytes; skipped=$warnings")
    }
    else {
        Write-CleanLog ("[WARN] Safe cleanup completed with skipped files: files=$removedFiles; KCS temp folders=$removedDirs; bytes=$removedBytes; skipped=$warnings")
    }
    Write-CleanLog '[SAFE] Kept application data, settings, databases, registry, documents, installers, portable builds, project outputs, .tools, node_modules, and all non-temp folders.'
    exit 0
}
catch {
    Write-Host ('[FAIL] Safe temporary cleanup initialization failed: ' + $_.Exception.Message)
    exit 2
}
