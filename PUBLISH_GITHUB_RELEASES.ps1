param([ValidateSet("stable","beta","both")][string]$Channel="both")
$ErrorActionPreference="Stop"
function ConvertTo-NativeCommandLine([string[]]$Arguments){
  $quotedArguments=New-Object System.Collections.Generic.List[string]
  foreach($value in $Arguments){
    if($null -eq $value){$value=""}
    $builder=New-Object System.Text.StringBuilder
    [void]$builder.Append([char]34)
    $backslashes=0
    foreach($character in $value.ToCharArray()){
      if([int][char]$character -eq 92){$backslashes++;continue}
      if([int][char]$character -eq 34){
        for($i=0;$i -lt (($backslashes*2)+1);$i++){[void]$builder.Append([char]92)}
        [void]$builder.Append([char]34)
        $backslashes=0
      } else {
        for($i=0;$i -lt $backslashes;$i++){[void]$builder.Append([char]92)}
        $backslashes=0
        [void]$builder.Append($character)
      }
    }
    for($i=0;$i -lt ($backslashes*2);$i++){[void]$builder.Append([char]92)}
    [void]$builder.Append([char]34)
    $quotedArguments.Add($builder.ToString())
  }
  return [string]::Join(' ',$quotedArguments.ToArray())
}
function Invoke-GhCapture([string]$Executable,[string[]]$Arguments){
  # ProcessStartInfo captures both native streams without PowerShell 5.1 converting stderr to terminating ErrorRecords.
  $startInfo=New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.FileName=$Executable
  $startInfo.Arguments=ConvertTo-NativeCommandLine -Arguments $Arguments
  $startInfo.UseShellExecute=$false
  $startInfo.CreateNoWindow=$true
  $startInfo.RedirectStandardOutput=$true
  $startInfo.RedirectStandardError=$true
  $process=New-Object System.Diagnostics.Process
  $process.StartInfo=$startInfo
  $started=$false
  try{
    $started=$process.Start()
    if(!$started){throw "Nie można uruchomić procesu natywnego: $Executable"}
    $stdoutTask=$process.StandardOutput.ReadToEndAsync()
    $stderrTask=$process.StandardError.ReadToEndAsync()
    $process.WaitForExit()
    $stdout=$stdoutTask.Result
    $stderr=$stderrTask.Result
    $combined=$stdout
    if(![string]::IsNullOrWhiteSpace($stderr)){
      if(![string]::IsNullOrWhiteSpace($combined)){$combined=$combined.TrimEnd()+[Environment]::NewLine}
      $combined+=$stderr
    }
    return [pscustomobject]@{Output=$combined;StdOut=$stdout;StdErr=$stderr;ExitCode=[int]$process.ExitCode}
  } finally {
    if($started -and !$process.HasExited){try{$process.Kill()}catch{}}
    $process.Dispose()
  }
}
function Invoke-GhInteractive([string]$Executable,[string[]]$Arguments){
  # Inherit the current console handles. This keeps gh's device code and URL visible and interactive.
  # No PowerShell call operator is used, so native stderr cannot become a PowerShell ErrorRecord.
  $startInfo=New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.FileName=$Executable
  $startInfo.Arguments=ConvertTo-NativeCommandLine -Arguments $Arguments
  $startInfo.UseShellExecute=$false
  $startInfo.CreateNoWindow=$false
  $startInfo.RedirectStandardOutput=$false
  $startInfo.RedirectStandardError=$false
  $startInfo.RedirectStandardInput=$false
  $process=New-Object System.Diagnostics.Process
  $process.StartInfo=$startInfo
  $started=$false
  try{
    $started=$process.Start()
    if(!$started){throw "Nie można uruchomić procesu interaktywnego: $Executable"}
    $process.WaitForExit()
    return [int]$process.ExitCode
  } finally {
    if($started -and !$process.HasExited){try{$process.Kill()}catch{}}
    $process.Dispose()
  }
}

$Root=[IO.Path]::GetFullPath($PSScriptRoot)
# FIX108: package identity is verified by its marker, never by the extracted folder name.
# Users may extract the same complete archive to any folder (including FIX057/FIX107).
$packageMarker=Join-Path $Root "FIX099_PACKAGE_MARKER.txt"
if(!(Test-Path -LiteralPath $packageMarker -PathType Leaf)){throw "Brak markera pakietu FIX099 — publikator musi być uruchomiony z kompletnego archiwum."}
$packageLines=Get-Content -LiteralPath $packageMarker
if($packageLines -notcontains "PACKAGE=FIX099" -or $packageLines -notcontains "REPOSITORY=naprawapclaptop1-dev/komputerowe-centrum-serwisu" -or $packageLines -notcontains "ENTRYPOINT=URUCHOM_TYLKO_TEN_PLIK.cmd"){throw "Marker pakietu nie potwierdza właściwego projektu / repozytorium / punktu startowego."}
. (Join-Path $Root "KCS_RELEASE_POLICY.ps1")
$Repo="naprawapclaptop1-dev/komputerowe-centrum-serwisu"
$LogDir=Join-Path $Root "dist\build-logs"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$Log=Join-Path $LogDir "02-github-publish.log"
Start-Transcript -Path $Log -Force | Out-Null
try {
  $RepoFile=Join-Path $Root "GITHUB_REPOSITORY.txt"
  if(!(Test-Path $RepoFile)){throw "Brak GITHUB_REPOSITORY.txt. Uruchom wyłącznie URUCHOM_TYLKO_TEN_PLIK.cmd."}
  $RepoInput=(Get-Content $RepoFile -Raw).Trim().Trim('"').Trim()
  if($RepoInput -match '(?i)^https?://(?:www\.)?github\.com/([A-Za-z0-9_.-]{1,39})/([A-Za-z0-9_.-]{1,100})(?:\.git)?/?$'){$Repo="$($Matches[1])/$($Matches[2])"}
  else {$Repo=$RepoInput.TrimEnd('/') -replace '(?i)\.git$',''}
  if($Repo -notmatch '^[A-Za-z0-9_.-]{1,39}/[A-Za-z0-9_.-]{1,100}$'){throw "Nieprawidłowy format repozytorium: $RepoInput"}
  Set-Content -LiteralPath $RepoFile -Value $Repo -Encoding ASCII
  $ExpectedRepo="naprawapclaptop1-dev/komputerowe-centrum-serwisu"
  if($Repo -ne $ExpectedRepo){throw "Repozytorium nie należy do tego programu. Oczekiwano: $ExpectedRepo"}
  $repoMeta=Invoke-RestMethod -Headers @{"User-Agent"="KCS-FIX099";Accept="application/vnd.github+json"} -Uri "https://api.github.com/repos/$Repo" -TimeoutSec 30
  if($repoMeta.visibility -ne "public" -or [string]::IsNullOrWhiteSpace($repoMeta.default_branch)){throw "Repozytorium musi być publiczne i posiadać gałąź domyślną."}
  $Gh=Get-Command gh.exe -ErrorAction SilentlyContinue
  if(!$Gh){$Gh=Get-Command gh -ErrorAction SilentlyContinue}
  if(!$Gh){throw "GitHub CLI nie jest dostępne po automatycznym przygotowaniu narzędzi."}
  $GhPath=$Gh.Source
  $authCheck=Invoke-GhCapture -Executable $GhPath -Arguments @("auth","status","--hostname","github.com")
  if($authCheck.Output.Trim()){Write-Host $authCheck.Output.TrimEnd()}
  if($authCheck.ExitCode -ne 0){throw "Brak autoryzacji GitHub CLI po etapie synchronizacji. Wróć do głównego CMD i dokończ jednorazowe logowanie w przeglądarce."}

  $Version="1.0.0.71"; $Tag="v$Version"
  $SetupName="KomputeroweCentrumSerwisu_FIX071_INSTALATOR.exe"
  $PortableName="KomputeroweCentrumSerwisu_FIX071_PORTABLE.exe"
  $Installer=Join-Path $Root "dist\installers\$SetupName"
  $Portable=Join-Path $Root "dist\portable\$PortableName"
  foreach($path in @($Installer,$Portable)){if(!(Test-Path -LiteralPath $path -PathType Leaf)){throw "Brak świeżego artefaktu kompilacji: $path"};if((Get-Item -LiteralPath $path).Length -le 0){throw "Plik wynikowy jest pusty: $path"}}
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

  # Keep release validation consistent with VERIFY_PAYLOAD.ps1: normalize fixed-width PE version strings.
  $installerVersionRaw=[Diagnostics.FileVersionInfo]::GetVersionInfo($Installer).FileVersion
  $installerVersion=Assert-ExpectedFileVersion -RawVersion $installerVersionRaw -ExpectedVersion $Version -Label "Instalator"
  $portableVersionRaw=[Diagnostics.FileVersionInfo]::GetVersionInfo($Portable).FileVersion
  $portableVersion=Assert-ExpectedFileVersion -RawVersion $portableVersionRaw -ExpectedVersion $Version -Label "Wersja portable"

  $Stage=Join-Path $Root "dist\github-release"
  if(Test-Path $Stage){Remove-Item -LiteralPath $Stage -Recurse -Force}
  New-Item -ItemType Directory -Force -Path $Stage | Out-Null
  Copy-Item -LiteralPath $Installer -Destination (Join-Path $Stage $SetupName)
  Copy-Item -LiteralPath $Portable -Destination (Join-Path $Stage $PortableName)
  $SetupSha=(Get-FileHash -LiteralPath $Installer -Algorithm SHA256).Hash.ToLowerInvariant()
  $PortableSha=(Get-FileHash -LiteralPath $Portable -Algorithm SHA256).Hash.ToLowerInvariant()
  $SetupSize=(Get-Item -LiteralPath $Installer).Length
  $PortableSize=(Get-Item -LiteralPath $Portable).Length
  $TagBase="https://github.com/$Repo/releases/download/$Tag/"
  $utf8NoBom=New-Object -TypeName System.Text.UTF8Encoding -ArgumentList $false
  foreach($ch in @("stable","beta")){
    $manifest="<?xml version=`"1.0`" encoding=`"utf-8`"?><Update version=`"$Version`" channel=`"$ch`" region=`"global`" language=`"all`" architecture=`"any`" packageUrl=`"$($TagBase)$SetupName`" sha256=`"$SetupSha`"><Notes lang=`"pl`">Komputerowe Centrum Serwisu $Version — kanał $ch. FIX123: poprawa inicjalizacji instalatora i diagnostyka instalacji.</Notes><Notes lang=`"en`">Computer Service Center $Version — $ch channel. FIX123: installer initialization fix and installation diagnostics.</Notes><Mirrors /></Update>"
    [IO.File]::WriteAllText((Join-Path $Stage "manifest-$ch.xml"),$manifest,($utf8NoBom))
  }
  $published=(Get-Date).ToUniversalTime().ToString("o")
  # The desktop client requires releases.json to be a root JSON array with one entry per channel.
  $catalog=@(
    [ordered]@{
      version=$Version;channel="stable";publishedUtc=$published
      notes="Wydanie stabilne $Version — FIX123: instalator i aktualizator GitHub."
      packageUrl="$TagBase$SetupName";sha256=$SetupSha;signerThumbprint=""
      signatureStatus="Brak podpisu Authenticode; sprawdzanie SHA-256";sizeBytes=$SetupSize
      portableName=$PortableName;portableUrl="$TagBase$PortableName";portableSha256=$PortableSha;portableSizeBytes=$PortableSize
    },
    [ordered]@{
      version=$Version;channel="beta";publishedUtc=$published
      notes="Kanał Beta $Version — FIX123: instalator i aktualizator GitHub."
      packageUrl="$TagBase$SetupName";sha256=$SetupSha;signerThumbprint=""
      signatureStatus="Brak podpisu Authenticode; sprawdzanie SHA-256";sizeBytes=$SetupSize
      portableName=$PortableName;portableUrl="$TagBase$PortableName";portableSha256=$PortableSha;portableSizeBytes=$PortableSize
    }
  )
  $catalogJson=ConvertTo-Json -InputObject $catalog -Depth 8
  $catalogCheck=ConvertFrom-Json -InputObject $catalogJson
  if($catalogCheck -isnot [System.Array] -or $catalogCheck.Count -ne 2){throw "Katalog releases.json musi być tablicą dwóch wpisów: Stable i Beta."}
  foreach($entry in $catalogCheck){
    if($entry.version -ne $Version -or $entry.channel -notin @("stable","beta") -or $entry.sha256 -notmatch '^[0-9a-f]{64}$' -or $entry.packageUrl -ne "$TagBase$SetupName"){throw "Katalog releases.json nie przeszedł kontroli schematu aplikacji."}
  }
  [IO.File]::WriteAllText((Join-Path $Stage "releases.json"),$catalogJson,$utf8NoBom)
  @("$SetupSha  $SetupName","$PortableSha  $PortableName") | Set-Content -LiteralPath (Join-Path $Stage "SHA256SUMS.txt") -Encoding ASCII
  $assets=@(
    (Join-Path $Stage $SetupName),
    (Join-Path $Stage $PortableName),
    (Join-Path $Stage "manifest-stable.xml"),
    (Join-Path $Stage "manifest-beta.xml"),
    (Join-Path $Stage "releases.json"),
    (Join-Path $Stage "SHA256SUMS.txt")
  )

  # Recover an incomplete draft safely. Published releases are immutable to this script.
  $releaseExists=$false; $releaseInfo=$null
  $releaseProbe=Invoke-GhCapture -Executable $GhPath -Arguments @("release","view",$Tag,"--repo",$Repo,"--json","isDraft,assets,url")
  if($releaseProbe.ExitCode -eq 0){
    $releaseJson=$releaseProbe.Output
    $releaseInfo=$releaseJson | ConvertFrom-Json; $releaseExists=$true
  }
  if(!$releaseExists){
    $tagProbe=Invoke-GhCapture -Executable $GhPath -Arguments @("api","repos/$Repo/git/ref/tags/$Tag")
    if($tagProbe.ExitCode -eq 0){throw "Tag $Tag już istnieje bez wydania. Zgodnie z polityką nie używam ponownie istniejącego tagu. Wymagana jest inspekcja."}
    Write-Host "[RELEASE] Tworzę pierwsze wydanie jako szkic, dodając sześć sprawdzonych plików..."
    $createArgs=@("release","create",$Tag)+$assets+@("--repo",$Repo,"--target",$repoMeta.default_branch,"--title","KOMPUTEROWE CENTRUM SERWISU $Version — FIX123","--notes","FIX123 — naprawa inicjalizacji instalatora, kontrola .NET Framework i diagnostyczny log instalacji.`n`nInstalator i wersja przenośna są weryfikowane przez SHA-256. Wydanie utworzono ze świeżych plików po lokalnej kompilacji.","--draft")
    $createResult=Invoke-GhCapture -Executable $GhPath -Arguments $createArgs
    if($createResult.Output.Trim()){Write-Host $createResult.Output.TrimEnd()}
    if($createResult.ExitCode -ne 0){throw "GitHub nie utworzył szkicu wydania lub nie przesłał wszystkich plików: $($createResult.Output.Trim())"}
    $releaseReload=Invoke-GhCapture -Executable $GhPath -Arguments @("release","view",$Tag,"--repo",$Repo,"--json","isDraft,assets,url")
    if($releaseReload.ExitCode -ne 0){throw "Utworzono szkic, ale nie można odczytać jego assetów: $($releaseReload.Output.Trim())"}
    $releaseInfo=$releaseReload.Output | ConvertFrom-Json; $releaseExists=$true
  }

  $requiredNames=@($SetupName,$PortableName,"manifest-stable.xml","manifest-beta.xml","releases.json","SHA256SUMS.txt")
  $reusePublishedRelease=$false
  $publishedReleaseExactMatch=$false

  # FIX119: a published product tag is never overwritten. If the local build differs,
  # reuse the public assets only when GitHub confirms that every change since the tag
  # is limited to website/tests/release tooling/documentation. Runtime/build inputs fail closed.
  if($releaseExists -and !$releaseInfo.isDraft){
    $publicMismatches=New-Object System.Collections.Generic.List[string]
    $publicMissing=New-Object System.Collections.Generic.List[string]
    $publicCheckRoot=Join-Path $Stage "existing-public-release-check"
    New-Item -ItemType Directory -Force -Path $publicCheckRoot | Out-Null
    $assetIndex=0
    foreach($assetPath in $assets){
      $assetName=[IO.Path]::GetFileName($assetPath)
      $expectedSize=(Get-Item -LiteralPath $assetPath).Length
      $existing=@($releaseInfo.assets | Where-Object {$_.name -eq $assetName}) | Select-Object -First 1
      if(!$existing -or [long]$existing.size -le 0){
        $publicMissing.Add($assetName)
        continue
      }
      if([long]$existing.size -ne [long]$expectedSize){
        $publicMismatches.Add(("{0}: public={1} B local={2} B" -f $assetName,[long]$existing.size,[long]$expectedSize))
        $assetIndex++
        continue
      }
      $checkDir=Join-Path $publicCheckRoot ("asset-{0:D2}" -f $assetIndex)
      New-Item -ItemType Directory -Force -Path $checkDir | Out-Null
      $downloadResult=Invoke-GhCapture -Executable $GhPath -Arguments @("release","download",$Tag,"--repo",$Repo,"--pattern",$assetName,"--dir",$checkDir)
      if($downloadResult.ExitCode -ne 0){throw "Nie można pobrać publicznego assetu $assetName do kontroli SHA-256. Nie modyfikuję wydania. $($downloadResult.Output.Trim())"}
      $downloaded=Join-Path $checkDir $assetName
      if(!(Test-Path -LiteralPath $downloaded -PathType Leaf)){throw "Brak pobranego publicznego assetu kontrolnego: $assetName"}
      $localHash=(Get-FileHash -LiteralPath $assetPath -Algorithm SHA256).Hash
      $remoteHash=(Get-FileHash -LiteralPath $downloaded -Algorithm SHA256).Hash
      if($localHash -ne $remoteHash){$publicMismatches.Add(("{0}: SHA-256 publiczny={1} lokalny={2}" -f $assetName,$remoteHash,$localHash))}
      else{Write-Host "[PASS] Publiczny asset ma identyczny rozmiar i SHA-256: $assetName"}
      $assetIndex++
    }
    if($publicMissing.Count -gt 0){throw ("Opublikowane wydanie $Tag nie ma wymaganych assetów: "+($publicMissing -join ', ')+". Nie modyfikuję publicznego wydania.")}
    if($publicMismatches.Count -gt 0){
      Write-Host "[INFO] Lokalny build różni się od assetów już opublikowanego wydania ${Tag}:"
      foreach($item in $publicMismatches){Write-Host ("[INFO] "+$item)}
      $compareUri="https://api.github.com/repos/$Repo/compare/$Tag...$($repoMeta.default_branch)"
      $compare=Invoke-RestMethod -Headers @{"User-Agent"="KCS-FIX119";Accept="application/vnd.github+json"} -Uri $compareUri -TimeoutSec 45
      $changedPaths=@()
      if($compare.files){$changedPaths=@($compare.files | ForEach-Object {[string]$_.filename})}
      $tagIsAncestor=$false
      if($compare.base_commit -and $compare.merge_base_commit){$tagIsAncestor=([string]$compare.base_commit.sha -eq [string]$compare.merge_base_commit.sha)}
      Write-Host ("[INFO] GitHub Compare: status={0}; ahead={1}; behind={2}; changedFiles={3}; tagIsAncestor={4}" -f $compare.status,$compare.ahead_by,$compare.behind_by,$changedPaths.Count,$tagIsAncestor)
      $safeReuse=Test-KcsReleaseIndependentChangeSet -Status ([string]$compare.status) -ChangedPaths $changedPaths -ReportedPathCount $changedPaths.Count -AssetsComplete $true -TagIsAncestor ([bool]$tagIsAncestor)
      if(-not $safeReuse){
        $changedSummary=if($changedPaths.Count){$changedPaths -join ', '}else{'brak pełnej listy zmian'}
        throw ("Publiczne wydanie $Tag ma już własne assety i nie może być nadpisane. Zmiany od tagu zawierają pliki aplikacji/instalatora albo nie dają się bezpiecznie sklasyfikować. Nie zmieniam wersji produktu automatycznie. Zmiany: $changedSummary")
      }
      $reusePublishedRelease=$true
      Write-Host "[PASS] Zmiany od $Tag dotyczą wyłącznie strony WWW, testów, narzędzi publikacji i dokumentacji."
      Write-Host "[PASS] Pliki aplikacji i receptura instalatora nie zmieniły się względem opublikowanego tagu."
      Write-Host "[SKIP] Zachowuję wszystkie sześć publicznych assetów $Tag; lokalne artefakty nie będą nadpisywać istniejącego wydania."
    } else {
      $publishedReleaseExactMatch=$true
      Write-Host "[PASS] Wszystkie sześć lokalnych assetów jest identycznych z publicznym wydaniem $Tag."
    }
  }

  if(!$reusePublishedRelease -and !$publishedReleaseExactMatch){
    foreach($assetPath in $assets){
      $assetName=[IO.Path]::GetFileName($assetPath)
      $expectedSize=(Get-Item -LiteralPath $assetPath).Length
      $existing=@($releaseInfo.assets | Where-Object {$_.name -eq $assetName}) | Select-Object -First 1
      if($existing){
        if([long]$existing.size -ne [long]$expectedSize){throw "W istniejącym szkicu wydania jest plik $assetName o innej wielkości. Bez automatycznego nadpisywania szkicu — wymagany przegląd ręczny."}
        $checkDir=Join-Path $Stage "existing-asset-check"
        New-Item -ItemType Directory -Force -Path $checkDir | Out-Null
        $downloadResult=Invoke-GhCapture -Executable $GhPath -Arguments @("release","download",$Tag,"--repo",$Repo,"--pattern",$assetName,"--dir",$checkDir)
        if($downloadResult.ExitCode -ne 0){throw "Nie można pobrać istniejącego assetu $assetName do kontroli SHA-256. Nie nadpisuję żadnego assetu. $($downloadResult.Output.Trim())"}
        $downloaded=Join-Path $checkDir $assetName
        if(!(Test-Path -LiteralPath $downloaded -PathType Leaf)){throw "Brak pobranego assetu kontrolnego: $assetName"}
        $localHash=(Get-FileHash -LiteralPath $assetPath -Algorithm SHA256).Hash
        $remoteHash=(Get-FileHash -LiteralPath $downloaded -Algorithm SHA256).Hash
        if($localHash -ne $remoteHash){throw "Asset $assetName różni się od bieżącego pliku. Nie nadpisuję szkicu wydania; wymagany jest przegląd ręczny."}
        Write-Host "[PASS] Asset szkicu istnieje, ma właściwy rozmiar i SHA-256: $assetName"
      } else {
        if(!$releaseInfo.isDraft){throw "Opublikowane wydanie $Tag nie ma wymaganego assetu $assetName. Nie modyfikuję istniejącego wydania."}
        Write-Host "[UPLOAD] Dodaję brakujący asset szkicu: $assetName"
        $uploadResult=Invoke-GhCapture -Executable $GhPath -Arguments @("release","upload",$Tag,$assetPath,"--repo",$Repo)
        if($uploadResult.Output.Trim()){Write-Host $uploadResult.Output.TrimEnd()}
        if($uploadResult.ExitCode -ne 0){throw "Nie udało się przesłać assetu $assetName do szkicu ${Tag}: $($uploadResult.Output.Trim())"}
      }
    }
  }
  $releaseFinal=Invoke-GhCapture -Executable $GhPath -Arguments @("release","view",$Tag,"--repo",$Repo,"--json","isDraft,assets,url")
  if($releaseFinal.ExitCode -ne 0){throw "Nie można zweryfikować assetów wydania: $($releaseFinal.Output.Trim())"}
  $releaseInfo=$releaseFinal.Output | ConvertFrom-Json
  foreach($name in $requiredNames){$a=@($releaseInfo.assets | Where-Object {$_.name -eq $name}) | Select-Object -First 1;if(!$a -or [long]$a.size -le 0){throw "Brak kompletnego assetu: $name"}}
  if($releaseInfo.isDraft){
    Write-Host "[RELEASE] Wszystkie assety są obecne. Publikuję pierwsze wydanie jako najnowsze."
    $publishResult=Invoke-GhCapture -Executable $GhPath -Arguments @("release","edit",$Tag,"--repo",$Repo,"--draft=false","--latest")
    if($publishResult.ExitCode -ne 0){throw "Assety są w szkicu, ale GitHub nie opublikował wydania: $($publishResult.Output.Trim())"}
  } else {Write-Host "[INFO] Wydanie $Tag już jest publiczne i kompletne — nie nadpisuję żadnego assetu."}

  $verifyExe=Join-Path $PSHOME "powershell.exe"
  $verifyStable=Invoke-GhCapture -Executable $verifyExe -Arguments @("-NoLogo","-NoProfile","-ExecutionPolicy","Bypass","-File",(Join-Path $Root "VERIFY_GLOBAL_UPDATE_SERVER.ps1"),"-Channel","stable")
  if($verifyStable.Output.Trim()){Write-Host $verifyStable.Output.TrimEnd()}
  if($verifyStable.ExitCode -ne 0){throw "Publiczna weryfikacja GitHub Releases nie powiodła się: $($verifyStable.Output.Trim())"}
  $verifyBeta=Invoke-GhCapture -Executable $verifyExe -Arguments @("-NoLogo","-NoProfile","-ExecutionPolicy","Bypass","-File",(Join-Path $Root "VERIFY_GLOBAL_UPDATE_SERVER.ps1"),"-Channel","beta")
  if($verifyBeta.Output.Trim()){Write-Host $verifyBeta.Output.TrimEnd()}
  if($verifyBeta.ExitCode -ne 0){throw "Publiczna weryfikacja kanału Beta nie powiodła się: $($verifyBeta.Output.Trim())"}
  if($reusePublishedRelease){Write-Host "[PASS] GitHub Release $Tag pozostawiony bez zmian; publiczne assety Stable/Beta zostały ponownie zweryfikowane."}else{Write-Host "[PASS] GitHub Release $Tag publiczny; sześć assetów sprawdzonych; SHA256 instalatora=$SetupSha; portable=$PortableSha"}
  exit 0
} catch {Write-Host "[FAIL] $($_.Exception.Message)"; exit 1}
finally {Stop-Transcript | Out-Null}
