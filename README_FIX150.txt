FIX150 — NAPRAWA PUBLIKATORA NAUKA OD A DO Z
Produkt 6.8.0 / strona FIX149 / publikator FIX150

CO NAPRAWIONO
Błąd ReferenceError: RELEASE is not defined w funkcji verifyWeb() pliku ONECLICK_AKADEMIA.js. Kontrola rozszerzenia FIX149 porównuje teraz wersję produktu z releaseVersion odczytaną z release.json.

CO ZOSTAŁO ZACHOWANE
Nie zmieniono HTML strony, #view-home, 35 widoków, 1083 lekcji, 19 przypisań zdjęć, cache fotografii, Service Workera, API, kont, OAuth, konfiguracji Cloudflare ani bindingu D1. Publiczny runtime pozostaje FIX149; FIX150 jest poprawką narzędzia publikującego.

JAK WGRAC
- Zrób kopię katalogu projektu.
- Rozpakuj pełną paczkę FIX150 do G:\AKADEMIA_SERWISU_PRO.
- Uruchom START_FIX105 tak jak dotychczas.
- Zachowaj LOGI\START_FIX105.log, jeśli zatrzyma się na innym etapie.

TESTY
Uruchom WYKONAJ_TESTY_FIX150.cmd, aby wykonać pełny zestaw regresyjny. Raport: RAPORT_FIX150_TESTY.log.
