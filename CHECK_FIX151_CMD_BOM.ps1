$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$path = Join-Path $root 'CHECK_SOURCE.cmd'
if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw 'CHECK_SOURCE.cmd is missing.' }
$bytes = [IO.File]::ReadAllBytes($path)
if ($bytes.Length -lt 9) { throw 'CHECK_SOURCE.cmd is unexpectedly short.' }
if ($bytes[0] -ne 0x40) { throw ('CHECK_SOURCE.cmd must start with @ (0x40); first bytes: ' + [BitConverter]::ToString($bytes[0..([Math]::Min(3,$bytes.Length-1))])) }
if ($bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) { throw 'UTF-8 BOM is not allowed in CHECK_SOURCE.cmd.' }
$prefix = [Text.Encoding]::ASCII.GetString($bytes,0,9)
if (-not $prefix.StartsWith('@echo off',[StringComparison]::OrdinalIgnoreCase)) { throw 'CHECK_SOURCE.cmd must begin with @echo off.' }
Write-Host '[PASS] FIX151: CHECK_SOURCE.cmd is BOM-free and starts with @echo off.'
foreach ($name in @('BUILD_ALL.cmd','BUILD_INSTALLER_XP.cmd','BUILD_INSTALLERS.cmd','BUILD_MANAGER.cmd')) {
    $bytes = [IO.File]::ReadAllBytes((Join-Path $root $name))
    if ($bytes.Length -lt 9 -or [Text.Encoding]::ASCII.GetString($bytes,0,9) -ne '@echo off') {
        throw ($name + ' must begin with @echo off and have no BOM.')
    }
}
$bytes = [IO.File]::ReadAllBytes((Join-Path $root 'CHECK_FIX150_OPTIONAL_XP_ORCHESTRATION.ps1'))
if ($bytes.Length -lt 4 -or [BitConverter]::ToString($bytes,0,4) -ne 'EF-BB-BF-24') {
    throw 'The FIX150 PowerShell check must start with one UTF-8 BOM followed by a dollar sign.'
}
$build = Get-Content -LiteralPath (Join-Path $root 'BUILD_ALL.cmd') -Raw
if (-not $build.Contains('"%ComSpec%" /d /s /c ""%~dp0BUILD_INSTALLER_XP.cmd" /nopause"')) {
    throw 'BUILD_ALL must run the optional XP stage in a separate CMD process.'
}
if ($build -notmatch '(?m)^if not exist "%LOGDIR%\\XP_INSTALLER\.status" goto :xp_optional_failed\r?$') {
    throw 'Missing XP status must take the optional failure path.'
}
Write-Host '[PASS] FIX152: build script encoding and optional XP isolation.'
# FIX153: Exercise the real build orchestrator without invoking compilers or publishing.
$tempRoot = Join-Path ([IO.Path]::GetTempPath()) ('KCS build (test) ' + [guid]::NewGuid().ToString('N'))
[void][IO.Directory]::CreateDirectory($tempRoot)
try {
    Copy-Item -LiteralPath (Join-Path $root 'BUILD_ALL.cmd') -Destination $tempRoot
    foreach ($name in @('BUILD_PORTABLE.cmd','BUILD_INSTALLER_MODERN.cmd')) {
        [IO.File]::WriteAllText((Join-Path $tempRoot $name), "@echo off`r`nexit /b 0`r`n", [Text.Encoding]::ASCII)
    }
    $verifyPath = Join-Path $tempRoot 'VERIFY_BUILD.cmd'
    $xpPath = Join-Path $tempRoot 'BUILD_INSTALLER_XP.cmd'
    $cases = @(
        @{Output='PASS';    Exit='exit /b 0'; Expected='[PASS] Optional XP installer'},
        @{Output='SKIPPED'; Exit='exit /b 0'; Expected='[SKIP] Optional XP installer'},
        @{Output='FAIL';    Exit='exit /b 0'; Expected='[WARN] Optional XP installer FAILED'},
        @{Output='';        Exit='exit /b 0'; Expected='[WARN] Optional XP installer FAILED'},
        @{Output='UNKNOWN'; Exit='exit /b 0'; Expected='[WARN] Optional XP installer FAILED'},
        @{Output='';        Exit='exit 7';    Expected='[WARN] Optional XP installer FAILED'}
    )
    Push-Location -LiteralPath $tempRoot
    try {
        foreach ($case in $cases) {
            $xpBody = "@echo off`r`n"
            if ($case.Output) { $xpBody += ('>"dist\build-logs\XP_INSTALLER.status" echo ' + $case.Output + "`r`n") }
            [IO.File]::WriteAllText($xpPath, $xpBody + $case.Exit + "`r`n", [Text.Encoding]::ASCII)
            [IO.File]::WriteAllText($verifyPath, "@echo off`r`nexit /b 0`r`n", [Text.Encoding]::ASCII)
            $output = & $env:ComSpec /d /c 'BUILD_ALL.cmd /nopause /skip-source-check' 2>&1
            $rc = $LASTEXITCODE
            $summary = [IO.File]::ReadAllText((Join-Path $tempRoot 'dist\build-logs\BUILD_SUMMARY.txt'))
            if ($rc -ne 0 -or -not $summary.Contains($case.Expected) -or -not $summary.Contains('[PASS] Full output verification')) {
                throw ("Optional XP scenario failed: " + $case.Exit + ' / ' + $case.Output + [Environment]::NewLine + ($output -join [Environment]::NewLine))
            }
        }
        [IO.File]::WriteAllText($verifyPath, "@echo off`r`nexit /b 3`r`n", [Text.Encoding]::ASCII)
        $output = & $env:ComSpec /d /c 'BUILD_ALL.cmd /nopause /skip-source-check' 2>&1
        if ($LASTEXITCODE -eq 0) { throw 'A required verification failure must fail BUILD_ALL.' }
    } finally {
        Pop-Location
    }
} finally {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force
}
Write-Host '[PASS] FIX153: optional XP outcomes and required verification in a path with parentheses.'
exit 0
