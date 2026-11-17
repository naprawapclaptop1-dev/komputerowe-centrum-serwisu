$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$source=Get-Content (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$cmd=Get-Content (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$marker=Get-Content (Join-Path $root 'FIX077_PACKAGE_MARKER.txt') -Raw
$checks=@(
 @($source.Contains('2> $stderrFile') -and $source -notmatch '2>&1 \| Out-String','Native command stderr is redirected to a physical file; no 2>&1 error-record pipeline'),
 @((Get-Content (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw).Contains('2> $stderrFile') -and (Get-Content (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw) -notmatch '2>&1 \| Out-String','Release publisher uses the same PowerShell 5.1 stderr-safe wrapper'),
 @($source.Contains('2> $stderrFile') -and $source.Contains('Invoke-NativeInteractive'),'Interactive auth preserves live stdout and redirects stderr safely'),
 @($source.Contains('KOMPUTEROWE_CENTRUM_SERWISU_FIX077') -and $source.Contains('activeFolder'),'PowerShell publisher refuses a mismatched/old active directory'),
 @($cmd.Contains('ACTIVE_FOLDER') -and $cmd.Contains('KOMPUTEROWE_CENTRUM_SERWISU_FIX077') -and $cmd.Contains('FIX077_PACKAGE_MARKER.txt'),'Single CMD refuses to run from FIX057 or another stale folder'),
 @($cmd.Contains('github.com/login/device') -and $cmd.Contains('Nie zamykaj okna CMD'),'Main CMD explains device flow and that it waits for authorization'),
 @($marker.Contains('PACKAGE=FIX077') -and $marker.Contains('EXPECTED_FOLDER=KOMPUTEROWE_CENTRUM_SERWISU_FIX077'),'Package marker binds FIX077 to expected folder'),
 @($cmd.Contains('PUBLISH_GITHUB_SOURCE.ps1') -and $cmd.Contains('BUILD_ALL.cmd') -and $cmd.Contains('PUBLISH_GITHUB_RELEASES.ps1') -and $cmd.Contains('VERIFY_PUBLIC_DEPLOYMENT.ps1') -and $cmd.Contains('INSTALL_PUBLISHED_BUILD.ps1'),'One main CMD retains the complete publication/build/install sequence')
)
$failed=0
foreach($c in $checks){if($c[0]){Write-Host "[PASS] $($c[1])"}else{Write-Host "[FAIL] $($c[1])";$failed++}}
if($failed){throw "$failed FIX077 auth/root checks failed."}
Write-Host "[PASS] FIX077 checks: $($checks.Count)/$($checks.Count)"
