$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$cmd = Get-Content -LiteralPath (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$worker = Get-Content -LiteralPath (Join-Path $root 'KCS_FIX101_WORKER.cmd') -Raw
$pub = Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw
if ($cmd -notmatch 'KCS_FIX101_WORKER\.cmd') { throw 'Launcher does not dispatch to the dedicated worker.' }
if (-not ($worker.Contains('BUILD_ALL.cmd') -and $worker.Contains('PUBLISH_GITHUB_RELEASES.ps1'))) { throw 'Single launcher pipeline is incomplete: build/release stages must be in the worker.' }
if ($worker -notmatch 'naprawapclaptop1-dev/komputerowe-centrum-serwisu') { throw 'Worker repository binding mismatch.' }
if ($worker -notmatch 'PUBLISH_GITHUB_SOURCE\.ps1' -or $worker -notmatch 'VERIFY_PUBLIC_DEPLOYMENT\.ps1' -or $worker -notmatch 'INSTALL_PUBLISHED_BUILD\.ps1') { throw 'Worker pipeline is missing source publish, online verification, or install stage.' }
if ($pub -match '--clobber') { throw 'Publisher must not overwrite existing release assets.' }
if ($pub -match 'releases/latest/download/') { throw 'Publisher must use tag-specific package URLs.' }
Write-Host '[PASS] FIX069 compatibility regression checks.'
