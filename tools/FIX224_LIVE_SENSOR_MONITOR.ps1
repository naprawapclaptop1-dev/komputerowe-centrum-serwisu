#requires -Version 5.1
[CmdletBinding()]
param(
  [ValidateRange(1,120)][int]$DurationMinutes = 5,
  [ValidateRange(2,30)][int]$IntervalSeconds = 2,
  [string]$OutputDirectory = (Join-Path $env:PUBLIC 'Documents\Nauka-FIX224-Sensors')
)
$ErrorActionPreference='Stop'
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null
$stamp=Get-Date -Format 'yyyyMMdd_HHmmss'
$jsonl=Join-Path $OutputDirectory "SENSORS_$stamp.jsonl"
$summary=Join-Path $OutputDirectory "SENSORS_$stamp_SUMMARY.json"
$namespaces=@('root/LibreHardwareMonitor','root/OpenHardwareMonitor')
$selected=$null
foreach($namespace in $namespaces){try{$probe=Get-CimInstance -Namespace $namespace -ClassName Sensor -ErrorAction Stop|Select-Object -First 1;if($probe){$selected=$namespace;break}}catch{}}
if(-not $selected){
  $result=[pscustomobject]@{schema='NAUKA_FIX224_LIVE_SENSORS';version=1;startedAt=(Get-Date).ToUniversalTime().ToString('o');endedAt=(Get-Date).ToUniversalTime().ToString('o');source='NONE';samples=0;status='SENSOR_PROVIDER_NOT_FOUND';message='Nie znaleziono WMI Sensor w LibreHardwareMonitor/OpenHardwareMonitor. Zainstaluj i uruchom jeden z tych dostawców WMI, a następnie ponów pomiar. Nie utworzono żadnych wartości zastępczych.';dataFile=$null}
  $result|ConvertTo-Json -Depth 5|Set-Content -LiteralPath $summary -Encoding UTF8
  Write-Host $result.message -ForegroundColor Yellow;Write-Host "Raport: $summary";exit 2
}
$started=Get-Date;$until=$started.AddMinutes($DurationMinutes);$samples=0;$sensorCount=0;$errors=0
Write-Host "FIX224 — monitor czujników: $selected" -ForegroundColor Cyan
Write-Host "Czas: $DurationMinutes min · interwał: $IntervalSeconds s · Ctrl+C zatrzymuje pomiar."
try{
  while((Get-Date)-lt $until){
    $now=(Get-Date).ToUniversalTime().ToString('o')
    try{
      $sensors=@(Get-CimInstance -Namespace $selected -ClassName Sensor -ErrorAction Stop | Where-Object {$_.SensorType -in @('Temperature','Fan','Voltage','Power','Clock','Load','Data','SmallData')} | Select-Object -First 500)
      $values=@(foreach($sensor in $sensors){$value=$null;try{if($null -ne $sensor.Value){$value=[double]$sensor.Value}}catch{};if($null -ne $value){[pscustomobject]@{name=([string]$sensor.Name -replace '[\r\n\t]',' ');type=[string]$sensor.SensorType;value=[Math]::Round($value,3);unit=[string]$sensor.ValueUnit}}})
      $record=[pscustomobject]@{schema='NAUKA_FIX224_SENSOR_SAMPLE';timestamp=$now;source=$selected;sensors=$values}
      ($record|ConvertTo-Json -Depth 5 -Compress)|Add-Content -LiteralPath $jsonl -Encoding UTF8
      $samples++;$sensorCount+=$values.Count
      Write-Progress -Activity 'Odczyt czujników sprzętowych' -Status "$samples próbek · $($values.Count) czujników · $selected" -PercentComplete ([Math]::Min(100,((Get-Date)-$started).TotalSeconds/($DurationMinutes*60)*100))
    }catch{$errors++;Write-Warning "Nie udało się odczytać próbki: $($_.Exception.Message)"}
    Start-Sleep -Seconds $IntervalSeconds
  }
}catch [System.Management.Automation.PipelineStoppedException] { Write-Host 'Pomiar przerwany przez użytkownika.' -ForegroundColor Yellow }
finally{
  Write-Progress -Activity 'Odczyt czujników sprzętowych' -Completed
  $ended=Get-Date
  $result=[pscustomobject]@{schema='NAUKA_FIX224_LIVE_SENSORS';version=1;source=$selected;startedAt=$started.ToUniversalTime().ToString('o');endedAt=$ended.ToUniversalTime().ToString('o');durationSeconds=[Math]::Round(($ended-$started).TotalSeconds,1);intervalSeconds=$IntervalSeconds;samples=$samples;sensorReadings=$sensorCount;readErrors=$errors;status=if($samples -gt 0){'COMPLETED'}else{'NO_READINGS'};dataFile=$jsonl;networkAccess=$false;writesToHardware=$false;limitations=@('Wartości zależą od dostawcy WMI, sterownika i czujnika.','Brak czujnika oznacza brak pomiaru, a nie temperaturę 0.','Nazwy czujników mogą być niepełne lub nieprecyzyjne.','Skrypt nie zmienia ustawień BIOS/UEFI, wentylatorów ani napięć.')}
  $result|ConvertTo-Json -Depth 5|Set-Content -LiteralPath $summary -Encoding UTF8
  Write-Host "Próbki: $samples · odczyty: $sensorCount · błędy: $errors" -ForegroundColor Green
  Write-Host "Dane JSONL: $jsonl";Write-Host "Podsumowanie: $summary"
}
