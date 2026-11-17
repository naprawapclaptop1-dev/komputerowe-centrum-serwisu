$ErrorActionPreference = "Stop"
$main = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.cs"))
$modules = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.Modules.cs"))
$verify = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "VERIFY_PAYLOAD.ps1"))
$assembly = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "AssemblyInfo.cs"))
if ($main -notmatch 'AddNav\("Migracja PC PRO"') { throw "FIX046: migration navigation entry missing." }
if ($main -notmatch 'BuildPcMigrationTransferPage') { throw "FIX046: migration page route missing." }
foreach ($pattern in @('BuildPcMigrationTransferPage','ExportPcMigrationPackage','VerifyPcMigrationPackage','ImportPcMigrationPackage','PcMigrationVerifyPackage','PcMigrationSafeRelative')) {
    if ($modules -notmatch $pattern) { throw "FIX046: required migration operation missing: $pattern" }
}
if ($modules -notmatch 'NEXUS_MIGRATION_MANIFEST_V1') { throw "FIX046: migration manifest format missing." }
if ($modules -notmatch 'PcMigrationHash') { throw "FIX046: SHA-256 integrity verification missing." }
if ($modules -notmatch 'FileAttributes.ReparsePoint') { throw "FIX046: reparse-point traversal protection missing." }
if ($modules -notmatch 'Pliki:\s*' -or $modules -notmatch 'Pakiet migracyjny utworzony') { throw "FIX046: migration export summary / confirmation missing." }
if ($verify -notmatch 'CHECK_FIX046_REGRESSION\.ps1') { throw "FIX046: regression checker is not source-bound." }
foreach ($style in @('PROFESJONALNY','FUTURYSTYCZNY','SZKLANY')) {
    if ($main -notmatch [regex]::Escape($style)) { throw "FIX046: selectable interface style missing: $style" }
}
foreach ($theme in @('GRANATOWY','TURKUSOWY','FIOLETOWY','SZMARAGDOWY','LODOWY','GRAFITOWY','BURSZTYNOWY','RUBINOWY',('S' + [char]0x0141 + 'ONECZNY'),'OCEANICZNY')) {
    if ($main -notmatch [regex]::Escape($theme)) { throw "FIX046: Polish color theme missing: $theme" }
}
if ($main -notmatch 'GetPolishModuleName' -or $main -notmatch 'NormalizeThemeName' -or $main -notmatch 'NormalizeInterfaceStyle') { throw "FIX046: Polish UI / legacy settings migration missing." }
if ($main -notmatch 'ApplyInterfaceStyleRecursive') { throw "FIX046: interface style drawing is not applied to existing pages." }
if ($main -notmatch 'NeonCardPanel\s+step\s*=\s*new\s+NeonCardPanel') { throw "FIX046: migration step card must be typed as NeonCardPanel to expose InterfaceStyle." }
if ($main -match '(?m)^\s*Panel\s+step\s*=\s*new\s+NeonCardPanel') { throw "FIX046: migration step card is typed as base Panel; compile error risk." }

if ($assembly -notmatch '\[assembly:\s*AssemblyVersion\("1\.0\.0\.46"\)\]') { throw "FIX046: AssemblyVersion mismatch." }
if ($assembly -notmatch '\[assembly:\s*AssemblyFileVersion\("1\.0\.0\.46"\)\]') { throw "FIX046: AssemblyFileVersion mismatch." }
if ($assembly -notmatch 'CENTRUM MIGRACJI I NAPRAW') { throw "FIX046: Polish product identity missing from assembly metadata." }
if ($main -notmatch 'NAPRAWA PC — CENTRUM MIGRACJI I NAPRAW') { throw "FIX046: Polish product title missing." }
if ($main -notmatch 'BuildNavigationGroups' -or $main -notmatch 'FilterNavigation') { throw "FIX046: grouped searchable navigation missing." }
if ($main -notmatch 'NAJCZĘŚCIEJ UŻYWANE NARZĘDZIA' -or $main -notmatch 'ASYSTENT MIGRACJI KOMPUTERA') { throw "FIX046: redesigned dashboard workspace missing." }
if ($main -notmatch 'StyleModernComboBox' -or $main -notmatch 'DrawMode.OwnerDrawFixed') { throw "FIX046: dark themed selectors missing." }
if ($main -notmatch 'private string GetNavigationGroup' -or $main -notmatch 'MIGRACJA I PRZENOSZENIE' -or $main -notmatch 'DIAGNOSTYKA I SPRZĘT' -or $main -notmatch 'NormalizeNavigationSearch') { throw "FIX046: module navigation grouping/search missing." }
if ($main -notmatch 'FUTURYSTYCZNY' -or $main -notmatch 'SZKLANY' -or $main -notmatch 'PROFESJONALNY') { throw "FIX046: style drawing variants missing." }
if ($main -match 'topNavLabels') { throw "FIX046: duplicated top navigation was not removed." }
if ($main -notmatch 'private void BuildDashboard\(\)' -or $main -notmatch 'PŁYTA GŁÓWNA I ROZRUCH' -or $main -notmatch 'OSTATNIE CZYNNOŚCI') { throw "FIX046: new dashboard sections missing." }
if ($modules -notmatch 'NAPRAWA PC — CENTRUM MIGRACJI I NAPRAW — PAKIET MIGRACYJNY') { throw "FIX046: Polish migration package identity missing." }
if ($main -match 'navHeader\.Text=.*NEXUS') { throw "FIX046: old brand remains visible in navigation." }

if ($main -notmatch 'ProcessCmdKey' -or $main -notmatch 'Keys.Control\|Keys.K') { throw "FIX046: Ctrl+K module search shortcut missing." }
if ($main -notmatch 'AddXml\(d,root,"DesignVersion","FIX046"\)') { throw "FIX046: design configuration version not advanced." }
if ($main -match 'applyNewDesign \|\| currentTheme=="Aurora PRO"') { throw "FIX046: recognized legacy palette reset would discard the user's selection." }


$navCount = [regex]::Matches($main,'AddNav\("[^"]+"').Count
$routeCount = [regex]::Matches($main,'if\(id=="[^"]+"\)').Count
if ($navCount -ne 62 -or $routeCount -ne 62) { throw "FIX046: module navigation route count mismatch: nav=$navCount routes=$routeCount" }
if ($main -notmatch 'AddXml\(d,root,"InterfaceStyle",currentInterfaceStyle\)' -or $main -notmatch 'd.SelectSingleNode\("/Settings/InterfaceStyle"\)') { throw "FIX046: interface style preference persistence missing." }
if ($main -notmatch 'NormalizeThemeName\(n.InnerText\)') { throw "FIX046: legacy color palette migration missing." }

Write-Output "[PASS] FIX046 Polish identity, navigation, three interface styles, ten color themes and migration safeguards verified."
