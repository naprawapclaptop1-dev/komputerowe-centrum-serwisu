$ErrorActionPreference = "Stop"
$main = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.cs"))
$modules = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.Modules.cs"))
$verify = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "VERIFY_PAYLOAD.ps1"))
$assembly = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "AssemblyInfo.cs"))
if ($main -notmatch 'AddNav\("Migracja PC PRO"') { throw "FIX044: migration navigation entry missing." }
if ($main -notmatch 'BuildPcMigrationTransferPage') { throw "FIX044: migration page route missing." }
foreach ($pattern in @('BuildPcMigrationTransferPage','ExportPcMigrationPackage','VerifyPcMigrationPackage','ImportPcMigrationPackage','PcMigrationVerifyPackage','PcMigrationSafeRelative')) {
    if ($modules -notmatch $pattern) { throw "FIX044: required migration operation missing: $pattern" }
}
if ($modules -notmatch 'NEXUS_MIGRATION_MANIFEST_V1') { throw "FIX044: migration manifest format missing." }
if ($modules -notmatch 'PcMigrationHash') { throw "FIX044: SHA-256 integrity verification missing." }
if ($modules -notmatch 'FileAttributes.ReparsePoint') { throw "FIX044: reparse-point traversal protection missing." }
if ($modules -notmatch 'Pliki:\s*' -or $modules -notmatch 'Pakiet migracyjny utworzony') { throw "FIX044: migration export summary / confirmation missing." }
if ($verify -notmatch 'CHECK_FIX044_REGRESSION\.ps1') { throw "FIX044: regression checker is not source-bound." }
foreach ($style in @('KLASYCZNY','FUTURYSTYCZNY','SZKLANY')) {
    if ($main -notmatch [regex]::Escape($style)) { throw "FIX044: selectable interface style missing: $style" }
}
foreach ($theme in @('GRANATOWY','TURKUSOWY','FIOLETOWY','SZMARAGDOWY','LODOWY','GRAFITOWY','BURSZTYNOWY','RUBINOWY',('S' + [char]0x0141 + 'ONECZNY'),'OCEANICZNY')) {
    if ($main -notmatch [regex]::Escape($theme)) { throw "FIX044: Polish color theme missing: $theme" }
}
if ($main -notmatch 'GetPolishModuleName' -or $main -notmatch 'NormalizeThemeName' -or $main -notmatch 'NormalizeInterfaceStyle') { throw "FIX044: Polish UI / legacy settings migration missing." }
if ($main -notmatch 'ApplyInterfaceStyleRecursive') { throw "FIX044: interface style drawing is not applied to existing pages." }
if ($assembly -notmatch '\[assembly:\s*AssemblyVersion\("1\.0\.0\.44"\)\]') { throw "FIX044: AssemblyVersion mismatch." }
if ($assembly -notmatch '\[assembly:\s*AssemblyFileVersion\("1\.0\.0\.44"\)\]') { throw "FIX044: AssemblyFileVersion mismatch." }
if ($assembly -notmatch 'CENTRUM MIGRACJI I NAPRAW') { throw "FIX044: Polish product identity missing from assembly metadata." }
if ($main -notmatch 'NAPRAWA PC — CENTRUM MIGRACJI I NAPRAW') { throw "FIX044: Polish product title missing." }
if ($main -notmatch 'CENTRUM SERWISOWE • MODUŁY') { throw "FIX044: Polish sidebar brand missing." }
if ($modules -notmatch 'NAPRAWA PC — CENTRUM MIGRACJI I NAPRAW — PAKIET MIGRACYJNY') { throw "FIX044: Polish migration package identity missing." }
if ($main -match 'navHeader\.Text=.*NEXUS') { throw "FIX044: old brand remains visible in navigation." }
Write-Output "[PASS] FIX044 Polish identity, navigation, three interface styles, ten color themes and migration safeguards verified."
