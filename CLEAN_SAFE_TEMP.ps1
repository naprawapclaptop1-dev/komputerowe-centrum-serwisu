param(
    [int]$PackageTempAgeDays = 7,
    [int]$SourceSyncAgeHours = 24
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

try {
    $ProjectRoot = [IO.Path]::GetFullPath($PSScriptRoot).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
    $markerPath = Join-Path $ProjectRoot 'FIX098_PACKAGE_MARKER.txt'
    if (-not (Test-Path -LiteralPath $markerPath -PathType Leaf)) { throw 'FIX098 package marker is missing.' }
    if (@(Get-Content -LiteralPath $markerPath -ErrorAction Stop) -notcontains 'PACKAGE=FIX098') { throw 'Cleaner is not running from FIX098 package root.' }

    $logDir = Join-Path $ProjectRoot 'dist\build-logs'
    New-Item -ItemType Directory -Force -Path $logDir -ErrorAction Stop | Out-Null
    $log = Join-Path $logDir 'SAFE_TEMP_CLEANUP.log'
    "=== FIX098 PACKAGE-LOCAL CLEANUP $(Get-Date -Format o) ===" | Set-Content -LiteralPath $log -Encoding UTF8 -ErrorAction Stop

    $removedFiles = 0
    $removedDirs = 0
    [long]$removedBytes = 0
    $warnings = 0
    $projectPrefix = $ProjectRoot + [IO.Path]::DirectorySeparatorChar
    $fileCutoff = (Get-Date).ToUniversalTime().AddDays(-[Math]::Max(1, $PackageTempAgeDays))
    $cloneCutoff = (Get-Date).ToUniversalTime().AddHours(-[Math]::Max(1, $SourceSyncAgeHours))

    function Write-CleanLog([string]$Message) {
        Add-Content -LiteralPath $script:log -Value $Message -Encoding UTF8 -ErrorAction Stop
        Write-Host $Message
    }

    function Get-SafePackageFiles([string]$StartPath) {
        $stack = New-Object 'System.Collections.Generic.Stack[string]'
        $stack.Push($StartPath)
        while ($stack.Count -gt 0) {
            $current = $stack.Pop()
            foreach ($item in (Get-ChildItem -LiteralPath $current -Force -ErrorAction SilentlyContinue)) {
                if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { continue }
                if ($item.PSIsContainer) { $stack.Push($item.FullName) }
                else { $item }
            }
        }
    }

    # Only these dedicated temporary folders INSIDE the package are inspected.
    # Source code, build output, logs, installers, portable files, .tools and node_modules are untouched.
    $allowedRelativeDirs = @('temp', 'tmp', 'dist\temp', 'dist\tmp', 'build\temp', 'build\tmp')
    foreach ($relative in $allowedRelativeDirs) {
        $candidate = [IO.Path]::GetFullPath((Join-Path $ProjectRoot $relative))
        if (-not $candidate.StartsWith($projectPrefix, [StringComparison]::OrdinalIgnoreCase)) { throw 'Temporary path escaped package root.' }
        if (-not (Test-Path -LiteralPath $candidate -PathType Container)) { continue }
        $dirItem = Get-Item -LiteralPath $candidate -Force -ErrorAction Stop
        if (($dirItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
            Write-CleanLog ('[SKIP] Reparse-point temp directory: ' + $candidate)
            continue
        }
        foreach ($file in (Get-SafePackageFiles -StartPath $candidate)) {
            if ($file.Extension -notin @('.tmp', '.temp')) { continue }
            if ($file.LastWriteTimeUtc -ge $fileCutoff) { continue }
            if (($file.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0 -or ($file.Attributes -band [IO.FileAttributes]::System) -ne 0) { continue }
            $full = [IO.Path]::GetFullPath($file.FullName)
            if (-not $full.StartsWith($candidate + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Temporary file resolved outside its allowlisted package folder.' }
            $stream = $null
            try {
                $stream = [IO.File]::Open($full, [IO.FileMode]::Open, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
                $stream.Dispose(); $stream = $null
                $size = [long]$file.Length
                Remove-Item -LiteralPath $full -Force -ErrorAction Stop
                $removedFiles++; $removedBytes += $size
                Write-CleanLog ('[CLEAN] Removed package temp file: ' + $full)
            } catch {
                $warnings++
                Write-CleanLog ('[WARN] Package temp file preserved (locked/protected): ' + $full + ' | ' + $_.Exception.Message)
            } finally { if ($stream) { $stream.Dispose() } }
        }
    }

    # Remove only stale source-sync work directories created by this program, under its own dist folder.
    $syncRoot = [IO.Path]::GetFullPath((Join-Path $ProjectRoot 'dist\source-sync-temp'))
    if ($syncRoot.StartsWith($projectPrefix, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $syncRoot -PathType Container)) {
        $syncItem = Get-Item -LiteralPath $syncRoot -Force -ErrorAction Stop
        if (($syncItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -eq 0) {
            foreach ($dir in (Get-ChildItem -LiteralPath $syncRoot -Directory -Force -ErrorAction SilentlyContinue)) {
                if ($dir.Name -notmatch '^KCS_FIX[0-9]{3}_SourceSync_[0-9a-f]{32}$') { continue }
                if ($dir.LastWriteTimeUtc -ge $cloneCutoff) { continue }
                if (($dir.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { continue }
                $full = [IO.Path]::GetFullPath($dir.FullName)
                if (-not $full.StartsWith($syncRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Source-sync path resolved outside package.' }
                try {
                    $nestedReparse = @(Get-ChildItem -LiteralPath $full -Force -Recurse -ErrorAction SilentlyContinue | Where-Object { ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0 })
                    if ($nestedReparse.Count -gt 0) {
                        $warnings++
                        Write-CleanLog ('[WARN] Source-sync folder preserved because it contains a reparse point: ' + $full)
                        continue
                    }
                    $size = (Get-SafePackageFiles -StartPath $full | Measure-Object -Property Length -Sum).Sum
                    Remove-Item -LiteralPath $full -Recurse -Force -ErrorAction Stop
                    $removedDirs++
                    if ($size) { $removedBytes += [long]$size }
                    Write-CleanLog ('[CLEAN] Removed stale package source-sync folder: ' + $full)
                } catch {
                    $warnings++
                    Write-CleanLog ('[WARN] Source-sync folder preserved: ' + $full + ' | ' + $_.Exception.Message)
                }
            }
        }
    }

    if ($warnings -eq 0) {
        Write-CleanLog ("[PASS] Package-local cleanup completed: files=$removedFiles; source-sync folders=$removedDirs; bytes=$removedBytes; skipped=$warnings")
    } else {
        Write-CleanLog ("[WARN] Package-local cleanup completed with skips: files=$removedFiles; source-sync folders=$removedDirs; bytes=$removedBytes; skipped=$warnings")
    }
    Write-CleanLog '[SCOPE] Only package-local temp/tmp folders and this program source-sync temp area were inspected.'
    Write-CleanLog '[PRESERVED] Windows TEMP, user TEMP, browser/Discord/Teams/GPU caches, user profiles, documents, settings, databases, credentials, project sources, build output, logs, installers, portable files, .tools and node_modules.'
    exit 0
}
catch {
    Write-Host ('[FAIL] Package-local cleanup initialization failed: ' + $_.Exception.Message)
    exit 2
}
