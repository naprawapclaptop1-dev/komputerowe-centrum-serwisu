$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$worker=Get-Content -LiteralPath (Join-Path $root 'KCS_FIX101_WORKER.cmd') -Raw
$publisher=Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$allowlist=Get-Content -LiteralPath (Join-Path $root 'FIX099_SOURCE_ALLOWLIST.txt')
$cleanup=Get-Content -LiteralPath (Join-Path $root 'CHECK_FIX100_CLEANUP_PATH.ps1') -Raw
$checks=@(
 [pscustomobject]@{Name='Tool PATH parsing is checked in the worker after bootstrap';Passed=($worker -match 'if defined GH_EXE for %%G' -and $worker -match 'if defined GIT_EXE for %%G')},
 [pscustomobject]@{Name='Worker runs cleanup before bootstrap';Passed=($worker.IndexOf('CLEAN_SAFE_TEMP.ps1') -lt $worker.IndexOf('BOOTSTRAP_BUILD_TOOLS.ps1'))},
 [pscustomobject]@{Name='Cleanup regression inspects the worker that actually runs cleanup';Passed=($cleanup.Contains('$worker=Get-Content') -and $cleanup.Contains('$worker.Contains'))},
 [pscustomobject]@{Name='Publisher removes only tracked .tools from temporary clone index';Passed=($publisher.Contains('"rm","-r","--cached","--ignore-unmatch",".tools"'))},
 [pscustomobject]@{Name='Publisher remains explicit-allowlist only';Passed=($publisher.Contains('FIX099_SOURCE_ALLOWLIST.txt') -and $publisher -notmatch '(?i)robocopy|git add -A')},
 [pscustomobject]@{Name='Local .tools cache is absent from source allowlist';Passed=($allowlist -notmatch '(?im)^\.tools(?:/|$)')}
)
$failed=0;foreach($c in $checks){if($c.Passed){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name);$failed++}}
if($failed){throw ("$failed FIX102 source-gate regression check(s) failed.")}
Write-Host ('[PASS] FIX102 source-gate checks: '+$checks.Count+'/'+$checks.Count)
