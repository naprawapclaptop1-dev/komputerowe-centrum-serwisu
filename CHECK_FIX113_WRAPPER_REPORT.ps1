$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$wrapperPath = Join-Path $root 'VERIFY_BUILD.cmd'
if (-not (Test-Path -LiteralPath $wrapperPath -PathType Leaf)) { throw 'VERIFY_BUILD.cmd is missing.' }
$wrapper = Get-Content -LiteralPath $wrapperPath -Raw
$required = @(
    'set "LOGDIR=%~dp0dist\build-logs"',
    'powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%VERIFY%"',
    'set "RC=%ERRORLEVEL%"',
    'type "%LOGDIR%\04-verification.log"',
    'if not "%RC%"=="0" goto :failed',
    'exit /b %RC%'
)
foreach ($item in $required) {
    if (-not $wrapper.Contains($item)) { throw ("FIX113 wrapper contract missing: {0}" -f $item) }
    Write-Host ("[PASS] Wrapper contains: {0}" -f $item)
}
$invoke = $wrapper.IndexOf($required[1], [System.StringComparison]::Ordinal)
$capture = $wrapper.IndexOf($required[2], [System.StringComparison]::Ordinal)
$print = $wrapper.IndexOf($required[3], [System.StringComparison]::Ordinal)
$gate = $wrapper.IndexOf($required[4], [System.StringComparison]::Ordinal)
if (-not ($invoke -ge 0 -and $capture -gt $invoke -and $print -gt $capture -and $gate -gt $print)) {
    throw 'Report must be printed after verifier execution and exit-code capture, before success/failure branching.'
}
if ($wrapper.Contains('-Root "%~dp0"')) { throw 'Unsafe trailing-backslash -Root argument is still passed to PowerShell.' }
Write-Host '[PASS] Report display is ordered after verifier execution and exit-code capture.'
if (-not ($wrapper.Contains(':report_missing') -and $wrapper.Contains('if "%RC%"=="0" set "RC=3"'))) {
    throw 'Missing report must not be silently treated as successful verification.'
}
Write-Host '[PASS] Missing report cannot be reported as successful verification.'
Write-Host '[PASS] FIX113 wrapper report regression checks: 8/8'
exit 0
