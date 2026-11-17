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
$Version="1.0.0.69"; $Tag="v$Version"; $Fix="FIX072"
$PackageName="KomputeroweCentrumSerwisu_FIX069_INSTALATOR.exe"
if([string]::IsNullOrWhiteSpace($PackagePath)){$PackagePath=Join-Path $Root "dist\installers\$PackageName"}
if(!(Test-Path -LiteralPath $PackagePath -PathType Leaf)){throw "Brak świeżego instalatora: $PackagePath"}
$FileVersion=[Diagnostics.FileVersionInfo]::GetVersionInfo($PackagePath).FileVersion
if($FileVersion -ne $Version){throw "Instalator ma wersję $FileVersion, oczekiwano $Version."}
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
