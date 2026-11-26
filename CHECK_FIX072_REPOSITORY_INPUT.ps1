$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$repo = 'naprawapclaptop1-dev/komputerowe-centrum-serwisu'
$checks = @()
function Add-Check { param([bool]$Passed,[string]$Name); $script:checks += [pscustomobject]@{Passed=$Passed;Name=$Name} }
function Read-Required { param([string]$Name); $path=Join-Path $root $Name; if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Missing FIX072 repository input: $Name" }; return [IO.File]::ReadAllText($path) }
$versionLines = [IO.File]::ReadAllLines((Join-Path $root 'VERSION.txt'))
$version = if ($versionLines.Count -gt 0) { $versionLines[0].Trim() } else { '' }
$fix = if ($versionLines.Count -gt 1) { $versionLines[1].Trim() } else { '' }
$entry = Read-Required 'URUCHOM_TYLKO_TEN_PLIK.cmd'
$sourcePublisher = Read-Required 'PUBLISH_GITHUB_SOURCE.ps1'
$releasePublisher = Read-Required 'PUBLISH_GITHUB_RELEASES.ps1'
$repoTemplate = (Read-Required 'GITHUB_REPOSITORY.txt.template').Trim()
$payloadVerifier = Read-Required 'VERIFY_PAYLOAD.ps1'
$checks += ,@(($repoTemplate -eq $repo),'Repository template is pinned to the dedicated public repository')
$checks += ,@(($sourcePublisher.Contains('$Repo="'+$repo+'"')),'Source publisher is locked to the dedicated repository')
$checks += ,@(($releasePublisher.Contains('$Repo="'+$repo+'"')),'Release publisher is locked to the dedicated repository')
$checks += ,@(($releasePublisher.Contains('$ExpectedRepo="'+$repo+'"')),'Release publisher rejects a different repository')
$checks += ,@(($entry -notmatch '(?im)^\s*set\s+/p\s|Read-Host|Podaj publiczne repozytorium'),'The single launcher does not ask for a repository manually')
$checks += ,@(($version -eq '1.0.0.73' -and $fix -eq 'FIX137'),'VERSION.txt identifies current product 1.0.0.73 / FIX137')
$checks += ,@(($payloadVerifier.Contains('"CHECK_FIX072_REPOSITORY_INPUT.ps1"')),'Payload source identity includes this repository-input regression')
$checks += ,@((Test-Path -LiteralPath (Join-Path $root 'GITHUB_REPOSITORY.txt.template') -PathType Leaf),'Repository template exists in the package root')
$failed = @($checks | Where-Object { -not $_[0] })
foreach ($c in $checks) { if ($c[0]) { Write-Host ('[PASS] ' + $c[1]) } else { Write-Host ('[FAIL] ' + $c[1]) } }
if ($failed.Count) { throw ('FIX072 repository input checks failed: ' + (($failed | ForEach-Object { $_[1] }) -join '; ')) }
Write-Host ('[PASS] FIX072 repository input checks: {0}/{0}' -f $checks.Count)
exit 0
