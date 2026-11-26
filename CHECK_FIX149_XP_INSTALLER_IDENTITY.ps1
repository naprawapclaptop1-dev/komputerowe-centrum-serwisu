$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$cmd = [IO.File]::ReadAllText((Join-Path $root 'BUILD_INSTALLER_XP.cmd'))
$version = Get-Content -LiteralPath (Join-Path $root 'VERSION.txt')
$checks = @()
$checks += [pscustomobject]@{Name='Reads product version from VERSION.txt'; Pass=($cmd -match '(?im)^set /p PRODUCT_VERSION=<"%~dp0VERSION\.txt"\r?$')}
$checks += [pscustomobject]@{Name='Reads product FIX from second VERSION.txt line'; Pass=($cmd -match '(?im)^for /f .*skip=1.*PRODUCT_FIX')}
$checks += [pscustomobject]@{Name='Payload verifier uses resolved product version and FIX'; Pass=($cmd -match '-ExpectedVersion "%PRODUCT_VERSION%" -ExpectedFix "%PRODUCT_FIX%"')}
$checks += [pscustomobject]@{Name='XP output filename uses resolved product FIX'; Pass=($cmd -match 'KomputeroweCentrumSerwisu_%PRODUCT_FIX%_INSTALATOR_XP\.exe')}
$checks += [pscustomobject]@{Name='Version is validated as four numeric components'; Pass=($cmd -match 'findstr /r /x .*0-9.*0-9.*0-9.*0-9')}
$checks += [pscustomobject]@{Name='FIX is validated as a three-digit FIX identity'; Pass=($cmd -match 'findstr /r /x .*FIX\[0-9\]')}
$checks += [pscustomobject]@{Name='No obsolete 1.0.0.75 or FIX140 identity remains in active XP builder'; Pass=($cmd -notmatch '1\.0\.0\.75|FIX140')}
$policy = [IO.File]::ReadAllText((Join-Path $root 'KCS_RELEASE_POLICY.ps1'))
$checks += [pscustomobject]@{Name='Release policy classifies XP builder as tooling-only'; Pass=($policy.Contains('BUILD_INSTALLER_XP\.cmd'))}
$checks += [pscustomobject]@{Name='Current product baseline remains 1.0.0.76 / FIX141'; Pass=($version[0].Trim() -eq '1.0.0.76' -and $version[1].Trim() -eq 'FIX141')}
$failed = @($checks | Where-Object { -not $_.Pass })
foreach ($c in $checks) { if ($c.Pass) { Write-Host ('[PASS] ' + $c.Name) } else { Write-Host ('[FAIL] ' + $c.Name) } }
if ($failed.Count) { exit 1 }
Write-Host '[PASS] FIX149 XP installer identity checks: 9/9'
exit 0
