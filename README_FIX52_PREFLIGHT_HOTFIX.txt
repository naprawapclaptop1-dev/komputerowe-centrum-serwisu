NAUKA OD A DO Z — FIX52 PREFLIGHT HOTFIX
Baza: 6.8.0 FIX51 VISUAL ACADEMY PRO
Wersja produktu: 6.8.0 (bez zmiany)
Hotfix: FIX52 — poprawka testów preflight

CO BYŁO NIE TAK
1. Test scripts/test-visual-academy-fix51.mjs szukał frazy „localne plakaty lekcji”, ale aplikacja prawidłowo wyświetla „lokalne plakaty lekcji”. To literówka w teście, nie brak plakatów w paczce.
2. Po naprawieniu pierwszej asercji kolejny test kontraktu wywołałby ReferenceError, ponieważ publicContract był użyty przed deklaracją const.

CO POPRAWIONO
- Asercja sprawdza prawidłowy polski tekst „lokalne plakaty lekcji”.
- Test porównuje listę ścieżek posterPaths w runtime z localPosters w FIX51_RELEASE_MANIFEST.json.
- publicContract jest parsowany przed asercjami, które go używają.
- Historyczny test runnerów dopuszcza wrapper FIX52 i potwierdza, że wywołuje aktualny runner FIX51.
- Dokumentacja podaje poprawną liczbę 33 zasobów wizualnych: 12 fotografii + 3 plakaty + 18 ilustracji SVG.

JAK SPRAWDZIĆ NA WINDOWS 10/11
1. Rozpakuj to archiwum do nowego folderu. Nie nadpisuj poprzedniego FIX51.
2. Upewnij się, że `node --version` pokazuje v24.19.0.
3. Uruchom `WYKONAJ_TESTY_FIX52.cmd`.
4. Dopiero po uzyskaniu [OK] z testów przejdź do zwykłej procedury publikacji.

BEZPIECZEŃSTWO I DANE
- Hotfix nie zmienia runtime aplikacji, publicznego build ID, OpenAI, OAuth, sekretów, Cloudflare Pages ani bindingu D1.
- Nie wykonuje kopii, migracji ani zapisów D1.
- Nie uruchamia publikacji.
- W logu użytkownika publikacja zatrzymała się przed operacjami na D1; ten hotfix nie zmienia tego zabezpieczenia.

WYNIKI WERYFIKACJI W KONTENERZE
- Node.js v22.16.0 (nie v24.19.0).
- 221/221 składni.
- 81/81 testów regresyjnych (28 JS + 53 MJS).
- Visual Academy 7/7; kontrakt wydania PASS; podgląd HTTP PASS.
- Audyt bezpieczeństwa: 0 ustaleń critical/high.
- Dwie historyczne migracje wymagają ręcznej oceny; nie wykonano żadnego SQL.
- Test GUI Chrome/Edge pozostaje do wykonania na Windows.

FIX52 naprawia fałszywie negatywną kontrolę preflight. Nie jest potwierdzeniem, że produkcja została opublikowana.
