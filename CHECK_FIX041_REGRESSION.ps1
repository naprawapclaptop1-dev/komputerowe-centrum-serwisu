$ErrorActionPreference = "Stop"
$main = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.cs"))
$modules = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.Modules.cs"))
$verify = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "VERIFY_PAYLOAD.ps1"))
$assembly = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "AssemblyInfo.cs"))
if ($main -notmatch 'AddNav\("Migracja PC PRO"') { throw "FIX041: migration navigation entry missing." }
if ($main -notmatch 'BuildPcMigrationTransferPage') { throw "FIX041: migration page route missing." }
foreach ($pattern in @('BuildPcMigrationTransferPage','ExportPcMigrationPackage','VerifyPcMigrationPackage','ImportPcMigrationPackage','PcMigrationVerifyPackage','PcMigrationSafeRelative')) {
    if ($modules -notmatch $pattern) { throw "FIX041: required migration operation missing: $pattern" }
}
if ($modules -notmatch 'NEXUS_MIGRATION_MANIFEST_V1') { throw "FIX041: migration manifest format missing." }
if ($modules -notmatch 'PcMigrationHash') { throw "FIX041: SHA-256 integrity verification missing." }
if ($modules -notmatch 'FileAttributes.ReparsePoint') { throw "FIX041: reparse-point traversal protection missing." }
if ($modules -notmatch 'Pliki:\s*' -or $modules -notmatch 'Pakiet migracyjny utworzony') { throw "FIX041: migration export summary / confirmation missing." }
if ($verify -notmatch 'CHECK_FIX041_REGRESSION\.ps1') { throw "FIX041: regression checker is not source-bound." }
foreach ($style in @('KLASYCZNY','FUTURYSTYCZNY','SZKLANY')) {
    if ($main -notmatch [regex]::Escape($style)) { throw "FIX041: selectable interface style missing: $style" }
}
foreach ($theme in @('GRANATOWY','TURKUSOWY','FIOLETOWY','SZMARAGDOWY','LODOWY','GRAFITOWY','BURSZTYNOWY','RUBINOWY','SŁONECZNY','OCEANICZNY')) {
    if ($main -notmatch [regex]::Escape($theme)) { throw "FIX041: Polish color theme missing: $theme" }
}
if ($main -notmatch 'GetPolishModuleName' -or $main -notmatch 'NormalizeThemeName' -or $main -notmatch 'NormalizeInterfaceStyle') { throw "FIX041: Polish UI / legacy settings migration missing." }
if ($main -notmatch 'ApplyInterfaceStyleRecursive') { throw "FIX041: interface style drawing is not applied to existing pages." }
if ($assembly -notmatch '1\.0\.0\.41') { throw "FIX041: assembly file version mismatch." }
if ($assembly -notmatch 'CENTRUM MIGRACJI I NAPRAW') { throw "FIX041: Polish product identity missing from assembly metadata." }
if ($main -notmatch 'NAPRAWA PC — CENTRUM MIGRACJI I NAPRAW') { throw "FIX041: Polish product title missing." }
if ($main -notmatch 'CENTRUM SERWISOWE • MODUŁY') { throw "FIX041: Polish sidebar brand missing." }
if ($modules -notmatch 'NAPRAWA PC — CENTRUM MIGRACJI I NAPRAW — PAKIET MIGRACYJNY') { throw "FIX041: Polish migration package identity missing." }
if ($main -match 'navHeader\.Text=.*NEXUS') { throw "FIX041: old brand remains visible in navigation." }
Write-Output "[PASS] FIX041 Polish identity, navigation, three interface styles, ten color themes and migration safeguards verified."
