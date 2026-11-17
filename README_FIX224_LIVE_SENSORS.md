# FIX224 — lokalny monitoring czujników Windows

`MONITOR_CZUJNIKOW_FIX224.cmd` uruchamia lokalny skrypt PowerShell. Monitor odpyta dostępne namespace'y LibreHardwareMonitor/OpenHardwareMonitor w zadanym interwale i zapisze próbki JSONL oraz podsumowanie. Nie instaluje sterowników, nie komunikuje się z siecią i nie zapisuje do rejestrów sprzętu. Jeśli dostawca WMI nie jest dostępny, skrypt raportuje `SENSOR_PROVIDER_NOT_FOUND`; nie tworzy wartości zastępczych. Należy uruchomić na docelowym Windows z zainstalowanym i działającym providerem.
