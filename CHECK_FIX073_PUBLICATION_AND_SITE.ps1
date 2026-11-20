$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$required=@('website/index.html','website/styles.css','website/app.js','website/media/prezentacja.mp4','website/media/prezentacja.vtt','website/media/prezentacja-en.vtt','website/sitemap.xml','website/robots.txt','.github/workflows/deploy-pages.yml','PUBLISH_GITHUB_SOURCE.ps1','PUBLISH_GITHUB_RELEASES.ps1','VERIFY_GLOBAL_UPDATE_SERVER.ps1','FIX073_RELEASE_NOTES.txt','FIX073_MODULE_MAP.txt')
$failed=0
foreach($rel in $required){$path=Join-Path $root $rel;if(Test-Path -LiteralPath $path -PathType Leaf){$item=Get-Item -LiteralPath $path;if($item.Length -gt 0){Write-Host "[PASS] $rel"}else{Write-Host "[FAIL] Empty: $rel";$failed++}}else{Write-Host "[FAIL] Missing: $rel";$failed++}}
$html=Get-Content (Join-Path $root 'website/index.html') -Raw
$js=Get-Content (Join-Path $root 'website/app.js') -Raw
$workflow=Get-Content (Join-Path $root '.github/workflows/deploy-pages.yml') -Raw
$source=Get-Content (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$pub=Get-Content (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw
$verify=Get-Content (Join-Path $root 'VERIFY_GLOBAL_UPDATE_SERVER.ps1') -Raw
$modules=Get-Content (Join-Path $root 'WindowsVersionSwitcherPRO.Modules.cs') -Raw
$checks=@(
 @($html.Contains('data-pl') -and $html.Contains('data-en') -and $html.Contains('application-fix'),'Website includes Polish and English content'),
 @($html.Contains('prezentacja.mp4') -and $html.Contains('prezentacja.vtt') -and $js.Contains('prezentacja-en.vtt'),'Website includes an accessible video player with captions'),
 @($html.Contains('offers') -and $html.Contains('price') -and $html.Contains('0'),'Structured metadata marks the software as free'),
 @($html.Contains('Pobierz') -and $html.Contains('Do czego') -or $html.Contains('CO ZNAJDZIESZ W PROGRAMIE'),'Website explains product purpose and functions'),
 @($js.Contains('/releases/latest') -and $js.Contains('KomputeroweCentrumSerwisu_FIX071_INSTALATOR.exe') -and $js.Contains('KomputeroweCentrumSerwisu_FIX071_PORTABLE.exe'),'Website gets official installer and portable assets dynamically'),
 @($workflow.Contains('pages: write') -and $workflow.Contains('id-token: write') -and $workflow.Contains('actions/deploy-pages@v4'),'GitHub Pages workflow deploys the website'),
 @($source.Contains('auth","refresh') -and $source.Contains('workflow","run","deploy-pages.yml') -and $source.Contains('Invoke-NativeCapture') -and $source.Contains('PAGES_DEPLOYMENT.status') -and $source.Contains('FIX078'),'One CMD configures, deploys and verifies Pages'),
 @($pub.Contains('KomputeroweCentrumSerwisu_FIX071_PORTABLE.exe') -and $pub.Contains('SHA256SUMS.txt') -and $pub.Contains('$catalog=@(') -and $pub.Contains('ConvertFrom-Json') -and $pub.Contains('musi być tablicą dwóch wpisów') -and $pub.Contains('signatureStatus'),'Release publishes installer, portable build and SHA256SUMS'),
 @($pub.Contains('--draft') -and $pub.Contains('--draft=false') -and $pub -notmatch '--clobber','Release assets are staged as draft and published without clobber'),
 @($verify.Contains('/releases/latest/download/') -and $verify.Contains('Method Head') -and $verify.Contains('SHA256SUMS.txt'),'Verification checks latest manifest, package links and checksums'),
 @($modules.Contains('manifest-beta.xml') -and $modules.Contains('SHA256SUMS.txt') -and $modules.Contains('PORTABLE'),'App checks all public release assets'),
 @($modules.Contains('PIERWSZE WYDANIE NIE JEST JESZCZE PUBLICZNE'),'App explains first-release-not-published state')
)
foreach($c in $checks){if($c[0]){Write-Host "[PASS] $($c[1])" -ForegroundColor Green}else{Write-Host "[FAIL] $($c[1])" -ForegroundColor Red;$failed++}}
if($failed){throw "$failed FIX073 checks failed."};Write-Host "[PASS] FIX073 static checks: $($required.Count + $checks.Count)/$($required.Count + $checks.Count)"
