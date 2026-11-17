NAUKA OD A DO Z — FIX177
Naprawa publikatora zdjęć i zależnej walidacji FIX83

Przyczyna:
Watcher pobierał media/home-photo-library-fix118.json, ale nie przekazywał
wyniku do walidatora FIX176. Kontrakt FIX176 wymaga 19 wpisów biblioteki
z przypisaniem slotId/seedId. Bez parametru photoLibrary walidator otrzymywał
pustą tablicę, więc remotePhotoCatalogValid było false. remoteGlobalAcademyFix83Valid
jest zależne od remotePhotoCatalogValid, dlatego również kończyło się false.

Zmiana:
AUTO_PUBLISH_WATCHER.js przekazuje photoLibrary: remoteHomePhotoLibrary.
Usunięto również redundantne pobranie katalogu JS.

Uruchomienie testów:
node scripts/run-tests-fix177.mjs

Uwaga:
FIX177 naprawia lokalny kod walidacji publikatora. Sam test lokalny nie potwierdza
stanu stałej domeny ani nie wykonuje publikacji do Cloudflare. Po uruchomieniu
OneClick należy zweryfikować rzeczywisty deployment i stały adres.
