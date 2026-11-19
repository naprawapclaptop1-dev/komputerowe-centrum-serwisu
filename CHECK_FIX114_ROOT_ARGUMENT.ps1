$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$wrapperPath = Join-Path $root 'VERIFY_BUILD.cmd'
$verifierPath = Join-Path $root 'VERIFY_BUILD.ps1'
foreach ($path in @($wrapperPath,$verifierPath)) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw ("Missing FIX114 file: {0}" -f $path) }
}
$wrapper = Get-Content -LiteralPath $wrapperPath -Raw
$verifier = Get-Content -LiteralPath $verifierPath -Raw
$checks = @()

$invokeLine = @($wrapper -split '\r?\n' | Where-Object { $_ -match '^powershell\.exe .* -File "%VERIFY%"' })
if ($invokeLine.Count -ne 1) { throw 'VERIFY_BUILD.cmd must invoke the verifier exactly once through its quoted script path.' }
if ($invokeLine[0] -match '(?i)\s-Root\s+') { throw 'VERIFY_BUILD.cmd must not pass an explicit -Root ending with %~dp0.' }
$checks += 'Wrapper invokes VERIFY_BUILD.ps1 without a trailing-backslash Root argument'

if (-not ($verifier -match '(?s)param\s*\(\s*\[string\]\$Root\s*=\s*\$PSScriptRoot')) {
    throw 'VERIFY_BUILD.ps1 must default Root to its own $PSScriptRoot.'
}
if (-not $verifier.Contains('[IO.Path]::GetFullPath($Root)')) { throw 'Verifier must normalize the script-root path before checking outputs.' }
$checks += 'Verifier defaults to PSScriptRoot and normalizes its package root'

if (-not ($wrapper.Contains('if exist "%LOGDIR%\04-verification.log" del /q "%LOGDIR%\04-verification.log"') -and $wrapper.Contains('md "%LOGDIR%"'))) {
    throw 'Wrapper must create the log directory and clear the previous report before a new verification run.'
}
$checks += 'Previous verification report is cleared before each run to prevent stale output'

if (-not ($wrapper.Contains('if "%RC%"=="0" set "RC=3"') -and $wrapper.Contains('> "%LOGDIR%\04-verification.log" echo [FAIL] Verification report was not created by VERIFY_BUILD.ps1.') -and $wrapper.Contains('>>"%LOGDIR%\04-verification.log" echo Verifier exit code: %RC%'))) {
    throw 'Wrapper must assign a non-zero code and write a fresh failure report when PowerShell exits before creating the report.'
}
if (-not $wrapper.Contains('> "%LOGDIR%\04-verification.log" echo [FAIL] Missing verification script: %VERIFY%')) {
    throw 'Missing verifier script must also create a current diagnostic report.'
}
$checks += 'Early verifier and missing-script failures create a fresh diagnostic report with the real exit code'

$invoke = $wrapper.IndexOf($invokeLine[0], [System.StringComparison]::Ordinal)
$capture = $wrapper.IndexOf('set "RC=%ERRORLEVEL%"', [System.StringComparison]::Ordinal)
$delete = $wrapper.IndexOf('del /q "%LOGDIR%\04-verification.log"', [System.StringComparison]::Ordinal)
if (-not ($delete -ge 0 -and $delete -lt $invoke -and $capture -gt $invoke)) {
    throw 'Stale report cleanup, execution and exit-code capture are out of order.'
}
$checks += 'Report cleanup, execution and exit-code capture follow the required order'

foreach ($item in $checks) { Write-Host ('[PASS] ' + $item) }
Write-Host ("[PASS] FIX114 root-argument regression checks: {0}/{0}" -f $checks.Count)
exit 0
