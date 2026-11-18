$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$modules=Get-Content (Join-Path $root 'WindowsVersionSwitcherPRO.Modules.cs') -Raw
$verify=Get-Content (Join-Path $root 'VERIFY_GLOBAL_UPDATE_SERVER.ps1') -Raw
$public=Get-Content (Join-Path $root 'VERIFY_PUBLIC_DEPLOYMENT.ps1') -Raw
$checks=@(
 [pscustomobject]@{Passed=($modules.Contains('releases/download/v"+ProgramVersion+"/') -and $modules -notmatch 'releases/latest/download/');Name='Desktop client uses immutable product-tag asset URLs'},
 [pscustomobject]@{Passed=($modules.Contains('/releases/tags/v"+ProgramVersion') -and $modules.Contains('manifest-beta.xml') -and $modules.Contains('manifest-stable.xml'));Name='Online diagnostic checks the exact product release and both channel assets'},
 [pscustomobject]@{Passed=($verify.Contains('/releases/tags/$expectedTag') -and $verify.Contains('releases/download/$expectedTag/$manifestName') -and $verify -notmatch 'releases/latest/download');Name='Release verifier checks tag-specific manifests'},
 [pscustomobject]@{Passed=($public.Contains('/releases/tags/$Tag') -and $public -notmatch 'releases/latest/download');Name='Public deployment verifier uses exact product tag'}
)
$failed=$false;foreach($c in $checks){if($c.Passed){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name);$failed=$true}}
if($failed){exit 1};Write-Host '[PASS] FIX107 updater endpoint regression.';exit 0
