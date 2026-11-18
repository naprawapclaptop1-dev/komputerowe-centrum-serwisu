$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$cmd = Get-Content -LiteralPath (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$checks = @(
    [pscustomobject]@{ Name='Default launch starts a separate persistent ComSpec /K host'; Passed=($cmd -match '(?im)^start\s+"[^"]*FIX099"\s+"%ComSpec%"\s+/d\s+/k\s+""%~f0" __KCS_KEEP_OPEN"\s*$') },
    [pscustomobject]@{ Name='Outer host runs worker in an isolated ComSpec /C process'; Passed=($cmd -match '(?im)^"%ComSpec%"\s+/d\s+/c\s+""%~f0" __KCS_WORKER"\s*$') },
    [pscustomobject]@{ Name='Worker exit code is captured immediately'; Passed=($cmd -match '(?im)^set "KCS_WORKER_RC=%ERRORLEVEL%"\s*$') },
    [pscustomobject]@{ Name='Persistent host pauses after success and failure'; Passed=($cmd -match '(?s)__KCS_KEEP_OPEN.*?KCS_WORKER_RC.*?pause\s*exit /b 0\s*:KCS_WORKER') },
    [pscustomobject]@{ Name='Worker body uses its own package folder'; Passed=($cmd.Contains('set "ROOT=%~dp0"') -and $cmd.Contains('pushd "%ROOT%"')) },
    [pscustomobject]@{ Name='Worker uses FIX099 validator'; Passed=($cmd.Contains('VALIDATE_FIX099_PACKAGE.ps1')) },
    [pscustomobject]@{ Name='Worker has explicit error handlers and returns nonzero'; Passed=($cmd.Contains(':end_fail') -and $cmd.Contains('exit /b 1')) },
    [pscustomobject]@{ Name='No early terminal close in worker'; Passed=($cmd -notmatch '(?s):KCS_WORKER.*?\bexit\s*$') }
)
$failed=0
foreach($c in $checks){if($c.Passed){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name);$failed++}}
if($failed -gt 0){throw ("$failed FIX099 keep-open checks failed.")}
Write-Host ('[PASS] FIX099 keep-open checks: '+$checks.Count+'/'+$checks.Count)
