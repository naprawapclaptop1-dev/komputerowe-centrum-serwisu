$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$repo='naprawapclaptop1-dev/komputerowe-centrum-serwisu'
$required=@(
 'URUCHOM_TYLKO_TEN_PLIK.cmd','PUBLISH_GITHUB_SOURCE.ps1','PUBLISH_GITHUB_RELEASES.ps1',
 'VERIFY_PUBLIC_DEPLOYMENT.ps1','INSTALL_PUBLISHED_BUILD.ps1','website/index.html','website/styles.css',
 'website/app.js','website/media/prezentacja.mp4','website/media/prezentacja.vtt',
 'website/media/prezentacja-en.vtt','website/media/centrum-serwisu.png',
 '.github/workflows/deploy-pages.yml','README.md','FIX075_RELEASE_NOTES.txt','FIX075_MODULE_MAP.txt'
)
$failed=0
foreach($rel in $required){$p=Join-Path $root $rel;if((Test-Path -LiteralPath $p -PathType Leaf) -and ((Get-Item -LiteralPath $p).Length -gt 0)){Write-Host "[PASS] $rel"}else{Write-Host "[FAIL] $rel";$failed++}}
$html=Get-Content (Join-Path $root 'website/index.html') -Raw
$js=Get-Content (Join-Path $root 'website/app.js') -Raw
$css=Get-Content (Join-Path $root 'website/styles.css') -Raw
$cmd=Get-Content (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$source=Get-Content (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$pub=Get-Content (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw
$verify=Get-Content (Join-Path $root 'VERIFY_PUBLIC_DEPLOYMENT.ps1') -Raw
$workflow=Get-Content (Join-Path $root '.github/workflows/deploy-pages.yml') -Raw
$checks=@(
 @($cmd.Contains($repo) -and $cmd.Contains('BUILD_ALL.cmd') -and $cmd.Contains('PUBLISH_GITHUB_SOURCE.ps1') -and $cmd.Contains('PUBLISH_GITHUB_RELEASES.ps1') -and $cmd.Contains('VERIFY_PUBLIC_DEPLOYMENT.ps1') -and $cmd.Contains('INSTALL_PUBLISHED_BUILD.ps1'),'Single CMD pins repo and runs all stages in order'),
 @($cmd.IndexOf('PUBLISH_GITHUB_SOURCE.ps1') -lt $cmd.IndexOf('BUILD_ALL.cmd') -and $cmd.IndexOf('BUILD_ALL.cmd') -lt $cmd.IndexOf('PUBLISH_GITHUB_RELEASES.ps1') -and $cmd.IndexOf('PUBLISH_GITHUB_RELEASES.ps1') -lt $cmd.IndexOf('VERIFY_PUBLIC_DEPLOYMENT.ps1') -and $cmd.IndexOf('VERIFY_PUBLIC_DEPLOYMENT.ps1') -lt $cmd.IndexOf('INSTALL_PUBLISHED_BUILD.ps1'),'Source/site -> build -> release -> online verification -> install order'),
 @($cmd -notmatch '(?im)^\s*set\s+/p\s|Read-Host|Podaj publiczne repozytorium','No interactive repo URL prompt'),
 @($cmd.Contains('01-github-source-sync-and-pages.log') -and $cmd.Contains('Get-Content') -and $cmd.Contains('Tail 100'),'Main CMD prints detailed source synchronization error to screen'),
 @($html.Contains('application-fix" content="FIX075') -and $html.Contains('data-pl') -and $html.Contains('data-en'),'Website has FIX075 marker and Polish/English versions'),
 @($html.Contains('isAccessibleForFree') -and $html.Contains('price":"0"') -and $html.Contains('Pobierz'),'Website is marked free and has download area'),
 @($html.Contains('prezentacja.mp4') -and $html.Contains('prezentacja.vtt') -and $html.Contains('ZOBACZ, DO CZEGO SŁUŻY'),'Website has original presentation video and captions'),
 @($js.Contains('releases/latest') -and $js.Contains('KomputeroweCentrumSerwisu_FIX071_INSTALATOR.exe') -and $js.Contains('KomputeroweCentrumSerwisu_FIX071_PORTABLE.exe') -and $js.Contains('SHA256SUMS.txt'),'Website activates real installer/portable/checksum links from published release'),
 @($js.Contains('response.status === 404') -and $js.Contains('warning') -and $js.Contains('disableDownloads'),'Site handles first release not yet published without a dead download button'),
 @($workflow.Contains('pages: write') -and $workflow.Contains('id-token: write') -and $workflow.Contains('actions/deploy-pages@v4'),'Free GitHub Pages workflow is configured'),
 @($source.Contains('git.exe') -and $source.Contains('permissions.push') -and $source.Contains('rebase') -and $source.Contains('origin/$Branch') -and $source.Contains('workflow","run","deploy-pages.yml') -and $source.Contains('FIX078'),'Source publisher checks push permission, diagnoses Git and retries safe branch conflict'),
 @($pub.Contains('manifest-stable.xml') -and $pub.Contains('manifest-beta.xml') -and $pub.Contains('releases.json') -and $pub.Contains('SHA256SUMS.txt') -and $pub.Contains('release","create'),'Publisher creates first public release with both manifests and hashes'),
 @($pub -notmatch '--clobber' -and $pub.Contains('release","download",$Tag') -and $pub.Contains('Get-FileHash'),'Publisher never overwrites release assets and checks existing asset hashes'),
 @($verify.Contains('/releases/latest/download/') -and $verify.Contains('prezentacja.mp4') -and $verify.Contains('HTTP 200') -and $verify.Contains('SHA256SUMS.txt'),'Final online verifier checks latest manifests, EXE, checksums and website assets'),
 @($css.Contains('.release-status.warning') -and $css.Contains('.release-extra'),'Website has accessible download status/checksum presentation')
)
foreach($c in $checks){if($c[0]){Write-Host "[PASS] $($c[1])"}else{Write-Host "[FAIL] $($c[1])";$failed++}}
if($failed){throw "$failed FIX074 regression checks failed."}
Write-Host "[PASS] FIX074 regression checks: $($required.Count + $checks.Count)/$($required.Count + $checks.Count)"
