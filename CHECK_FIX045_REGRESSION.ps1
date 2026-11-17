$ErrorActionPreference = "Stop"
$main = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.cs"))
$modules = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.Modules.cs"))
$verify = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "VERIFY_PAYLOAD.ps1"))
$assembly = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "AssemblyInfo.cs"))
if ($main -notmatch 'AddNav\("Migracja PC PRO"') { throw "FIX045: migration navigation entry missing." }
if ($main -notmatch 'BuildPcMigrationTransferPage') { throw "FIX045: migration page route missing." }
foreach ($pattern in @('BuildPcMigrationTransferPage','ExportPcMigrationPackage','VerifyPcMigrationPackage','ImportPcMigrationPackage','PcMigrationVerifyPackage','PcMigrationSafeRelative')) {
    if ($modules -notmatch $pattern) { throw "FIX045: required migration operation missing: $pattern" }
}
if ($modules -notmatch 'NEXUS_MIGRATION_MANIFEST_V1') { throw "FIX045: migration manifest format missing." }
if ($modules -notmatch 'PcMigrationHash') { throw "FIX045: SHA-256 integrity verification missing." }
if ($modules -notmatch 'FileAttributes.ReparsePoint') { throw "FIX045: reparse-point traversal protection missing." }
if ($modules -notmatch 'Pliki:\s*' -or $modules -notmatch 'Pakiet migracyjny utworzony') { throw "FIX045: migration export summary / confirmation missing." }
if ($verify -notmatch 'CHECK_FIX045_REGRESSION\.ps1') { throw "FIX045: regression checker is not source-bound." }
foreach ($style in @('PROFESJONALNY','FUTURYSTYCZNY','SZKLANY')) {
    if ($main -notmatch [regex]::Escape($style)) { throw "FIX045: selectable interface style missing: $style" }
}
foreach ($theme in @('GRANATOWY','TURKUSOWY','FIOLETOWY','SZMARAGDOWY','LODOWY','GRAFITOWY','BURSZTYNOWY','RUBINOWY',('S' + [char]0x0141 + 'ONECZNY'),'OCEANICZNY')) {
    if ($main -notmatch [regex]::Escape($theme)) { throw "FIX045: Polish color theme missing: $theme" }
}
if ($main -notmatch 'GetPolishModuleName' -or $main -notmatch 'NormalizeThemeName' -or $main -notmatch 'NormalizeInterfaceStyle') { throw "FIX045: Polish UI / legacy settings migration missing." }
if ($main -notmatch 'ApplyInterfaceStyleRecursive') { throw "FIX045: interface style drawing is not applied to existing pages." }
if ($assembly -notmatch '\[assembly:\s*AssemblyVersion\("1\.0\.0\.45"\)\]') { throw "FIX045: AssemblyVersion mismatch." }
if ($assembly -notmatch '\[assembly:\s*AssemblyFileVersion\("1\.0\.0\.45"\)\]') { throw "FIX045: AssemblyFileVersion mismatch." }
if ($assembly -notmatch 'CENTRUM MIGRACJI I NAPRAW') { throw "FIX045: Polish product identity missing from assembly metadata." }
if ($main -notmatch 'NAPRAWA PC — CENTRUM MIGRACJI I NAPRAW') { throw "FIX045: Polish product title missing." }
if ($main -notmatch 'BuildNavigationGroups' -or $main -notmatch 'FilterNavigation') { throw "FIX045: grouped searchable navigation missing." }
if ($main -notmatch 'NAJCZĘŚCIEJ UŻYWANE NARZĘDZIA' -or $main -notmatch 'ASYSTENT MIGRACJI KOMPUTERA') { throw "FIX045: redesigned dashboard workspace missing." }
if ($main -notmatch 'StyleModernComboBox' -or $main -notmatch 'DrawMode.OwnerDrawFixed') { throw "FIX045: dark themed selectors missing." }
if ($main -notmatch 'private string GetNavigationGroup' -or $main -notmatch 'MIGRACJA I PRZENOSZENIE' -or $main -notmatch 'DIAGNOSTYKA I SPRZĘT' -or $main -notmatch 'NormalizeNavigationSearch') { throw "FIX045: module navigation grouping/search missing." }
if ($main -notmatch 'FUTURYSTYCZNY' -or $main -notmatch 'SZKLANY' -or $main -notmatch 'PROFESJONALNY') { throw "FIX045: style drawing variants missing." }
if ($main -match 'topNavLabels') { throw "FIX045: duplicated top navigation was not removed." }
if ($main -notmatch 'private void BuildDashboard\(\)' -or $main -notmatch 'PŁYTA GŁÓWNA I ROZRUCH' -or $main -notmatch 'OSTATNIE CZYNNOŚCI') { throw "FIX045: new dashboard sections missing." }
if ($modules -notmatch 'NAPRAWA PC — CENTRUM MIGRACJI I NAPRAW — PAKIET MIGRACYJNY') { throw "FIX045: Polish migration package identity missing." }
if ($main -match 'navHeader\.Text=.*NEXUS') { throw "FIX045: old brand remains visible in navigation." }

if ($main -notmatch 'ProcessCmdKey' -or $main -notmatch 'Keys.Control\|Keys.K') { throw "FIX045: Ctrl+K module search shortcut missing." }
if ($main -notmatch 'AddXml\(d,root,"DesignVersion","FIX045"\)') { throw "FIX045: design configuration version not advanced." }
if ($main -match 'applyNewDesign \|\| currentTheme=="Aurora PRO"') { throw "FIX045: recognized legacy palette reset would discard the user's selection." }


$navCount = [regex]::Matches($main,'AddNav\("[^"]+"').Count
$routeCount = [regex]::Matches($main,'if\(id=="[^"]+"\)').Count
if ($navCount -ne 62 -or $routeCount -ne 62) { throw "FIX045: module navigation route count mismatch: nav=$navCount routes=$routeCount" }
if ($main -notmatch 'AddXml\(d,root,"InterfaceStyle",currentInterfaceStyle\)' -or $main -notmatch 'd.SelectSingleNode\("/Settings/InterfaceStyle"\)') { throw "FIX045: interface style preference persistence missing." }
if ($main -notmatch 'NormalizeThemeName\(n.InnerText\)') { throw "FIX045: legacy color palette migration missing." }

Write-Output "[PASS] FIX045 Polish identity, navigation, three interface styles, ten color themes and migration safeguards verified."
