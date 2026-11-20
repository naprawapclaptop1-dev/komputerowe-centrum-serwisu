param([int]$PageAttempts=36,[int]$PageDelaySeconds=5)
$ErrorActionPreference="Stop"
$Repo="naprawapclaptop1-dev/komputerowe-centrum-serwisu"
$Version="1.0.0.71"
$Tag="v$Version"
$PageUrl="https://naprawapclaptop1-dev.github.io/komputerowe-centrum-serwisu/"
$Headers=@{"User-Agent"="KCS-FIX121-PublicVerifier";Accept="application/vnd.github+json"}
[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
$LogDir=Join-Path $PSScriptRoot "dist\build-logs"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$Log=Join-Path $LogDir "03-public-deployment-verification.log"
. (Join-Path $PSScriptRoot "KCS_RELEASE_POLICY.ps1")
$LocalIndexPath=Join-Path $PSScriptRoot "website\index.html"
$LocalIndex=Get-Content -LiteralPath $LocalIndexPath -Raw -Encoding UTF8
$LocalFixMatch=[regex]::Match($LocalIndex, '<meta\s+name="application-fix"\s+content="([^"]+)"')
if(-not $LocalFixMatch.Success){throw "Lokalna strona nie zawiera znacznika application-fix."}
$ExpectedSiteFix=$LocalFixMatch.Groups[1].Value
$ExpectedSiteMarker='application-fix" content="'+$ExpectedSiteFix+'"'
Start-Transcript -Path $Log -Force | Out-Null
try {
  $api="https://api.github.com/repos/$Repo/releases/tags/$Tag"
  Write-Host "[1/3] Sprawdzam publiczne wydanie GitHub Releases: $api"
  $release=Invoke-RestMethod -Headers $Headers -Uri $api -TimeoutSec 45
  if($release.tag_name -ne $Tag){throw "Oczekiwano $Tag, GitHub zwrócił $($release.tag_name)."}
  if($release.draft){throw "Wydanie $Tag nadal jest szkicem (draft)."}
  if($release.draft -or $release.prerelease){throw "Najnowsze wydanie nie jest publicznym wydaniem stabilnym."}
  $required=@("KomputeroweCentrumSerwisu_FIX071_INSTALATOR.exe","KomputeroweCentrumSerwisu_FIX071_PORTABLE.exe","manifest-stable.xml","manifest-beta.xml","releases.json","SHA256SUMS.txt")
  $assets=@{}
  foreach($name in $required){
    $asset=@($release.assets | Where-Object {$_.name -eq $name -and $_.state -eq "uploaded" -and [long]$_.size -gt 0}) | Select-Object -First 1
    if(!$asset){throw "Brak lub pusty asset publicznego wydania: $name"}
    $assets[$name]=$asset
    Write-Host "[PASS] Asset $name — $($asset.size) B"
  }
  $tagBase="https://github.com/$Repo/releases/download/$Tag/"
  foreach($channel in @("stable","beta")){
    $manifestName="manifest-$channel.xml"
    $tagUrl=$assets[$manifestName].browser_download_url
    $manifestResponse=Invoke-WebRequest -UseBasicParsing -Headers $Headers -Uri $tagUrl -TimeoutSec 45
    if($manifestResponse.StatusCode -ne 200){throw "Manifest $channel (tag) nie zwrócił HTTP 200."}
    $manifestText=ConvertTo-KcsResponseText -Content $manifestResponse.Content
    if([string]::IsNullOrWhiteSpace($manifestText)){throw "Manifest $channel jest pusty."}
    [xml]$doc=$manifestText
    $root=$doc.DocumentElement
    if($root.Name -ne "Update" -or $root.GetAttribute("version") -ne $Version -or $root.GetAttribute("channel") -ne $channel){throw "Manifest $channel ma błędny format, wersję lub kanał."}
    $expectedPackage=$tagBase+"KomputeroweCentrumSerwisu_FIX071_INSTALATOR.exe"
    if($root.GetAttribute("packageUrl") -ne $expectedPackage){throw "Manifest $channel wskazuje nieprawidłowy pakiet."}
    if($root.GetAttribute("sha256") -notmatch '^[0-9a-fA-F]{64}$'){throw "Manifest $channel nie ma poprawnej sumy SHA-256."}
    if($tagUrl -ne ($tagBase+$manifestName)){throw "Manifest $channel ma nieprawidłowy adres tagowy."}
    Write-Host "[PASS] Manifest ${channel}: HTTP 200, wersja, kanał, URL i SHA-256 zgodne."
  }

  $setupName="KomputeroweCentrumSerwisu_FIX071_INSTALATOR.exe"
  $portableName="KomputeroweCentrumSerwisu_FIX071_PORTABLE.exe"
  $setupUrl=$tagBase+$setupName
  $portableUrl=$tagBase+$portableName
  foreach($url in @($setupUrl,$portableUrl)){
    $head=Invoke-WebRequest -UseBasicParsing -Method Head -Headers $Headers -Uri $url -TimeoutSec 60
    if($head.StatusCode -ne 200){throw "Plik instalatora/portable nie zwrócił HTTP 200: $url"}
    Write-Host "[PASS] Pobieranie HEAD HTTP 200: $url"
  }

  $catalogResponse=Invoke-WebRequest -UseBasicParsing -Headers $Headers -Uri $assets["releases.json"].browser_download_url -TimeoutSec 45
  $catalogText=ConvertTo-KcsResponseText -Content $catalogResponse.Content
  if([string]::IsNullOrWhiteSpace($catalogText)){throw "releases.json jest pusty."}
  $catalog=ConvertFrom-Json -InputObject $catalogText
  if($catalog -isnot [array] -or $catalog.Count -ne 2){throw "releases.json musi zawierać dokładnie dwa wpisy kanałów Stable/Beta."}
  foreach($channel in @("stable","beta")){
    $entry=@($catalog | Where-Object {$_.channel -eq $channel -and $_.version -eq $Version}) | Select-Object -First 1
    if(!$entry -or $entry.packageUrl -ne $setupUrl -or $entry.sha256 -notmatch '^[0-9a-fA-F]{64}$'){throw "Katalog releases.json ma nieprawidłowy wpis $channel."}
  }
  $sumResponse=Invoke-WebRequest -UseBasicParsing -Headers $Headers -Uri $assets["SHA256SUMS.txt"].browser_download_url -TimeoutSec 45
  $sumText=ConvertTo-KcsResponseText -Content $sumResponse.Content
  if([string]::IsNullOrWhiteSpace($sumText)){throw "SHA256SUMS.txt jest pusty."}
  foreach($name in @($setupName,$portableName)){
    if($sumText -notmatch [regex]::Escape($name)){throw "SHA256SUMS.txt nie zawiera pliku $name."}
  }
  Write-Host "[PASS] Katalog Stable/Beta i plik sum SHA-256 są dostępne i mają poprawną strukturę."

  Write-Host "[2/3] Czekam na wdrożenie bezpłatnej strony GitHub Pages: $PageUrl"
  $siteReady=$false
  for($i=1;$i -le $PageAttempts;$i++){
    try {
      $page=Invoke-WebRequest -UseBasicParsing -Headers @{"Cache-Control"="no-cache"} -Uri ($PageUrl+"?fix086="+[guid]::NewGuid().ToString("N")) -TimeoutSec 20
      $pageText=ConvertTo-KcsResponseText -Content $page.Content
      if($page.StatusCode -eq 200 -and $pageText.Contains($ExpectedSiteMarker) -and $pageText -match 'Pobierz' -and $pageText -match 'prezentacja.mp4'){$siteReady=$true;break}
    } catch {}
    Start-Sleep -Seconds $PageDelaySeconds
  }
  if(!$siteReady){throw "Wydanie GitHub działa, ale strona WWW nie potwierdziła HTTP 200 z oczekiwanym znacznikiem $ExpectedSiteFix. Sprawdź https://github.com/$Repo/actions/workflows/deploy-pages.yml oraz Settings > Pages."}
  Write-Host "[PASS] Strona WWW HTTP 200 i zawiera znacznik $ExpectedSiteFix zgodny z pakietem lokalnym."
  foreach($relative in @("styles.css","app.js","media/centrum-serwisu.png","media/favicon.svg","media/prezentacja.mp4","media/prezentacja.vtt","media/prezentacja-en.vtt","site.webmanifest","sitemap.xml","robots.txt","404.html")){
    $url=$PageUrl+$relative
    $assetResponse=Invoke-WebRequest -UseBasicParsing -Method Head -Uri $url -TimeoutSec 45
    if($assetResponse.StatusCode -ne 200){throw "Zasób strony nie zwrócił HTTP 200: $relative"}
    Write-Host "[PASS] Strona WWW: $relative — HTTP 200"
  }
  Write-Host "[3/3] Weryfikacja zakończona."
  Write-Host "[PASS] GitHub Release, manifesty, instalator, portable, SHA-256 i globalna strona WWW są publicznie dostępne."
  Set-Content -LiteralPath (Join-Path $PSScriptRoot "PUBLICATION_VERIFICATION.status") -Value "PASS" -Encoding ASCII
} catch {
  Set-Content -LiteralPath (Join-Path $PSScriptRoot "PUBLICATION_VERIFICATION.status") -Value "FAIL" -Encoding ASCII
  Write-Host "[FAIL] Weryfikacja publikacji: $($_.Exception.Message)"
  exit 1
} finally {
  Stop-Transcript | Out-Null
}
