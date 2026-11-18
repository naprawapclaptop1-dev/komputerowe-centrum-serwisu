$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$worker=Get-Content -LiteralPath (Join-Path $root 'KCS_FIX101_WORKER.cmd') -Raw
$pipeline=Get-Content -LiteralPath (Join-Path $root 'CHECK_FIX100_PIPELINE.ps1') -Raw
$checks=@(
 [pscustomobject]@{Name='BUILD_ALL is isolated in a child ComSpec process';Passed=($worker -match '(?im)^"%ComSpec%" /d /c ""%ROOT%BUILD_ALL\.cmd" /nopause /skip-source-check"')},
 [pscustomobject]@{Name='Build output is captured in a dedicated stage log';Passed=($worker.Contains('02-build-all.log') -and $worker.Contains('>"%BUILD_LOG%" 2>&1'))},
 [pscustomobject]@{Name='Build output is visible and appended to the main log';Passed=($worker.Contains('type "%BUILD_LOG%"') -and $worker.Contains('type "%BUILD_LOG%" >>"%LOG%"'))},
 [pscustomobject]@{Name='Worker checks the child process exit code before advancing';Passed=($worker.Contains('set "RC=%ERRORLEVEL%"') -and $worker.Contains('if not "%RC%"=="0" goto :build_fail'))},
 [pscustomobject]@{Name='Pipeline regression test protects the isolated build invocation';Passed=($pipeline.Contains('isolated child CMD') -and $pipeline.Contains('02-build-all.log'))}
)
$failed=0;foreach($c in $checks){if($c.Passed){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name);$failed++}}
if($failed){throw ("$failed FIX104 build-isolation checks failed.")}
Write-Host ('[PASS] FIX104 build isolation checks: '+$checks.Count+'/'+$checks.Count)
