$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'KCS_RELEASE_POLICY.ps1')
$checks = @()
function Add-Check { param([bool]$Passed,[string]$Name); $script:checks += [pscustomobject]@{Passed=$Passed;Name=$Name} }
$safePaths = @(
 'CHANGELOG.txt','CHECK_SOURCE.cmd','CHECK_FIX119_PUBLISHED_RELEASE_PRESERVATION.ps1',
 'CHECK_FIX121_PUBLIC_HTTP_TEXT.ps1','CHECK_FIX122_INSTALL_VERSION_NORMALIZATION.ps1','FIX099_POWERSHELL_MANIFEST.txt','FIX099_SOURCE_ALLOWLIST.txt',
 'FIX119_RELEASE_NOTES.txt','FIX119_MODULE_MAP.txt','FIX120_RELEASE_NOTES.txt','FIX120_MODULE_MAP.txt',
 'FIX121_RELEASE_NOTES.txt','FIX121_MODULE_MAP.txt','FIX122_RELEASE_NOTES.txt','FIX122_MODULE_MAP.txt','INSTALL_PUBLISHED_BUILD.ps1','KCS_RELEASE_POLICY.ps1',
 'PUBLISH_GITHUB_RELEASES.ps1','VALIDATE_FIX100_PACKAGE.ps1','VERIFY_GLOBAL_UPDATE_SERVER.ps1',
 'VERIFY_PUBLIC_DEPLOYMENT.ps1','website/app.js','website/index.html','website/styles.css',
 '.github/workflows/deploy-pages.yml'
)
Add-Check (Test-KcsReleaseIndependentChangeSet -Status 'ahead' -ChangedPaths $safePaths -ReportedPathCount $safePaths.Count -AssetsComplete $true -TagIsAncestor $true) 'Website, tests, release tooling and docs may reuse a complete public release'
$currentTagChanges = @('CHANGELOG.txt','CHECK_FIX117_WEBSITE_FEATURES.ps1','CHECK_FIX118_WEBSITE_REGRESSION.ps1','CHECK_FIX119_PUBLISHED_RELEASE_PRESERVATION.ps1','CHECK_FIX120_POWERSHELL_INTERPOLATION.ps1','CHECK_FIX121_PUBLIC_HTTP_TEXT.ps1','CHECK_FIX122_INSTALL_VERSION_NORMALIZATION.ps1','CHECK_SOURCE.cmd','FIX099_POWERSHELL_MANIFEST.txt','FIX099_SOURCE_ALLOWLIST.txt','FIX117_MODULE_MAP.txt','FIX117_RELEASE_NOTES.txt','FIX118_MODULE_MAP.txt','FIX118_RELEASE_NOTES.txt','FIX119_MODULE_MAP.txt','FIX119_RELEASE_NOTES.txt','FIX120_MODULE_MAP.txt','FIX120_RELEASE_NOTES.txt','FIX121_MODULE_MAP.txt','FIX121_RELEASE_NOTES.txt','FIX122_MODULE_MAP.txt','FIX122_RELEASE_NOTES.txt','INSTALL_PUBLISHED_BUILD.ps1','KCS_RELEASE_POLICY.ps1','PUBLISH_GITHUB_RELEASES.ps1','VALIDATE_FIX100_PACKAGE.ps1','VERIFY_GLOBAL_UPDATE_SERVER.ps1','VERIFY_PUBLIC_DEPLOYMENT.ps1','website/app.js','website/index.html','website/styles.css')
Add-Check (Test-KcsReleaseIndependentChangeSet -Status 'ahead' -ChangedPaths $currentTagChanges -ReportedPathCount $currentTagChanges.Count -AssetsComplete $true -TagIsAncestor $true) 'Actual FIX117/FIX118/FIX119/FIX120/FIX121/FIX122 changes since v1.0.0.69 are classified as release-independent'
Add-Check (-not (Test-KcsReleaseIndependentChangeSet -Status 'ahead' -ChangedPaths @('WindowsVersionSwitcherPRO.cs') -ReportedPathCount 1 -AssetsComplete $true -TagIsAncestor $true)) 'Application C# changes cannot reuse an old public release'
Add-Check (-not (Test-KcsReleaseIndependentChangeSet -Status 'ahead' -ChangedPaths @('SETUP_MODERN.iss') -ReportedPathCount 1 -AssetsComplete $true -TagIsAncestor $true)) 'Installer recipe changes cannot reuse an old public release'
Add-Check (-not (Test-KcsReleaseIndependentChangeSet -Status 'ahead' -ChangedPaths @('NaprawaPC.ico') -ReportedPathCount 1 -AssetsComplete $true -TagIsAncestor $true)) 'Application resource changes cannot reuse an old public release'
Add-Check (-not (Test-KcsReleaseIndependentChangeSet -Status 'diverged' -ChangedPaths @() -ReportedPathCount 0 -AssetsComplete $true -TagIsAncestor $false)) 'Diverged history fails closed'
Add-Check (-not (Test-KcsReleaseIndependentChangeSet -Status 'ahead' -ChangedPaths @('website/app.js') -ReportedPathCount 1 -AssetsComplete $false -TagIsAncestor $true)) 'Incomplete public release asset set fails closed'
Add-Check (-not (Test-KcsReleaseIndependentChangeSet -Status 'ahead' -ChangedPaths @('website/app.js') -ReportedPathCount 300 -AssetsComplete $true -TagIsAncestor $true)) 'Potentially truncated GitHub comparison fails closed'
Add-Check (-not (Test-KcsReleaseIndependentChangeSet -Status 'ahead' -ChangedPaths @('unknown.bin') -ReportedPathCount 1 -AssetsComplete $true -TagIsAncestor $true)) 'Unknown changed files fail closed'
$xmlBytes=[Text.Encoding]::UTF8.GetBytes('<?xml version="1.0" encoding="utf-8"?><Update version="1.0.0.69" />')
$xmlText=ConvertTo-KcsResponseText -Content $xmlBytes
$xmlDoc=[xml]$xmlText
Add-Check ($xmlDoc.DocumentElement.Name -eq 'Update' -and $xmlDoc.DocumentElement.GetAttribute('version') -eq '1.0.0.69') 'PowerShell 5.1 byte-array HTTP content is decoded as UTF-8 before XML parsing'
$sumBytes=[Text.Encoding]::UTF8.GetBytes(('a'*64)+'  package.exe')
$sumText=ConvertTo-KcsResponseText -Content $sumBytes
Add-Check ($sumText.Contains('package.exe') -and $sumText.Contains(('a'*64))) 'Byte-array checksum response is decoded as UTF-8 text'
$publisher=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'PUBLISH_GITHUB_RELEASES.ps1') -Raw -Encoding UTF8
$globalVerifier=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'VERIFY_GLOBAL_UPDATE_SERVER.ps1') -Raw -Encoding UTF8
Add-Check ($publisher.Contains('compare/$Tag...') -and $publisher.Contains('Test-KcsReleaseIndependentChangeSet') -and $publisher.Contains('$reusePublishedRelease')) 'Publisher classifies changes against the published tag before reusing assets'
Add-Check ($publisher.Contains('Nie modyfikuję publicznego wydania') -and $publisher -notmatch 'release upload.*--clobber' -and $publisher -notmatch 'release delete-asset') 'Public release assets are never deleted or clobbered'
Add-Check ($publisher.Contains('$publicMissing.Count -gt 0') -and $publisher.Contains('$releaseInfo.isDraft') -and $publisher.Contains('$compare.base_commit.sha')) 'Missing assets, draft state and tag ancestry are checked before reusing a public release'
Add-Check ($publisher.Contains('$Version="1.0.0.69"') -and $publisher.Contains('$Tag="v$Version"')) 'Product version and public release tag remain unchanged'
Add-Check ($globalVerifier.Contains('ConvertTo-KcsResponseText -Content $manifest.Content') -and $globalVerifier.Contains('ConvertTo-KcsResponseText -Content $sumResponse.Content')) 'Global verifier uses safe response decoding for XML and checksums'
$failed=@($checks | Where-Object {-not $_.Passed})
foreach($c in $checks){if($c.Passed){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name)}}
if($failed.Count){Write-Host ('[FAIL] FIX119 release preservation: '+(($failed | ForEach-Object {$_.Name}) -join '; '));exit 1}
Write-Host ('[PASS] FIX119 published-release preservation checks: '+$checks.Count+'/'+$checks.Count)
exit 0
