# FIX214 — opcjonalne czujniki

Kolektor Windows próbuje odczytać czujniki z przestrzeni WMI LibreHardwareMonitor/OpenHardwareMonitor, jeśli są zainstalowane i udostępniają namespace. Brak danych jest oznaczany jako brak źródła; nie generuje fikcyjnych pomiarów. Nie jest to samodzielny sterownik czujników.
