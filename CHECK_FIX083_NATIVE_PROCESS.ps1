$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$source=Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$release=Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw
$checks=@()
$checks += [pscustomobject]@{Passed=[bool]$source.Contains('function ConvertTo-NativeCommandLine');Name='Source publisher has Windows argument quoting helper'}
$checks += [pscustomobject]@{Passed=[bool]($source.Contains('$process.StandardOutput.ReadToEndAsync()') -and $source.Contains('$process.StandardError.ReadToEndAsync()'));Name='Captured process streams are drained asynchronously'}
$checks += [pscustomobject]@{Passed=[bool]($source.Contains('$startInfo.RedirectStandardOutput=$false') -and $source.Contains('$startInfo.RedirectStandardError=$false'));Name='Interactive process inherits stdout/stderr for device-code visibility'}
$checks += [pscustomobject]@{Passed=[bool]($source.Contains('$process.WaitForExit()') -and $source.Contains('$process.ExitCode'));Name='Native process waits and returns the real exit code'}
$checks += [pscustomobject]@{Passed=[bool]($source.Contains('auth","login","--web') -and $source.Contains('auth","status","--hostname","github.com'));Name='Login is attempted and auth status is checked afterward'}
$checks += [pscustomobject]@{Passed=[bool]($release.Contains('function Invoke-GhCapture') -and $release.Contains('System.Diagnostics.ProcessStartInfo'));Name='Release publisher uses the PowerShell 5.1-safe process runner'}
$checks += [pscustomobject]@{Passed=[bool]($source -notmatch '(?m)^\s*& \$Executable' -and $release -notmatch '(?m)^\s*& \$Executable');Name='No direct PowerShell invocation operator remains in native wrappers'}
$failed=0
foreach($check in $checks){if($check.Passed){Write-Host ('[PASS] '+$check.Name)}else{Write-Host ('[FAIL] '+$check.Name);$failed++}}
if($failed -gt 0){throw ($failed.ToString()+' FIX083 native process tests failed.')}
Write-Host ('[PASS] FIX083 native process tests: '+$checks.Count+'/'+$checks.Count)
