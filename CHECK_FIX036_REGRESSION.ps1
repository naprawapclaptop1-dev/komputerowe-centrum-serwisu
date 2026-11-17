$ErrorActionPreference = "Stop"
$main = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.cs"))
$modules = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "WindowsVersionSwitcherPRO.Modules.cs"))
$verify = [IO.File]::ReadAllText((Join-Path $PSScriptRoot "VERIFY_PAYLOAD.ps1"))
if ($main -notmatch 'AddNav\("Migracja PC PRO"') { throw "FIX036: PC Migration navigation entry missing." }
if ($main -notmatch 'if\(id=="Migracja PC PRO"\) BuildPcMigrationTransferPage\(\);') { throw "FIX036: PC Migration page route missing." }
foreach ($pattern in @('BuildPcMigrationTransferPage','ExportPcMigrationPackage','VerifyPcMigrationPackage','ImportPcMigrationPackage','PcMigrationVerifyPackage','PcMigrationSafeRelative')) {
    if ($modules -notmatch $pattern) { throw "FIX036: required migration operation missing: $pattern" }
}
if ($modules -notmatch 'NEXUS_MIGRATION_MANIFEST_V1') { throw "FIX036: migration manifest format missing." }
if ($modules -notmatch 'PcMigrationHash') { throw "FIX036: SHA-256 integrity verification missing." }
if ($modules -notmatch 'FileAttributes.ReparsePoint') { throw "FIX036: reparse-point traversal protection missing." }
if ($modules -notmatch 'Liczba plików') { throw "FIX036: migration confirmation summary missing." }
if ($verify -notmatch 'CHECK_FIX036_REGRESSION\.ps1') { throw "FIX036: regression checker is not source-bound." }
if ($main -notmatch 'NEXUS RUBY' -or $main -notmatch 'NEXUS SOLAR' -or $main -notmatch 'NEXUS OCEAN') { throw "FIX036: three additional NEXUS themes missing." }
Write-Output "[PASS] FIX036 migration page, manifest validation, SHA-256, reparse-point protection and 10 themes verified."
