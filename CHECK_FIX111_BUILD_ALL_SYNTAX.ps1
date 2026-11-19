$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$build = Get-Content -LiteralPath (Join-Path $root 'BUILD_ALL.cmd') -Raw
$checks = @(
    [pscustomobject]@{ Name = 'BUILD_ALL has no multi-line IF parenthesis blocks'; Passed = ($build -notmatch '(?im)^\s*if\b.*\(\s*$') },
    [pscustomobject]@{ Name = 'Verification detail log is printed through label flow'; Passed = ($build.Contains('if not exist "%LOGDIR%\04-verification.log" goto :verification_detail_done') -and $build.Contains(':verification_detail_done')) },
    [pscustomobject]@{ Name = 'Verification exit code still gates failure'; Passed = ($build.Contains('if not "%V_RC%"=="0" goto :verification_failed')) },
    [pscustomobject]@{ Name = 'FIX105 label-driven stages remain present'; Passed = ($build.Contains(':source_skipped') -and $build.Contains(':portable_failed') -and $build.Contains(':modern_failed') -and $build.Contains(':verification_failed')) }
)
$failed = 0
foreach ($check in $checks) {
    if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) }
    else { Write-Host ('[FAIL] ' + $check.Name); $failed++ }
}
if ($failed -gt 0) { throw ("$failed FIX111 BUILD_ALL syntax check(s) failed.") }
Write-Host ('[PASS] FIX111 BUILD_ALL syntax checks: ' + $checks.Count + '/' + $checks.Count)
