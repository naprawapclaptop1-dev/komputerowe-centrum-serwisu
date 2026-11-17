# FIX215 — kontrola zdrowia Windows

Dodano skrypt diagnostyczny uruchamiający wyłącznie kontrole odczytowe: SFC `/verifyonly`, DISM `/ScanHealth` i analizę wybranych zdarzeń systemowych. Skrypt nie wykonuje napraw, nie usuwa plików i nie zmienia konfiguracji. Działanie należy potwierdzić na Windows 10/11.
