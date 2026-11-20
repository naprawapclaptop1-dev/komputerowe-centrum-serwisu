param(
  [string]$PackagePath="",
  [ValidateSet("stable","beta")][string]$Channel="stable"
)
$ErrorActionPreference="Stop"
$Root=$PSScriptRoot
$Repo="naprawapclaptop1-dev/komputerowe-centrum-serwisu"
$RepoFile=Join-Path $Root "GITHUB_REPOSITORY.txt"
if(!(Test-Path $RepoFile)){throw "Brak GITHUB_REPOSITORY.txt — uruchom URUCHOM_TYLKO_TEN_PLIK.cmd."}
if((Get-Content $RepoFile -Raw).Trim() -ne $Repo){throw "Nieprawidłowe repozytorium przypisane do aplikacji."}
$Version="1.0.0.71"; $Tag="v$Version"; $Fix="FIX071"
$PackageName="KomputeroweCentrumSerwisu_FIX071_INSTALATOR.exe"
if([string]::IsNullOrWhiteSpace($PackagePath)){$PackagePath=Join-Path $Root "dist\installers\$PackageName"}
if(!(Test-Path -LiteralPath $PackagePath -PathType Leaf)){throw "Brak świeżego instalatora: $PackagePath"}
function Assert-ExpectedFileVersion {
  param([string]$RawVersion,[string]$ExpectedVersion,[string]$Label)
  $raw = [string]$RawVersion
  $actual = $raw.Trim()
  $expected = ([string]$ExpectedVersion).Trim()
  if ([string]::IsNullOrWhiteSpace($actual)) {
    throw ("{0}: zasób FileVersion jest pusty; raw=[{1}] expected=[{2}]" -f $Label,$raw,$expected)
  }
  $matches = $false
  try {
    $actualVersionObject = [version]$actual
    $expectedVersionObject = [version]$expected
    $matches = $actualVersionObject.Equals($expectedVersionObject)
  }
  catch {
    $matches = [string]::Equals($actual,$expected,[StringComparison]::OrdinalIgnoreCase)
  }
  if (-not $matches) {
    $characterCodes = @()
    foreach ($character in $raw.ToCharArray()) { $characterCodes += ('U+{0:X4}' -f [int][char]$character) }
    throw ("{0}: nieprawidłowy FileVersion; raw=[{1}] normalized=[{2}] expected=[{3}] chars=[{4}]" -f $Label,$raw,$actual,$expected,($characterCodes -join ' '))
  }
  return $actual
}
$FileVersionRaw=[Diagnostics.FileVersionInfo]::GetVersionInfo($PackagePath).FileVersion
$FileVersion=Assert-ExpectedFileVersion -RawVersion $FileVersionRaw -ExpectedVersion $Version -Label "Instalator"
$Stage=Join-Path $Root "dist\github-release"
New-Item -ItemType Directory -Force -Path $Stage | Out-Null
Copy-Item -LiteralPath $PackagePath -Destination (Join-Path $Stage $PackageName) -Force
$Sha=(Get-FileHash -LiteralPath $PackagePath -Algorithm SHA256).Hash.ToLowerInvariant()
$PackageUrl="https://github.com/$Repo/releases/download/$Tag/$PackageName"
$ManifestName="manifest-$Channel.xml"
$ManifestPath=Join-Path $Stage $ManifestName
$Xml='<?xml version="1.0" encoding="utf-8"?><Update version="'+$Version+'" channel="'+$Channel+'" region="global" language="all" architecture="any" packageUrl="'+$PackageUrl+'" sha256="'+$Sha+'"><Notes lang="pl">Wydanie '+$Version+' — Komputerowe Centrum Serwisu</Notes><Notes lang="en">Release '+$Version+' — Computer Service Center</Notes><Mirrors /></Update>'
Set-Content -LiteralPath $ManifestPath -Value $Xml -Encoding UTF8
@"
KOMPUTEROWE CENTRUM SERWISU — $Fix
Repozytorium: https://github.com/$Repo
Tag: $Tag
Kanał: $Channel
Manifest: $ManifestName
Pakiet: $PackageName
URL pakietu: $PackageUrl
SHA-256: $Sha

Pliki są przygotowane do dołączenia do wydania przez główny automat PUBLISH_GITHUB_RELEASES.ps1.
Nie publikuj tych plików ręcznie. Główny automat dołącza je do wydania w przypisanym repozytorium GitHub.
"@ | Set-Content -LiteralPath (Join-Path $Stage "README_PUBLISH.txt") -Encoding UTF8
Write-Host "[PASS] Manifest $Channel przygotowany dla GitHub Release $Tag."
Write-Host "[PASS] SHA-256: $Sha"
