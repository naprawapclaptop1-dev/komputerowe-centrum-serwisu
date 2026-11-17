# FIX239 — smoke test po wdrożeniu

Uruchom z ustawioną zmienną `NAUKA_SMOKE_URL`, np. `https://twoja-domena.example`:

```cmd
set NAUKA_SMOKE_URL=https://twoja-domena.example
node scripts/post-deploy-smoke-fix239.mjs
```

Opcjonalnie ustaw `NAUKA_SMOKE_COOKIE` dla testów sesji oraz `NAUKA_SMOKE_ADMIN_TOKEN` dla endpointów administratora. Nie przekazuj tych wartości w argumentach polecenia i nigdy nie udostępniaj logów z sekretami.

Raport: `reports/FIX239_POST_DEPLOY_SMOKE.json`. Test sprawdza zasoby, Service Worker, schemat D1, pięciu dostawców OAuth i ochronę endpointów. Test lokalny kontraktu nie jest testem produkcyjnym. Właściwy smoke test wykonuje użytkownik po publikacji.
