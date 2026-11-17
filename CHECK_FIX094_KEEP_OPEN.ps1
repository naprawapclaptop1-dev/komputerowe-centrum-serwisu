$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$cmd = Get-Content -LiteralPath (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$checks = @(
    [pscustomobject]@{ Name='Default launch starts a separate persistent ComSpec /K host'; Passed=($cmd -match '(?im)^start\s+"[^"]*FIX094"\s+"%ComSpec%"\s+/d\s+/k\s+""%~f0" __KCS_KEEP_OPEN"\s*$') },
    [pscustomobject]@{ Name='Outer host runs worker in an isolated ComSpec /C process'; Passed=($cmd -match '(?im)^"%ComSpec%"\s+/d\s+/c\s+""%~f0" __KCS_WORKER"\s*$') },
    [pscustomobject]@{ Name='Worker exit code is captured immediately'; Passed=($cmd -match '(?im)^set "KCS_WORKER_RC=%ERRORLEVEL%"\s*$') },
    [pscustomobject]@{ Name='Persistent host pauses after both success and failure'; Passed=($cmd -match '(?s)__KCS_KEEP_OPEN.*?KCS_WORKER_RC.*?pause\s*exit /b 0\s*:KCS_WORKER') },
    [pscustomobject]@{ Name='Unexpected worker exit cannot terminate outer /K host'; Passed=($cmd.Contains('/d /k') -and $cmd.Contains('/d /c') -and $cmd.Contains('__KCS_KEEP_OPEN') -and $cmd.Contains('__KCS_WORKER')) },
    [pscustomobject]@{ Name='Worker body retains normal package root discovery'; Passed=($cmd.Contains('set "ROOT=%~dp0"') -and $cmd.Contains('pushd "%ROOT%"')) },
    [pscustomobject]@{ Name='Worker invokes the FIX094 validator'; Passed=($cmd.Contains('VALIDATE_FIX094_PACKAGE.ps1')) },
    [pscustomobject]@{ Name='Worker no longer owns terminal pause'; Passed=($cmd -notmatch '(?s):KCS_WORKER.*?pause\s*popd\s*exit /b 1') }
)
$failed = 0
foreach ($check in $checks) {
    if ($check.Passed) { Write-Host ('[PASS] ' + $check.Name) }
    else { Write-Host ('[FAIL] ' + $check.Name); $failed++ }
}
if ($failed -gt 0) { throw ("$failed FIX094 keep-open checks failed.") }
Write-Host ('[PASS] FIX094 keep-open checks: ' + $checks.Count + '/' + $checks.Count)
