import process from 'node:process';
const baseUrl = process.env.ACADEMY_E2E_URL || 'https://naprawa-pc-akademia-serwisu-pro.pages.dev';
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('SKIP: Playwright nie jest zainstalowany. Zainstaluj go lokalnie: npm install --save-dev playwright && npx playwright install chromium.');
  console.error('Test przeglądarkowy nie został wykonany i nie jest oznaczony jako PASS.');
  process.exit(2);
}
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
try {
  const response = await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 45000 });
  if (!response?.ok()) throw new Error(`Strona zwróciła HTTP ${response?.status() || 'brak odpowiedzi'}`);
  const build = await page.locator('meta[name="academy-build"]').getAttribute('content');
  if (!build?.includes('fix49')) throw new Error(`Oczekiwano FIX49, otrzymano ${build || 'brak build ID'}`);
  await page.locator('[data-view="fix49"]').click();
  await page.locator('#view-fix49').waitFor({ state: 'visible' });
  for (const tab of ['overview','browser','errors','release','staging','rollback','migrations','security','bundle','practice']) {
    await page.locator(`[data-f49-tab="${tab}"]`).click();
    await page.locator(`#f49-pane-${tab}`).waitFor({ state: 'visible' });
  }
  if (errors.length) throw new Error(`Błędy przeglądarki: ${errors.slice(0, 5).join(' | ')}`);
  console.log(`PASS Browser E2E FIX49: ${baseUrl}; build=${build}; 10 zakładek; 0 console/page errors.`);
} finally { await browser.close(); }
