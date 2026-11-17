param(
    [string]$InstallerPath = "",
    [ValidateSet("stable","beta","both")][string]$Channel = "both"
)
$ErrorActionPreference = "Stop"

$ProjectName = "kcs-rj2026-updates"
$BucketName = "kcs-rj2026-updates-store"
$PagesHost = "kcs-rj2026-updates.pages.dev"
$BaseUrl = "https://kcs-rj2026-updates.pages.dev/updates/"
$Version = "1.0.0.68"
$Fix = "FIX068"
$PackageName = "KomputeroweCentrumSerwisu_FIX068_INSTALATOR.exe"
$CatalogName = "releases.json"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$CfRoot = Join-Path $ScriptRoot "cloudflare"
$PublicRoot = Join-Path $CfRoot "public"
$StageRoot = Join-Path $ScriptRoot "GlobalUpdateServer"
$ProjectConfig = Join-Path $CfRoot "wrangler.toml"
$LogDir = Join-Path $ScriptRoot "dist\build-logs"
if (-not (Test-Path -LiteralPath $LogDir -PathType Container)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}
$PublishLog = Join-Path $LogDir "01-cloudflare-publish.log"
try { Start-Transcript -Path $PublishLog -Force | Out-Null } catch {}

function Stop-Build([string]$Message) {
    throw $Message
}

function Quote-CommandArgument([string]$Value) {
    if ($Value.Contains('"')) {
        throw "Argument zawiera niedozwolony znak cudzysłowu: $Value"
    }
    if ($Value -match '[\s&|<>^()]') { return '"' + $Value + '"' }
    return $Value
}

function Invoke-CapturedProcess {
    param(
        [Parameter(Mandatory=$true)][string]$FilePath,
        [Parameter(Mandatory=$true)][string[]]$Arguments,
        [string]$WorkingDirectory = $ScriptRoot,
        [switch]$CommandScript,
        [switch]$Interactive
    )

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = (-not $Interactive)
    $psi.RedirectStandardOutput = (-not $Interactive)
    $psi.RedirectStandardError = (-not $Interactive)
    $psi.WorkingDirectory = $WorkingDirectory

    if ($CommandScript) {
        $quotedScript = Quote-CommandArgument $FilePath
        $quotedArgs = @()
        foreach ($arg in $Arguments) { $quotedArgs += (Quote-CommandArgument ([string]$arg)) }
        $inner = $quotedScript
        if ($quotedArgs.Count -gt 0) { $inner += " " + ($quotedArgs -join " ") }
        $psi.FileName = $env:ComSpec
        $psi.Arguments = '/d /s /c "' + $inner + '"'
    }
    else {
        $psi.FileName = $FilePath
        $quotedArgs = @()
        foreach ($arg in $Arguments) { $quotedArgs += (Quote-CommandArgument ([string]$arg)) }
        $psi.Arguments = ($quotedArgs -join " ")
    }

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $psi
    try {
        if (-not $process.Start()) {
            return [pscustomobject]@{ ExitCode = 9009; StdOut = ""; StdErr = "Nie udało się uruchomić procesu." }
        }
        if ($Interactive) {
            # Interactive Cloudflare OAuth keeps the parent CMD console attached so
            # Wrangler can display a fallback login URL if the browser does not open.
            $process.WaitForExit()
            return [pscustomobject]@{ ExitCode = [int]$process.ExitCode; StdOut = ""; StdErr = "" }
        }
        # Read both streams asynchronously: npm warnings on stderr must never be treated
        # as PowerShell terminating errors. The process exit code decides success/failure.
        $stdoutTask = $process.StandardOutput.ReadToEndAsync()
        $stderrTask = $process.StandardError.ReadToEndAsync()
        $process.WaitForExit()
        $stdout = $stdoutTask.Result
        $stderr = $stderrTask.Result
        return [pscustomobject]@{
            ExitCode = [int]$process.ExitCode
            StdOut = [string]$stdout
            StdErr = [string]$stderr
        }
    }
    finally {
        $process.Dispose()
    }
}

function Invoke-Wrangler {
    param(
        [Parameter(Mandatory=$true)][string[]]$Arguments,
        [switch]$AllowFailure,
        [switch]$Interactive,
        [string]$WorkingDirectory = $ScriptRoot
    )

    Write-Host ("[CLOUDFLARE] wrangler " + ($Arguments -join " ")) -ForegroundColor Cyan
    $result = Invoke-CapturedProcess -FilePath $WranglerCmd `
        -Arguments $Arguments `
        -WorkingDirectory $WorkingDirectory -CommandScript -Interactive:$Interactive

    if (-not [string]::IsNullOrWhiteSpace($result.StdOut)) {
        foreach ($line in ($result.StdOut -split "`r?`n")) {
            if (-not [string]::IsNullOrWhiteSpace($line)) { Write-Host $line }
        }
    }
    if (-not [string]::IsNullOrWhiteSpace($result.StdErr)) {
        foreach ($line in ($result.StdErr -split "`r?`n")) {
            if (-not [string]::IsNullOrWhiteSpace($line)) {
                # npm cleanup warnings are diagnostics; they are not a failure if Wrangler exits 0.
                Write-Host ("[NPM / WRANGLER STDERR] " + $line) -ForegroundColor DarkYellow
            }
        }
    }

    if ($result.ExitCode -ne 0 -and -not $AllowFailure) {
        $details = ($result.StdErr + "`r`n" + $result.StdOut).Trim()
        if ($details.Length -gt 1800) { $details = $details.Substring($details.Length-1800) }
        throw ("Wrangler zakończył się kodem {0}: {1}`r`n{2}" -f $result.ExitCode,($Arguments -join " "),$details)
    }
    return $result
}

function Wait-CloudflareHealth {
    param([int]$Attempts = 36,[int]$DelaySeconds = 5,[switch]$RequireManifests)
    $healthUrl = $BaseUrl + "health"
    for ($i=1; $i -le $Attempts; $i++) {
        Write-Host ("[DNS/HTTPS] Próba {0}/{1}: {2}" -f $i,$Attempts,$healthUrl) -ForegroundColor DarkCyan
        try {
            $addresses = [System.Net.Dns]::GetHostAddresses($PagesHost)
            if ($addresses.Count -eq 0) { throw "DNS nie zwrócił adresów IP." }
            $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 15
            if ($response.StatusCode -eq 200) {
                $health = $response.Content | ConvertFrom-Json
                if ($health.ok -eq $true -and $health.r2Binding -eq $true) {
                    if ($RequireManifests -and (-not $health.stableManifest -or -not $health.betaManifest -or -not $health.releaseCatalog -or -not $health.latestPackage)) {
                        throw ("R2 nie jest kompletne: Stable={0}, Beta={1}, katalog={2}, najnowszy instalator={3}." -f $health.stableManifest,$health.betaManifest,$health.releaseCatalog,$health.latestPackage)
                    }
                    $manifestText = if ($RequireManifests) { "Stable + Beta + katalog wydań + instalator obecne." } else { "endpoint i binding aktywne." }
                    Write-Host ("[PASS] DNS działa: {0}; HTTPS 200; R2 aktywne; {1}" -f (($addresses | ForEach-Object {$_.IPAddressToString}) -join ", "),$manifestText) -ForegroundColor Green
                    return $health
                }
                throw "Pages odpowiada, ale binding R2 UPDATES nie jest aktywny."
            }
        }
        catch {
            $reason = $_.Exception.Message
            Write-Host ("[WAIT] {0}" -f $reason) -ForegroundColor DarkYellow
            if ($i -lt $Attempts) { Start-Sleep -Seconds $DelaySeconds }
        }
    }
    throw ("Cloudflare Pages nie jest dostępny pod {0}. DNS/HTTPS/Pages Function nie potwierdziły działania po {1} próbach. Projekt musi mieć produkcyjne wdrożenie, a pages.dev musi być aktywne na koncie Cloudflare." -f $PagesHost,$Attempts)
}

function Test-PublicManifest {
    param([string]$ManifestName,[string]$ExpectedSha,[string]$ExpectedSignerThumbprint)
    $manifestUrl = $BaseUrl + $ManifestName
    $response = Invoke-WebRequest -Uri $manifestUrl -UseBasicParsing -TimeoutSec 45
    if ($response.StatusCode -ne 200) { throw "Manifest nie zwrócił HTTP 200: $manifestUrl" }
    [xml]$xml = $response.Content
    if ($xml.Update.version -ne $Version) { throw "Zła wersja w manifeście: $manifestUrl" }
    if ($xml.Update.sha256 -ne $ExpectedSha) { throw "SHA-256 manifestu nie zgadza się z opublikowanym instalatorem: $manifestUrl" }
    $expectedChannel = $ManifestName.Replace("manifest-","").Replace(".xml","")
    if ($xml.Update.channel -ne $expectedChannel) { throw "Manifest ma nieprawidłowy kanał: $manifestUrl" }
    $manifestSigner = ([string]$xml.Update.signerThumbprint -replace '\s','').ToUpperInvariant()
    $expectedSigner = ([string]$ExpectedSignerThumbprint -replace '\s','').ToUpperInvariant()
    if ($expectedSigner -and $manifestSigner -ne $expectedSigner) {
        throw "Odcisk certyfikatu w manifeście nie zgadza się z podpisanym instalatorem: $manifestUrl"
    }
    if (-not $expectedSigner -and $manifestSigner) {
        throw "Manifest zawiera nieoczekiwany odcisk certyfikatu, którego nie potwierdzono w instalatorze: $manifestUrl"
    }
    Write-Host ("[PASS] Manifest {0} | wersja {1} | SHA-256 i odcisk certyfikatu zgodne" -f $ManifestName,$Version) -ForegroundColor Green
    return $xml
}

function New-UpdateManifest([string]$ManifestChannel,[string]$Installer,[string]$OutputPath,[string]$SignerThumbprint) {
    $sha = (Get-FileHash -LiteralPath $Installer -Algorithm SHA256).Hash.ToLowerInvariant()
    $packageUrl = $BaseUrl + $PackageName
    $doc = New-Object System.Xml.XmlDocument
    $decl = $doc.CreateXmlDeclaration("1.0","utf-8",$null)
    [void]$doc.AppendChild($decl)
    $update = $doc.CreateElement("Update")
    [void]$doc.AppendChild($update)
    $update.SetAttribute("version",$Version)
    $update.SetAttribute("channel",$ManifestChannel)
    $update.SetAttribute("region","global")
    $update.SetAttribute("language","all")
    $update.SetAttribute("architecture","any")
    $update.SetAttribute("packageUrl",$packageUrl)
    $update.SetAttribute("sha256",$sha)
    if (-not [string]::IsNullOrWhiteSpace($SignerThumbprint)) { $update.SetAttribute("signerThumbprint",($SignerThumbprint -replace '\s','').ToUpperInvariant()) }
    $pl = $doc.CreateElement("Notes"); $pl.SetAttribute("lang","pl")
    $pl.InnerText="Wydanie $Version ($Fix) — Komputerowe Centrum Serwisu"; [void]$update.AppendChild($pl)
    $en = $doc.CreateElement("Notes"); $en.SetAttribute("lang","en")
    $en.InnerText="Release $Version ($Fix) — Computer Service Center"; [void]$update.AppendChild($en)
    [void]$update.AppendChild($doc.CreateElement("Mirrors"))
    $settings = New-Object System.Xml.XmlWriterSettings
    $settings.Indent = $true
    $settings.Encoding = New-Object System.Text.UTF8Encoding($false)
    $writer = [System.Xml.XmlWriter]::Create($OutputPath,$settings)
    try { $doc.Save($writer) } finally { $writer.Dispose() }
    return $sha
}

if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) {
    Stop-Build "Nie znaleziono Node.js. Zainstaluj Node.js LTS."
}
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    Stop-Build "Nie znaleziono npm.cmd. Napraw instalację Node.js."
}
$npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
if ($null -eq $npm -or [string]::IsNullOrWhiteSpace($npm.Source)) {
    Stop-Build "Nie znaleziono npm.cmd. Napraw instalację Node.js/npm."
}
$NpmPath = $npm.Source
$WranglerHome = Join-Path $ScriptRoot ".tools\wrangler"
$WranglerCache = Join-Path $WranglerHome "npm-cache"
$WranglerCmd = Join-Path $WranglerHome "node_modules\.bin\wrangler.cmd"
if (-not (Test-Path -LiteralPath $WranglerCmd -PathType Leaf)) {
    Write-Host "[SETUP] Instaluję Wrangler lokalnie w folderze programu (bez tymczasowego npx)..." -ForegroundColor Cyan
    if (-not (Test-Path -LiteralPath $WranglerHome -PathType Container)) {
        New-Item -ItemType Directory -Path $WranglerHome -Force | Out-Null
    }
    $npmInstall = Invoke-CapturedProcess -FilePath $NpmPath -Arguments @("install","--prefix",$WranglerHome,"--cache",$WranglerCache,"--no-audit","--no-fund","--no-save","wrangler@4") -WorkingDirectory $ScriptRoot -CommandScript
    if ($npmInstall.ExitCode -ne 0 -or -not (Test-Path -LiteralPath $WranglerCmd -PathType Leaf)) {
        $npmDetails = ($npmInstall.StdErr + "`r`n" + $npmInstall.StdOut).Trim()
        if ($npmDetails.Length -gt 1600) { $npmDetails = $npmDetails.Substring($npmDetails.Length-1600) }
        Stop-Build ("Nie udało się przygotować lokalnego Wrangler v4. Kod={0}. {1}" -f $npmInstall.ExitCode,$npmDetails)
    }
    Write-Host "[PASS] Wrangler v4 gotowy — będzie używany ponownie przy kolejnych publikacjach." -ForegroundColor Green
}

if (-not (Test-Path -LiteralPath $ProjectConfig -PathType Leaf)) {
    Stop-Build "Brak konfiguracji Cloudflare: $ProjectConfig"
}
if (-not (Test-Path -LiteralPath $PublicRoot -PathType Container)) {
    Stop-Build "Brak katalogu Pages public: $PublicRoot"
}

if ([string]::IsNullOrWhiteSpace($InstallerPath)) {
    $InstallerPath = Join-Path $ScriptRoot "dist\installers\$PackageName"
}
if (-not (Test-Path -LiteralPath $InstallerPath -PathType Leaf)) {
    Stop-Build "Nie znaleziono instalatora FIX068: $InstallerPath. Najpierw uruchom URUCHOM_WSZYSTKO.cmd z folderu źródłowego."
}
if ([IO.Path]::GetExtension($InstallerPath) -ne ".exe") {
    Stop-Build "Do aktualizacji można publikować tylko instalator EXE."
}

# Require the build stamp created by the current build and recheck the source hash.
$stampPath = Join-Path ([IO.Path]::GetDirectoryName($InstallerPath)) "SETUP_BUILD_ID.txt"
if (-not (Test-Path -LiteralPath $stampPath -PathType Leaf)) {
    Stop-Build "Brak SETUP_BUILD_ID.txt. Odmowa publikacji pliku bez potwierdzonego pochodzenia."
}
$verifyArgs = @(
    "-NoProfile","-ExecutionPolicy","Bypass",
    "-File",(Join-Path $ScriptRoot "VERIFY_PAYLOAD.ps1"),
    "-ExePath",$InstallerPath,
    "-ExpectedVersion",$Version,
    "-ExpectedFix",$Fix,
    "-StampPath",$stampPath,
    "-SourceRoot",$ScriptRoot,
    "-CheckStamp"
)
$verifyResult = Invoke-CapturedProcess -FilePath (Join-Path $PSHOME "powershell.exe") -Arguments $verifyArgs -WorkingDirectory $ScriptRoot
if ($verifyResult.ExitCode -ne 0) {
    Stop-Build ("Instalator nie przeszedł kontroli pochodzenia FIX068. " + $verifyResult.StdOut + " " + $verifyResult.StdErr)
}
if (-not [string]::IsNullOrWhiteSpace($verifyResult.StdOut)) { Write-Host $verifyResult.StdOut.Trim() -ForegroundColor Green }

$fileVersion = [Diagnostics.FileVersionInfo]::GetVersionInfo($InstallerPath).FileVersion
if ([string]::IsNullOrWhiteSpace($fileVersion) -or $fileVersion.Trim() -ne $Version) {
    Stop-Build "FileVersion instalatora [$fileVersion] nie zgadza się z oczekiwaną wersją [$Version]."
}

Write-Host ""
Write-Host "KOMPUTEROWE CENTRUM SERWISU — PUBLIKACJA CLOUDFLARE FREE" -ForegroundColor Cyan
Write-Host "Pages: https://$ProjectName.pages.dev"
Write-Host "R2 bucket: $BucketName"
Write-Host "Installer: $InstallerPath"
Write-Host "Source root: $ScriptRoot"
Write-Host ""

# Authenticate once. A non-zero exit from whoami triggers the browser login flow.
$who = Invoke-Wrangler -Arguments @("whoami") -AllowFailure
if ($who.ExitCode -ne 0 -or (($who.StdOut + "`n" + $who.StdErr) -match "not authenticated|not logged in|login required|not logged")) {
    Write-Host "[INFO] Brak aktywnej sesji. Otwieram logowanie Cloudflare w przeglądarce..." -ForegroundColor Yellow
    $login = Invoke-Wrangler -Arguments @("login") -AllowFailure -Interactive
    # Verify the persisted OAuth session, rather than trusting only the interactive wrapper exit code.
    $who = Invoke-Wrangler -Arguments @("whoami") -AllowFailure
    if ($who.ExitCode -ne 0) {
        Stop-Build "Logowanie Cloudflare nie zostało potwierdzone. Dokończ autoryzację w przeglądarce i uruchom ponownie TEN SAM URUCHOM_WSZYSTKO.cmd. Sesja nie została uznana za aktywną."
    }
    if ($login.ExitCode -ne 0) {
        Write-Host "[WARN] Wrangler login zwrócił kod $($login.ExitCode), ale whoami potwierdził zapisaną sesję OAuth — kontynuuję." -ForegroundColor Yellow
    }
    Write-Host "[PASS] Sesja Cloudflare OAuth aktywna." -ForegroundColor Green
}

# Create the R2 bucket only when it is missing.
$bucketResult = Invoke-Wrangler -Arguments @("r2","bucket","list") -AllowFailure
if ($bucketResult.ExitCode -ne 0) { Stop-Build "Nie udało się pobrać listy bucketów R2." }
if (($bucketResult.StdOut + "`n" + $bucketResult.StdErr) -notmatch [regex]::Escape($BucketName)) {
    $createBucket = Invoke-Wrangler -Arguments @("r2","bucket","create",$BucketName)
    if ($createBucket.ExitCode -ne 0) { Stop-Build "Nie udało się utworzyć bucketu R2." }
}

# Create the Pages project only when it is missing.
$pagesResult = Invoke-Wrangler -Arguments @("pages","project","list","--json") -AllowFailure
if ($pagesResult.ExitCode -ne 0) { Stop-Build "Nie udało się pobrać listy projektów Pages." }
if (($pagesResult.StdOut + "`n" + $pagesResult.StdErr) -notmatch [regex]::Escape($ProjectName)) {
    $createPages = Invoke-Wrangler -Arguments @("pages","project","create",$ProjectName,"--production-branch","main")
    if ($createPages.ExitCode -ne 0) {
        Stop-Build "Nie udało się utworzyć projektu Pages [$ProjectName]. Możliwe, że nazwa pages.dev jest już zajęta na świecie; wybierz wolną nazwę projektu."
    }
}

# Deploy Pages static assets and its R2 binding from cloudflare/wrangler.toml.
$deploy = Invoke-Wrangler -Arguments @("pages","deploy","public","--project-name",$ProjectName,"--branch","main","--config","wrangler.toml","--commit-dirty=true") -WorkingDirectory $CfRoot
if ($deploy.ExitCode -ne 0) { Stop-Build "Wdrożenie Cloudflare Pages nie powiodło się." }

# Confirm that Wrangler produced a production deployment, not only a project shell.
$deploymentList = Invoke-Wrangler -Arguments @("pages","deployment","list","--project-name",$ProjectName,"--json") -AllowFailure
if ($deploymentList.ExitCode -ne 0) { Stop-Build "Nie udało się odczytać listy wdrożeń Pages po publikacji." }
$deploymentJson = $deploymentList.StdOut.Trim()
if ([string]::IsNullOrWhiteSpace($deploymentJson)) {
    Stop-Build "Cloudflare nie zwrócił listy wdrożeń Pages. Nie publikuję do nieaktywnego projektu."
}
try { $deploymentItems = @($deploymentJson | ConvertFrom-Json -ErrorAction Stop) }
catch { Stop-Build ("Nie można odczytać JSON listy wdrożeń Pages: " + $_.Exception.Message) }
$productionDeployments = @($deploymentItems | Where-Object { [string]$_.Environment -ieq "Production" })
if ($productionDeployments.Count -eq 0) {
    Stop-Build "Cloudflare nie potwierdził wdrożenia Production. Nie publikuję manifestu do nieaktywnego projektu."
}

# Upload the R2 payloads immediately after the production deploy; DNS propagation is checked afterwards.
# This avoids delaying or aborting the R2 upload just because the fresh pages.dev record is still propagating.

# Stage the verified installer and generate Stable/Beta manifests.
New-Item -ItemType Directory -Path $StageRoot -Force | Out-Null
$stagedInstaller = Join-Path $StageRoot $PackageName
Copy-Item -LiteralPath $InstallerPath -Destination $stagedInstaller -Force
$sha = (Get-FileHash -LiteralPath $stagedInstaller -Algorithm SHA256).Hash.ToLowerInvariant()

# Read the signature embedded in the installer. Signing is optional until a publisher
# certificate exists in the Windows certificate store.
$SignerThumbprint = ""
$signature = Get-AuthenticodeSignature -LiteralPath $stagedInstaller
if ($signature.Status -eq "Valid" -and $signature.SignerCertificate) {
    $SignerThumbprint = ($signature.SignerCertificate.Thumbprint -replace '\s','').ToUpperInvariant()
    Write-Host ("[PASS] Authenticode: Valid | {0}" -f $SignerThumbprint) -ForegroundColor Green
} else {
    Write-Host ("[WARN] Authenticode: {0}; SHA-256 remains mandatory, signature not pinned." -f $signature.Status) -ForegroundColor Yellow
}

# Wrangler v4 requires --remote for R2 object GET/PUT. Keep the remote history, not local dev storage.
$CatalogPath = Join-Path $StageRoot $CatalogName
$RemoteCatalogPath = Join-Path $StageRoot "releases.remote.json"
if (Test-Path -LiteralPath $RemoteCatalogPath) { Remove-Item -LiteralPath $RemoteCatalogPath -Force }
$remoteCatalogResult = Invoke-Wrangler -Arguments @("r2","object","get","$BucketName/$CatalogName","--remote","--file=$RemoteCatalogPath") -AllowFailure
$existingReleases = @()
if ($remoteCatalogResult.ExitCode -eq 0 -and (Test-Path -LiteralPath $RemoteCatalogPath)) {
    try { $existingReleases = @(Get-Content -LiteralPath $RemoteCatalogPath -Raw -Encoding UTF8 | ConvertFrom-Json) }
    catch { Write-Host "[WARN] Zdalny katalog wydań był niepoprawny — tworzę nowy." -ForegroundColor Yellow }
}
$channels = if ($Channel -eq "both") { @("stable","beta") } else { @($Channel) }
$manifestNames = @()
$newReleaseEntries = @()
foreach ($channelName in $channels) {
    $manifestName = if ($channelName -eq "beta") { "manifest-beta.xml" } else { "manifest-stable.xml" }
    $manifestPath = Join-Path $StageRoot $manifestName
    [void](New-UpdateManifest $channelName $stagedInstaller $manifestPath $SignerThumbprint)
    $manifestNames += $manifestName
    $newReleaseEntries += [pscustomobject]@{
        version = $Version; channel = $channelName; publishedUtc = [DateTime]::UtcNow.ToString("o")
        packageFile = $PackageName; packageUrl = ($BaseUrl + $PackageName); sha256 = $sha
        signerThumbprint = $SignerThumbprint; signatureStatus = if ($SignerThumbprint) { "Valid" } else { "NotSigned" }
        sizeBytes = (Get-Item -LiteralPath $stagedInstaller).Length
        notes = "Wydanie $Version ($Fix) — Komputerowe Centrum Serwisu"
    }
}
$combinedReleases = @($newReleaseEntries) + @($existingReleases | Where-Object { -not (($_.version -eq $Version) -and ($channels -contains $_.channel)) })
$combinedReleases = @($combinedReleases | Sort-Object publishedUtc -Descending | Select-Object -First 100)
$catalogJson = ConvertTo-Json -InputObject $combinedReleases -Depth 6
[IO.File]::WriteAllText($CatalogPath,$catalogJson,(New-Object System.Text.UTF8Encoding($false)))

# Upload the binary to R2; Pages static assets have a per-file size limit.
$uploadPackage = Invoke-Wrangler -Arguments @(
    "r2","object","put","$BucketName/$PackageName","--remote",
    "--file=$stagedInstaller",
    "--content-type=application/vnd.microsoft.portable-executable",
    "--cache-control=public, max-age=86400"
)
if ($uploadPackage.ExitCode -ne 0) { Stop-Build "Wysłanie instalatora do Cloudflare R2 nie powiodło się." }

foreach ($manifestName in $manifestNames) {
    $manifestPath = Join-Path $StageRoot $manifestName
    $uploadManifest = Invoke-Wrangler -Arguments @(
        "r2","object","put","$BucketName/$manifestName","--remote",
        "--file=$manifestPath",
        "--content-type=application/xml",
        "--cache-control=no-store"
    )
    if ($uploadManifest.ExitCode -ne 0) { Stop-Build "Wysłanie manifestu $manifestName do R2 nie powiodło się." }
}

$uploadCatalog = Invoke-Wrangler -Arguments @(
    "r2","object","put","$BucketName/$CatalogName","--remote",
    "--file=$CatalogPath","--content-type=application/json","--cache-control=no-store"
)
if ($uploadCatalog.ExitCode -ne 0) { Stop-Build "Wysłanie katalogu releases.json do R2 nie powiodło się." }

# Verify public DNS, Pages Function + R2, manifest hashes, HEAD and resumable Range.
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
[void](Wait-CloudflareHealth -Attempts 36 -DelaySeconds 5 -RequireManifests)
foreach ($manifestName in $manifestNames) { [void](Test-PublicManifest -ManifestName $manifestName -ExpectedSha $sha -ExpectedSignerThumbprint $SignerThumbprint) }

$catalogUrl = $BaseUrl + $CatalogName
$catalogResponse = Invoke-WebRequest -Uri $catalogUrl -UseBasicParsing -TimeoutSec 45
if ($catalogResponse.StatusCode -ne 200) { Stop-Build "Katalog wydań nie zwrócił HTTP 200: $catalogUrl" }
try { $publishedCatalog = @($catalogResponse.Content | ConvertFrom-Json -ErrorAction Stop) }
catch { Stop-Build ("Publiczny releases.json nie jest prawidłowym JSON: " + $_.Exception.Message) }
foreach ($channelName in $channels) {
    $catalogEntry = $publishedCatalog | Where-Object {
        $_.version -eq $Version -and $_.channel -eq $channelName -and $_.packageUrl -eq ($BaseUrl + $PackageName)
    } | Select-Object -First 1
    if ($null -eq $catalogEntry) { Stop-Build "Publiczny katalog releases.json nie zawiera wydania $Version / $channelName." }
    if ($catalogEntry.sha256 -ne $sha) { Stop-Build "Publiczny katalog releases.json ma niezgodny SHA-256 dla $channelName." }
    $entrySigner = ([string]$catalogEntry.signerThumbprint -replace '\s','').ToUpperInvariant()
    if ($entrySigner -ne $SignerThumbprint) { Stop-Build "Publiczny katalog releases.json ma niezgodny odcisk certyfikatu dla $channelName." }
    Write-Host ("[PASS] releases.json: {0} / {1} / SHA-256 / Authenticode" -f $Version,$channelName) -ForegroundColor Green
}
$packageUrl = $BaseUrl + $PackageName
$head = Invoke-WebRequest -Uri $packageUrl -Method Head -UseBasicParsing -TimeoutSec 45
if ($head.StatusCode -ne 200) { Stop-Build "Instalator nie zwraca HTTP 200: $packageUrl" }
$range = Invoke-WebRequest -Uri $packageUrl -Headers @{ Range = "bytes=0-0" } -UseBasicParsing -TimeoutSec 45
if ($range.StatusCode -ne 206 -or $range.Headers["Content-Range"] -notmatch "^bytes 0-0/") {
    Stop-Build "Cloudflare nie potwierdził obsługi HTTP Range dla instalatora."
}
Write-Host "[PASS] Instalator: HEAD 200, Range 206, Content-Range poprawny." -ForegroundColor Green

$readme = Join-Path $StageRoot "README_CLOUDFLARE_PUBLISH.txt"
@"
KOMPUTEROWE CENTRUM SERWISU — CLOUDFLARE FREE / $Fix
Projekt Pages: $ProjectName
Bucket R2: $BucketName
Wersja: $Version
Installer: $PackageName
URL: $packageUrl
SHA-256: $sha
Manifesty: $($manifestNames -join ", ")
Katalog wydań: $CatalogName
Podpis wydawcy: $(if ($SignerThumbprint) { $SignerThumbprint } else { "NotSigned" })

Publiczny adres katalogu: $($BaseUrl + "releases.json")
Publiczny adres Stable: $($BaseUrl + "manifest-stable.xml")
Publiczny adres Beta: $($BaseUrl + "manifest-beta.xml")

Weryfikacja: manifest HTTP 200, pakiet HEAD HTTP 200, zakres HTTP Range 206.
"@ | Set-Content -LiteralPath $readme -Encoding UTF8

Write-Host ""
Write-Host "[PASS] Cloudflare Pages + R2 opublikowane i sprawdzone." -ForegroundColor Green
Write-Host "[PASS] Publiczny endpoint: $BaseUrl"
Write-Host "[PASS] DNS $PagesHost + Pages Function + R2 binding UPDATES: aktywne"
Write-Host "[PASS] SHA-256: $sha"
Write-Host "[PASS] Katalog wydań: $($combinedReleases.Count) wpisów."
Write-Host ("[INFO] Authenticode: " + $(if ($SignerThumbprint) { $SignerThumbprint } else { "NotSigned — brak certyfikatu wydawcy" }))
Write-Host "[PASS] Instalator ma potwierdzone pochodzenie FIX068."
Write-Host "[INFO] Publikacja zakończona w jednym przebiegu. Do uruchomienia służy URUCHOM_WSZYSTKO.cmd."
try { Stop-Transcript | Out-Null } catch {}
