$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$modules=Get-Content (Join-Path $root 'WindowsVersionSwitcherPRO.Modules.cs') -Raw
$cmd=Get-Content (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$pub=Get-Content (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw
$verify=Get-Content (Join-Path $root 'VERIFY_GLOBAL_UPDATE_SERVER.ps1') -Raw
$generate=Get-Content (Join-Path $root 'GENERATE_UPDATE_MANIFEST.ps1') -Raw
$boot=Get-Content (Join-Path $root 'BOOTSTRAP_BUILD_TOOLS.ps1') -Raw
$sourceSync=Get-Content (Join-Path $root 'PUBLISH_GITHUB_SOURCE.ps1') -Raw
$install=Get-Content (Join-Path $root 'INSTALL_PUBLISHED_BUILD.ps1') -Raw
$files=@('BOOTSTRAP_BUILD_TOOLS.ps1','PUBLISH_GITHUB_SOURCE.ps1','INSTALL_PUBLISHED_BUILD.ps1','GITHUB_REPOSITORY.txt.template','FIX072_RELEASE_NOTES.txt','FIX073_RELEASE_NOTES.txt','FIX073_MODULE_MAP.txt','CHECK_FIX073_PUBLICATION_AND_SITE.ps1')
$checks=@(
 @($cmd.Contains('set "GHREPO=naprawapclaptop1-dev/komputerowe-centrum-serwisu"') -and $cmd.Contains('BOOTSTRAP_BUILD_TOOLS.ps1') -and $cmd.Contains('BUILD_ALL.cmd') -and $cmd.Contains('PUBLISH_GITHUB_SOURCE.ps1') -and $cmd.Contains('PUBLISH_GITHUB_RELEASES.ps1') -and $cmd.Contains('INSTALL_PUBLISHED_BUILD.ps1') -and $cmd.Contains('[0/5]'),'One CMD automatically bootstraps, builds, publishes and installs'),
 @($cmd -notmatch 'set /p|Read-Host|Podaj publiczne repozytorium','No manual repository prompt'),
 @($modules.Contains('https://github.com/"+repo+"/releases/latest/download/') -and $modules -notmatch 'kcs-rj2026-updates\.pages\.dev','Application update URL uses GitHub Releases, not Cloudflare Pages'),
 @($modules -match 'MONITORING AKTUALIZACJI.*GITHUB API' -and $modules -notmatch 'CLOUDFLARE|PAGES FUNCTION|binding R2','Updater diagnostics no longer mention Cloudflare Pages/R2'),
 @($verify.Contains('https://api.github.com/repos/$Repo/releases/latest') -and $verify.Contains('manifest-stable.xml'),'Public verification uses GitHub Releases API'),
 @($generate.Contains('https://github.com/$Repo/releases/download/$Tag/') -and $generate -notmatch 'pages\.dev','Manifest generator uses tag-specific GitHub release URLs'),
 @($boot.Contains('GitHub.cli') -and $boot.Contains('Git.Git') -and $boot.Contains('JRSoftware.InnoSetup.7'),'Required build tools are auto-installed through WinGet'),
 @($sourceSync.Contains('Arguments @("clone","--branch"') -and $sourceSync.Contains('Arguments @("-C",$Temp,"push","origin","HEAD:refs/heads/$Branch")') -and $sourceSync.Contains('POLITYKA_PUBLIKACJI.md') -and $sourceSync.Contains('auth","login","--web') -and $sourceSync.Contains('Invoke-NativeCapture') -and $sourceSync.Contains('Add-Content -LiteralPath $gitIgnore'),'Source code sync authenticates once and preserves repository docs and ignore rules'),
 @($install -notmatch '/VERYSILENT|/SILENT|/SUPPRESSMSGBOXES' -and $install.Contains('/NORESTART') -and $install.Contains('/SP-') -and $install.Contains('Start-Process') -and $install.Contains('-Verb RunAs') -and $install.Contains('-Wait'),'Published installer is launched interactively so the user can acknowledge the risk warning'),
 @($pub -notmatch '--clobber' -and $pub.Contains('release","create'),'No release overwrite; create new tag only'),
 @($pub.Contains('naprawapclaptop1-dev/komputerowe-centrum-serwisu'),'Publisher is locked to the dedicated repository')
)
foreach($f in $files){$checks+=,@((Test-Path (Join-Path $root $f)),"Required FIX072 file exists: $f")}
$failed=0;foreach($c in $checks){if($c[0]){Write-Host "[PASS] $($c[1])" -ForegroundColor Green}else{Write-Host "[FAIL] $($c[1])" -ForegroundColor Red;$failed++}}
if($failed){throw "$failed FIX072 checks failed."};Write-Host "[PASS] FIX072 checks: $($checks.Count)/$($checks.Count)"
