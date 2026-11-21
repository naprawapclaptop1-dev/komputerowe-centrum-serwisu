$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$publisher=Get-Content (Join-Path $root 'PUBLISH_GITHUB_RELEASES.ps1') -Raw
$verify=Get-Content (Join-Path $root 'VERIFY_GLOBAL_UPDATE_SERVER.ps1') -Raw
$version=(Get-Content -LiteralPath (Join-Path $root 'VERSION.txt') -Encoding UTF8 | Select-Object -First 1).Trim()
$expectedTagText = '$expectedTag="v' + $version + '"'
$tagPos=$verify.IndexOf($expectedTagText)
$apiPos=$verify.IndexOf('$api="https://api.github.com/repos/$Repo/releases/tags/$expectedTag"')
$checks=@(
 [pscustomobject]@{Passed=($publisher -notmatch 'Split-Path -Leaf \$Root.*KCS_FIX099' -and $publisher.Contains('FIX099_PACKAGE_MARKER.txt') -and $publisher.Contains('ENTRYPOINT=URUCHOM_TYLKO_TEN_PLIK.cmd'));Name='Publisher accepts any extraction folder but validates package identity'},
 [pscustomobject]@{Passed=($tagPos -ge 0 -and $apiPos -gt $tagPos);Name='Release verifier initializes expectedTag before constructing API URL'},
 [pscustomobject]@{Passed=($verify.Contains('manifest-stable.xml') -and $verify.Contains('manifest-beta.xml') -and $verify.Contains('SHA256SUMS.txt'));Name='Stable, Beta and SHA-256 checks remain enabled'}
)
$failed=$false;foreach($c in $checks){if($c.Passed){Write-Host ('[PASS] '+$c.Name)}else{Write-Host ('[FAIL] '+$c.Name);$failed=$true}}
if($failed){exit 1};Write-Host '[PASS] FIX108 release publishing regression.';exit 0
