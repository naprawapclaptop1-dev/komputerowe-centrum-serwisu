$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$source=Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$release=Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw
$checks=@(
 @($source.Contains('function ConvertTo-NativeCommandLine'),'Source publisher has Windows argument quoting helper'),
 @($source.Contains('$process.StandardOutput.ReadToEndAsync()') -and $source.Contains('$process.StandardError.ReadToEndAsync()'),'Captured process streams are drained asynchronously'),
 @($source.Contains('$startInfo.RedirectStandardOutput=$false') -and $source.Contains('$startInfo.RedirectStandardError=$false'),'Interactive process inherits stdout/stderr for device code visibility'),
 @($source.Contains('$process.WaitForExit()') -and $source.Contains('$process.ExitCode'),'Native process waits and returns real exit code'),
 @($source.Contains('auth","login","--web') -and $source.Contains('auth","status","--hostname","github.com'),'Login is attempted and auth status is checked afterward'),
 @($release.Contains('function ConvertTo-NativeCommandLine') -and $release.Contains('System.Diagnostics.ProcessStartInfo'),'Release publisher uses the same PowerShell 5.1-safe process runner'),
 @($source -notmatch '(?m)^\s*& \$Executable' -and $release -notmatch '(?m)^\s*& \$Executable','No direct PowerShell invocation operator remains in native wrappers')
)
$failed=0
foreach($check in $checks){if($check[0]){Write-Host ('[PASS] '+$check[1])}else{Write-Host ('[FAIL] '+$check[1]);$failed++}}
if($failed -gt 0){throw ($failed.ToString()+' FIX083 native process tests failed.')}
Write-Host ('[PASS] FIX083 native process tests: '+$checks.Count+'/'+$checks.Count)
