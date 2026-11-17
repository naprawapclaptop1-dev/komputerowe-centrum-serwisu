$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$cmd = Get-Content -LiteralPath (Join-Path $root 'URUCHOM_TYLKO_TEN_PLIK.cmd') -Raw
$pub = Get-Content -LiteralPath (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw
if (-not ($cmd.Contains('BUILD_ALL.cmd') -and $cmd.Contains('PUBLISH_GITHUB_RELEASES.ps1'))) { throw 'Single launcher pipeline is incomplete.' }
if ($cmd -notmatch 'naprawapclaptop1-dev/komputerowe-centrum-serwisu') { throw 'Launcher repository binding mismatch.' }
if ($pub -match '--clobber') { throw 'Publisher must not overwrite existing release assets.' }
if ($pub -match 'releases/latest/download/') { throw 'Publisher must use tag-specific package URLs.' }
Write-Host '[PASS] FIX069 compatibility regression checks.'
