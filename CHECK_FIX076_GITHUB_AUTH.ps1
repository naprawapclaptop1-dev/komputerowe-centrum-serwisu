$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$source=Get-Content (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$release=Get-Content (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw
$cmd=Get-Content (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$workflow=Get-Content (Join-Path $root '.github/workflows/deploy-pages.yml') -Raw
$checks=@(
 @($source.Contains('function ConvertTo-NativeCommandLine') -and $source.Contains('System.Diagnostics.ProcessStartInfo') -and $source.Contains('ReadToEndAsync') -and $source.Contains('RedirectStandardError=$true'),'Source publisher captures native stdout/stderr with .NET Process; no PowerShell native stderr conversion'),
 @($source.Contains('function Invoke-NativeInteractive') -and $source.Contains('RedirectStandardOutput=$false') -and $source.Contains('RedirectStandardError=$false') -and $source.Contains('auth","login","--web'),'Source publisher runs visible interactive browser/device login inheriting the console'),
 @($source.Contains('auth","status","--hostname","github.com') -and $source.Contains('authResult.ExitCode') -and $source.Contains('Po zakończeniu logowania'),'Authentication is rechecked after gh auth login returns'),
 @($source.Contains('auth","setup-git","--hostname","github.com'),'Git HTTPS credential integration is configured after login'),
 @($source.Contains('permissions.push') -and $source.Contains('viewerPermission'),'Repository write permission is verified after login'),
 @($source.Contains('Invoke-NativeInteractive -Executable $robocopy.Source') -and $source.Contains('roboCode -ge 8'),'Robocopy exit codes are captured without PowerShell native stderr handling'),
 @($release.Contains('function Invoke-GhCapture') -and $release.Contains('System.Diagnostics.ProcessStartInfo') -and $release.Contains('authCheck.ExitCode') -and $release.Contains('verifyStable.ExitCode') -and $release -notmatch '(?m)^\s*& \$GhPath\s','Release publisher uses ProcessStartInfo for native commands'),
 @($cmd.Contains('FIX083_PACKAGE_MARKER.txt') -and $cmd.Contains('Folder aktywnego pakietu'),'Main CMD checks the FIX083 package validator and prints active folder'),
 @($workflow.Contains('actions/checkout@v7'),'GitHub Pages workflow uses checkout v7 action'),
 @($cmd.Contains('automat sam otworzy logowanie GitHub'),'Main CMD explains one-time browser authorization'),
 @($cmd -notmatch 'PUBLISH_GITHUB_SOURCE\.ps1.*>>' -and $cmd.Contains('PUBLISH_GITHUB_SOURCE.ps1'),'Main CMD does not hide device-login output behind log redirection'),
 @($source -match 'FIX083 source sync' -and $cmd.Contains('FIX083'),'Active package identifies itself as FIX083')
)
$failed=0
foreach($check in $checks){if($check[0]){Write-Host "[PASS] $($check[1])"}else{Write-Host "[FAIL] $($check[1])";$failed++}}
if($failed -gt 0){throw "$failed GitHub authentication / native process regression checks failed."}
Write-Host "[PASS] GitHub authentication / native process tests: $($checks.Count)/$($checks.Count)"
