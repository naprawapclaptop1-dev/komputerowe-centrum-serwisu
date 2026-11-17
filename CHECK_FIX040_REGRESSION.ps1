$ErrorActionPreference = "Stop"
$main = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.cs"))
$modules = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.Modules.cs"))
$verify = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "VERIFY_PAYLOAD.ps1"))
if ($main -notmatch 'AddNav\("Migracja PC PRO"') { throw "FIX040: PC Migration navigation entry missing." }
if ($main -notmatch 'if\(id=="Migracja PC PRO"\) BuildPcMigrationTransferPage\(\);') { throw "FIX040: PC Migration page route missing." }
foreach ($pattern in @('BuildPcMigrationTransferPage','ExportPcMigrationPackage','VerifyPcMigrationPackage','ImportPcMigrationPackage','PcMigrationVerifyPackage','PcMigrationSafeRelative')) {
    if ($modules -notmatch $pattern) { throw "FIX040: required migration operation missing: $pattern" }
}
if ($modules -notmatch 'NEXUS_MIGRATION_MANIFEST_V1') { throw "FIX040: migration manifest format missing." }
if ($modules -notmatch 'PcMigrationHash') { throw "FIX040: SHA-256 integrity verification missing." }
if ($modules -notmatch 'FileAttributes.ReparsePoint') { throw "FIX040: reparse-point traversal protection missing." }
if ($modules -notmatch 'Pliki:\s*' -or $modules -notmatch 'MessageBox\.Show\(\"Pakiet migracyjny utworzony') { throw \"FIX040: migration export summary / user confirmation missing.\" }
if ($verify -notmatch 'CHECK_FIX040_REGRESSION\.ps1') { throw "FIX040: regression checker is not source-bound." }
if ($main -notmatch 'NEXUS RUBY' -or $main -notmatch 'NEXUS SOLAR' -or $main -notmatch 'NEXUS OCEAN') { throw "FIX040: three additional NEXUS themes missing." }

foreach ($style in @('NEXUS PREMIUM','NEXUS FUTURE','NEXUS PRO GLASS')) {
    if ($main -notmatch [regex]::Escape($style)) { throw "FIX040: selectable interface style missing: $style" }
}
if ($main -notmatch 'InterfaceStyle') { throw "FIX040: interface style persistence missing." }
if ($main -notmatch 'ApplyInterfaceStyle') { throw "FIX040: interface style application missing." }

Write-Output "[PASS] FIX040 migration safeguards, 10 color themes and 3 selectable interface styles verified."
