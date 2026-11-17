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
if ($main -notmatch [regex]::Escape($product)) { throw "FIX060: new Polish product name missing from application source." }
if ($main -match 'NAPRAWA PC') { throw "FIX060: old visible product name remains in the main application source." }
if ($modules -match 'NAPRAWA PC') { throw "FIX060: old visible product name remains in module/report text." }
if ($modules -notmatch '<title>Komputerowe Centrum Serwisu - raport serwisowy</title>') { throw "FIX060: Polish service report title missing." }
if ($fallback.Contains('$form.Text=''NAPRAWA PC') -or $fallback.Contains('$head.Text=''NAPRAWA PC') -or $fallback.Contains('RAPORT NAPRAWA PC')) { throw "FIX060: old visible name remains in compatibility mode." }
if ($legacy.Contains('applicationname="Naprawa PC')) { throw "FIX060: old application name remains in HTA compatibility mode." }
if ($assembly -notmatch [regex]::Escape($product)) { throw "FIX060: new product name missing from assembly metadata." }
if ($setup -notmatch [regex]::Escape($product)) { throw "FIX060: new product name missing from installer." }
if ($main -notmatch 'Text = "KOMPUTEROWE CENTRUM SERWISU"') { throw "FIX060: clean application window title missing." }
if ($main -notmatch 'brand.Text="KOMPUTEROWE\\r\\nCENTRUM SERWISU"') { throw "FIX060: two-line sidebar brand missing." }
if ($main -notmatch 'headerBrand.Text="KOMPUTEROWE CENTRUM SERWISU"') { throw "FIX060: header brand missing." }
if ($main -notmatch 'e.Index>=0\?Convert.ToString\(box.Items\[e.Index\]\)') { throw "FIX060: owner-drawn ComboBox selected value drawing missing." }
if ($main -notmatch 'int quickY=514,quickH=174') { throw "FIX060: expanded dashboard actions missing." }
if ($main -notmatch 'PŁYTA GŁÓWNA I ROZRUCH' -or $main -notmatch 'ZADANIA I KONTROLA JAKOŚCI') { throw "FIX060: dashboard status panels missing." }
foreach ($style in @('PROFESJONALNY','FUTURYSTYCZNY','SZKLANY')) { if ($main -notmatch [regex]::Escape($style)) { throw "FIX060: interface style missing: $style" } }
foreach ($theme in @('GRANATOWY','TURKUSOWY','FIOLETOWY','SZMARAGDOWY','LODOWY','GRAFITOWY','BURSZTYNOWY','RUBINOWY',('S' + [char]0x0141 + 'ONECZNY'),'OCEANICZNY')) { if ($main -notmatch [regex]::Escape($theme)) { throw "FIX060: theme missing: $theme" } }
foreach ($pattern in @('BuildPcMigrationTransferPage','ExportPcMigrationPackage','VerifyPcMigrationPackage','ImportPcMigrationPackage','PcMigrationHash','FileAttributes.ReparsePoint')) { if ($modules -notmatch $pattern) { throw "FIX060: migration safeguard missing: $pattern" } }
if ($verify -notmatch 'CHECK_FIX060_REGRESSION\.ps1') { throw "FIX060: source-bound regression test reference missing." }
$assemblyVersionMatch = [regex]::Match($assembly, '\[assembly:\s*AssemblyVersion\("(?<version>\d+(?:\.\d+){3})"\)\]')
$fileVersionMatch = [regex]::Match($assembly, '\[assembly:\s*AssemblyFileVersion\("(?<version>\d+(?:\.\d+){3})"\)\]')
$verifyVersionMatch = [regex]::Match($verify, '\[string\]\$ExpectedVersion\s*=\s*"(?<version>\d+(?:\.\d+){3})"')
if (-not $assemblyVersionMatch.Success -or -not $fileVersionMatch.Success -or -not $verifyVersionMatch.Success) { throw "FIX060: assembly/verifier version metadata missing." }
$assemblyVersion = $assemblyVersionMatch.Groups['version'].Value
$fileVersion = $fileVersionMatch.Groups['version'].Value
$verifyVersion = $verifyVersionMatch.Groups['version'].Value
if ($assemblyVersion -ne $fileVersion -or $fileVersion -ne $verifyVersion) { throw "FIX060: assembly and payload verifier versions differ: Assembly=$assemblyVersion File=$fileVersion Verify=$verifyVersion" }
if ($assemblyVersion -ne "1.0.0.60") { throw "FIX060: expected current release 1.0.0.60, got $assemblyVersion" }
if ($main -notmatch 'BuildNavigationGroups' -or $main -notmatch 'FilterNavigation' -or $main -notmatch 'ProcessCmdKey') { throw "FIX060: grouped searchable navigation / Ctrl+K missing." }
if ($modules -notmatch 'AUTOMATYCZNE AKTUALIZACJE') { throw "FIX060: automatic updater page missing." }
$navCount = [regex]::Matches($main,'AddNav\("[^"]+"').Count
$routeCount = [regex]::Matches($main,'if\(id=="[^"]+"\)').Count
if ($navCount -ne 65 -or $routeCount -ne 65) { throw "FIX060: module route count mismatch: nav=$navCount routes=$routeCount" }
Write-Output "[PASS] FIX060 Polish product identity, redesigned dashboard, custom selectors, 65 routes, 3 styles, 10 themes and migration safeguards verified."

foreach ($route in @('Zdrowie PC','Porównanie PC','Spis programów')) {
    if ($main -notmatch [regex]::Escape('AddNav("'+$route+'"')) { throw "FIX060: navigation entry missing: $route" }
}
foreach ($method in @('BuildPcHealthCenterPage','RefreshPcHealthCenter','BuildComputerComparisonPage','SaveComputerSnapshot','ImportComputerSnapshots','CompareSelectedComputerSnapshot','BuildInstalledSoftwarePage','RefreshInstalledSoftware','ExportInstalledSoftwareCsv')) {
    if ($modules -notmatch [regex]::Escape($method)) { throw "FIX060: service module method missing: $method" }
}
foreach ($pattern in @('PredictFailure','FreePhysicalMemory','Win32_DiskDrive')) {
    if ($modules -notmatch [regex]::Escape($pattern)) { throw "FIX060: health telemetry check missing: $pattern" }
}
foreach ($pattern in @('RegistryHive.LocalMachine','RegistryView.Registry64','RegistryView.Registry32','DisplayName','DisplayVersion','Publisher')) {
    if ($modules -notmatch [regex]::Escape($pattern)) { throw "FIX060: installed software inventory check missing: $pattern" }
}
foreach ($pattern in @('servicePhoneBox','serviceEmailBox','serviceStatusBox','DeleteServiceCase','SetCaseValue')) {
    if ($modules -notmatch [regex]::Escape($pattern)) { throw "FIX060: customer service workflow feature missing: $pattern" }
}

# Global updater checks: fixed official endpoint, system locale, HTTPS, hash verification and local recovery.
foreach ($pattern in @('OfficialUpdateBaseUrl','GetOfficialUpdateManifestUrl','DetectUpdaterRegion','DetectUpdaterLanguage',
                       'SelectedUpdaterRegion','SelectedUpdaterLanguage','IsSafeHttpsUpdateUrl',
                       'ParseGlobalUpdateManifest','Mirrors/Url','TimeoutMilliseconds','ReadWriteTimeout',
                       'DtdProcessing.Prohibit','pendingUpdateMirrors','GlobalUpdates','InitializeGlobalUpdateService')) {
    if ($modules -notmatch [regex]::Escape($pattern)) { throw "FIX060: global update capability missing: $pattern" }
}
foreach ($ui in @('SPRAWDŹ TERAZ','Automatycznie sprawdzaj po uruchomieniu i co 6 godzin',
                 'Automatycznie pobieraj wykryte aktualizacje','CENTRUM AUTOMATYCZNYCH AKTUALIZACJI')) {
    if ($modules -notmatch [regex]::Escape($ui)) { throw "FIX060: automatic updater UI option missing: $ui" }
}
if ($modules -notmatch 'SecurityProtocol=\(SecurityProtocolType\)3072' -or $modules -notmatch 'LastResponseUri\.Scheme!=Uri\.UriSchemeHttps') { throw "FIX060: TLS / HTTPS redirect control missing." }
if ($modules -notmatch 'SHA-256 niezgodny z manifestem' -or $modules -notmatch '\.part') { throw "FIX060: atomic package download / SHA-256 verification missing." }


# FIX060: aktualizacje muszą być widoczne bez wyszukiwania.
foreach ($required in @('globalUpdatesButton.Text="AKTUALIZACJE"','ShowPage("Aktualizator PRO")','return "AKTUALIZACJE"','"AKTUALIZACJE"')) {
    if ($main -notmatch [regex]::Escape($required)) { throw "FIX060: visible global update entry missing: $required" }
}
if ($main -notmatch 'updatesItem=new ToolStripMenuItem\("Aktualizacje globalne"\)') { throw "FIX060: tray update shortcut missing." }
if ($main -notmatch 'string\[\] groups=new string\[\]\{"START","AKTUALIZACJE"') { throw "FIX060: updates group is not placed near the top." }

# FIX060: radio window must be resizable and adapt its layout to the monitor.
foreach ($required in @('FormBorderStyle.Sizable','MinimumSize=new Size(640,740)','ApplyRadioBubbleLayout','CaptureRadioLayoutTree','ClientSize=new Size(targetClientWidth,targetClientHeight)')) {
    if ($main -notmatch [regex]::Escape($required)) { throw "FIX060: responsive radio window component missing: $required" }
}
foreach ($required in @('DrawMode.OwnerDrawFixed','ApplyDarkRadioComboThemes','radioCountryFilter','radioLanguageFilter','radioGenreFilter')) {
    if ($main -notmatch [regex]::Escape($required)) { throw "FIX060: dark radio selector component missing: $required" }
}


# FIX060 — globalny aktualizator: status, responsywność, postęp, pauza/wznowienie i historia.
foreach ($required in @(
    'GetUpdaterPageLogicalWidth','OfficialUpdateBaseUrl','GetOfficialUpdateManifestUrl',
    'InitializeGlobalUpdateService','updaterStatusLabel','updaterProgressBar','updaterProgressLabel',
    'updaterPauseButton','updaterStopButton','updaterHistoryList',
    'updaterAutoCheckBox','updaterAutoDownloadBox','updaterAutoInstallBox',
    'AppendUpdaterHistory','LoadUpdaterHistory','BuildReleaseManifest','GENERATE_UPDATE_MANIFEST.ps1','VERIFY_GLOBAL_UPDATE_SERVER.ps1',
    'BackupUpdaterSettingsBeforeInstall','RestoreLatestUpdaterSettingsBackup','StartDownloadedUpdateInstaller'
)) {
    if (($main + $modules + $verify).IndexOf($required,[StringComparison]::OrdinalIgnoreCase) -lt 0) {
        throw "FIX060: required update capability missing: $required"
    }
}
foreach ($required in @(
    'HttpWebRequest','AddRange(existing)','ManualResetEvent','updaterPauseGate.WaitOne()',
    'WorkerSupportsCancellation=true','ProgressChanged','FileMode.Append','FileMode.Create',
    'HashFile(part)','SHA-256 niezgodny z manifestem','SettingsBackups','history.xml'
)) {
    if ($modules -notmatch [regex]::Escape($required)) { throw "FIX060: transfer / recovery capability missing: $required" }
}
if ($modules -notmatch 'OfficialUpdateBaseUrl = "https://kcs-rj2026-updates\.pages\.dev/updates/"' -or
    $modules -notmatch 'manifest-stable\.xml' -or $modules -notmatch 'manifest-beta\.xml') {
    throw "FIX060: official fixed update endpoints missing."
}
if ($modules -notmatch 'Cloudflare Pages nie udostępnił manifestu' -or $modules -notmatch 'DownloadProgramUpdate\(true\)') {
    throw "FIX060: automatic no-manifest state / auto-download flow missing."
}
if ($modules -match 'Brak manifestu"\s*,\s*"Brak manifestu"') {
    throw "FIX060: old modal error for empty manifest remains."
}
if ([regex]::Matches($modules,'private void BuildReleaseManifest\(\)').Count -ne 1) {
    throw "FIX060: duplicate or missing BuildReleaseManifest method."
}
$runtimeVersionMatch = [regex]::Match($modules, 'private const string ProgramVersion\s*=\s*"(?<version>\d+(?:\.\d+){3})";')
if (-not $runtimeVersionMatch.Success) { throw "FIX060: runtime ProgramVersion declaration missing." }
$runtimeVersion = $runtimeVersionMatch.Groups['version'].Value
if ($runtimeVersion -ne "1.0.0.60") { throw "FIX060: expected runtime ProgramVersion 1.0.0.60, got $runtimeVersion." }
$runtimeAssemblyMatch = [regex]::Match($assembly, '\[assembly:\s*AssemblyVersion\("(?<version>\d+(?:\.\d+){3})"\)\]')
$runtimeFileMatch = [regex]::Match($assembly, '\[assembly:\s*AssemblyFileVersion\("(?<version>\d+(?:\.\d+){3})"\)\]')
$runtimeVerifierMatch = [regex]::Match($verify, '\[string\]\$ExpectedVersion\s*=\s*"(?<version>\d+(?:\.\d+){3})"')
if (-not $runtimeAssemblyMatch.Success -or -not $runtimeFileMatch.Success -or -not $runtimeVerifierMatch.Success) {
    throw "FIX060: runtime/assembly/verifier version metadata missing."
}
if ($runtimeVersion -ne $runtimeAssemblyMatch.Groups['version'].Value -or
    $runtimeVersion -ne $runtimeFileMatch.Groups['version'].Value -or
    $runtimeVersion -ne $runtimeVerifierMatch.Groups['version'].Value) {
    throw "FIX060: runtime / AssemblyVersion / AssemblyFileVersion / ExpectedVersion mismatch."
}
if ($main -notmatch 'DesignVersion","FIX060"' -or $main -notmatch 'design\.InnerText!="FIX060"') {
    throw "FIX060: settings schema version was not advanced without resetting user selections."
}
if ($verify -notmatch 'GENERATE_UPDATE_MANIFEST\.ps1' -or
    $verify -notmatch 'VERIFY_GLOBAL_UPDATE_SERVER\.ps1' -or
    $verify -notmatch 'PUBLISH_CLOUDFLARE_FREE\.ps1' -or
    $verify -notmatch [regex]::Escape('cloudflare\wrangler.toml') -or
    $verify -notmatch [regex]::Escape('cloudflare\functions\updates\[[path]].js') -or
    $verify -notmatch 'FIX060_RELEASE_NOTES\.txt') {
    throw "FIX060: source hash inventory misses new updater files."
}


# FIX060 — aktualizacje mają być automatyczne, bez ręcznego wpisywania URL/manifestu.
$updaterPageStart = $modules.IndexOf('private void BuildUpdaterPage()')
$updaterPageEnd = $modules.IndexOf('private void SetUpdaterStatus(', $updaterPageStart)
if ($updaterPageStart -lt 0 -or $updaterPageEnd -lt 0) { throw "FIX060: updater page source boundaries missing." }
$updaterPage = $modules.Substring($updaterPageStart, $updaterPageEnd-$updaterPageStart)
foreach ($forbidden in @('Manifest Stable HTTPS','Manifest Beta HTTPS','Serwery zapasowe','updaterStableFeedBox','updaterBetaFeedBox','updaterMirrorFeedBox','TextAt(channel')) {
    if ($updaterPage -match [regex]::Escape($forbidden)) { throw "FIX060: manual endpoint entry still visible: $forbidden" }
}
foreach ($required in @('OfficialUpdateBaseUrl','InitializeGlobalUpdateService','Interval=6*60*60*1000',
                        'updaterAutoCheckBox.Checked=true','updaterAutoDownloadBox.Checked=true',
                        'DownloadProgramUpdate(true)','StartDownloadedUpdateInstaller','Verb="runas"')) {
    if ($modules -notmatch [regex]::Escape($required)) { throw "FIX060: automatic self-update component missing: $required" }
}
if ($modules -notmatch 'GetOfficialUpdateManifestUrl\(\)[\s\S]*?OfficialUpdateBaseUrl\+\(beta\?') {
    throw "FIX060: stable/beta manifest must be chosen by the app, not the user."
}
if ($modules -match 'twoja-domena\.example|updates\.example\.invalid|cdn-eu\.example') {
    throw "FIX060: fake update host remains in active updater code."
}
if ($modules -notmatch 'packageUri\.AbsolutePath\.EndsWith\("\.exe"') {
    throw "FIX060: updater must only accept the Windows installer EXE."
}


# FIX060 — autostart aktualizacji oraz ponowna weryfikacja przed podniesieniem uprawnień.
if ($main -notmatch 'InitializeGlobalUpdateService\(\);') {
    throw "FIX060: automatic update service is not initialized after application startup."
}
foreach ($required in @('updaterAutoTimer.Interval=6\*60\*60\*1000',
                        'updaterAutoCheckBox.Checked=true',
                        'updaterAutoDownloadBox.Checked=true',
                        'HashFile\(fullPath\)',
                        'actualVersion\.Trim\(\)',
                        'Verb="runas"',
                        'FileVersionInfo.GetVersionInfo')) {
    if ($modules -notmatch $required) { throw "FIX060: secure update handoff missing: $required" }
}
# Check only the user-facing page for manual endpoint input; other source helpers and
# release-publisher documentation may legitimately mention mirrors/server terminology.
$manualFieldDeclarations = [regex]::Matches($modules,'(?m)^\s*private\s+(?:TextBox|ComboBox)\s+[^;]*(?:updaterStableFeedBox|updaterBetaFeedBox|updaterMirrorFeedBox|updaterRegionBox|updaterLanguageBox)')
if ($manualFieldDeclarations.Count -gt 0) {
    throw "FIX060: obsolete user-editable updater fields remain declared in the application."
}


# FIX060 — integrity report must use the actual runtime version.
if ($modules -notmatch 'root\.SetAttribute\("ProductVersion",ProgramVersion\)') {
    throw "FIX060: integrity baseline ProductVersion must come from ProgramVersion."
}
if ($modules -match 'ProductVersion","1\.0\.0\.5[0-8]"') {
    throw "FIX060: obsolete hard-coded ProductVersion remains."
}


# FIX060 — stały powrót do pulpitu z każdej sekcji i z okna radia.
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
        throw "FIX060: main-dashboard return control missing: $required"
    }
}
if ($main -notmatch 'RadioButton\(radioBubbleWindow,"⌂  PULPIT"') {
    throw "FIX060: radio window does not expose the return-to-dashboard button."
}

# FIX060 — Cloudflare Pages + R2 is the only active update origin.
$cloudflareBase = 'https://kcs-rj2026-updates.pages.dev/updates/'
if ($modules -notmatch [regex]::Escape('OfficialUpdateBaseUrl = "'+$cloudflareBase+'"')) {
    throw "FIX060: Cloudflare Pages endpoint is not embedded in the client."
}
if ($modules -match 'naprawapclaptop\.pl/updates/' -or
    $modules -match 'example\.invalid|twoja-domena\.example') {
    throw "FIX060: old or placeholder update origin remains in runtime module."
}
if ($generator -notmatch [regex]::Escape('$BaseUrl = "'+$cloudflareBase+'"')) {
    throw "FIX060: release generator is not configured for Cloudflare Pages."
}
if ($serverTest -notmatch [regex]::Escape('$BaseUrl = "'+$cloudflareBase+'"')) {
    throw "FIX060: public server test is not configured for Cloudflare Pages."
}
$wrangler = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'cloudflare\wrangler.toml') -Raw
$function = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'cloudflare\functions\updates\[[path]].js') -Raw
$publisher = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'PUBLISH_CLOUDFLARE_FREE.ps1') -Raw
foreach ($required in @('name = "kcs-rj2026-updates"','pages_build_output_dir = "./public"',
                        'binding = "UPDATES"','bucket_name = "kcs-rj2026-updates-store"')) {
    if ($wrangler -notmatch [regex]::Escape($required)) { throw "FIX060: Cloudflare Pages/R2 config missing: $required" }
}
foreach ($required in @('env.UPDATES.head','env.UPDATES.get','range: { offset: start, length }',
                        'status: 206','Content-Range','manifest-stable.xml','manifest-beta.xml')) {
    if ($function -notmatch [regex]::Escape($required)) { throw "FIX060: Cloudflare update endpoint capability missing: $required" }
}
foreach ($required in @(
    '"pages","project","create"',
    '"r2","bucket","create"',
    '"pages","deploy","public"',
    '"r2","object","put"',
    'Verify the public manifest',
    'HTTP Range'
)) {
    if ($publisher -notmatch [regex]::Escape($required)) { throw "FIX060: Cloudflare publisher capability missing: $required" }
}
