$ErrorActionPreference = "Stop"
$main = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.cs"))
$modules = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.Modules.cs"))
$verify = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "VERIFY_PAYLOAD.ps1"))
$assembly = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "AssemblyInfo.cs"))
$fallback = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO_LegacyFallback.ps1"))
$legacy = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "LegacyMode.hta"))
$setup = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "SETUP_MODERN.iss"))
$product = 'KOMPUTEROWE CENTRUM SERWISU'
if ($main -notmatch [regex]::Escape($product)) { throw "FIX054: new Polish product name missing from application source." }
if ($main -match 'NAPRAWA PC') { throw "FIX054: old visible product name remains in the main application source." }
if ($modules -match 'NAPRAWA PC') { throw "FIX054: old visible product name remains in module/report text." }
if ($modules -notmatch '<title>Komputerowe Centrum Serwisu - raport serwisowy</title>') { throw "FIX054: Polish service report title missing." }
if ($fallback.Contains('$form.Text=''NAPRAWA PC') -or $fallback.Contains('$head.Text=''NAPRAWA PC') -or $fallback.Contains('RAPORT NAPRAWA PC')) { throw "FIX054: old visible name remains in compatibility mode." }
if ($legacy.Contains('applicationname="Naprawa PC')) { throw "FIX054: old application name remains in HTA compatibility mode." }
if ($assembly -notmatch [regex]::Escape($product)) { throw "FIX054: new product name missing from assembly metadata." }
if ($setup -notmatch [regex]::Escape($product)) { throw "FIX054: new product name missing from installer." }
if ($main -notmatch 'Text = "KOMPUTEROWE CENTRUM SERWISU"') { throw "FIX054: clean application window title missing." }
if ($main -notmatch 'brand.Text="KOMPUTEROWE\\r\\nCENTRUM SERWISU"') { throw "FIX054: two-line sidebar brand missing." }
if ($main -notmatch 'headerBrand.Text="KOMPUTEROWE CENTRUM SERWISU"') { throw "FIX054: header brand missing." }
if ($main -notmatch 'e.Index>=0\?Convert.ToString\(box.Items\[e.Index\]\)') { throw "FIX054: owner-drawn ComboBox selected value drawing missing." }
if ($main -notmatch 'int quickY=514,quickH=174') { throw "FIX054: expanded dashboard actions missing." }
if ($main -notmatch 'PŁYTA GŁÓWNA I ROZRUCH' -or $main -notmatch 'ZADANIA I KONTROLA JAKOŚCI') { throw "FIX054: dashboard status panels missing." }
foreach ($style in @('PROFESJONALNY','FUTURYSTYCZNY','SZKLANY')) { if ($main -notmatch [regex]::Escape($style)) { throw "FIX054: interface style missing: $style" } }
foreach ($theme in @('GRANATOWY','TURKUSOWY','FIOLETOWY','SZMARAGDOWY','LODOWY','GRAFITOWY','BURSZTYNOWY','RUBINOWY',('S' + [char]0x0141 + 'ONECZNY'),'OCEANICZNY')) { if ($main -notmatch [regex]::Escape($theme)) { throw "FIX054: theme missing: $theme" } }
foreach ($pattern in @('BuildPcMigrationTransferPage','ExportPcMigrationPackage','VerifyPcMigrationPackage','ImportPcMigrationPackage','PcMigrationHash','FileAttributes.ReparsePoint')) { if ($modules -notmatch $pattern) { throw "FIX054: migration safeguard missing: $pattern" } }
if ($verify -notmatch 'CHECK_FIX054_REGRESSION\.ps1') { throw "FIX054: source-bound regression test reference missing." }
$assemblyVersionMatch = [regex]::Match($assembly, '\[assembly:\s*AssemblyVersion\("(?<version>\d+(?:\.\d+){3})"\)\]')
$fileVersionMatch = [regex]::Match($assembly, '\[assembly:\s*AssemblyFileVersion\("(?<version>\d+(?:\.\d+){3})"\)\]')
$verifyVersionMatch = [regex]::Match($verify, '\[string\]\$ExpectedVersion\s*=\s*"(?<version>\d+(?:\.\d+){3})"')
if (-not $assemblyVersionMatch.Success -or -not $fileVersionMatch.Success -or -not $verifyVersionMatch.Success) { throw "FIX054: assembly/verifier version metadata missing." }
$assemblyVersion = $assemblyVersionMatch.Groups['version'].Value
$fileVersion = $fileVersionMatch.Groups['version'].Value
$verifyVersion = $verifyVersionMatch.Groups['version'].Value
if ($assemblyVersion -ne $fileVersion -or $fileVersion -ne $verifyVersion) { throw "FIX054: assembly and payload verifier versions differ: Assembly=$assemblyVersion File=$fileVersion Verify=$verifyVersion" }
if ($assemblyVersion -ne "1.0.0.54") { throw "FIX054: expected current release 1.0.0.54, got $assemblyVersion" }
if ($main -notmatch 'BuildNavigationGroups' -or $main -notmatch 'FilterNavigation' -or $main -notmatch 'ProcessCmdKey') { throw "FIX054: grouped searchable navigation / Ctrl+K missing." }
if ($main -notmatch 'Card\(p,"Kana\u0142 aktualizacji programu",10,8,950,140\);') { throw "FIX054: channel card declaration syntax regression." }
$navCount = [regex]::Matches($main,'AddNav\("[^"]+"').Count
$routeCount = [regex]::Matches($main,'if\(id=="[^"]+"\)').Count
if ($navCount -ne 65 -or $routeCount -ne 65) { throw "FIX054: module route count mismatch: nav=$navCount routes=$routeCount" }
Write-Output "[PASS] FIX054 Polish product identity, redesigned dashboard, custom selectors, 65 routes, 3 styles, 10 themes and migration safeguards verified."

foreach ($route in @('Zdrowie PC','Porównanie PC','Spis programów')) {
    if ($main -notmatch [regex]::Escape('AddNav("'+$route+'"')) { throw "FIX054: navigation entry missing: $route" }
}
foreach ($method in @('BuildPcHealthCenterPage','RefreshPcHealthCenter','BuildComputerComparisonPage','SaveComputerSnapshot','ImportComputerSnapshots','CompareSelectedComputerSnapshot','BuildInstalledSoftwarePage','RefreshInstalledSoftware','ExportInstalledSoftwareCsv')) {
    if ($modules -notmatch [regex]::Escape($method)) { throw "FIX054: service module method missing: $method" }
}
foreach ($pattern in @('PredictFailure','FreePhysicalMemory','Win32_DiskDrive')) {
    if ($modules -notmatch [regex]::Escape($pattern)) { throw "FIX054: health telemetry check missing: $pattern" }
}
foreach ($pattern in @('RegistryHive.LocalMachine','RegistryView.Registry64','RegistryView.Registry32','DisplayName','DisplayVersion','Publisher')) {
    if ($modules -notmatch [regex]::Escape($pattern)) { throw "FIX054: installed software inventory check missing: $pattern" }
}
foreach ($pattern in @('servicePhoneBox','serviceEmailBox','serviceStatusBox','DeleteServiceCase','SetCaseValue')) {
    if ($modules -notmatch [regex]::Escape($pattern)) { throw "FIX054: customer service workflow feature missing: $pattern" }
}

# Global updater checks: regional selection, locale, HTTPS mirror fallback, timeout and hash verification.
foreach ($pattern in @('DetectUpdaterRegion','DetectUpdaterLanguage','RegionKey','SelectedUpdaterLanguage','SplitUpdateUrls','IsSafeHttpsUpdateUrl','ParseGlobalUpdateManifest','Mirrors/Url','TimeoutMilliseconds','ReadWriteTimeout','DtdProcessing.Prohibit','pendingUpdateMirrors','GlobalUpdates')) {
    if ($modules -notmatch [regex]::Escape($pattern)) { throw "FIX054: global update capability missing: $pattern" }
}
foreach ($ui in @('Automatyczny (wykryj region)','Europa','Ameryka Północna','Ameryka Południowa','Azja i Pacyfik','Afryka','Bliski Wschód','Wszystkie języki','Manifest Stable HTTPS','Serwery zapasowe')) {
    if ($modules -notmatch [regex]::Escape($ui)) { throw "FIX054: global update UI option missing: $ui" }
}
if ($modules -notmatch 'SecurityProtocol=\(SecurityProtocolType\)3072' -or $modules -notmatch 'LastResponseUri\.Scheme!=Uri\.UriSchemeHttps') { throw "FIX054: TLS / HTTPS redirect control missing." }
if ($modules -notmatch 'SHA-256 niezgodny z manifestem' -or $modules -notmatch '\.part') { throw "FIX054: atomic package download / SHA-256 verification missing." }
