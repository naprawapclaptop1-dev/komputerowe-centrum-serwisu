param([ValidateSet("stable","beta")][string]$Channel="stable")
$ErrorActionPreference="Stop"
$Repo="naprawapclaptop1-dev/komputerowe-centrum-serwisu"
$RepoFile=Join-Path $PSScriptRoot "GITHUB_REPOSITORY.txt"
if(!(Test-Path -LiteralPath $RepoFile)){throw "Brak GITHUB_REPOSITORY.txt — uruchom główny CMD."}
if((Get-Content -LiteralPath $RepoFile -Raw).Trim() -ne $Repo){throw "Repozytorium niezgodne z przypisaniem tej aplikacji."}
[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
$headers=@{"User-Agent"="KomputeroweCentrumSerwisu-FIX073";Accept="application/vnd.github+json"}
$expectedTag="v1.0.0.69"
$api="https://api.github.com/repos/$Repo/releases/tags/$expectedTag"
Write-Host "[INFO] Repozytorium: $Repo"
Write-Host "[INFO] Sprawdzam publiczne wydanie GitHub Releases..."
$release=Invoke-RestMethod -Headers $headers -Uri $api -TimeoutSec 45
if($release.tag_name -ne $expectedTag){throw "Oczekiwano wydania $expectedTag, otrzymano $($release.tag_name)."}
if($release.draft){throw "Wydanie $expectedTag nadal jest szkicem (draft)."}
$required=@("KomputeroweCentrumSerwisu_FIX069_INSTALATOR.exe","KomputeroweCentrumSerwisu_FIX069_PORTABLE.exe","manifest-stable.xml","manifest-beta.xml","releases.json","SHA256SUMS.txt")
$assetMap=@{}
foreach($name in $required){
  $asset=@($release.assets | Where-Object {$_.name -eq $name}) | Select-Object -First 1
  if(!$asset){throw "Brak assetu w publicznym wydaniu: $name"}
  if($asset.state -ne "uploaded" -or $asset.size -le 0){throw "Asset nie jest gotowy lub jest pusty: $name"}
  if($asset.browser_download_url -notmatch [regex]::Escape("https://github.com/$Repo/releases/download/$expectedTag/")){throw "Asset ma nieoczekiwany adres: $name"}
  $assetMap[$name]=$asset
  Write-Host "[PASS] $name — $($asset.size) B"
}
$manifestName=if($Channel -eq "beta"){"manifest-beta.xml"}else{"manifest-stable.xml"}
$manifestAsset=$assetMap[$manifestName]
$manifest=Invoke-WebRequest -UseBasicParsing -Headers @{"User-Agent"="KCS-FIX073"} -Uri $manifestAsset.browser_download_url -TimeoutSec 45
if($manifest.StatusCode -ne 200){throw "Manifest tagowy zwrócił HTTP $($manifest.StatusCode)."}
[xml]$doc=$manifest.Content
if($doc.DocumentElement.Name -ne "Update"){throw "Manifest nie ma korzenia Update."}
if($doc.DocumentElement.GetAttribute("version") -ne "1.0.0.69"){throw "Manifest ma nieprawidłową wersję."}
if($doc.DocumentElement.GetAttribute("channel") -ne $Channel){throw "Manifest ma nieprawidłowy kanał."}
$setupSha=$doc.DocumentElement.GetAttribute("sha256")
if($setupSha -notmatch '^[0-9a-fA-F]{64}$'){throw "Manifest nie zawiera poprawnego SHA-256."}
$setupName="KomputeroweCentrumSerwisu_FIX069_INSTALATOR.exe"
$expectedPackage="https://github.com/$Repo/releases/download/$expectedTag/$setupName"
if($doc.DocumentElement.GetAttribute("packageUrl") -ne $expectedPackage){throw "Manifest wskazuje inny serwer lub tag."}
# Verify the exact immutable tag URL used by the desktop client. This avoids GitHub latest-alias behavior and prerelease/asset routing ambiguity.
if($manifestAsset.browser_download_url -ne "https://github.com/$Repo/releases/download/$expectedTag/$manifestName"){throw "Manifest ma nieoczekiwany adres tagowy."}
# Test installer link with HEAD; no binary is downloaded by this check.
$packageHead=Invoke-WebRequest -UseBasicParsing -Method Head -Headers @{"User-Agent"="KCS-FIX073"} -Uri $expectedPackage -TimeoutSec 60
if($packageHead.StatusCode -ne 200){throw "Publiczny instalator zwrócił HTTP $($packageHead.StatusCode)."}
$portableName="KomputeroweCentrumSerwisu_FIX069_PORTABLE.exe"
$portableUrl="https://github.com/$Repo/releases/download/$expectedTag/$portableName"
$portableHead=Invoke-WebRequest -UseBasicParsing -Method Head -Headers @{"User-Agent"="KCS-FIX073"} -Uri $portableUrl -TimeoutSec 60
if($portableHead.StatusCode -ne 200){throw "Publiczna wersja przenośna zwróciła HTTP $($portableHead.StatusCode)."}
$sumResponse=Invoke-WebRequest -UseBasicParsing -Headers @{"User-Agent"="KCS-FIX073"} -Uri $assetMap["SHA256SUMS.txt"].browser_download_url -TimeoutSec 45
if($sumResponse.Content -notmatch [regex]::Escape($setupSha)){throw "SHA256SUMS.txt nie zawiera sumy instalatora z manifestu."}
if($sumResponse.Content -notmatch [regex]::Escape($assetMap["KomputeroweCentrumSerwisu_FIX069_PORTABLE.exe"].name)){throw "SHA256SUMS.txt nie zawiera wpisu wersji portable."}
Write-Host "[PASS] GitHub API i publiczne wydanie: $($release.tag_name)"
Write-Host "[PASS] Manifest ${Channel}: poprawny XML, kanał, tag i SHA-256."
Write-Host "[PASS] /releases/download/$expectedTag/${manifestName}: HTTP 200 — dokładny adres używany przez klienta."
Write-Host "[PASS] Instalator i wersja portable: publiczny link HTTP 200."
Write-Host "[PASS] SHA256SUMS.txt zawiera obie sumy SHA-256."
Write-Host "[PASS] Publiczne aktualizacje korzystają wyłącznie z przypisanego repozytorium GitHub."
