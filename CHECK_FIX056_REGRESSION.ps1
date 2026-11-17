$ErrorActionPreference = "Stop"
$main = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.cs"))
$modules = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.Modules.cs"))
$verify = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "VERIFY_PAYLOAD.ps1"))
$assembly = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "AssemblyInfo.cs"))
$fallback = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO_LegacyFallback.ps1"))
$legacy = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "LegacyMode.hta"))
$setup = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "SETUP_MODERN.iss"))
$product = 'KOMPUTEROWE CENTRUM SERWISU'
if ($main -notmatch [regex]::Escape($product)) { throw "FIX056: new Polish product name missing from application source." }
if ($main -match 'NAPRAWA PC') { throw "FIX056: old visible product name remains in the main application source." }
if ($modules -match 'NAPRAWA PC') { throw "FIX056: old visible product name remains in module/report text." }
if ($modules -notmatch '<title>Komputerowe Centrum Serwisu - raport serwisowy</title>') { throw "FIX056: Polish service report title missing." }
if ($fallback.Contains('$form.Text=''NAPRAWA PC') -or $fallback.Contains('$head.Text=''NAPRAWA PC') -or $fallback.Contains('RAPORT NAPRAWA PC')) { throw "FIX056: old visible name remains in compatibility mode." }
if ($legacy.Contains('applicationname="Naprawa PC')) { throw "FIX056: old application name remains in HTA compatibility mode." }
if ($assembly -notmatch [regex]::Escape($product)) { throw "FIX056: new product name missing from assembly metadata." }
if ($setup -notmatch [regex]::Escape($product)) { throw "FIX056: new product name missing from installer." }
if ($main -notmatch 'Text = "KOMPUTEROWE CENTRUM SERWISU"') { throw "FIX056: clean application window title missing." }
if ($main -notmatch 'brand.Text="KOMPUTEROWE\\r\\nCENTRUM SERWISU"') { throw "FIX056: two-line sidebar brand missing." }
if ($main -notmatch 'headerBrand.Text="KOMPUTEROWE CENTRUM SERWISU"') { throw "FIX056: header brand missing." }
if ($main -notmatch 'e.Index>=0\?Convert.ToString\(box.Items\[e.Index\]\)') { throw "FIX056: owner-drawn ComboBox selected value drawing missing." }
if ($main -notmatch 'int quickY=514,quickH=174') { throw "FIX056: expanded dashboard actions missing." }
if ($main -notmatch 'PŁYTA GŁÓWNA I ROZRUCH' -or $main -notmatch 'ZADANIA I KONTROLA JAKOŚCI') { throw "FIX056: dashboard status panels missing." }
foreach ($style in @('PROFESJONALNY','FUTURYSTYCZNY','SZKLANY')) { if ($main -notmatch [regex]::Escape($style)) { throw "FIX056: interface style missing: $style" } }
foreach ($theme in @('GRANATOWY','TURKUSOWY','FIOLETOWY','SZMARAGDOWY','LODOWY','GRAFITOWY','BURSZTYNOWY','RUBINOWY',('S' + [char]0x0141 + 'ONECZNY'),'OCEANICZNY')) { if ($main -notmatch [regex]::Escape($theme)) { throw "FIX056: theme missing: $theme" } }
foreach ($pattern in @('BuildPcMigrationTransferPage','ExportPcMigrationPackage','VerifyPcMigrationPackage','ImportPcMigrationPackage','PcMigrationHash','FileAttributes.ReparsePoint')) { if ($modules -notmatch $pattern) { throw "FIX056: migration safeguard missing: $pattern" } }
if ($verify -notmatch 'CHECK_FIX056_REGRESSION\.ps1') { throw "FIX056: source-bound regression test reference missing." }
$assemblyVersionMatch = [regex]::Match($assembly, '\[assembly:\s*AssemblyVersion\("(?<version>\d+(?:\.\d+){3})"\)\]')
$fileVersionMatch = [regex]::Match($assembly, '\[assembly:\s*AssemblyFileVersion\("(?<version>\d+(?:\.\d+){3})"\)\]')
$verifyVersionMatch = [regex]::Match($verify, '\[string\]\$ExpectedVersion\s*=\s*"(?<version>\d+(?:\.\d+){3})"')
if (-not $assemblyVersionMatch.Success -or -not $fileVersionMatch.Success -or -not $verifyVersionMatch.Success) { throw "FIX056: assembly/verifier version metadata missing." }
$assemblyVersion = $assemblyVersionMatch.Groups['version'].Value
$fileVersion = $fileVersionMatch.Groups['version'].Value
$verifyVersion = $verifyVersionMatch.Groups['version'].Value
if ($assemblyVersion -ne $fileVersion -or $fileVersion -ne $verifyVersion) { throw "FIX056: assembly and payload verifier versions differ: Assembly=$assemblyVersion File=$fileVersion Verify=$verifyVersion" }
if ($assemblyVersion -ne "1.0.0.56") { throw "FIX056: expected current release 1.0.0.56, got $assemblyVersion" }
if ($main -notmatch 'BuildNavigationGroups' -or $main -notmatch 'FilterNavigation' -or $main -notmatch 'ProcessCmdKey') { throw "FIX056: grouped searchable navigation / Ctrl+K missing." }
if ($main -notmatch 'Card\(p,"Kana\u0142 aktualizacji programu",10,8,950,140\);') { throw "FIX056: channel card declaration syntax regression." }
$navCount = [regex]::Matches($main,'AddNav\("[^"]+"').Count
$routeCount = [regex]::Matches($main,'if\(id=="[^"]+"\)').Count
if ($navCount -ne 65 -or $routeCount -ne 65) { throw "FIX056: module route count mismatch: nav=$navCount routes=$routeCount" }
Write-Output "[PASS] FIX056 Polish product identity, redesigned dashboard, custom selectors, 65 routes, 3 styles, 10 themes and migration safeguards verified."

foreach ($route in @('Zdrowie PC','Porównanie PC','Spis programów')) {
    if ($main -notmatch [regex]::Escape('AddNav("'+$route+'"')) { throw "FIX056: navigation entry missing: $route" }
}
foreach ($method in @('BuildPcHealthCenterPage','RefreshPcHealthCenter','BuildComputerComparisonPage','SaveComputerSnapshot','ImportComputerSnapshots','CompareSelectedComputerSnapshot','BuildInstalledSoftwarePage','RefreshInstalledSoftware','ExportInstalledSoftwareCsv')) {
    if ($modules -notmatch [regex]::Escape($method)) { throw "FIX056: service module method missing: $method" }
}
foreach ($pattern in @('PredictFailure','FreePhysicalMemory','Win32_DiskDrive')) {
    if ($modules -notmatch [regex]::Escape($pattern)) { throw "FIX056: health telemetry check missing: $pattern" }
}
foreach ($pattern in @('RegistryHive.LocalMachine','RegistryView.Registry64','RegistryView.Registry32','DisplayName','DisplayVersion','Publisher')) {
    if ($modules -notmatch [regex]::Escape($pattern)) { throw "FIX056: installed software inventory check missing: $pattern" }
}
foreach ($pattern in @('servicePhoneBox','serviceEmailBox','serviceStatusBox','DeleteServiceCase','SetCaseValue')) {
    if ($modules -notmatch [regex]::Escape($pattern)) { throw "FIX056: customer service workflow feature missing: $pattern" }
}

# Global updater checks: regional selection, locale, HTTPS mirror fallback, timeout and hash verification.
foreach ($pattern in @('DetectUpdaterRegion','DetectUpdaterLanguage','RegionKey','SelectedUpdaterLanguage','SplitUpdateUrls','IsSafeHttpsUpdateUrl','ParseGlobalUpdateManifest','Mirrors/Url','TimeoutMilliseconds','ReadWriteTimeout','DtdProcessing.Prohibit','pendingUpdateMirrors','GlobalUpdates')) {
    if ($modules -notmatch [regex]::Escape($pattern)) { throw "FIX056: global update capability missing: $pattern" }
}
foreach ($ui in @('Automatyczny (wykryj region)','Europa','Ameryka Północna','Ameryka Południowa','Azja i Pacyfik','Afryka','Bliski Wschód','Wszystkie języki','Manifest Stable HTTPS','Serwery zapasowe')) {
    if ($modules -notmatch [regex]::Escape($ui)) { throw "FIX056: global update UI option missing: $ui" }
}
if ($modules -notmatch 'SecurityProtocol=\(SecurityProtocolType\)3072' -or $modules -notmatch 'LastResponseUri\.Scheme!=Uri\.UriSchemeHttps') { throw "FIX056: TLS / HTTPS redirect control missing." }
if ($modules -notmatch 'SHA-256 niezgodny z manifestem' -or $modules -notmatch '\.part') { throw "FIX056: atomic package download / SHA-256 verification missing." }


# FIX056: aktualizacje muszą być widoczne bez wyszukiwania.
foreach ($required in @('globalUpdatesButton.Text="AKTUALIZACJE"','ShowPage("Aktualizator PRO")','return "AKTUALIZACJE"','"AKTUALIZACJE"')) {
    if ($main -notmatch [regex]::Escape($required)) { throw "FIX056: visible global update entry missing: $required" }
}
if ($main -notmatch 'updatesItem=new ToolStripMenuItem\("Aktualizacje globalne"\)') { throw "FIX056: tray update shortcut missing." }
if ($main -notmatch 'string\[\] groups=new string\[\]\{"START","AKTUALIZACJE"') { throw "FIX056: updates group is not placed near the top." }

# FIX056: radio window must be resizable and adapt its layout to the monitor.
foreach ($required in @('FormBorderStyle.Sizable','MinimumSize=new Size(640,740)','ApplyRadioBubbleLayout','CaptureRadioLayoutTree','ClientSize=new Size(targetClientWidth,targetClientHeight)')) {
    if ($main -notmatch [regex]::Escape($required)) { throw "FIX056: responsive radio window component missing: $required" }
}
foreach ($required in @('DrawMode.OwnerDrawFixed','ApplyDarkRadioComboThemes','radioCountryFilter','radioLanguageFilter','radioGenreFilter')) {
    if ($main -notmatch [regex]::Escape($required)) { throw "FIX056: dark radio selector component missing: $required" }
}


# FIX056 — globalny aktualizator: status, responsywność, postęp, pauza/wznowienie i historia.
foreach ($required in @(
    'GetUpdaterPageLogicalWidth','SERWER NIE SKONFIGUROWANY',
    'updaterStatusLabel','updaterProgressBar','updaterProgressLabel',
    'updaterPauseButton','updaterStopButton','updaterHistoryList',
    'updaterAutoCheckBox','AppendUpdaterHistory','LoadUpdaterHistory',
    'BuildReleaseManifest','GENERATE_UPDATE_MANIFEST.ps1',
    'BackupUpdaterSettingsBeforeInstall','RestoreLatestUpdaterSettingsBackup'
)) {
    if (($main + $modules + $verify).IndexOf($required,[StringComparison]::OrdinalIgnoreCase) -lt 0) {
        throw "FIX056: required update capability missing: $required"
    }
}
foreach ($required in @(
    'HttpWebRequest','AddRange(existing)','ManualResetEvent','updaterPauseGate.WaitOne()',
    'WorkerSupportsCancellation=true','ProgressChanged','FileMode.Append','FileMode.Create',
    'HashFile(part)','SHA-256 niezgodny z manifestem','SettingsBackups','history.xml'
)) {
    if ($modules -notmatch [regex]::Escape($required)) { throw "FIX056: transfer / recovery capability missing: $required" }
}
if ($modules -notmatch 'if\(feeds\.Count==0\)\s*\{[\s\S]*?SERWER NIE SKONFIGUROWANY') {
    throw "FIX056: empty manifest configuration must show status, not a blocking error dialog."
}
if ($modules -match 'Brak manifestu"\s*,\s*"Brak manifestu"') {
    throw "FIX056: old modal error for empty manifest remains."
}
if ([regex]::Matches($modules,'private void BuildReleaseManifest\(\)').Count -ne 1) {
    throw "FIX056: duplicate or missing BuildReleaseManifest method."
}
if ($modules -notmatch 'private const string ProgramVersion = "1\.0\.0\.56";') {
    throw "FIX056: runtime ProgramVersion mismatch."
}
if ($main -notmatch 'DesignVersion","FIX056"' -or $main -notmatch 'design\.InnerText!="FIX056"') {
    throw "FIX056: settings schema version was not advanced without resetting user selections."
}
if ($verify -notmatch 'GENERATE_UPDATE_MANIFEST\.ps1' -or $verify -notmatch 'FIX056_RELEASE_NOTES\.txt') {
    throw "FIX056: source hash inventory misses new updater files."
}
