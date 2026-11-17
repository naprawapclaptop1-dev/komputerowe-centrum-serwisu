$ErrorActionPreference = "Stop"
$main = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.cs"))
$modules = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.Modules.cs"))
$verify = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "VERIFY_PAYLOAD.ps1"))
$assembly = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "AssemblyInfo.cs"))
$fallback = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO_LegacyFallback.ps1"))
$legacy = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "LegacyMode.hta"))
$setup = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "SETUP_MODERN.iss"))
$generator = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "GENERATE_UPDATE_MANIFEST.ps1"))
$serverTest = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "VERIFY_GLOBAL_UPDATE_SERVER.ps1"))
$product = 'KOMPUTEROWE CENTRUM SERWISU'
if ($main -notmatch [regex]::Escape($product)) { throw "FIX065: new Polish product name missing from application source." }
if ($main -match 'NAPRAWA PC') { throw "FIX065: old visible product name remains in the main application source." }
if ($modules -match 'NAPRAWA PC') { throw "FIX065: old visible product name remains in module/report text." }
if ($modules -notmatch '<title>Komputerowe Centrum Serwisu - raport serwisowy</title>') { throw "FIX065: Polish service report title missing." }
if ($fallback.Contains('$form.Text=''NAPRAWA PC') -or $fallback.Contains('$head.Text=''NAPRAWA PC') -or $fallback.Contains('RAPORT NAPRAWA PC')) { throw "FIX065: old visible name remains in compatibility mode." }
if ($legacy.Contains('applicationname="Naprawa PC')) { throw "FIX065: old application name remains in HTA compatibility mode." }
if ($assembly -notmatch [regex]::Escape($product)) { throw "FIX065: new product name missing from assembly metadata." }
if ($setup -notmatch [regex]::Escape($product)) { throw "FIX065: new product name missing from installer." }
if ($main -notmatch 'Text = "KOMPUTEROWE CENTRUM SERWISU"') { throw "FIX065: clean application window title missing." }
if ($main -notmatch 'brand.Text="KOMPUTEROWE\\r\\nCENTRUM SERWISU"') { throw "FIX065: two-line sidebar brand missing." }
if ($main -notmatch 'headerBrand.Text="KOMPUTEROWE CENTRUM SERWISU"') { throw "FIX065: header brand missing." }
if ($main -notmatch 'e.Index>=0\?Convert.ToString\(box.Items\[e.Index\]\)') { throw "FIX065: owner-drawn ComboBox selected value drawing missing." }
if ($main -notmatch 'int quickY=514,quickH=174') { throw "FIX065: expanded dashboard actions missing." }
if ($main -notmatch 'PŁYTA GŁÓWNA I ROZRUCH' -or $main -notmatch 'ZADANIA I KONTROLA JAKOŚCI') { throw "FIX065: dashboard status panels missing." }
foreach ($style in @('PROFESJONALNY','FUTURYSTYCZNY','SZKLANY')) { if ($main -notmatch [regex]::Escape($style)) { throw "FIX065: interface style missing: $style" } }
foreach ($theme in @('GRANATOWY','TURKUSOWY','FIOLETOWY','SZMARAGDOWY','LODOWY','GRAFITOWY','BURSZTYNOWY','RUBINOWY',('S' + [char]0x0141 + 'ONECZNY'),'OCEANICZNY')) { if ($main -notmatch [regex]::Escape($theme)) { throw "FIX065: theme missing: $theme" } }
foreach ($pattern in @('BuildPcMigrationTransferPage','ExportPcMigrationPackage','VerifyPcMigrationPackage','ImportPcMigrationPackage','PcMigrationHash','FileAttributes.ReparsePoint')) { if ($modules -notmatch $pattern) { throw "FIX065: migration safeguard missing: $pattern" } }
if ($verify -notmatch 'CHECK_FIX065_REGRESSION\.ps1') { throw "FIX065: source-bound regression test reference missing." }
$assemblyVersionMatch = [regex]::Match($assembly, '\[assembly:\s*AssemblyVersion\("(?<version>\d+(?:\.\d+){3})"\)\]')
$fileVersionMatch = [regex]::Match($assembly, '\[assembly:\s*AssemblyFileVersion\("(?<version>\d+(?:\.\d+){3})"\)\]')
$verifyVersionMatch = [regex]::Match($verify, '\[string\]\$ExpectedVersion\s*=\s*"(?<version>\d+(?:\.\d+){3})"')
if (-not $assemblyVersionMatch.Success -or -not $fileVersionMatch.Success -or -not $verifyVersionMatch.Success) { throw "FIX065: assembly/verifier version metadata missing." }
$assemblyVersion = $assemblyVersionMatch.Groups['version'].Value
$fileVersion = $fileVersionMatch.Groups['version'].Value
$verifyVersion = $verifyVersionMatch.Groups['version'].Value
if ($assemblyVersion -ne $fileVersion -or $fileVersion -ne $verifyVersion) { throw "FIX065: assembly and payload verifier versions differ: Assembly=$assemblyVersion File=$fileVersion Verify=$verifyVersion" }
if ($assemblyVersion -ne "1.0.0.65") { throw "FIX065: expected current release 1.0.0.65, got $assemblyVersion" }
if ($main -notmatch 'BuildNavigationGroups' -or $main -notmatch 'FilterNavigation' -or $main -notmatch 'ProcessCmdKey') { throw "FIX065: grouped searchable navigation / Ctrl+K missing." }
if ($modules -notmatch 'AUTOMATYCZNE AKTUALIZACJE') { throw "FIX065: automatic updater page missing." }
$navCount = [regex]::Matches($main,'AddNav\("[^"]+"').Count
$routeCount = [regex]::Matches($main,'if\(id=="[^"]+"\)').Count
if ($navCount -ne 65 -or $routeCount -ne 65) { throw "FIX065: module route count mismatch: nav=$navCount routes=$routeCount" }
Write-Output "[PASS] FIX065 Polish product identity, redesigned dashboard, custom selectors, 65 routes, 3 styles, 10 themes and migration safeguards verified."

foreach ($route in @('Zdrowie PC','Porównanie PC','Spis programów')) {
    if ($main -notmatch [regex]::Escape('AddNav("'+$route+'"')) { throw "FIX065: navigation entry missing: $route" }
}
foreach ($method in @('BuildPcHealthCenterPage','RefreshPcHealthCenter','BuildComputerComparisonPage','SaveComputerSnapshot','ImportComputerSnapshots','CompareSelectedComputerSnapshot','BuildInstalledSoftwarePage','RefreshInstalledSoftware','ExportInstalledSoftwareCsv')) {
    if ($modules -notmatch [regex]::Escape($method)) { throw "FIX065: service module method missing: $method" }
}
foreach ($pattern in @('PredictFailure','FreePhysicalMemory','Win32_DiskDrive')) {
    if ($modules -notmatch [regex]::Escape($pattern)) { throw "FIX065: health telemetry check missing: $pattern" }
}
foreach ($pattern in @('RegistryHive.LocalMachine','RegistryView.Registry64','RegistryView.Registry32','DisplayName','DisplayVersion','Publisher')) {
    if ($modules -notmatch [regex]::Escape($pattern)) { throw "FIX065: installed software inventory check missing: $pattern" }
}
foreach ($pattern in @('servicePhoneBox','serviceEmailBox','serviceStatusBox','DeleteServiceCase','SetCaseValue')) {
    if ($modules -notmatch [regex]::Escape($pattern)) { throw "FIX065: customer service workflow feature missing: $pattern" }
}

# Global updater checks: fixed official endpoint, system locale, HTTPS, hash verification and local recovery.
foreach ($pattern in @('OfficialUpdateBaseUrl','GetOfficialUpdateManifestUrl','DetectUpdaterRegion','DetectUpdaterLanguage',
                       'SelectedUpdaterRegion','SelectedUpdaterLanguage','IsSafeHttpsUpdateUrl',
                       'ParseGlobalUpdateManifest','Mirrors/Url','TimeoutMilliseconds','ReadWriteTimeout',
                       'DtdProcessing.Prohibit','pendingUpdateMirrors','GlobalUpdates','InitializeGlobalUpdateService')) {
    if ($modules -notmatch [regex]::Escape($pattern)) { throw "FIX065: global update capability missing: $pattern" }
}
$updaterPageStart = $modules.IndexOf("private void BuildUpdaterPage()")
if ($updaterPageStart -lt 0) {
    throw "FIX065: BuildUpdaterPage() was not found in the module source."
}
$updaterPageEnd = $modules.IndexOf("private void TestCloudflareUpdateEndpoint()", $updaterPageStart)
if ($updaterPageEnd -le $updaterPageStart) {
    throw "FIX065: updater page method boundary is invalid."
}
$updaterPage = $modules.Substring($updaterPageStart, $updaterPageEnd - $updaterPageStart)
foreach ($ui in @(
    'CENTRUM AKTUALIZACJI GLOBALNYCH',
    'SPRAWDŹ TERAZ',
    'Automatycznie sprawdzaj po uruchomieniu i według harmonogramu',
    'Automatycznie pobieraj wykryte aktualizacje',
    'TEST DNS / CLOUDFLARE',
    'ZAPISZ USTAWIENIA',
    'DOSTĘPNE WYDANIA',
    'HISTORIA I WYNIKI KONTROLI'
)) {
    if ($updaterPage -notmatch [regex]::Escape($ui)) {
        throw "FIX065: actual updater page UI element missing: $ui"
    }
}

if ($modules -notmatch 'SecurityProtocol=\(SecurityProtocolType\)3072' -or $modules -notmatch 'LastResponseUri\.Scheme!=Uri\.UriSchemeHttps') { throw "FIX065: TLS / HTTPS redirect control missing." }
if ($modules -notmatch 'SHA-256 niezgodny z manifestem' -or $modules -notmatch '\.part') { throw "FIX065: atomic package download / SHA-256 verification missing." }


# FIX065: aktualizacje muszą być widoczne bez wyszukiwania.
foreach ($required in @('globalUpdatesButton.Text="AKTUALIZACJE"','ShowPage("Aktualizator PRO")','return "AKTUALIZACJE"','"AKTUALIZACJE"')) {
    if ($main -notmatch [regex]::Escape($required)) { throw "FIX065: visible global update entry missing: $required" }
}
if ($main -notmatch 'updatesItem=new ToolStripMenuItem\("Aktualizacje globalne"\)') { throw "FIX065: tray update shortcut missing." }
if ($main -notmatch 'string\[\] groups=new string\[\]\{"START","AKTUALIZACJE"') { throw "FIX065: updates group is not placed near the top." }

# FIX065: radio window must be resizable and adapt its layout to the monitor.
foreach ($required in @('FormBorderStyle.Sizable','MinimumSize=new Size(640,740)','ApplyRadioBubbleLayout','CaptureRadioLayoutTree','ClientSize=new Size(targetClientWidth,targetClientHeight)')) {
    if ($main -notmatch [regex]::Escape($required)) { throw "FIX065: responsive radio window component missing: $required" }
}
foreach ($required in @('DrawMode.OwnerDrawFixed','ApplyDarkRadioComboThemes','radioCountryFilter','radioLanguageFilter','radioGenreFilter')) {
    if ($main -notmatch [regex]::Escape($required)) { throw "FIX065: dark radio selector component missing: $required" }
}


# FIX065 — globalny aktualizator: status, responsywność, postęp, pauza/wznowienie i historia.
foreach ($required in @(
    'GetUpdaterPageLogicalWidth','OfficialUpdateBaseUrl','GetOfficialUpdateManifestUrl',
    'InitializeGlobalUpdateService','updaterStatusLabel','updaterProgressBar','updaterProgressLabel',
    'updaterPauseButton','updaterStopButton','updaterHistoryList',
    'updaterAutoCheckBox','updaterAutoDownloadBox','updaterAutoInstallBox',
    'AppendUpdaterHistory','LoadUpdaterHistory','BuildReleaseManifest','GENERATE_UPDATE_MANIFEST.ps1','VERIFY_GLOBAL_UPDATE_SERVER.ps1',
    'BackupUpdaterSettingsBeforeInstall','RestoreLatestUpdaterSettingsBackup','StartDownloadedUpdateInstaller'
)) {
    if (($main + $modules + $verify).IndexOf($required,[StringComparison]::OrdinalIgnoreCase) -lt 0) {
        throw "FIX065: required update capability missing: $required"
    }
}
foreach ($required in @(
    'HttpWebRequest','AddRange(existing)','ManualResetEvent','updaterPauseGate.WaitOne()',
    'WorkerSupportsCancellation=true','ProgressChanged','FileMode.Append','FileMode.Create',
    'HashFile(part)','SHA-256 niezgodny z manifestem','SettingsBackups','history.xml'
)) {
    if ($modules -notmatch [regex]::Escape($required)) { throw "FIX065: transfer / recovery capability missing: $required" }
}
if ($modules -notmatch 'OfficialUpdateBaseUrl = "https://kcs-rj2026-updates\.pages\.dev/updates/"' -or
    $modules -notmatch 'manifest-stable\.xml' -or $modules -notmatch 'manifest-beta\.xml') {
    throw "FIX065: official fixed update endpoints missing."
}
if ($modules -notmatch 'Cloudflare Pages nie udostępnił manifestu' -or $modules -notmatch 'DownloadProgramUpdate\(true\)') {
    throw "FIX065: automatic no-manifest state / auto-download flow missing."
}
if ($modules -match 'Brak manifestu"\s*,\s*"Brak manifestu"') {
    throw "FIX065: old modal error for empty manifest remains."
}
if ([regex]::Matches($modules,'private void BuildReleaseManifest\(\)').Count -ne 1) {
    throw "FIX065: duplicate or missing BuildReleaseManifest method."
}
$runtimeVersionMatch = [regex]::Match($modules, 'private const string ProgramVersion\s*=\s*"(?<version>\d+(?:\.\d+){3})";')
if (-not $runtimeVersionMatch.Success) { throw "FIX065: runtime ProgramVersion declaration missing." }
$runtimeVersion = $runtimeVersionMatch.Groups['version'].Value
if ($runtimeVersion -ne "1.0.0.65") { throw "FIX065: expected runtime ProgramVersion 1.0.0.65, got $runtimeVersion." }
$runtimeAssemblyMatch = [regex]::Match($assembly, '\[assembly:\s*AssemblyVersion\("(?<version>\d+(?:\.\d+){3})"\)\]')
$runtimeFileMatch = [regex]::Match($assembly, '\[assembly:\s*AssemblyFileVersion\("(?<version>\d+(?:\.\d+){3})"\)\]')
$runtimeVerifierMatch = [regex]::Match($verify, '\[string\]\$ExpectedVersion\s*=\s*"(?<version>\d+(?:\.\d+){3})"')
if (-not $runtimeAssemblyMatch.Success -or -not $runtimeFileMatch.Success -or -not $runtimeVerifierMatch.Success) {
    throw "FIX065: runtime/assembly/verifier version metadata missing."
}
if ($runtimeVersion -ne $runtimeAssemblyMatch.Groups['version'].Value -or
    $runtimeVersion -ne $runtimeFileMatch.Groups['version'].Value -or
    $runtimeVersion -ne $runtimeVerifierMatch.Groups['version'].Value) {
    throw "FIX065: runtime / AssemblyVersion / AssemblyFileVersion / ExpectedVersion mismatch."
}
if ($main -notmatch 'DesignVersion","FIX060"' -or $main -notmatch 'design\.InnerText!="FIX060"') {
    throw "FIX065: saved-settings schema compatibility FIX060 is missing; update must not reset user settings."
}
if ($verify -notmatch 'GENERATE_UPDATE_MANIFEST\.ps1' -or
    $verify -notmatch 'VERIFY_GLOBAL_UPDATE_SERVER\.ps1' -or
    $verify -notmatch 'PUBLISH_CLOUDFLARE_FREE\.ps1' -or
    $verify -notmatch 'URUCHOM_WSZYSTKO\.cmd' -or
    $verify -notmatch [regex]::Escape('cloudflare\wrangler.toml') -or
    $verify -notmatch [regex]::Escape('cloudflare\functions\updates\[[path]].js') -or
    $verify -notmatch 'FIX065_RELEASE_NOTES\.txt') {
    throw "FIX065: source hash inventory misses new updater files."
}


# FIX065 — aktualizacje mają być automatyczne, bez ręcznego wpisywania URL/manifestu.
$updaterPageStart = $modules.IndexOf('private void BuildUpdaterPage()')
$updaterPageEnd = $modules.IndexOf('private void SetUpdaterStatus(', $updaterPageStart)
if ($updaterPageStart -lt 0 -or $updaterPageEnd -lt 0) { throw "FIX065: updater page source boundaries missing." }
$updaterPage = $modules.Substring($updaterPageStart, $updaterPageEnd-$updaterPageStart)
foreach ($forbidden in @('Manifest Stable HTTPS','Manifest Beta HTTPS','Serwery zapasowe','updaterStableFeedBox','updaterBetaFeedBox','updaterMirrorFeedBox','TextAt(channel')) {
    if ($updaterPage -match [regex]::Escape($forbidden)) { throw "FIX065: manual endpoint entry still visible: $forbidden" }
}
foreach ($required in @('OfficialUpdateBaseUrl','InitializeGlobalUpdateService','updaterCheckIntervalHours','CheckIntervalHours','ApplyUpdaterSchedule',
                        'updaterAutoCheckBox.Checked=true','updaterAutoDownloadBox.Checked=true',
                        'DownloadProgramUpdate(true)','StartDownloadedUpdateInstaller','Verb="runas"')) {
    if ($modules -notmatch [regex]::Escape($required)) { throw "FIX065: automatic self-update component missing: $required" }
}
if ($modules -notmatch 'GetOfficialUpdateManifestUrl\(\)[\s\S]*?OfficialUpdateBaseUrl\+\(beta\?') {
    throw "FIX065: stable/beta manifest must be chosen by the app, not the user."
}
if ($modules -match 'twoja-domena\.example|updates\.example\.invalid|cdn-eu\.example') {
    throw "FIX065: fake update host remains in active updater code."
}
if ($modules -notmatch 'packageUri\.AbsolutePath\.EndsWith\("\.exe"') {
    throw "FIX065: updater must only accept the Windows installer EXE."
}


# FIX065 — autostart aktualizacji oraz ponowna weryfikacja przed podniesieniem uprawnień.
if ($main -notmatch 'InitializeGlobalUpdateService\(\);') {
    throw "FIX065: automatic update service is not initialized after application startup."
}
foreach ($required in @('updaterAutoTimer.Interval=Math.Max','updaterCheckIntervalHours','ApplyUpdaterSchedule',
                        'updaterAutoCheckBox.Checked=true',
                        'updaterAutoDownloadBox.Checked=true',
                        'HashFile\(fullPath\)',
                        'actualVersion\.Trim\(\)',
                        'Verb="runas"',
                        'FileVersionInfo.GetVersionInfo')) {
    if ($modules -notmatch $required) { throw "FIX065: secure update handoff missing: $required" }
}
# Check only the user-facing page for manual endpoint input; other source helpers and
# release-publisher documentation may legitimately mention mirrors/server terminology.
$manualFieldDeclarations = [regex]::Matches($modules,'(?m)^\s*private\s+(?:TextBox|ComboBox)\s+[^;]*(?:updaterStableFeedBox|updaterBetaFeedBox|updaterMirrorFeedBox|updaterRegionBox|updaterLanguageBox)')
if ($manualFieldDeclarations.Count -gt 0) {
    throw "FIX065: obsolete user-editable updater fields remain declared in the application."
}


# FIX065 — integrity report must use the actual runtime version.
if ($modules -notmatch 'root\.SetAttribute\("ProductVersion",ProgramVersion\)') {
    throw "FIX065: integrity baseline ProductVersion must come from ProgramVersion."
}
if ($modules -match 'ProductVersion","1\.0\.0\.5[0-8]"') {
    throw "FIX065: obsolete hard-coded ProductVersion remains."
}


# FIX065 — stały powrót do pulpitu z każdej sekcji i z okna radia.
foreach ($required in @(
    'homeButton.Text="⌂  PULPIT GŁÓWNY"',
    'homeButton.Click+=delegate{RestoreMainWindow();ShowPage("Pulpit");};',
    'sideTop.Height=198',
    'Keys.Control|Keys.Home',
    'ReturnToMainDashboardFromRadio',
    'radioBubbleWindow.KeyPreview=true',
    'e.KeyCode==Keys.Escape',
    'radioBubbleWindow.FormClosing',
    'delegate{ReturnToMainDashboardFromRadio();}'
)) {
    if ($main -notmatch [regex]::Escape($required)) {
        throw "FIX065: main-dashboard return control missing: $required"
    }
}
if ($main -notmatch 'RadioButton\(radioBubbleWindow,"⌂  PULPIT"') {
    throw "FIX065: radio window does not expose the return-to-dashboard button."
}

# FIX065 — Cloudflare Pages + R2 is the only active update origin.
$cloudflareBase = 'https://kcs-rj2026-updates.pages.dev/updates/'
if ($modules -notmatch [regex]::Escape('OfficialUpdateBaseUrl = "'+$cloudflareBase+'"')) {
    throw "FIX065: Cloudflare Pages endpoint is not embedded in the client."
}
if ($modules -match 'OfficialUpdateBaseUrl\s*=\s*"https://naprawapclaptop\.pl/updates/"' -or
    $modules -match 'OfficialUpdateBaseUrl\s*=\s*"https://(?:[^"]*example\.invalid|[^"]*twoja-domena\.example)' ) {
    throw "FIX065: old or placeholder update origin remains in the active updater endpoint."
}
if ($modules -notmatch 'IndexOf\("naprawapclaptop\.pl/updates/"' -or
    $modules -notmatch '\[ARCHIWUM') {
    throw "FIX065: legacy history is not isolated and marked as archive."
}
if ($generator -notmatch [regex]::Escape('$BaseUrl = "'+$cloudflareBase+'"')) {
    throw "FIX065: release generator is not configured for Cloudflare Pages."
}
if ($serverTest -notmatch [regex]::Escape('$BaseUrl = "'+$cloudflareBase+'"')) {
    throw "FIX065: public server test is not configured for Cloudflare Pages."
}
$wrangler = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'cloudflare\wrangler.toml') -Raw
$function = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'cloudflare\functions\updates\[[path]].js') -Raw
$publisher = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'PUBLISH_CLOUDFLARE_FREE.ps1') -Raw
foreach ($required in @('name = "kcs-rj2026-updates"','pages_build_output_dir = "./public"',
                        'binding = "UPDATES"','bucket_name = "kcs-rj2026-updates-store"')) {
    if ($wrangler -notmatch [regex]::Escape($required)) { throw "FIX065: Cloudflare Pages/R2 config missing: $required" }
}
foreach ($required in @('env.UPDATES.head','env.UPDATES.get','range: { offset: start, length }',
                        'status: 206','Content-Range','manifest-stable.xml','manifest-beta.xml')) {
    if ($function -notmatch [regex]::Escape($required)) { throw "FIX065: Cloudflare update endpoint capability missing: $required" }
}
foreach ($required in @(
    '"pages","project","create"',
    '"r2","bucket","create"',
    '"pages","deploy","public"',
    '"pages","deployment","list"',
    '"--config","wrangler.toml"',
    '"r2","object","put"',
    'Verify public DNS',
    'Test-PublicManifest',
    'HTTP Range'
)) {
    if ($publisher -notmatch [regex]::Escape($required)) { throw "FIX065: Cloudflare publisher capability missing: $required" }
}


# FIX065 — jeden plik CMD uruchamia pelny build i publikacje; uzytkownik nie uruchamia etapow osobno.
$oneCmd = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'URUCHOM_WSZYSTKO.cmd') -Raw
foreach ($required in @(
    'BUILD_ALL.cmd',
    'PUBLISH_CLOUDFLARE_FREE.ps1',
    'KomputeroweCentrumSerwisu_FIX065_INSTALATOR.exe',
    'BUILD_RC',
    'PUBLISH_RC',
    'FULL_RELEASE.status'
)) {
    if ($oneCmd -notmatch [regex]::Escape($required)) {
        throw "FIX065: one-command release workflow missing: $required"
    }
}
if ($oneCmd.IndexOf('BUILD_ALL.cmd') -gt $oneCmd.IndexOf('PUBLISH_CLOUDFLARE_FREE.ps1')) {
    throw "FIX065: Cloudflare publication must run only after a successful complete build."
}
if ($publisher -notmatch 'System.Diagnostics.ProcessStartInfo' -or
    $publisher -notmatch 'ReadToEndAsync\(\)' -or
    $publisher -notmatch 'process\.ExitCode') {
    throw "FIX065: process stdout/stderr must be captured independently and success determined by exit code."
}
$modernBuild = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "BUILD_INSTALLER_MODERN.cmd"))
if ($modernBuild -notmatch '-CheckStamp >nul 2>&1' -or
    $modernBuild -notmatch 'Existing staged EXE is old or unverified' -or
    $modernBuild -notmatch 'BUILD_PORTABLE\.cmd') {
    throw "FIX065: stale EXE preflight must be silent and must rebuild from source."
}

if ($publisher -match '& npx\.cmd.*2>&1') {
    throw "FIX065: old PowerShell native-stderr npx invocation remains."
}
if ($publisher -notmatch 'SETUP_BUILD_ID\.txt' -or
    $publisher -notmatch 'VERIFY_PAYLOAD\.ps1' -or
    $publisher -notmatch 'SourceRoot') {
    throw "FIX065: publisher must validate installer provenance and current source hash."
}

if ($publisher -notmatch '\[switch\]\$Interactive' -or
    $publisher -notmatch 'Invoke-Wrangler -Arguments @\("login"\) -AllowFailure -Interactive') {
    throw "FIX065: Cloudflare OAuth login must keep the console interactive."
}


# FIX065 — całkowicie nieprzezroczyste wypełnienia stylu SZKLANY.
foreach ($forbidden in @('Color.FromArgb(236,48,65,81)','Color.FromArgb(224,29,43,58)',
                         'Color.FromArgb(236,Math.Min','Color.FromArgb(228,bottomColor')) {
    if ($main.Contains($forbidden)) { throw "FIX065: translucent fill remains: $forbidden" }
}
foreach ($required in @('Color.FromArgb(255,Math.Min(255,bottomColor.R+31)',
                        'Color.FromArgb(255,25,41,58)',
                        'c.Parent==null?t.Panel:c.Parent.BackColor')) {
    if ($main -notmatch [regex]::Escape($required)) { throw "FIX065: opaque UI styling missing: $required" }
}

# FIX065 — service health endpoint and actual Pages deployment/DNS validation.
if ($function -notmatch 'key === "health"' -or $function -notmatch 'r2Binding: true') {
    throw "FIX065: Cloudflare health endpoint missing."
}
foreach ($required in @('"--config","wrangler.toml"','"pages","deployment","list"',
                        'Wait-CloudflareHealth','[System.Net.Dns]::GetHostAddresses',
                        'Invoke-WebRequest -Uri $healthUrl','Test-PublicManifest')) {
    if ($publisher -notmatch [regex]::Escape($required)) { throw "FIX065: deployment/DNS validation missing: $required" }
}
foreach ($required in @('TestCloudflareUpdateEndpoint','DescribeCloudflareFailure',
                        'WebExceptionStatus.NameResolutionFailure','TEST DNS / CLOUDFLARE','status==503','status==404','status==403',
                        'updaterServerDiagLabel')) {
    if ($modules -notmatch [regex]::Escape($required)) { throw "FIX065: client DNS diagnostics missing: $required" }
}
if ($modules -notmatch 'DNS NIE ROZPOZNAJE HOSTA') {
    throw "FIX065: runtime does not explain DNS resolution failure."
}


# FIX065 — etykiety statusu nie mogą nachodzić na przyciski w karcie aktualizacji.
foreach ($required in @('int statusTextWidth=Math.Max(380,pageW-468);',
                        '18,42,statusTextWidth,25',
                        '18,82,statusTextWidth,18',
                        '18,103,statusTextWidth,18')) {
    if ($modules -notmatch [regex]::Escape($required)) { throw "FIX065: updater status/button overlap remains: $required" }
}
if ($modules -notmatch 'using System\.Net\.Sockets;' -or
    $modules -notmatch 'SocketError\.HostNotFound') {
    throw "FIX065: DNS SocketException is not classified by socket error code."
}
if ($modules.IndexOf('if(!stable || !beta',[StringComparison]::Ordinal) -lt 0) {
    throw "FIX065: diagnostic test can incorrectly report success without both channel manifests."
}
if ($publisher -notmatch '\[switch\]\$RequireManifests' -or
    $publisher -notmatch 'Wait-CloudflareHealth -Attempts 36 -DelaySeconds 5 -RequireManifests' -or
    $publisher -notmatch 'ConvertFrom-Json -ErrorAction Stop' -or
    $publisher -notmatch 'productionDeployments') {
    throw "FIX065: Cloudflare publication must verify production deployment and both manifests."
}

if ($modules -notmatch 'InvalidDataException invalidData=current as InvalidDataException') {
    throw "FIX065: missing Stable/Beta manifests are not reported explicitly."
}
foreach ($required in @('card.Invalidate(true)','premium.Invalidate()','content.Invalidate(true)','sidebar.Invalidate(true)')) {
    if ($main -notmatch [regex]::Escape($required)) { throw "FIX065: custom controls are not fully repainted after style change: $required" }
}


# FIX065 — archiwalne wpisy starego serwera są oznaczane i czyszczone wyłącznie na żądanie.
foreach ($required in @('USUŃ STARE WPISY SERWERA','[ARCHIWUM — STARY SERWER]','ClearArchivedUpdaterHistory',
                        'Bieżące wpisy Cloudflare zostaną zachowane.','DrawMode=DrawMode.OwnerDrawFixed')) {
    if ($modules -notmatch [regex]::Escape($required)) { throw "FIX065: updater history clarity feature missing: $required" }
}


# FIX065 — potwierdzenie czyszczenia historii ma poprawny literał C# bez surowego LF/CR.
if ($modules -notmatch 'naprawapclaptop\.pl\?\\r\\n\\r\\nBieżące wpisy Cloudflare zostaną zachowane\.') {
    throw "FIX065: archive cleanup confirmation text is not escaped as a valid C# string."
}
if ($modules -match 'naprawapclaptop\.pl\?\r?\n') {
    throw "FIX065: archive cleanup confirmation contains a raw newline inside a C# string."
}

# FIX065 — nieprzezroczyste karty oraz etykiety bez migotania / prześwitów.
foreach ($required in @('ControlStyles.Opaque,true','FillRectangle(clear,ClientRectangle)',
                        'FillRectangle(clearBrush,ClientRectangle)','p.BackColor=parent.BackColor',
                        'card.BackColor=parent.BackColor','l.BackColor=Color.Transparent; l.UseMnemonic=false')) {
    if ($main -notmatch [regex]::Escape($required)) { throw "FIX065: full opaque repaint missing: $required" }
}
if ($modules -notmatch 'message.IndexOf\("DNS NIE ROZPOZNAJE HOSTA"') {
    throw "FIX065: wrapped DNS failure is not presented as a DNS error."
}

if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'FIX065_RELEASE_NOTES.txt'))) {
    throw "FIX065: current release notes are missing."
}
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'FIX065_MODULE_MAP.txt'))) {
    throw "FIX065: current module map is missing."
}


# FIX065 — katalog wydań, sterowanie transferem, limity, bezpieczeństwo i rollback.
foreach ($required in @(
    'using System.Web.Script.Serialization;',
    'JavaScriptSerializer serializer=new JavaScriptSerializer();',
    'DeserializeObject(json)',
    'catalogArray.Count>100',
    'POBIERZ WYBRANE WYDANIE',
    'DownloadSelectedCatalogRelease',
    'ReadJsonStringProperty',
    'sizeBytes',
    'updaterReleaseCatalogEntries'
)) {
    if ($modules -notmatch [regex]::Escape($required)) {
        throw "FIX065: release catalog capability missing: $required"
    }
}

foreach ($required in @(
    'MaxSpeedKBps',
    'CheckIntervalHours',
    'updaterSpeedLimitBox',
    'updaterIntervalBox',
    'updaterCheckIntervalHours',
    'speedStartBytes',
    'Pobrano ',
    'ETA: ',
    'AddRange(existing)',
    'retryAttempt<3',
    'ManualResetEvent',
    'updaterPauseGate.WaitOne()'
)) {
    if ($modules -notmatch [regex]::Escape($required)) {
        throw "FIX065: download manager capability missing: $required"
    }
}

foreach ($required in @(
    'GetAuthenticodeSignatureInfo',
    'BeginOutputReadLine()',
    'BeginErrorReadLine()',
    'WaitForExit(15000)',
    'SignerThumbprint',
    'pendingUpdateSignerThumbprint',
    'signatureCheck.IsValid',
    'HashFile(fullPath)'
)) {
    if ($modules -notmatch [regex]::Escape($required)) {
        throw "FIX065: Authenticode / package verification missing: $required"
    }
}

foreach ($required in @(
    'BackupUpdaterSettingsBeforeInstall',
    'SettingsBackups',
    'rollback-files.txt',
    'RestorePreviousVersion.ps1',
    'StartRollbackToPreviousVersion',
    'GetLatestRollbackSnapshot',
    'Wait-Process -Id $TargetPid -Timeout 45',
    'Get-FileHash -LiteralPath $source -Algorithm SHA256',
    'if(!backupOk)',
    'updaterRollbackButton.Enabled'
)) {
    if ($modules -notmatch [regex]::Escape($required)) {
        throw "FIX065: backup / rollback protection missing: $required"
    }
}

if ($modules -notmatch 'OfficialUpdateBaseUrl\)\.Host' -or
    $modules -notmatch 'SignerThumbprint.*40' -or
    $modules -notmatch 'packageUri\.Host') {
    throw "FIX065: primary update host / certificate thumbprint is not pinned to the Cloudflare feed."
}
if ($modules -notmatch 'Regex\.IsMatch\(entry\.Sha256' -or
    $modules -notmatch 'Dictionary<string,object>' -or
    $modules -notmatch 'ArrayList catalogArray') {
    throw "FIX065: JSON release catalog entry validation missing."
}

foreach ($required in @(
    'SurfaceColorAt',
    'FindNearestCard',
    'chk.UseVisualStyleBackColor=false',
    'chk.FlatStyle=FlatStyle.Flat',
    'rb.UseVisualStyleBackColor=false',
    'rb.FlatStyle=FlatStyle.Flat'
)) {
    if ($main -notmatch [regex]::Escape($required)) {
        throw "FIX065: opaque card-matched control painting missing: $required"
    }
}

foreach ($required in @(
    'Test-PublicManifest -ManifestName $manifestName -ExpectedSha $sha -ExpectedSignerThumbprint $SignerThumbprint',
    '$catalogResponse = Invoke-WebRequest',
    'Publiczny katalog releases.json nie zawiera wydania',
    '$entrySigner -ne $SignerThumbprint',
    '"r2","object","get"',
    '"--remote"',
    '"r2","object","put"'
)) {
    if ($publisher -notmatch [regex]::Escape($required)) {
        throw "FIX065: Cloudflare release catalog / remote R2 / signature validation missing: $required"
    }
}

if ($modules -notmatch 'Kopia rollback przekroczyłaby bezpieczny limit' -or
    $modules -notmatch 'backupDrive.AvailableFreeSpace' -or
    $modules -notmatch 'Directory.Delete\(backup,true\)') {
    throw "FIX065: rollback snapshot capacity / incomplete-copy cleanup missing."
}


# FIX065 — PowerShell normalizuje odcisk certyfikatu prawdziwym regexem białych znaków.
if ($publisher -match "-replace '\\\\s',''") {
    throw "FIX065: publisher thumbprint normalization contains a double-escaped whitespace pattern."
}
if ($publisher -notmatch "-replace '\\s',''") {
    throw "FIX065: publisher thumbprint normalization is missing."
}
