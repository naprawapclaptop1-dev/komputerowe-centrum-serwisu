$ErrorActionPreference="Stop"
$ProgressPreference="SilentlyContinue"
$Repo="naprawapclaptop1-dev/komputerowe-centrum-serwisu"
$Branch="main"
$Root=$PSScriptRoot
$LogDir=Join-Path $Root "dist\build-logs"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$Log=Join-Path $LogDir "01-github-source-sync-and-pages.log"
$Temp=Join-Path $env:TEMP ("KCS_FIX088_SourceSync_"+[guid]::NewGuid().ToString("N"))
$PageUrl="https://naprawapclaptop1-dev.github.io/komputerowe-centrum-serwisu/"
$PagesReady=$false
$TranscriptStarted=$false
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
function Invoke-NativeCapture([string]$Executable,[string[]]$Arguments){
  # ProcessStartInfo captures both native streams without PowerShell 5.1 converting stderr to terminating ErrorRecords.
  $startInfo=New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.FileName=$Executable
  $startInfo.Arguments=ConvertTo-NativeCommandLine -Arguments $Arguments
  $startInfo.UseShellExecute=$false
  $startInfo.CreateNoWindow=$true
  $startInfo.RedirectStandardOutput=$true
  $startInfo.RedirectStandardError=$true
  $startInfo.RedirectStandardInput=$true
  $process=New-Object System.Diagnostics.Process
  $process.StartInfo=$startInfo
  $started=$false
  try{
    $started=$process.Start()
    if(!$started){throw "Nie można uruchomić procesu natywnego: $Executable"}
    $process.StandardInput.Close()
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
function Invoke-NativeInteractive([string]$Executable,[string[]]$Arguments){
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

function Invoke-GitChecked([string[]]$GitArgs,[string]$Description){
  $result=Invoke-NativeCapture -Executable "git.exe" -Arguments $GitArgs
  if($result.Output.Trim()){Write-Host $result.Output.TrimEnd()}
  if($result.ExitCode -ne 0){throw "$Description (git exit=$($result.ExitCode)). Szczegoly: $($result.Output.Trim())"}
  return $result.Output
}
try {
  Start-Transcript -Path $Log -Force | Out-Null
  $TranscriptStarted=$true
  Write-Host "[INFO] FIX088 source sync / non-interactive Pages dispatch / marker-only package validation"
  Write-Host "[INFO] Folder projektu: $Root"
  $markerPath=Join-Path $Root "FIX088_PACKAGE_MARKER.txt"
  if(!(Test-Path -LiteralPath $markerPath -PathType Leaf)){throw "Brak markera FIX088. Uruchom CMD z kompletnego pakietu FIX088."}
  $markerLines=Get-Content -LiteralPath $markerPath
  if($markerLines -notcontains "PACKAGE=FIX088" -or $markerLines -notcontains "REPOSITORY=$Repo"){throw "Marker pakietu nie zgadza się z FIX088 lub przypisanym repozytorium."}
  Write-Host "[PASS] Marker FIX088 i repozytorium potwierdzone. Folder nadrzędny: $Root"
  Write-Host "[INFO] Repozytorium: $Repo / galaz $Branch"
  $RepoFile=Join-Path $Root "GITHUB_REPOSITORY.txt"
  if(!(Test-Path -LiteralPath $RepoFile)){throw "Brak GITHUB_REPOSITORY.txt — uruchom wyłącznie URUCHOM_TYLKO_TEN_PLIK.cmd."}
  if((Get-Content -LiteralPath $RepoFile -Raw).Trim() -ne $Repo){throw "Repozytorium źródeł jest inne niż przypisane do tego programu."}
  $repoMeta=Invoke-RestMethod -Headers @{"User-Agent"="KCS-FIX088";Accept="application/vnd.github+json"} -Uri "https://api.github.com/repos/$Repo" -TimeoutSec 30
  if($repoMeta.visibility -ne "public" -or $repoMeta.default_branch -ne $Branch){throw "Repozytorium musi być publiczne i używać gałęzi main. visibility=$($repoMeta.visibility), default_branch=$($repoMeta.default_branch)."}
  $gh=Get-Command gh.exe -ErrorAction SilentlyContinue
  if(!$gh){$gh=Get-Command gh -ErrorAction SilentlyContinue}
  if(!$gh){throw "GitHub CLI (gh.exe) nie jest dostępne w PATH po kroku 0/5."}
  $git=Get-Command git.exe -ErrorAction SilentlyContinue
  if(!$git){$git=Get-Command git -ErrorAction SilentlyContinue}
  if(!$git){throw "Git for Windows (git.exe) nie jest dostępny w PATH po kroku 0/5."}
  $robocopy=Get-Command robocopy.exe -ErrorAction SilentlyContinue
  if(!$robocopy){throw "Nie znaleziono robocopy.exe w Windows System32."}

  Write-Host "[AUTH] Sprawdzam uwierzytelnienie GitHub CLI (bezpieczna obsługa stderr dla Windows PowerShell 5.1)."
  $authResult=Invoke-NativeCapture -Executable $gh.Source -Arguments @("auth","status","--hostname","github.com")
  $authInfo=$authResult.Output
  if($authResult.ExitCode -ne 0){
    if($authInfo.Trim()){Write-Host $authInfo.TrimEnd()}
    Write-Host "[AUTH] Brak aktywnej sesji. Otwieram jednorazowe logowanie urządzenia GitHub."
    Write-Host "[AUTH] Kod i adres logowania pojawią się poniżej. Wpisz kod na stronie GitHub i zatwierdź dostęp."
    Write-Host "[AUTH] Nie zamykaj tego okna CMD — gh auth login czeka na zatwierdzenie i sam wznowi pracę."
    $loginCode=Invoke-NativeInteractive -Executable $gh.Source -Arguments @("auth","login","--web","--git-protocol","https","--hostname","github.com","--scopes","repo,workflow")
    if($loginCode -ne 0){throw "Logowanie GitHub nie zostało zakończone (gh auth login exit=$loginCode). Uruchom ponownie ten sam CMD po zalogowaniu."}
    $authResult=Invoke-NativeCapture -Executable $gh.Source -Arguments @("auth","status","--hostname","github.com")
    $authInfo=$authResult.Output
    if($authResult.ExitCode -ne 0){throw "Po zakończeniu logowania GitHub CLI nadal nie potwierdza sesji: $($authInfo.Trim())"}
  }
  Write-Host "[AUTH] Aktywna sesja GitHub CLI potwierdzona."
  if($authInfo -match '(?i)token scopes:'){
    if($authInfo -notmatch '(?i)\brepo\b' -or $authInfo -notmatch '(?i)\bworkflow\b'){
      Write-Host "[AUTH] Token nie ma wymaganych zakresów. Rozszerzam o repo i workflow; może otworzyć się przeglądarka."
      $refreshCode=Invoke-NativeInteractive -Executable $gh.Source -Arguments @("auth","refresh","--hostname","github.com","--scopes","repo,workflow")
      if($refreshCode -ne 0){throw "Nie uzyskano wymaganych zakresów repo/workflow (gh auth refresh exit=$refreshCode)."}
      $authResult=Invoke-NativeCapture -Executable $gh.Source -Arguments @("auth","status","--hostname","github.com")
      $authInfo=$authResult.Output
      if($authResult.ExitCode -ne 0 -or $authInfo -notmatch '(?i)\brepo\b' -or $authInfo -notmatch '(?i)\bworkflow\b'){throw "Nie potwierdzono zakresów repo/workflow po odświeżeniu tokena: $($authInfo.Trim())"}
    }
  }
  $setupGitCode=Invoke-NativeInteractive -Executable $gh.Source -Arguments @("auth","setup-git","--hostname","github.com")
  if($setupGitCode -ne 0){throw "Nie udało się skonfigurować uwierzytelniania Git: gh auth setup-git (exit=$setupGitCode)."}
  $loginResult=Invoke-NativeCapture -Executable $gh.Source -Arguments @("api","user","--jq",".login")
  $login=$loginResult.Output.Trim()
  if($loginResult.ExitCode -ne 0 -or [string]::IsNullOrWhiteSpace($login)){throw "Nie można ustalić konta zalogowanego w GitHub CLI: $login"}
  $permissionResult=Invoke-NativeCapture -Executable $gh.Source -Arguments @("api","repos/$Repo","--jq",".permissions.push")
  $canPush=$permissionResult.Output.Trim()
  if($permissionResult.ExitCode -ne 0){throw "Nie można odczytać uprawnień do repozytorium $($Repo): $canPush"}
  if($canPush -ne "true"){
    $viewerResult=Invoke-NativeCapture -Executable $gh.Source -Arguments @("repo","view",$Repo,"--json","viewerPermission","--jq",".viewerPermission")
    $viewer=$viewerResult.Output.Trim()
    throw "Konto GitHub '$login' nie ma uprawnień zapisu do $Repo (permissions.push=$canPush, viewerPermission=$viewer). Zaloguj się kontem właściciela lub współpracownika z prawem Write."
  }
  Write-Host "[PASS] Konto: $login; repozytorium ma potwierdzone uprawnienie zapisu."

  Write-Host "[GITHUB] Klonuję bieżącą gałąź $Branch z core.longpaths=true (bez cache .tools)."
  $cloneResult=Invoke-NativeCapture -Executable $git.Source -Arguments @("-c","core.longpaths=true","clone","--branch",$Branch,"--single-branch","--no-tags","https://github.com/$Repo.git",$Temp)
  if($cloneResult.Output.Trim()){Write-Host $cloneResult.Output.TrimEnd()}
  if($cloneResult.ExitCode -ne 0){throw "git clone nie powiódł się (kod=$($cloneResult.ExitCode)): $($cloneResult.Output.Trim())"}
  Invoke-GitChecked @("-C",$Temp,"config","user.name",$login) "Nie udało się ustawić autora commitu"
  $uidResult=Invoke-NativeCapture -Executable $gh.Source -Arguments @("api","user","--jq",".id")
  $uid=$uidResult.Output.Trim()
  if($uidResult.ExitCode -ne 0 -or !$uid){throw "Nie można odczytać identyfikatora konta GitHub: $($uidResult.Output.Trim())"}
  Invoke-GitChecked @("-C",$Temp,"config","user.email",($uid+"+"+$login+"@users.noreply.github.com")) "Nie udało się ustawić adresu autora commitu"
  Invoke-GitChecked @("-C",$Temp,"config","core.longpaths","true") "Nie udało się włączyć obsługi długich ścieżek"
  Invoke-GitChecked @("-C",$Temp,"config","core.autocrlf","false") "Nie udało się ustawić stabilnego kodowania końców linii Git"

  $exclude=@("dist","GlobalUpdateServer","node_modules",".tools","bin","obj",".vs",".idea",".git")
  $xd=@(); foreach($name in $exclude){$xd+=@("/XD",(Join-Path $Root $name))}
  $xf=@("*.zip","*.7z","*.exe","*.dll","*.pdb","*.msi","*.log","*.tmp","*.new","*.pfx","*.p12","*.key","*.pem",".env",".env.*","README.md","POLITYKA_PUBLIKACJI.md")
  $robocopyArgs=@($Root,$Temp,"/E","/COPY:DAT","/DCOPY:DAT","/R:2","/W:2","/XJ","/FFT","/NP","/TEE","/LOG+:$(Join-Path $LogDir '01-robocopy-source-sync.log')","/XF")+$xf+$xd
  Write-Host "[COPY] Synchronizuję pliki projektu i witrynę; zachowuję README.md oraz POLITYKA_PUBLIKACJI.md z repozytorium."
  $roboResult=Invoke-NativeCapture -Executable $robocopy.Source -Arguments $robocopyArgs
  $roboCode=$roboResult.ExitCode
  if($roboCode -ge 8){
    if($roboResult.Output.Trim()){Write-Host $roboResult.Output.TrimEnd()}
    throw "Robocopy nie zakończył synchronizacji (kod=$roboCode). Szczegóły: $(Join-Path $LogDir '01-robocopy-source-sync.log')"
  }
  Write-Host "[PASS] Robocopy zakończył synchronizację (kod=$roboCode). Szczegóły: $(Join-Path $LogDir '01-robocopy-source-sync.log')"

  $gitIgnore=Join-Path $Temp ".gitignore"
  $ignoreRules=@("dist/","GlobalUpdateServer/",".tools/","*.log","*.tmp","*.new","*.bak","*.user","*.pfx","*.p12","*.key","*.pem",".env",".env.*")
  if(Test-Path -LiteralPath $gitIgnore){$existingIgnore=Get-Content -LiteralPath $gitIgnore -ErrorAction SilentlyContinue;foreach($rule in $ignoreRules){if($existingIgnore -notcontains $rule){Add-Content -LiteralPath $gitIgnore -Value $rule -Encoding ASCII}}}
  else {$ignoreRules | Set-Content -LiteralPath $gitIgnore -Encoding ASCII}
  # The previous run accidentally committed a local npm/Wrangler cache. Remove only its Git index entries;
  # the user's original .tools folder is excluded from Robocopy and is never deleted.
  $untrackCache=Invoke-NativeCapture -Executable $git.Source -Arguments @("-C",$Temp,"rm","-r","--cached","--ignore-unmatch",".tools")
  if($untrackCache.ExitCode -ne 0){throw "Nie udało się usunąć lokalnego cache .tools z indeksu Git: $($untrackCache.Output.Trim())"}
  Invoke-GitChecked @("-C",$Temp,"add","-A") "git add zakończył się błędem"
  $statusResult=Invoke-NativeCapture -Executable $git.Source -Arguments @("-C",$Temp,"status","--porcelain")
  $changes=$statusResult.Output.Trim()
  if($statusResult.ExitCode -ne 0){throw "git status nie powiódł się: $changes"}
  if($changes){
    Write-Host "[GIT] Tworzę commit źródeł, strony i workflow Pages."
    Invoke-GitChecked @("-C",$Temp,"commit","-m","FIX088: non-interactive Pages dispatch and cache-safe source sync") "Nie udało się utworzyć commitu źródeł"
    $pushResult=Invoke-NativeCapture -Executable $git.Source -Arguments @("-C",$Temp,"push","origin","HEAD:refs/heads/$Branch")
    $pushOut=$pushResult.Output; $pushCode=$pushResult.ExitCode
    if($pushOut.Trim()){Write-Host $pushOut.TrimEnd()}
    if($pushCode -ne 0){
      if($pushOut -match '(?i)non-fast-forward|fetch first|rejected|failed to push some refs'){
        Write-Warning "Wykryto równoległą zmianę gałęzi. Pobieram aktualny main i próbuję bezpiecznego rebase."
        Invoke-GitChecked @("-C",$Temp,"fetch","origin",$Branch) "Nie udało się pobrać najnowszej gałęzi po konflikcie push"
        $rebaseResult=Invoke-NativeCapture -Executable $git.Source -Arguments @("-C",$Temp,"rebase","origin/$Branch")
        $rebaseOut=$rebaseResult.Output; $rebaseCode=$rebaseResult.ExitCode
        if($rebaseOut.Trim()){Write-Host $rebaseOut.TrimEnd()}
        if($rebaseCode -ne 0){$null=Invoke-NativeCapture -Executable $git.Source -Arguments @("-C",$Temp,"rebase","--abort");throw "Rebase nie powiódł się; nie nadpisano zdalnej gałęzi. Szczegóły: $($rebaseOut.Trim())"}
        $pushResult=Invoke-NativeCapture -Executable $git.Source -Arguments @("-C",$Temp,"push","origin","HEAD:refs/heads/$Branch")
        $pushOut=$pushResult.Output; $pushCode=$pushResult.ExitCode
        if($pushOut.Trim()){Write-Host $pushOut.TrimEnd()}
      }
      if($pushCode -ne 0){throw "git push origin $Branch nie powiódł się (kod=$pushCode). Konto=$login; repo=$Repo; permissions.push=$canPush. Odpowiedź Git: $($pushOut.Trim())"}
    }
    Write-Host "[PASS] Źródła, strona, film i workflow Pages wysłane do GitHub."
  } else {Write-Host "[PASS] Repozytorium zawiera już aktualne pliki; pomijam pusty commit."}
  Write-Host "[PASS] Zachowano istniejące README.md i POLITYKA_PUBLIKACJI.md."

  try {
    $pagesResult=Invoke-NativeCapture -Executable $gh.Source -Arguments @("api","repos/$Repo/pages")
    $pagesRaw=$pagesResult.Output; $pagesExit=$pagesResult.ExitCode
    if($pagesExit -ne 0){
      Write-Host "[PAGES] Włączam bezpłatny GitHub Pages w trybie Actions."
      $pagesResult=Invoke-NativeCapture -Executable $gh.Source -Arguments @("api","--method","POST","repos/$Repo/pages","-H","Accept: application/vnd.github+json","-H","X-GitHub-Api-Version: 2026-03-10","-f","build_type=workflow","-f","source[branch]=$Branch","-f","source[path]=/")
      $pagesRaw=$pagesResult.Output
      if($pagesResult.ExitCode -ne 0){
        $pagesCheckResult=Invoke-NativeCapture -Executable $gh.Source -Arguments @("api","repos/$Repo/pages")
        if($pagesCheckResult.ExitCode -ne 0){throw "GitHub Pages API odrzuciło konfigurację: $($pagesRaw.Trim())"}
        $pagesRaw=$pagesCheckResult.Output
      }
    } else {
      $pagesObject=$pagesRaw | ConvertFrom-Json
      if($pagesObject.build_type -ne "workflow"){
        $pagesResult=Invoke-NativeCapture -Executable $gh.Source -Arguments @("api","--method","PUT","repos/$Repo/pages","-H","Accept: application/vnd.github+json","-H","X-GitHub-Api-Version: 2026-03-10","-f","build_type=workflow","-f","source[branch]=$Branch","-f","source[path]=/")
        $pagesRaw=$pagesResult.Output
        if($pagesResult.ExitCode -ne 0){throw "Nie udało się ustawić Pages na GitHub Actions: $($pagesRaw.Trim())"}
      }
    }
    $pagesVerifyResult=Invoke-NativeCapture -Executable $gh.Source -Arguments @("api","repos/$Repo/pages")
    $pagesVerify=$pagesVerifyResult.Output
    if($pagesVerifyResult.ExitCode -ne 0){throw "Nie można potwierdzić ustawień Pages: $($pagesVerify.Trim())"}
    $pagesObject=$pagesVerify | ConvertFrom-Json
    if($pagesObject.build_type -ne "workflow"){throw "GitHub Pages nie jest skonfigurowane dla GitHub Actions (build_type=$($pagesObject.build_type))."}
    $PagesReady=$true
    Set-Content -LiteralPath (Join-Path $Root "PAGES_DEPLOYMENT.status") -Value "CONFIGURED" -Encoding ASCII
    Write-Host "[PASS] Darmowy GitHub Pages skonfigurowany: $PageUrl"
  } catch {
    Set-Content -LiteralPath (Join-Path $Root "PAGES_DEPLOYMENT.status") -Value "PENDING" -Encoding ASCII
    throw ("Nie udało się utworzyć ani skonfigurować witryny GitHub Pages przy użyciu zalogowanego konta gh. " + $_.Exception.Message + " Wymagane: konto administratora repozytorium i token klasyczny z zakresem repo albo token fine-grained z Pages:write oraz Administration:write. Alternatywnie ustaw jednorazowo Settings > Pages > Build and deployment > Source: GitHub Actions.")
  }
  if($PagesReady){
    Write-Host "[PAGES] Uruchamiam workflow deploy-pages.yml bez interaktywnego procesu; przechwytuję stdout, stderr i kod wyjścia."
    $workflowDispatchResult=Invoke-NativeCapture -Executable $gh.Source -Arguments @("workflow","run","deploy-pages.yml","--repo",$Repo,"--ref",$Branch)
    if($workflowDispatchResult.Output.Trim()){Write-Host $workflowDispatchResult.Output.TrimEnd()}
    if($workflowDispatchResult.ExitCode -ne 0){
      $workflowListResult=Invoke-NativeCapture -Executable $gh.Source -Arguments @("workflow","list","--repo",$Repo,"--all")
      $workflowListOutput=$workflowListResult.Output.Trim()
      if($workflowListResult.Output.Trim()){Write-Host $workflowListResult.Output.TrimEnd()}
      throw "Nie udało się uruchomić wdrożenia GitHub Pages bez interakcji (gh exit=$($workflowDispatchResult.ExitCode)). Odpowiedź gh: $($workflowDispatchResult.Output.Trim()). Lista workflow: $workflowListOutput"
    }
    Set-Content -LiteralPath (Join-Path $Root "PAGES_DEPLOYMENT.status") -Value "TRIGGERED" -Encoding ASCII
    Write-Host "[PASS] Wysłano żądanie wdrożenia GitHub Pages; szczegółowy status będzie sprawdzony w kroku 4/5."
  }
  Set-Content -LiteralPath (Join-Path $Root "GITHUB_PAGES_URL.txt") -Value $PageUrl -Encoding ASCII
  Write-Host "[PASS] Etap synchronizacji źródeł zakończony."
  exit 0
} catch {
  Write-Host "[FAIL] Synchronizacja źródeł GitHub: $($_.Exception.Message)"
  Write-Host "[INFO] Repozytorium: $Repo"
  Write-Host "[INFO] Konto CLI: $login"
  Write-Host "[INFO] Folder źródłowy: $Root"
  Write-Host "[INFO] Log szczegółowy: $Log"
  exit 1
} finally {
  if(Test-Path $Temp){Remove-Item -LiteralPath $Temp -Recurse -Force -ErrorAction SilentlyContinue}
  if($TranscriptStarted){Stop-Transcript | Out-Null}
}
