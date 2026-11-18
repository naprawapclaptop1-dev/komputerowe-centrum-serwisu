$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$build = Get-Content -LiteralPath (Join-Path $root 'BUILD_ALL.cmd') -Raw
$worker = Get-Content -LiteralPath (Join-Path $root 'KCS_FIX101_WORKER.cmd') -Raw
$checks = @(
 [pscustomobject]@{Name='BUILD_ALL uses label-driven stage flow';Passed=($build.Contains(':source_skipped') -and $build.Contains(':portable_failed') -and $build.Contains(':modern_failed') -and $build.Contains(':verification_failed'))},
 [pscustomobject]@{Name='BUILD_ALL contains no multi-line IF parenthesis blocks';Passed=($build -notmatch '(?im)^\s*if\b.*\(\s*$')},
 [pscustomobject]@{Name='Source check can be skipped only after master launcher completed it';Passed=($build.Contains('if /i "%~2"=="/skip-source-check" goto :source_skipped'))},
 [pscustomobject]@{Name='Portable build exit code gates installer';Passed=($build.Contains('set "P_RC=%ERRORLEVEL%"') -and $build.Contains('if not "%P_RC%"=="0" goto :portable_failed'))},
 [pscustomobject]@{Name='Modern installer exit code gates output verification';Passed=($build.Contains('set "M_RC=%ERRORLEVEL%"') -and $build.Contains('if not "%M_RC%"=="0" goto :modern_failed'))},
 [pscustomobject]@{Name='Worker invokes BUILD_ALL in isolated child CMD and captures result';Passed=($worker.Contains('BUILD_ALL.cmd') -and $worker.Contains('02-build-all.log') -and $worker.Contains('set "RC=%ERRORLEVEL%"'))}
)
$failed = 0
foreach ($check in $checks) {
 if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) }
 else { Write-Host ('[FAIL] ' + $check.Name); $failed++ }
}
if ($failed -gt 0) { throw ("$failed FIX105 build-flow regression check(s) failed.") }
Write-Host ('[PASS] FIX105 build-flow checks: ' + $checks.Count + '/' + $checks.Count)
