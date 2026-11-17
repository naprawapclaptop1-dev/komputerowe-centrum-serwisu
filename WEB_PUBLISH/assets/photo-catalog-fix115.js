/* FIX136 — TOP HERO / ACTIVE SLIDE PRIORITY; FIX135 MODULE PHOTO OWNERSHIP PRESERVED.
 * NAUKA OD A DO Z 6.8.0 — local PWA photo library, static-first slots and robust assignment restore.
 * Tracks all slots, but fetches only for the active view and near-viewport cards.
 * Preserves FIX108 provider recovery, licences, attribution and global photo uniqueness.
 * Repairs stale assignments that had reserved homepage photos for unrelated slots.
 * SVG remains an honestly-labelled illustration fallback; it is never counted as a photograph.
 */
(() => {
  'use strict';
  const VERSION = '6.8.0-fix136-top-photo-priority-20261114';
  const CONFIG_URL = 'media/photo-sources-online.json?v=6.8.0-fix135';
  const ASSIGN_KEY = 'academyPhotoCatalogAssignmentsFix115';
  const LEGACY_ASSIGN_KEY_FIX111 = 'academyPhotoCatalogAssignmentsFix111';
  const LEGACY_ASSIGN_KEY_FIX109 = 'academyPhotoCatalogAssignmentsFix109';
  const LEGACY_ASSIGN_KEY_FIX108 = 'academyPhotoCatalogAssignmentsFix108';
  const LEGACY_ASSIGN_KEY = 'academyPhotoCatalogAssignmentsFix106';
  const LEGACY_ASSIGN_KEY_FIX99 = 'academyPhotoCatalogAssignmentsFix99';
  const LEGACY_ASSIGN_KEY_FIX98 = 'academyPhotoCatalogAssignmentsFix98';
  const DAILY_KEY = 'academyPhotoCatalogDailyFix106'; // Shared budget: a runtime update must not reset today's provider allowance.
  const LEGACY_DAILY_KEY = 'academyPhotoCatalogDailyFix99';
  const LEGACY_DAILY_KEY_FIX98 = 'academyPhotoCatalogDailyFix98';
  const PAGE_STATE_KEY = 'academyPhotoCatalogPageStateFix115';
  const LEGACY_PAGE_STATE_FIX111_KEY = 'academyPhotoCatalogPageStateFix111';
  const LEGACY_PAGE_STATE_FIX109_KEY = 'academyPhotoCatalogPageStateFix109';
  const LEGACY_PAGE_STATE_FIX108_KEY = 'academyPhotoCatalogPageStateFix108';
  const LEGACY_PAGE_STATE_FIX106_KEY = 'academyPhotoCatalogPageStateFix106';
  const LEGACY_PAGE_STATE_FIX99_KEY = 'academyPhotoCatalogPageStateFix99';
  const LEGACY_PAGE_STATE_FIX98_KEY = 'academyPhotoCatalogPageStateFix98';
  const LEGACY_PAGE_STATE_KEY = 'academyPhotoCatalogPageStateFix91';
  const CANDIDATE_POOL_KEY = 'academyPhotoCatalogCandidatePoolsFix115';
  const LEGACY_CANDIDATE_POOL_FIX111_KEY = 'academyPhotoCatalogCandidatePoolsFix111';
  const LEGACY_CANDIDATE_POOL_FIX109_KEY = 'academyPhotoCatalogCandidatePoolsFix109';
  const LEGACY_CANDIDATE_POOL_FIX108_KEY = 'academyPhotoCatalogCandidatePoolsFix108';
  const LEGACY_CANDIDATE_POOL_FIX106_KEY = 'academyPhotoCatalogCandidatePoolsFix106';
  const LEGACY_CANDIDATE_POOL_KEY = 'academyPhotoCatalogCandidatePoolsFix99';
  const LEGACY_CANDIDATE_POOL_FIX98_KEY = 'academyPhotoCatalogCandidatePoolsFix98';
  const MAX_DAILY_REQUESTS = 180; // Keep below Openverse anonymous daily quota.
  const OPENVERSE_GAP_MS = 3300; // Stay below the anonymous per-minute request ceiling.
  const COMMONS_GAP_MS = 1200;
  const MAX_PAGES_PER_QUERY = 3;
  const MAX_COMMONS_PAGES = 6;
  const OPENVERSE_QUERY_VARIANTS = 3;
  const MAX_COMMONS_QUERY_VARIANTS = 3;
  const OPENVERSE_ENDPOINT = 'https://api.openverse.org/v1/images/';
  const COMMONS_ENDPOINT = 'https://commons.wikimedia.org/w/api.php';
  // Only images visible in the top hero and the currently active showcase slide are urgent.
  // Module/specialist cards keep their existing FIX135 curated static assignments.
  const HOME_PRIORITY_SELECTOR = '#view-home .np630-photo-hero img, #view-home .np640-slide.is-active > img';
  const api = window.ACADEMY_ART || (window.ACADEMY_ART = {});
  const FIX96_HOME_LOCAL_PHOTOGRAPHY = true;
  const FIX98_ALL_MODULE_AND_SPECIALIST_PHOTOS = true;
  const FIX106_ACTIVE_VIEW_LAZY_QUEUE = true; // Restored: hidden/off-screen cards must not spend provider quota.
  const FIX109_FULL_CATALOG_BACKGROUND_QUEUE = false; // Historical policy explicitly retired by FIX111.
  const FIX111_ACTIVE_VIEW_PROGRESSIVE_QUEUE = true; // Preserved queue behaviour.
  const FIX111_HOME_SEED_OWNERSHIP_MIGRATION = true; // Preserved reserved homepage seeds.
  const FIX115_STRICT_PHOTO_MEDIA_MATCH = true;
const FIX117_REGISTER_PRIMED_HOME_ASSIGNMENTS = true;
  const FIX118_STATIC_HOME_PHOTO_LIBRARY = true;
  const FIX115_REVALIDATE_LEGACY_ASSIGNMENTS = true;
  const FIX108_PROVIDER_RECOVERY = true;
  const FIX106_METHOD_TITLE_TOPIC_MAPPING = true;
  const FIX106_METHOD_RENDERER_QUEUE_HANDOFF = true;
  const FIX106_METHOD_STATUS_PANEL = true;
  const ACTIVE_VIEW_MARGIN = 1450;
  // Curated photographs are bound to their intended homepage cards first.
  // Extra candidates are listed so an older FIX98 assignment elsewhere does not
  // force a duplicate or leave the slot permanently on an illustration.
  const FIX106_HOME_SLOT_SEEDS = {
    'home-module-repairmaster': ['multimeter-bench'],
    'home-module-components': ['ram-modules'],
    'home-module-ultimate3d': ['motherboard-closeup'],
    'home-module-labplus': ['electronics-circuit-macro-40342987'],
    'home-tech-slot-14': ['data-storage'],
    'home-tech-slot-15': ['gpu-cooling-heatsink-fans'],
    'home-module-courses': ['pc-hardware'],
    'home-module-checklists': ['vram-qimonda-gddr3-chip'],
    'home-module-modelcenter': ['board-motherboard-black-14887694'],
    'home-tech-slot-19': ['cpu-ram-modules-37113174'],
    'home-module-knowledge': ['ram-desktop-dimm-corsair'],
    'home-module-cloudchat': ['vram-samsung-gddr3-chip'],
    'home-tech-slot-22': ['bios-chips-pair-commons'],
    'home-module-14': ['gpu-msi-geforce-rtx3070'],
    'home-module-15': ['usb-c-laptop-port'],
    'home-module-16': ['board-motherboard-microchips-6755074'],
    'home-module-17': ['network-switch-ethernet-6466143'],
    'home-module-18': ['laptop-motherboard'],
    'home-module-19': ['network-switch-ethernet-cable-2881224'],
  };
  // Reserve each homepage slot's first curated seed for that exact card. Method
  // cards must not consume the 19 curated module photo assignments
  // before the visitor returns to the homepage. Alternate seeds are reserved
  // after all primary owners have been registered.
  const FIX106_HOME_SEED_OWNER = new Map();
  for (const [slotId, seedIds] of Object.entries(FIX106_HOME_SLOT_SEEDS)) {
    if (seedIds[0] && !FIX106_HOME_SEED_OWNER.has(seedIds[0])) FIX106_HOME_SEED_OWNER.set(seedIds[0], slotId);
  }
  for (const [slotId, seedIds] of Object.entries(FIX106_HOME_SLOT_SEEDS)) {
    for (const seedId of seedIds.slice(1)) if (seedId && !FIX106_HOME_SEED_OWNER.has(seedId)) FIX106_HOME_SEED_OWNER.set(seedId, slotId);
  }
  const CATEGORY = {
    vram: { query: 'GDDR3 memory chip', alternate: 'graphics card GDDR', third: 'video memory GPU', commons: ['GDDR3 memory chip', 'graphics card GDDR', 'video memory GPU'], min: 1 },
    ram: { query: 'computer RAM', alternate: 'RAM memory', third: 'DDR4 RAM module', commons: ['computer RAM memory', 'DDR4 RAM module DIMM', 'SO-DIMM laptop RAM'], min: 1 },
    gpu: { query: 'video card', alternate: 'NVIDIA GeForce graphics card', third: 'graphics processing unit', commons: ['Nvidia GeForce graphics card', 'graphics card PC computer hardware', 'GPU graphics card fan computer'], min: 1 },
    cpu: { query: 'CPU processor chip', alternate: 'computer processor', third: 'microprocessor computer', commons: ['CPU processor', 'computer CPU chip', 'microprocessor'], min: 0 },
    storage: { query: 'hard disk drive', alternate: 'solid state drive', third: 'NVMe SSD drive', commons: ['hard disk drive', 'solid state drive', 'M.2 SSD'], min: 0 },
    cooling: { query: 'computer fan', alternate: 'graphics card cooling fan', third: 'CPU heatsink computer', commons: ['computer cooling fan', 'GPU heatsink fan', 'laptop cooling fan'], min: 0 },
    display: { query: 'laptop display', alternate: 'LCD laptop screen', third: 'computer monitor display', commons: ['laptop display', 'LCD laptop screen', 'computer monitor'], min: 0 },
    port: { query: 'USB-C', alternate: 'USB port laptop', third: 'USB-C connector laptop', commons: ['USB-C connector on a laptop', 'USB port computer', 'laptop charging port'], min: 1 },
    network: { query: 'network card computer', alternate: 'ethernet card', third: 'wireless network adapter', commons: ['computer network card', 'ethernet network card', 'Wi-Fi adapter'], min: 0 },
    audio: { query: 'computer speaker', alternate: 'laptop speaker', third: 'computer sound card', commons: ['laptop speaker', 'computer speaker', 'sound card computer'], min: 0 },
    power: { query: 'computer power supply', alternate: 'laptop power adapter', third: 'motherboard power circuit', commons: ['computer power supply', 'laptop power adapter', 'motherboard power circuit'], min: 0 },
    board: { query: 'motherboard', alternate: 'computer motherboard', third: 'laptop motherboard', commons: ['motherboard', 'computer motherboard', 'laptop motherboard'], min: 1 },
    meter: { query: 'multimeter', alternate: 'digital multimeter', third: 'electronics workbench multimeter', commons: ['digital multimeter', 'multimeter circuit board', 'electronics measurement multimeter'], min: 1 },
    safety: { query: 'ESD electronics workstation', alternate: 'antistatic electronics repair', third: 'electronics safety workbench', commons: ['ESD electronics workstation', 'antistatic workstation', 'electronics safety'], min: 0 },
    software: { query: 'computer motherboard diagnostics hardware', alternate: 'PC testing equipment', third: 'computer hardware testing', commons: ['computer motherboard diagnostics', 'PC hardware testing equipment', 'computer diagnostics hardware'], min: 0 },
    laptop: { query: 'laptop repair', alternate: 'laptop motherboard', third: 'laptop disassembly', commons: ['laptop repair', 'laptop disassembly', 'open laptop hardware'], min: 1 },
    bios: { query: 'BIOS chip', alternate: 'SPI flash programmer', third: 'EEPROM programmer', commons: ['BIOS chip motherboard', 'SPI flash programmer', 'EEPROM programmer'], min: 0 },
    solder: { query: 'soldering circuit board electronics', alternate: 'SMD soldering electronics', third: 'hot air soldering circuit board', commons: ['soldering circuit board electronics', 'SMD soldering', 'hot air soldering electronics'], min: 1 },
    diagnostics: { query: 'computer diagnostic equipment motherboard testing', alternate: 'PC hardware test bench equipment', third: 'motherboard diagnostic tools', commons: ['computer diagnostic equipment', 'PC hardware test bench', 'motherboard diagnostic tools'], min: 0 },
    battery: { query: 'laptop battery', alternate: 'laptop battery replacement', third: 'computer battery pack', commons: ['laptop battery', 'laptop battery replacement', 'laptop battery pack'], min: 0 },
    electronics: { query: 'electronic components circuit board', alternate: 'computer electronics repair', third: 'circuit board components', commons: ['electronic components', 'computer electronics repair', 'circuit board components'], min: 0 },
    certification: { query: 'computer hardware learning equipment', alternate: 'electronics educational equipment', third: 'PC components teaching materials', commons: ['computer hardware equipment', 'electronics components equipment', 'PC components'], min: 0 }
  };
  const SELECTOR = [
    'img[data-photo-id]', 'img[data-photo-title]', 'img[data-photo-kind]',
    '.np630-photo-hero img', '.np30-hero-photo-main img', '.np30-hero-photo-stack img',
    '.np640-slide > img', '#view-home .np640-module-grid .np30-module-photo img',
    '.diagnostic-photo-fix90', '.diagnostic-feature-image img', '.diagnostic-feature-card img',
    '.course-card-image', '.course-lesson-figure img', '.course-grid .course-card img',
    '.lesson-card img', '.learning-card img', '.lesson-tile img',
    '.catalog-card-art', '.tool-card > img', '.method-card > img',
    '.repair-row-art', '.repair-photo-stage img', '.photo-card-image-button img',
    '.academy-video-cover img', '.video-card img', '.video-cover img', '.long-video-cover img',
    '.fix51-photo-grid img', '.nwm-related-media img',
    '#np62PhotoMain', '.np62-photo-main img', '.np62-photo-thumbs img', '.photo-lab-gallery img',
    '.workshop-photo-card img', '.long-video-photo img', '.lesson-photo-slot img'
  ].join(',');
  const safeJson = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } };
  const saveJson = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } };
  const clean = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim().slice(0, 500);
  const absoluteUrl = value => { try { const u = new URL(String(value || ''), location.href); return u.protocol === 'https:' ? u.href : ''; } catch (_) { return ''; } };
  const canonicalUrl = value => { try { const u = new URL(value); u.hash = ''; u.search = ''; return u.href.replace(/\/$/, '').toLowerCase(); } catch (_) { return ''; } };
  const localRaster = value => /^(?:https?:\/\/[^/]+)?\/(?:media|assets\/media)\/.*\.(?:jpe?g|png|webp|avif)(?:[?#].*)?$/i.test(String(value || '')) || /^(?:media|assets\/media)\/.*\.(?:jpe?g|png|webp|avif)(?:[?#].*)?$/i.test(String(value || ''));
  const isSvg = value => /\.svg(?:[?#]|$)|^data:image\/svg/i.test(String(value || ''));
  // Retry-After may be a delta in seconds OR an HTTP-date (RFC 9110). Number(date)
  // produces NaN; the old code then poisoned pausedUntil and paused Openverse forever.
  function retryAfterDelayMs(value, now = Date.now(), fallbackMs = 60000) {
    const raw = String(value || '').trim();
    if (!raw) return fallbackMs;
    if (/^\d+(?:\.\d+)?$/.test(raw)) {
      const ms = Number(raw) * 1000;
      return Number.isFinite(ms) ? Math.max(5000, Math.min(24 * 60 * 60 * 1000, ms)) : fallbackMs;
    }
    const parsed = Date.parse(raw);
    return Number.isFinite(parsed) ? Math.max(5000, Math.min(24 * 60 * 60 * 1000, parsed - now)) : fallbackMs;
  }
  function commonsBackoffMs(failures) {
    const count = Math.max(1, Number(failures) || 1);
    return Math.min(15 * 60 * 1000, 30000 * (2 ** Math.min(5, count - 1)));
  }

  const isNonCommercial = value => /(?:non.?commercial|\bcc\s*by\s*nc\b|\bby-nc\b|\bnc-sa\b|\bnc-nd\b)/i.test(String(value || ''));
  function normalizeLicense(value) {
    const raw = String(value || '').trim();
    if (!raw || isNonCommercial(raw)) return '';
    if (/^pexels(?:\s+photo)?\s+license$/i.test(raw) || /^pexels license$/i.test(raw)) return 'pexels';
    // Openverse returns short codes (cc0/by/by-sa), while FIX91 assignments
    // stored labels such as "CC CC0". Canonicalize both without allowing NC/ND.
    let s = raw.toLowerCase().replace(/\bcreative commons\b/g, 'cc');
    s = s.replace(/^cc\s+cc(?=\s*(?:0|by)(?:\b|$))/i, 'cc');
    s = s.replace(/public domain mark/ig, 'pdm').replace(/public domain/ig, 'pdm');
    const compact = s.replace(/[^a-z0-9]/g, '');
    if (/^(?:cc)?0\d*$/.test(compact) || ['zero','pdm','publicdomain','publicdomainmark'].includes(compact) || compact.startsWith('publicdomainmark') || compact.startsWith('pdm')) return 'cc0';
    if (/^(?:cc)?by\d*$/.test(compact)) return 'by';
    if (/^(?:cc)?bysa\d*$/.test(compact)) return 'by-sa';
    return '';
  }
  function licenseLabel(value) {
    const normalized = normalizeLicense(value);
    if (normalized === 'pexels') return 'Pexels License';
    if (normalized === 'cc0') return 'CC0';
    if (normalized === 'by') return 'CC BY';
    if (normalized === 'by-sa') return 'CC BY-SA';
    return clean(value);
  }
  function licenseAllowed(value) { return Boolean(normalizeLicense(value)); }
  function categoryFor(text) {
    const s = clean(text).toLowerCase();
    if (/\bvram\b|gddr[3-7x]?|hbm[23e]?|video memory|graphics memory|pamięć graficzna|pamięć karty graficznej/.test(s)) return 'vram';
    if (/\bram\b|\bddr[3-6]\b|so-dimm|sodimm|udimm|pamięć operacyjna|moduł pamięci/.test(s)) return 'ram';
    if (/bios|uefi|spi flash|firmware|eeprom|programator/.test(s)) return 'bios';
    if (/gpu|grafik|graphics card|karta graficzna|karta wideo/.test(s)) return 'gpu';
    if (/cpu|procesor|processor|socket|gniazdo procesora/.test(s)) return 'cpu';
    if (/lutow|hot.?air|smd|reball|solder|mikrolut/.test(s)) return 'solder';
    if (/certyfikat|certyfikac|egzamin|certification|academy|akademia/.test(s)) return 'certification';
    if (/elektronik|ohm|rezystor|kondensator|cewka|electronic/.test(s)) return 'electronics';
    if (/ssd|nvme|hdd|dysk|storage|nośnik|raid|m\.2/.test(s)) return 'storage';
    if (/chłod|temperatur|wentyl|fan|thermal|radiator|heat.?pipe|cooling/.test(s)) return 'cooling';
    if (/matryc|ekran|monitor|display|screen|zawias|edp|taśma obrazu|wyświetlan|podświetlen/.test(s)) return 'display';
    if (/usb.?c|usb4|thunderbolt|port|złącze|dock|hdmi|displayport/.test(s)) return 'port';
    if (/wi.?fi|wifi|bluetooth|ethernet|router|sieć|network|lan/.test(s)) return 'network';
    if (/łączność i peryferia|usb|hdmi|port|złącze|klawiatur|touchpad|peryferia/.test(s)) return 'port';
    if (/audio|dźwięk|mikrofon|speaker|głośnik|sound/.test(s)) return 'audio';
    if (/bater|akumulator|zasil|power|ładow|charger|mosfet|vrm|buck|dc.?in/.test(s)) return 'power';
    if (/esd|bezpieczeń|antystat|bhp|ochron|safety|zalani|koroz/.test(s)) return 'safety';
    if (/windows|system|sterownik|driver|bsod|software|program/.test(s)) return 'software';
    if (/multimetr|oscyloskop|pomiar|test|diagnost|miernik|measurement|probe|sonda/.test(s)) return 'meter';
    if (/usterk|napraw|repair|diagnos|workbench|warsztat|serwis/.test(s)) return 'diagnostics';
    if (/laptop|notebook|komputer przenośny/.test(s)) return 'laptop';
    return 'board';
  }
  const FIX106_METHOD_CATEGORY_ALIASES = Object.freeze({
    'bez wymiany czesci': 'diagnostics',
    'naprawy mechaniczne': 'laptop',
    'naprawy modulowe pc': 'diagnostics',
    'naprawy elektroniki pcb': 'electronics',
    'dyski, dane i system': 'storage',
    'lacznosc i peryferia': 'port',
    'diagnostyka i pomiary': 'meter',
    'systemy operacyjne': 'software',
    'siec i lacznosc': 'network',
    'wyswietlanie i peryferia': 'display',
    'bhp i procedury warsztatowe': 'safety',
    'firmware / bezpieczenstwo': 'bios',
    'bezpieczenstwo systemu': 'software'
  });
  function normalizeMethodText(value) {
    return clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ł/g, 'l')
      .replace(/[–—_]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function methodCategoryFor(record) {
    // FIX106: classify from the method title first. Polish inflections are matched by
    // stems (wentylat*, radiator*, pamięci*, zasilacz*) instead of fragile \b endings.
    // Long diagnosis/procedure text is intentionally excluded because it often names
    // unrelated components as examples and must not redirect the photograph.
    const title = normalizeMethodText(record?.name || record?.title || '');
    const rawCategory = normalizeMethodText(record?.category || '');
    const aliases = {
      'bez wymiany czesci': 'diagnostics',
      'naprawy mechaniczne': 'laptop',
      'naprawy modulowe pc': 'diagnostics',
      'naprawy elektroniki pcb': 'electronics',
      'dyski, dane i system': 'storage',
      'lacznosc i peryferia': 'port',
      'diagnostyka i pomiary': 'meter',
      'systemy operacyjne': 'software',
      'siec i lacznosc': 'network',
      'wyswietlanie i peryferia': 'display',
      'bhp i procedury warsztatowe': 'safety',
      'firmware / bezpieczenstwo': 'bios',
      'bezpieczenstwo systemu': 'software'
    };
    const exact = (CATEGORY[rawCategory] ? rawCategory : '') || aliases[rawCategory] || FIX106_METHOD_CATEGORY_ALIASES[rawCategory] || '';
    // Strong, specific subjects must override their broad source group.
    const rules = [
      ['vram', /(?:\bvram\b|\bgddr[3-7x]?\b|\bhbm[23e]?\b|pamiec.{0,18}(?:graf|video)|(?:graf|video).{0,18}pamiec)/],
      ['ram', /(?:\bram\b|\bdimm\b|so.?dimm|sodimm|udimm|\becc\b|\bspd\b|\bqvl\b|test\w*.{0,12}pamieci|pamieci?.{0,18}(?:operacyj|ram)|modul\w*.{0,12}pamieci?|slot\w*.{0,12}pamieci?)/],
      ['storage', /(?:\bssd\b|\bnvme\b|\bhdd\b|dysk\w*|\braid\b|\bnas\b|\bgpt\b|\bmbr\b|partycj\w*|\bsmart\b|nosnik\w*|filesystem|system plikow|sektor\w*|odzysk\w*.{0,12}dan|\bm[.]?2\b)/],
      ['bios', /(?:\bbios\b|\buefi\b|spi nor|spi flash|eeprom|firmware|secure boot|\btpm\b|ec firmware|bootloader|uklad\w*.{0,12}bios|kosci?.{0,12}bios|programator)/],
      ['audio', /(?:audio|dzwiek\w*|mikrofon\w*|glosnik\w*|speaker|sound card|codec|jack|sluchawk\w*)/],
      ['network', /(?:wi.?fi|wifi|ethernet|bluetooth|router\w*|dns|dhcp|\bmlo\b|\b6 ghz\b|\b(?:2[.]5|10|25) gbe\b|sieci?\w*|\blan\b|adres\w*.{0,8}ip|pakiet\w*.{0,12}sieci)/],
      ['display', /(?:matryc\w*|\blcd\b|\boled\b|display|ekran\w*|monitor\w*|\bedid\b|\bhdr\b|\bvrr\b|\bdsc\b|\bhdmi\b|displayport|\bedp\b|\blvds\b|podswietlen\w*|artefakt\w*.{0,12}obrazu|obraz\w*.{0,12}migot|migot\w*|piksel\w*)/],
      ['cooling', /(?:chlod\w*|wentyl\w*|\bfan\b|thermal|termic\w*|radiator\w*|heat.?pipe|termopad\w*|pasta termic\w*|throttling|przeplyw powietrza)/],
      ['battery', /(?:bater\w*|akumulator\w*|\brtc\b|\bcmos\b|li.?ion|li.?po|ogniw\w*|pakiet\w*.{0,8}bat)/],
      ['port', /(?:\busb\b|usb.?c|usb4|thunderbolt|port\w*|zlacz\w*|gniazd\w*|magjack|\brj45\b|dock\w*|alternate mode|power delivery|kabel\w*|tasmy? matryc\w*|ffc|fpc|drukark\w*|kamer\w*)/],
      ['gpu', /(?:\bgpu\b|karta graficzn\w*|graphics card|grafik\w*|\bdgpu\b|\bigpu\b|\bmux\b|artefakt\w*.{0,12}(?:gpu|grafik))/],
      ['cpu', /(?:\bcpu\b|procesor\w*|processor|socket\w*|\bnpu\b|\bai pc\b|\bimc\b|\bcore\b|rdzen\w*)/],
      ['power', /(?:zasil\w*|\bpsu\b|napieci\w*|masy?\b|pobor\w*.{0,12}prad\w*|prad\w*|\bvrm\b|mosfet\w*|transistor\w*|power good|standby|pwr_ok|buck|dc.?in|gniazd\w*.{0,8}dc|bezpiecznik\w*|fuse|ladow\w*|charging|przetwornic\w*)/],
      ['solder', /(?:lutow\w*|solder\w*|reball\w*|\bbga\b|\bsmd\b|\btht\b|hot.?air|pad repair|pole lutownicz\w*|przelotk\w*|via repair|jumper\w*|sciezk\w*.{0,8}pcb)/],
      ['electronics', /(?:kart\w*.{0,18}rozszerzen\w*|\bkontroler\b|\bpcb\b|plyt\w*|element\w*.{0,12}elektronicz\w*|rezystancj\w*|diode.?mode|\bi2c\b|\bsmbus\b|\buart\b|\bspi\b|clock|reset|power.good|\bwhea\b|\baer\b|\bpcie\b|przerwan\w*.{0,12}sciezk\w*|korozj\w*|zalani\w*|\bvrm\b|uklad\w*.{0,12}steruj\w*)/],
      ['software', /(?:\bwindows\b|\blinux\b|\bgrub\b|initramfs|bootloader|rozruch\w*|sterownik\w*|driver\w*|\bdism\b|\bsfc\b|update|aktualiz\w*|malware|zlosliw\w*|infekcj\w*|system plikow|bitlocker|rollback|\bwinre\b|\bbcd\b|\bbsod\b|oprogramowan\w*)/],
      ['safety', /(?:\bbhp\b|\besd\b|bezpieczen\w*|safety|chemikali\w*|\bsds\b|utyliz\w*|ochron\w*|litow\w*|\blio\b|\blipo\b|zalani\w*|korozj\w*)/],
      ['meter', /(?:multimetr\w*|oscyloskop\w*|miernik\w*|pomiar\w*|napieci\w*|rezystancj\w*|diode.?mode|poboru pradu|analiza whea|test\w*.{0,12}miernik\w*|pomiar\w*.{0,12}standby)/],
      ['laptop', /(?:\blaptop\b|\bnotebook\b|hinge|zawias\w*|palmrest|obudow\w*|klawiatur\w*|touchpad|keyboard|trackpad|kadlub\w*)/],
      ['diagnostics', /(?:diagnost\w*|izolacj\w*.{0,12}objaw\w*|test a.?b|referencyjn\w*|kontrol\w*.{0,12}koncow\w*|test\w*.{0,12}koncow\w*|procedur\w*|rozpoznan\w*|inspekcj\w*)/]
    ];
    for (const [category, pattern] of rules) if (pattern.test(title)) return category;
    return exact || 'diagnostics';
  }
  function normalizeTopicText(value) {
    return clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ł/g, 'l').replace(/[_–—]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function photoTopicText(photo) {
    return normalizeTopicText([photo.title, photo.tags, photo.description, photo.topic, photo.alt, photo.page, photo.sourcePage].filter(Boolean).join(' '));
  }
  const NO_HUMAN_SUBJECT_RE = /\b(?:people|person|persons|human|humans|man|woman|men|women|hand|hands|finger|fingers|face|faces|portrait|selfie|teacher|teachers|instructor|instructors|student|students|trainee|technician|technicians|mechanic|mechanics|worker|workers|employee|employees|astronaut|classroom|team|group|staff|operator|child|children|boy|girl|czlowiek|osoba|osoby|rece|dlonie|twarz|mezczyzna|kobieta|uczen|uczniowie|nauczyciel|instruktor|technik|serwisant|pracownik|zespol|dzieci|chlopiec|dziewczynka|astronauta)\b/i;
  function hasHumanSubjectMetadata(photo) {
    return NO_HUMAN_SUBJECT_RE.test(photoTopicText(photo || {}));
  }
  function isVramPhotoRelevant(photo) {
    const text = photoTopicText(photo);
    if (/\b(dimm|so[- ]?dimm|sodimm|udimm|desktop ram|system ram|memory module|ram stick)\b/.test(text)) return false;
    return /\b(vram|gddr[3-7x]?|hbm[23e]?|graphics memory|video memory|gpu memory|video card memory|graphics card memory)\b/.test(text);
  }
  // Metadata blacklist: a JPEG can still be a diagram/flowchart. Never treat
  // non-photographic visual media as a photograph merely because its tags mention training.
  const NON_PHOTO_VISUAL_RE = /\b(?:diagram(?:s|matic)?|flowcharts?|flow charts?|schematics?|infographics?|illustrations?|vector graphics?|clip ?art|logos?|icons?|posters?|screenshots?|blueprints?|worksheets?|presentation slides?|topology diagrams?|mind maps?|process charts?|wiring diagrams?|circuit diagrams?|block diagrams?|organization charts?|organizational charts?|family trees?)\b/i;
  function isNonPhotographicVisual(photo) {
    const text = photoTopicText(photo || {});
    return NON_PHOTO_VISUAL_RE.test(text);
  }
  function isPhotoRelevant(photo, category = photo?.category) {
    const text = photoTopicText(photo || {});
    if (!text || isNonPhotographicVisual(photo) || hasHumanSubjectMetadata(photo)) return false;
    const rules = {
      vram: () => isVramPhotoRelevant(photo),
      ram: () => !/\b(memory card|sd card|compact ?flash|flash card|floppy|diskette|usb flash|storage card|cassette|old storage media|cartridge|game cartridge|video game|tape|camcorder|vhs)\b/.test(text)
        && /\b(ddr[2-6]|so[- ]?dimm|sodimm|udimm|dimm|ram module|memory module|ram stick|computer memory module|desktop ram module|laptop ram module)\b/.test(text),
      gpu: () => !/\b(greeting card|business card|credit card|trading card|baseball card|postcard|gift card)\b/.test(text)
        && /\b(gpu|graphics card|video card|graphics processing unit|graphics processor|geforce|radeon|quadro)\b/.test(text),
      board: () => /\b(motherboard|mainboard|logic board|printed circuit board|pcb)\b/.test(text) || /plyt.{0,16}glown/.test(text),
      port: () => ((/\busb[- ]?c\b/.test(text) && /\b(connector|port|laptop|notebook|computer|probook|thinkpad)\b/.test(text)) || /\b(laptop charging port|usb port on laptop|usb type[- ]?c connector|thunderbolt port on laptop)\b/.test(text))
        && !/\b(train|metro|subway|bus|railcar|station|transit|street light|bokeh|blurred lights|night lights)\b/.test(text),
      meter: () => /\b(multimeter|digital multimeter|bench multimeter|voltmeter|clamp meter|multitester)\b/.test(text),
      solder: () => /\b(solder(?:s|ed|ing)?|hot air rework|reflow oven|smd rework|solder iron)\b/.test(text)
        && /\b(electronic|circuit|pcb|computer|component|board|microgravity)\b/.test(text),
      laptop: () => /\b(laptop|notebook)\b/.test(text)
        && /\b(repair|disassembl|motherboard|hardware|computer|hinge|screen|service|open|technician|workshop)\b/.test(text),
      storage: () => /\b(ssd|nvme|hdd|hard disk|solid state drive|data storage|m\.2|storage drive)\b/.test(text),
      cooling: () => /\b(computer fan|cpu fan|gpu fan|cooling fan|heatsink|heat sink|cpu cooler|graphics card cooling)\b/.test(text),
      display: () => /\b(laptop display|lcd screen|laptop screen|display panel|screen hinge|edp cable|monitor)\b/.test(text),
      network: () => /\b(wi.?fi adapter|wireless network adapter|ethernet card|ethernet cable|ethernet cables|network card|network switch|switch panel|router|network interface|data center)\b/.test(text),
      audio: () => /\b(computer speaker|laptop speaker|sound card|audio board|microphone)\b/.test(text),
      power: () => /\b(computer power supply|laptop power adapter|dc.?in|power circuit|vrm|power delivery)\b/.test(text),
      bios: () => /\b(bios|uefi|spi flash|eeprom|firmware|flash programmer)\b/.test(text),
      battery: () => /\b(laptop battery|computer battery|battery pack|battery replacement)\b/.test(text),
      safety: () => /\b(esd|electrostatic discharge|antistatic|anti.static|esd workstation|electronic safety)\b/.test(text),
      diagnostics: () => /\b(diagnostic|diagnostics|troubleshooting|inspection|test bench|testing|computer|pc|laptop|motherboard|pcb|electronic device|circuit board|electronics|multimeter)\b/.test(text)
        && /\b(computer|pc|laptop|motherboard|pcb|electronic device|circuit board|electronics|multimeter)\b/.test(text),
      electronics: () => /\b(electronic components|electronics|circuit board components|electronic circuit|pcb components|electronic component|resistor|capacitor|inductor)\b/.test(text),
      software: () => /\b(computer diagnostics|computer troubleshooting|windows repair|software diagnostics|bsod)\b/.test(text),
      certification: () => /\b(computer|pc|laptop|electronics|electronic|circuit|technology|hardware|motherboard|pcb|processor|memory|graphics card|gpu|ssd|nvme)\b/.test(text)
    };
    return Boolean(rules[category] ? rules[category]() : false);
  }
  function isPhotoRelevantForSlot(photo, category = photo?.category, slotId = '') {
    if (!isPhotoRelevant(photo, category)) return false;
    const text = photoTopicText(photo || {});
    // FIX129: cards about courses/checklists/knowledge use equipment photos only; no classroom people.
    if (['home-module-courses','home-module-checklists','home-module-knowledge','home-module-cloudchat','home-module-19'].includes(slotId)
        && !/\b(computer|pc|laptop|electronics|electronic|circuit|technology|hardware|motherboard|pcb|processor|memory|graphics card|gpu|ssd|nvme|gddr|vram|ram|dimm|ethernet|network|bios|firmware|cooling|multimeter|resistor|usb|port)\b/.test(text)) return false;
    if (slotId === 'home-specialist-laptop' && !/\b(laptop|notebook)\b/.test(text)) return false;
    if (slotId === 'home-specialist-bios' && !/\b(bios|uefi|eprom|eeprom|spi flash|firmware)\b/.test(text)) return false;
    if (slotId === 'home-specialist-storage' && !/\b(ssd|nvme|hdd|hard disk|solid state drive|data storage|storage drive)\b/.test(text)) return false;
    if (slotId === 'home-specialist-network' && !/\b(ethernet|network switch|network card|router|wi.?fi|lan)\b/.test(text)) return false;
    if (slotId === 'home-specialist-cpu-ram' && !/\b(cpu|processor|ram|dimm|ddr[3-6])\b/.test(text)) return false;
    if ((slotId === 'home-module-14' || slotId === 'home-specialist-windows')
      && !(/\b(computer|pc|laptop|motherboard|pcb|electronic device|circuit board|electronics|diagnostic|troubleshooting|hardware|gpu|graphics card|geforce|radeon)\b/.test(text))) return false;
    return true;
  }
  function photoIdentity(photo) {
    return [photo.providerId && `id:${photo.providerId}`, photo.page && `page:${canonicalUrl(photo.page)}`, photo.url && `url:${canonicalUrl(photo.url)}`].filter(Boolean);
  }
  function keyHash(value) {
    let h = 2166136261; for (const ch of String(value || '')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0');
  }
  function nodeInfo(img) {
    const parent = img.closest('article,button,figure,.np30-module-photo,.photo-card,section') || img.parentElement;
    const parentText = clean(parent?.textContent || '');
    const explicitTitle = clean(img.dataset.photoTitle || img.dataset.photoAlt || img.alt || '');
    const explicitIsGeneric = /^(?:(?:unikalna\s+)?ilustracja techniczna|(?:unikalna\s+)?ilustracja edukacyjna|grafika techniczna)(?:\s|:|$)/i.test(explicitTitle);
    const contentTitleNode = parent?.querySelector?.('.diagnostic-feature-title,.course-card-title,h2,h3,b,strong,.np30-module-kicker');
    const contentTitle = clean(contentTitleNode?.textContent || '');
    const alt = explicitIsGeneric ? (contentTitle || parentText || explicitTitle) : explicitTitle;
    const context = img.dataset.photoScope || (img.classList.contains('course-card-image') ? 'course-card' : img.classList.contains('catalog-card-art') ? 'workshop-catalog' : img.classList.contains('repair-row-art') ? 'repair-card' : img.classList.contains('np630-hero-photo') ? 'home-hero' : img.closest('.np640-slide') ? 'home-slide' : img.closest('.np30-module-photo') ? 'home-module' : img.closest('.np75-specialist-photo') ? 'home-specialist' : img.closest('.diagnostic-feature-image') ? 'diagnostic-card' : 'photo-slot');
    const repair = img.dataset.repairPhoto;
    const course = img.closest('[data-course-id]')?.dataset.courseId;
    const tool = img.closest('[data-tool-id]')?.dataset.toolId;
    const method = img.closest('[data-method-id]')?.dataset.methodId;
    const slot = img.dataset.photoSlot || '0';
    let id = img.dataset.photoId || '';
    if (!id && repair) id = `repair:${repair}:${img.dataset.photoContext || context}:${slot}`;
    if (!id && course) id = `${context}:${course}:${slot}`;
    if (!id && tool) id = `tool:${tool}`;
    if (!id && method) id = `method:${method}`;
    if (!id) {
      const identity = `${context}|${alt}|${parentText.slice(0, 160)}|${img.getAttribute('src') || ''}|${img.closest('[data-slide]')?.getAttribute('data-slide') || ''}`;
      id = `${context}:${keyHash(identity)}`;
    }
    // FIX141: the main USB-C hero is a dedicated photo slot, not one of the
    // 19 curated module seeds. Give it an explicit port category so the live
    // catalog searches USB-C/laptop charging-port photographs without taking
    // or duplicating any of the reserved FIX135 module assignments.
    const usbCHero = id === 'home-hero-usbc-main';
    const rawCategory = usbCHero ? 'port' : clean(img.dataset.photoKind || img.dataset.photoCategory || '').toLowerCase();
    const category = context === 'workshop-method'
      ? methodCategoryFor({ category: rawCategory, name: alt })
      : (CATEGORY[rawCategory] ? rawCategory : categoryFor(`${rawCategory} ${alt} ${parentText} ${img.getAttribute('src') || ''}`));
    const title = usbCHero ? 'Złącze USB-C w laptopie obsługujące ładowanie Power Delivery' : (alt || parentText || id);
    return { id, category: CATEGORY[category] ? category : 'board', title, context, slot };
  }
  const assignmentState = safeJson(ASSIGN_KEY) || {};
  const legacyFix111Assignments = safeJson(LEGACY_ASSIGN_KEY_FIX111) || {};
  const legacyFix109Assignments = safeJson(LEGACY_ASSIGN_KEY_FIX109) || {};
  const trustedMethodAssignments = new Set([...Object.keys(legacyFix111Assignments), ...Object.keys(legacyFix109Assignments), ...Object.keys(safeJson(LEGACY_ASSIGN_KEY_FIX108) || {}), ...Object.keys(safeJson(LEGACY_ASSIGN_KEY) || {}), ...Object.keys(assignmentState)]);
  const legacyAssignmentState = { ...(safeJson(LEGACY_ASSIGN_KEY_FIX98) || {}), ...(safeJson(LEGACY_ASSIGN_KEY_FIX99) || {}), ...(safeJson(LEGACY_ASSIGN_KEY) || {}), ...(safeJson(LEGACY_ASSIGN_KEY_FIX108) || {}), ...legacyFix109Assignments, ...legacyFix111Assignments };
  const assignments = new Map();
  const used = new Set();
  const hashUsed = [];
  const seedPools = new Map();
  const curatedSeedIndex = [];
  const savedCandidates = safeJson(CANDIDATE_POOL_KEY) || safeJson(LEGACY_CANDIDATE_POOL_FIX111_KEY) || safeJson(LEGACY_CANDIDATE_POOL_FIX109_KEY) || safeJson(LEGACY_CANDIDATE_POOL_FIX108_KEY) || safeJson(LEGACY_CANDIDATE_POOL_FIX106_KEY) || safeJson(LEGACY_CANDIDATE_POOL_KEY) || safeJson(LEGACY_CANDIDATE_POOL_FIX98_KEY) || {};
  const candidatePools = new Map(Object.entries(savedCandidates).filter(([category, photos]) => CATEGORY[category] && Array.isArray(photos)).map(([category, photos]) => [category, photos.filter(photo => photo && absoluteUrl(photo.url) && absoluteUrl(photo.page) && photo.author && licenseAllowed(photo.license) && photo.category === category && isPhotoRelevant(photo, category)).map(photo => ({ ...photo, url: absoluteUrl(photo.url), page: absoluteUrl(photo.page), license: licenseLabel(photo.license) })).slice(0, 20)]));
  const savedPageStates = safeJson(PAGE_STATE_KEY) || safeJson(LEGACY_PAGE_STATE_FIX111_KEY) || safeJson(LEGACY_PAGE_STATE_FIX109_KEY) || safeJson(LEGACY_PAGE_STATE_FIX108_KEY) || safeJson(LEGACY_PAGE_STATE_FIX106_KEY) || {}; // FIX111 migrates verified provider progress without resetting the shared daily quota.
  const pageState = new Map(Object.entries(savedPageStates).filter(([category, state]) => CATEGORY[category] && state && typeof state === 'object').map(([category, state]) => [category, {
    queryIndex: Math.max(0, Math.min(OPENVERSE_QUERY_VARIANTS, Number(state.queryIndex) || 0)),
    page: Math.max(1, Number(state.page) || 1),
    pageCount: Math.max(1, Math.min(MAX_PAGES_PER_QUERY, Number(state.pageCount) || MAX_PAGES_PER_QUERY)),
    queryFailures: Math.max(0, Number(state.queryFailures) || 0),
    retryAt: Math.max(0, Number(state.retryAt) || 0),
    commonsOffset: Math.max(0, Number(state.commonsOffset) || 0),
    commonsPages: Math.max(0, Number(state.commonsPages) || 0),
    commonsQueryIndex: Math.max(0, Math.min(MAX_COMMONS_QUERY_VARIANTS, Number(state.commonsQueryIndex) || 0)),
    commonsTried: Boolean(state.commonsTried),
    commonsHasMore: Boolean(state.commonsHasMore),
    commonsFailures: Math.max(0, Number(state.commonsFailures) || 0),
    commonsRetryAt: Math.max(0, Number(state.commonsRetryAt) || 0),
    exhausted: Boolean(state.exhausted)
  }]));
  if (!safeJson(PAGE_STATE_KEY) && pageState.size) {
    // FIX109: preserve FIX108 provider recovery while migrating state into the full-catalog queue.
    // Re-open those categories while retaining verified candidate pools and Openverse pagination.
    // Old FIX91 exhausted flags were terminal even when providers only rate-limited
    // or previous query variants were too narrow. Re-open exhausted categories once.
    for (const [category, state] of pageState) {
      if (state.exhausted || state.retryAt) {
        state.exhausted = false; state.retryAt = 0;
        state.queryIndex = 0; state.page = 1; state.pageCount = MAX_PAGES_PER_QUERY; state.queryFailures = 0;
      }
      // FIX106 stored commonsTried=true after any network error, not only after
      // exhausting the search. Re-open the Commons queries and keep valid offsets.
      state.commonsTried = false;
      state.commonsFailures = 0;
      state.commonsRetryAt = 0;
      if (state.commonsQueryIndex >= MAX_COMMONS_QUERY_VARIANTS) {
        state.commonsQueryIndex = 0; state.commonsOffset = 0; state.commonsPages = 0; state.commonsHasMore = false;
      }
      pageState.set(category, state);
    }
    try { saveJson(PAGE_STATE_KEY, Object.fromEntries(pageState.entries())); } catch (_) { /* Continue in memory if storage is unavailable. */ }
  }
  const failedUrls = new Set();
  const scheduled = new WeakSet();
  const processed = new WeakSet();
  const retryTimers = new WeakMap();
  const pendingRetryImages = new Set();
  const queue = [];
  let queueRetryTimer = null;
  let activeViewQueueTimer = null;
  let config = null;
  let seedsReady = false;
  let running = false;
  let observer = null;
  let mutationObserver = null;
  let statusNode = null;
  let onlinePhotos = 0;
  let queuedCount = 0;
  let failedCount = 0;
  let lastOpenverseAt = 0;
  let lastCommonsAt = 0;
  let pausedUntil = 0;
  let commonsPausedUntil = 0;
  let lastProviderError = '';
  let lastProvider = '';
  let apiRequests = 0;
  let currentRepairs = [];
  function persistPageState(category, state) {
    pageState.set(category, state);
    try { saveJson(PAGE_STATE_KEY, Object.fromEntries(pageState.entries())); } catch (_) { /* Storage can be full; in-memory pagination continues. */ }
  }
  function persistCandidatePools() {
    const snapshot = {};
    for (const [category, pool] of candidatePools) if (pool.length) snapshot[category] = pool.slice(0, 20);
    try { saveJson(CANDIDATE_POOL_KEY, snapshot); } catch (_) { /* Storage can be full; online search still continues. */ }
  }
  function reserve(photo) { for (const key of photoIdentity(photo)) used.add(key); if (photo.hash && !hashUsed.includes(photo.hash)) hashUsed.push(photo.hash); }
  function releaseReservation(photo) { for (const key of photoIdentity(photo)) used.delete(key); if (photo?.hash) { const i = hashUsed.indexOf(photo.hash); if (i >= 0) hashUsed.splice(i, 1); } }
  function alreadyUsed(photo) { return photoIdentity(photo).some(key => used.has(key)) || (photo.hash && hashUsed.some(old => hamming(old, photo.hash) < 10)); }
  function hamming(a, b) { if (!a || !b || a.length !== b.length) return 64; let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n; }
  function perceptualHash(image) {
    try {
      const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32;
      const ctx = canvas.getContext('2d', { willReadFrequently: true }); if (!ctx) return '';
      ctx.drawImage(image, 0, 0, 32, 32); const data = ctx.getImageData(0, 0, 32, 32).data; const gray = new Float64Array(1024);
      for (let i = 0; i < 1024; i++) gray[i] = data[i * 4] * .299 + data[i * 4 + 1] * .587 + data[i * 4 + 2] * .114;
      const coeff = []; const cos = Array.from({ length: 8 }, (_, u) => Array.from({ length: 32 }, (_, x) => Math.cos(((2 * x + 1) * u * Math.PI) / 64)));
      for (let v = 0; v < 8; v++) for (let u = 0; u < 8; u++) { let sum = 0; for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) sum += gray[y * 32 + x] * cos[u][x] * cos[v][y]; coeff.push(sum); }
      const values = coeff.slice(1).sort((a, b) => a - b); const median = values[Math.floor(values.length / 2)];
      return coeff.slice(1).map(value => value > median ? '1' : '0').join('');
    } catch (_) { return ''; } // CORS-tainted canvas: URL/provider-ID checks remain active.
  }
  async function restoreLocalPhotoHashes() {
    try {
      const response = await fetch('/assets/photo-uniqueness-manifest-fix77.json', { cache: 'force-cache', credentials: 'same-origin' });
      if (!response.ok) return;
      const manifest = await response.json();
      for (const item of manifest.photos || []) if (typeof item.perceptualHash === 'string' && item.perceptualHash.length === 63) hashUsed.push(item.perceptualHash);
    } catch (_) { /* Local photo checks continue by URL and assignment ID. */ }
  }
  function resolveCuratedSeedId(photo) {
    const explicit = clean(photo?.seedId || photo?.curatedSeedId || '');
    if (explicit) return explicit;
    const providerId = clean(photo?.providerId || '').toLowerCase();
    const urls = new Set([photo?.url, photo?.originalUrl].map(canonicalUrl).filter(Boolean));
    const page = canonicalUrl(photo?.page || '');
    const match = curatedSeedIndex.find(seed =>
      (providerId && String(seed.providerId || '').toLowerCase() === providerId)
      || (urls.size && (urls.has(canonicalUrl(seed.url)) || urls.has(canonicalUrl(seed.originalUrl))))
      || (page && page === canonicalUrl(seed.page))
    );
    return match?.seedId || '';
  }
  function staticHomepagePhotoSlots() {
    const slots = Object.create(null);
    document.querySelectorAll('#view-home img[data-photo-fix118-seed]').forEach(img => {
      const slotId = clean(img.dataset.photoId || '');
      const seedId = clean(img.dataset.photoFix118Seed || '');
      if (slotId && seedId) slots[slotId] = seedId;
    });
    return slots;
  }
  function registerStaticHomepagePhotoAssignments() {
    let registered = 0;
    const images = Array.from(document.querySelectorAll('#view-home img[data-photo-fix118-seed]'));
    for (const img of images) {
      recoverPhotoSlotId(img);
      const id = clean(img.dataset.photoId || '');
      const seedId = clean(img.dataset.photoFix118Seed || '');
      if (!id || !seedId || assignments.has(id)) continue;
      const photo = curatedSeedIndex.find(seed => seed.seedId === seedId);
      if (!photo) { console.warn('[PHOTO FIX118] static seed missing from validated manifest', id, seedId); continue; }
      const reservedOwner = FIX106_HOME_SEED_OWNER.get(seedId);
      const currentSrc = absoluteUrl(img.currentSrc || img.getAttribute('src') || '');
      const fallback = img.dataset.photoFix90Fallback || img.dataset.fix77Fallback || '';
      if (!img.dataset.photoFix90Fallback && fallback) img.dataset.photoFix90Fallback = fallback;
      if ((reservedOwner && reservedOwner !== id)
          || canonicalUrl(currentSrc) !== canonicalUrl(photo.url)
          || !isPhotoRelevantForSlot(photo, photo.category, id)
          || alreadyUsed(photo)) {
        console.warn('[PHOTO FIX118] static homepage photo rejected', id, seedId);
        continue;
      }
      const accepted = { ...photo, hash: photo.hash || '' };
      assignments.set(id, accepted);
      assignmentState[id] = accepted;
      reserve(accepted);
      img.dataset.photoFix90Assigned = accepted.providerId || accepted.url;
      img.dataset.photoFix90State = 'online-photo-pending';
      img.classList.add('photo-fix90-online');
      img.classList.remove('photo-fix90-offline-fallback');
      addCredit(img, accepted);
      // Attach the same guarded load/error handlers used by the dynamic provider queue.
      applyPhoto(img, accepted);
      registered++;
    }
    saveJson(ASSIGN_KEY, assignmentState);
    window.NPA_HOME_PHOTO_STATIC_REGISTERED_FIX118 = registered;
    return registered;
  }
  function registerPrimedHomepageAssignments(primeResult = window.NPA_HOME_PHOTO_PRIME_FIX118 || window.NPA_HOME_PHOTO_PRIME_FIX117 || window.NPA_HOME_PHOTO_PRIME_FIX116 || {}) {
    const primedHomeSlots = primeResult?.seedIds || {};
    const primedHomePhotos = primeResult?.photos || {};
    let primedAssignmentsRegistered = 0;
    for (const [id, rawPhoto] of Object.entries(primedHomePhotos)) {
      if (!Object.prototype.hasOwnProperty.call(primedHomeSlots, id)) continue;
      const lockedHomeImage = document.querySelector(`#view-home img[data-photo-id="${CSS.escape(id)}"]`);
      if (lockedHomeImage?.dataset?.photoIgnore === 'true' || lockedHomeImage?.dataset?.photoEligible === 'false') continue; // FIX129: explicit exclusions remain respected; homepage photos are otherwise enabled.
      const photo = {
        ...rawPhoto,
        url: absoluteUrl(rawPhoto?.url || rawPhoto?.asset),
        page: absoluteUrl(rawPhoto?.page),
        licenseUrl: absoluteUrl(rawPhoto?.licenseUrl || rawPhoto?.page),
        providerId: clean(rawPhoto?.providerId || `${String(rawPhoto?.provider || '').toLowerCase()}:${rawPhoto?.seedId || rawPhoto?.id || ''}`),
        category: clean(rawPhoto?.category).toLowerCase(),
        license: String(rawPhoto?.license || ''),
        hash: String(rawPhoto?.hash || '')
      };
      const seedId = clean(photo.seedId || photo.id || primedHomeSlots[id]);
      const reservedOwner = seedId ? FIX106_HOME_SEED_OWNER.get(seedId) : '';
      const slotSeed = String(primedHomeSlots[id] || '');
      if (!photo.url || !photo.page || !photo.author || !photo.licenseUrl
          || !licenseAllowed(photo.license)
          || !/\.(?:jpe?g|png|webp|avif)(?:[?#]|$)/i.test(photo.url)
          || photo.seedId !== slotSeed
          || (reservedOwner && reservedOwner !== id)
          || !isPhotoRelevantForSlot(photo, photo.category, id)
          || alreadyUsed(photo)) {
        delete assignmentState[id];
        console.warn('[PHOTO FIX117] rejected primed homepage assignment', id, seedId || 'missing seed');
        continue;
      }
      const accepted = { ...photo, seedId, url: absoluteUrl(photo.url), page: absoluteUrl(photo.page), license: licenseLabel(photo.license) };
      assignments.set(id, accepted);
      assignmentState[id] = accepted;
      reserve(accepted);
      primedAssignmentsRegistered++;
    }
    return primedAssignmentsRegistered;
  }
  function restoreAssignments() {
    const previous = { ...legacyAssignmentState, ...assignmentState };
    const primeResult = window.NPA_HOME_PHOTO_PRIME_FIX118 || window.NPA_HOME_PHOTO_PRIME_FIX117 || window.NPA_HOME_PHOTO_PRIME_FIX116 || {};
    const primedHomeSlots = { ...staticHomepagePhotoSlots(), ...(primeResult.seedIds || {}) };
    for (const [id, photo] of Object.entries(previous)) {
      // FIX116/FIX117: curated first-render homepage slots own their primary seed. Drop any
      // previous assignment for those IDs so old localStorage cannot override the exact slot.
      if (Object.prototype.hasOwnProperty.call(primedHomeSlots, id)) { delete assignmentState[id]; continue; }
      // FIX99 method assignments were classified from long diagnosis/procedure text.
      // FIX106/FIX109 verified assignments remain trusted after topic and licence checks.
      if (String(id).startsWith('method:') && !trustedMethodAssignments.has(id)) { delete assignmentState[id]; continue; }
      if (!photo || !absoluteUrl(photo.url) || !absoluteUrl(photo.page) || !photo.author || !licenseAllowed(photo.license) || !isPhotoRelevantForSlot(photo, photo.category, id) || alreadyUsed(photo)) { delete assignmentState[id]; continue; }
      const seedId = resolveCuratedSeedId(photo);
      const reservedOwner = seedId ? FIX106_HOME_SEED_OWNER.get(seedId) : '';
      const preferredHomeSeeds = FIX106_HOME_SLOT_SEEDS[id];
      // A curated homepage photo may never be restored under another card's ID.
      // This repairs old FIX109 localStorage records that permanently occupied a reserved seed.
      if ((reservedOwner && reservedOwner !== id) || (preferredHomeSeeds && seedId && !preferredHomeSeeds.includes(seedId))) {
        delete assignmentState[id];
        console.info('[PHOTO FIX111] released stale/misowned curated seed', seedId, 'from', id, 'owner', reservedOwner || 'homepage slot mismatch');
        continue;
      }
      const accepted = { ...photo, ...(seedId ? { seedId } : {}), url: absoluteUrl(photo.url), page: absoluteUrl(photo.page), license: licenseLabel(photo.license) };
      assignments.set(id, accepted); assignmentState[id] = accepted; reserve(accepted);
    }
    // FIX117: import the validated first-render records into the same registry used by the queue.
    // This prevents processQueue() from treating a primed photo as unassigned and restoring SVG.
    const primedAssignmentsRegistered = registerPrimedHomepageAssignments(primeResult);
    const staticAssignmentsRegistered = registerStaticHomepagePhotoAssignments();
    saveJson(ASSIGN_KEY, assignmentState);
    onlinePhotos = assignments.size;
    window.NPA_HOME_PHOTO_PRIME_REGISTERED_FIX118 = primedAssignmentsRegistered + staticAssignmentsRegistered;
    window.NPA_HOME_PHOTO_PRIME_REGISTERED_FIX117 = window.NPA_HOME_PHOTO_PRIME_REGISTERED_FIX118;
  }
  function dailyState() {
    const today = new Date().toISOString().slice(0, 10); const old = safeJson(DAILY_KEY) || safeJson(LEGACY_DAILY_KEY) || safeJson(LEGACY_DAILY_KEY_FIX98);
    return old && old.day === today ? old : { day: today, requests: 0 };
  }
  function canRequest() { return dailyState().requests < MAX_DAILY_REQUESTS && Date.now() >= pausedUntil; }
  function addDailyRequest() { const d = dailyState(); d.requests++; saveJson(DAILY_KEY, d); }
  function renderedLocalPhotoCount() {
    return Array.from(document.querySelectorAll('img[data-photo-unique]')).filter(img => {
      const src = String(img.getAttribute('src') || img.currentSrc || '');
      return localRaster(src) && img.dataset.photoDuplicate !== 'replaced-with-vector'
        && img.naturalWidth >= 320 && img.naturalHeight >= 180;
    }).length;
  }
  function renderedOnlinePhotoCount() {
    return Array.from(document.querySelectorAll(SELECTOR)).filter(img => {
      const src = String(img.currentSrc || img.getAttribute('src') || '');
      let parsed;
      try { parsed = new URL(src, location.href); } catch (_) { return false; }
      const sameOriginCuratedPhoto = parsed.origin === location.origin && parsed.pathname.startsWith('/media/photos/');
      const secureRemotePhoto = parsed.protocol === 'https:' && parsed.origin !== location.origin;
      return img.classList?.contains('photo-fix90-online')
        && img.dataset.photoFix90Loaded === '1'
        && img.naturalWidth >= 320 && img.naturalHeight >= 180
        && parsed.protocol === 'https:' && (sameOriginCuratedPhoto || secureRemotePhoto)
        && !/\.svg(?:[?#]|$)/i.test(parsed.pathname);
    }).length;
  }
  function setStatus() {
    const registered = Array.from(document.querySelectorAll(SELECTOR)).filter(img => !localRaster(img.getAttribute('src') || '') || img.dataset.photoForceOnline).length;
    const localDisplayed = renderedLocalPhotoCount();
    const onlineDisplayed = renderedOnlinePhotoCount();
    const displayed = localDisplayed + onlineDisplayed;
    const activeView = document.querySelector?.('.view-section.active');
    const activeImages = activeView ? Array.from(activeView.querySelectorAll(SELECTOR)).filter(img => eligible(img)) : [];
    const activeDisplayed = activeImages.filter(img => { const src = String(img.getAttribute('src') || img.currentSrc || ''); return (localRaster(src) || img.classList?.contains('photo-fix90-online')) && img.naturalWidth >= 320 && img.naturalHeight >= 180 && !isSvg(src); }).length;
    const activePending = Math.max(0, activeImages.length - activeDisplayed);
    const pending = Math.max(0, registered - onlineDisplayed);
    const allEligible = Array.from(document.querySelectorAll(SELECTOR)).filter(img => eligible(img));
    const allPending = Math.max(0, allEligible.length - displayed);
    const providerNote = lastProviderError ? ` · ŹRÓDŁO ${lastProvider}: ${lastProviderError}` : (apiRequests ? ` · źródła online: ${apiRequests} zapytań` : ' · katalog online oczekuje na zapytania');
    const activeName = activeView?.dataset?.sectionLabel || activeView?.id || 'bieżący widok';
    const message = `Prawdziwe fotografie: ${displayed} wyświetlonych (${localDisplayed} lokalnych + ${onlineDisplayed} online) · cała platforma ${displayed}/${allEligible.length} · oczekuje globalnie ${allPending} · aktywny widok ${activeDisplayed}/${activeImages.length} · kolejka ${queue.length}${providerNote}`;
    if (statusNode) { const text = statusNode.querySelector('[data-fix90-status-text]'); if (text) text.textContent = message; statusNode.title = `Wyświetlone prawdziwe fotografie: ${displayed}, w tym ${localDisplayed} lokalnych i ${onlineDisplayed} online; cała platforma ma ${allEligible.length} pól, ${allPending} oczekuje. Aktywny widok: ${activeName}; fotografie ${activeDisplayed}/${activeImages.length}; do pobrania w bieżącym widoku ${activePending}. Przypisane rekordy katalogu: ${assignments.size}. ${apiRequests} zapytań API w tej sesji. Ilustracje SVG nie są liczone jako zdjęcia.`; }
    const repairStatus = document.getElementById('repairPhotoStatus');
    if (repairStatus) repairStatus.textContent = message;
    const methodStatus = document.getElementById('methodPhotoQueueStatusText');
    if (methodStatus) {
      const methodImages = Array.from(document.querySelectorAll('#view-methods .method-card > img.catalog-card-art'));
      const methodLoaded = methodImages.filter(img => img.dataset.photoFix90Loaded === '1' && img.naturalWidth >= 320 && img.naturalHeight >= 180 && img.classList.contains('photo-fix90-online')).length;
      const methodPending = Math.max(0, methodImages.length - methodLoaded);
      const methodFallback = methodImages.filter(img => img.dataset.photoFix90State === 'fallback' || isSvg(img.getAttribute('src') || '')).length;
      const limit = dailyState();
      const hold = !navigator.onLine ? ' · BRAK INTERNETU' : (limit.requests >= MAX_DAILY_REQUESTS ? ` · LIMIT ŹRÓDEŁ ${limit.requests}/${MAX_DAILY_REQUESTS} — kolejka czeka na następny dzień` : '');
      const error = lastProviderError ? ` · ${lastProvider}: ${lastProviderError}` : '';
      methodStatus.textContent = `METODY NAPRAW — zdjęcia: ${methodLoaded}/${methodImages.length} · oczekujące: ${methodPending} · ilustracje zastępcze: ${methodFallback} · kolejka: ${queue.length} · zapytania dziś: ${limit.requests}/${MAX_DAILY_REQUESTS}${hold}${error}`;
      methodStatus.title = `Licznik dotyczy wyłącznie kart metod aktualnie wyrenderowanych po filtrze. Ilustracje SVG nie są fotografiami. Ostatni błąd dostawcy: ${lastProviderError || 'brak'}`;
    }
    api.photoCount = displayed;
    api.photoCatalogStats = { localPhotos: localDisplayed, onlinePhotos: onlineDisplayed, displayedPhotos: displayed, assignedPhotos: assignments.size, queued: queue.length, failed: failedCount, version: VERSION, localHomepagePhotos: FIX96_HOME_LOCAL_PHOTOGRAPHY };
  }
  function bindMethodPhotoRetry() {
    const methodRetry = document.getElementById('methodPhotoRetry');
    if (!methodRetry || methodRetry.dataset.fix106Bound) return;
    methodRetry.dataset.fix106Bound = '1';
    methodRetry.addEventListener('click', () => {
      resume();
      setTimeout(() => { queueActiveViewImages(); processQueue(); }, 0);
    });
  }
  function ensureStatus() {
    bindMethodPhotoRetry();
    if (statusNode) return;
    statusNode = document.getElementById('photoCatalogFix90Status');
    if (statusNode) return;
    const box = document.createElement('div'); box.id = 'photoCatalogFix90Status'; box.className = 'photo-catalog-fix90-status';
    const textNode = document.createElement('span'); textNode.dataset.fix90StatusText = '1'; textNode.textContent = 'Włączanie katalogu prawdziwych fotografii…';
    const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Wznów pobieranie'; button.addEventListener('click', () => resume());
    box.append(textNode, button);
    const home = document.querySelector('#view-home .np640-showcase');
    if (home?.parentNode) home.parentNode.insertBefore(box, home);
    else (document.querySelector('#view-home') || document.body).prepend(box);
    statusNode = box;
  }
  function addCredit(img, photo) {
    const slotId = img.dataset.photoId || '';
    const repairCredit = img.closest('.repair-photo-stage,.repair-row-photo-wrap')?.querySelector('[data-repair-photo-credit]');
    const slideCredit = img.closest('.np640-slide')?.querySelector('.np640-photo-credit');
    const existing = Array.from(img.parentElement?.querySelectorAll('.photo-credit-fix90[data-photo-credit-for]') || []).find(node => node.dataset.photoCreditFor === slotId);
    const heroCaption = img.closest('.np30-hero-photo-main')?.querySelector('figcaption');
    let credit = repairCredit || slideCredit || existing;
    if (!credit) {
      credit = document.createElement('small'); credit.className = 'photo-credit-fix90'; credit.dataset.photoCreditFor = slotId;
      const parent = img.parentElement; if (parent) parent.appendChild(credit);
    }
    credit.replaceChildren(); credit.classList.add('photo-credit-fix90'); if (img.closest('.np75-specialist-photo')) credit.classList.add('np75-specialist-credit'); credit.dataset.photoCreditFor = slotId;
    const author = document.createElement('a'); author.href = photo.page; author.target = '_blank'; author.rel = 'noopener noreferrer'; author.textContent = clean(photo.author || 'Autor niepodany');
    const provider = document.createElement('span'); provider.textContent = ` · ${clean(photo.provider || 'Openverse')}`;
    const license = document.createElement('a'); license.href = photo.licenseUrl || photo.page; license.target = '_blank'; license.rel = 'noopener noreferrer'; license.textContent = ` · ${clean(photo.license)}`;
    credit.append(author, provider, license); credit.hidden = true;
    // FIX131: never claim that a photo is displayed before the browser decodes it.
    if (slideCredit) slideCredit.textContent = 'ZDJĘCIE SPRZĘTU · ŁADOWANIE…';
    const moduleLabel = img.closest('.np30-module-photo')?.querySelector('i');
    if (moduleLabel) moduleLabel.textContent = 'ZDJĘCIE SPRZĘTU · ŁADOWANIE…';
    const specialistLabel = img.closest('.np75-specialist-photo')?.querySelector('i');
    if (specialistLabel) specialistLabel.textContent = 'ZDJĘCIE SPRZĘTU · ŁADOWANIE…';
    if (heroCaption) {
      const small = heroCaption.querySelector('small');
      if (small) small.textContent = 'Zdjęcie sprzętu · ładowanie…';
    }
  }
  function removeCredit(img) {
    const credit = Array.from(img.parentElement?.querySelectorAll('.photo-credit-fix90[data-photo-credit-for]') || []).find(node => node.dataset.photoCreditFor === (img.dataset.photoId || ''));
    if (credit) credit.remove();
    const fallback = Array.from(img.parentElement?.querySelectorAll('.photo-fallback-label-fix90[data-photo-credit-for]') || []).find(node => node.dataset.photoCreditFor === (img.dataset.photoId || ''));
    if (fallback) fallback.remove();
  }
  function addFallbackLabel(img) {
    const slotId = img.dataset.photoId || '';
    if (!slotId || !img.parentElement) return;
    const existing = Array.from(img.parentElement.querySelectorAll('.photo-fallback-label-fix90[data-photo-credit-for]')).find(node => node.dataset.photoCreditFor === slotId);
    if (existing) return;
    const label = document.createElement('small');
    label.className = 'photo-fallback-label-fix90';
    label.dataset.photoCreditFor = slotId;
    label.textContent = 'ILUSTRACJA TECHNICZNA OFFLINE · FOTOGRAFIA NIEDOSTĘPNA';
    img.parentElement.appendChild(label);
  }
  function restoreFallback(img, caption = true) {
    const fallback = img.dataset.photoFix90Fallback || '';
    if (fallback) img.src = fallback;
    img.hidden = false;
    delete img.dataset.photoFix90Assigned;
    img.dataset.photoFix90State = 'fallback';
    img.classList.add('photo-fix90-offline-fallback');
    img.classList.remove('photo-fix90-online');
    img.alt = `${img.dataset.photoTitle || img.alt || 'Materiał'} — ilustracja techniczna offline; brak zweryfikowanej fotografii`;
    const credit = img.closest('.repair-photo-stage,.repair-row-photo-wrap')?.querySelector('[data-repair-photo-credit]');
    if (credit) { credit.hidden = false; credit.textContent = 'Ilustracja techniczna · brak zweryfikowanej fotografii'; }
    const slideCredit = img.closest('.np640-slide')?.querySelector('.np640-photo-credit');
    if (slideCredit) slideCredit.textContent = 'ILUSTRACJA TECHNICZNA OFFLINE · BRAK ZWERYFIKOWANEJ FOTOGRAFII';
    const heroSmall = img.closest('.np30-hero-photo-main')?.querySelector('figcaption small');
    if (heroSmall) heroSmall.textContent = 'Ilustracja techniczna offline · zdjęcie niedostępne';
    removeCredit(img);
    addFallbackLabel(img);
    const pending = img.parentElement?.querySelector('.repair-photo-pending');
    if (pending) pending.hidden = true;
    if (caption) {
      const label = img.closest('.np30-module-photo')?.querySelector('i');
      if (label) label.textContent = 'ILUSTRACJA TECHNICZNA · ZDJĘCIE NIEDOSTĘPNE';
      const specialistLabel = img.closest('.np75-specialist-photo')?.querySelector('i');
      if (specialistLabel) specialistLabel.textContent = 'ILUSTRACJA TECHNICZNA · ZDJĘCIE NIEDOSTĘPNE';
    }
  }
  // FIX96_DIRECT_TARGET_IMAGE_LOAD_TOPIC_VERIFIED: the destination IMG performs the real fetch once; no serial probe.
  function applyPhoto(img, photo) {
    if (!img || !photo) return false;
    recoverPhotoSlotId(img);
    const liveInfo = nodeInfo(img);
    if (!isPhotoRelevantForSlot(photo, liveInfo.category, liveInfo.id)) {
      assignments.delete(liveInfo.id);
      delete assignmentState[liveInfo.id];
      releaseReservation(photo);
      saveJson(ASSIGN_KEY, assignmentState);
      restoreFallback(img);
      failedCount++;
      console.warn('[PHOTO FIX115] rejected slot-mismatched photo', liveInfo.id, photo.title || photo.url);
      setStatus();
      return false;
    }
    if (!img.dataset.photoId) {
      const info = nodeInfo(img);
      img.dataset.photoId = info.id;
      img.dataset.photoKind = info.category;
      img.dataset.photoTitle = info.title;
    }
    if (!img.dataset.photoFix90Fallback) img.dataset.photoFix90Fallback = img.getAttribute('src') || '';
    // Mark the slot before changing src. FIX77/FIX83 observe src changes and must
    // recognize this as a catalog-owned photograph in the same mutation cycle.
    img.dataset.photoFix90Assigned = photo.providerId || photo.url;
    img.dataset.photoFix90State = 'online-photo';
    img.dataset.photoFix90Loaded = '0';
    img.hidden = false;
    img.classList.add('photo-fix90-online');
    img.classList.remove('photo-fix90-offline-fallback', 'repair-photo-illustration', 'npa-fix83-visual');
    delete img.dataset.npaFix83Generated;
    delete img.dataset.fix77Replaced;
    img.alt = `${img.dataset.photoTitle || img.alt || 'Fotografia edukacyjna'} — fotografia ${clean(photo.title || photo.category || '')}`;
    img.title = `${clean(photo.title || '')} · ${clean(photo.author)} · ${clean(photo.license)}`;
    removeCredit(img);
    addCredit(img, photo);
    const fallbackLabel = Array.from(img.parentElement?.querySelectorAll('.photo-fallback-label-fix90[data-photo-credit-for]') || []).find(node => node.dataset.photoCreditFor === (img.dataset.photoId || ''));
    if (fallbackLabel) fallbackLabel.remove();
    const pending = img.parentElement?.querySelector('.repair-photo-pending');
    if (pending) pending.hidden = true;
    let originalFallbackTried = false;
    const revealVerifiedPhotoCredit = () => {
      const credit = Array.from(img.parentElement?.querySelectorAll('.photo-credit-fix90[data-photo-credit-for]') || []).find(node => node.dataset.photoCreditFor === (img.dataset.photoId || ''));
      if (credit) credit.hidden = false;
      const author = clean(photo.author || '');
      const licence = clean(photo.license || '');
      const labelText = `FOTOGRAFIA SPRZĘTU · ${author.slice(0, 28)} · ${licence}`;
      const moduleLabel = img.closest('.np30-module-photo')?.querySelector('i');
      if (moduleLabel) moduleLabel.textContent = labelText;
      const specialistLabel = img.closest('.np75-specialist-photo')?.querySelector('i');
      if (specialistLabel) specialistLabel.textContent = labelText;
      const slideCredit = img.closest('.np640-slide')?.querySelector('.np640-photo-credit');
      if (slideCredit) slideCredit.textContent = labelText;
      const heroSmall = img.closest('.np30-hero-photo-main')?.querySelector('figcaption small');
      if (heroSmall) heroSmall.textContent = `Fotografia: ${author} · ${licence}`;
    };
    img.onload = () => {
      if (img.naturalWidth >= 320 && img.naturalHeight >= 180) {
        img.dataset.photoFix90Loaded = '1';
        img.dataset.photoFix90VerifiedWidth = String(img.naturalWidth);
        img.dataset.photoFix90VerifiedHeight = String(img.naturalHeight);
        img.dataset.photoFix90State = 'online-photo';
        revealVerifiedPhotoCredit();
        setStatus();
      } else if (img.onerror) {
        img.onerror();
      }
    };
    img.onerror = () => {
      const originalUrl = absoluteUrl(photo.originalUrl);
      if (!originalFallbackTried && originalUrl && canonicalUrl(originalUrl) !== canonicalUrl(photo.url)) {
        originalFallbackTried = true;
        img.dataset.photoFix90TriedOriginal = '1';
        img.dataset.photoFix90State = 'online-photo';
        img.src = originalUrl;
        return;
      }
      failedUrls.add(canonicalUrl(photo.url));
      assignments.delete(img.dataset.photoId);
      delete assignmentState[img.dataset.photoId];
      delete img.dataset.photoFix90Assigned;
      delete img.dataset.photoFix90Loaded;
      for (const key of photoIdentity(photo)) used.delete(key);
      if (photo.hash) { const index = hashUsed.indexOf(photo.hash); if (index >= 0) hashUsed.splice(index, 1); }
      saveJson(ASSIGN_KEY, assignmentState);
      onlinePhotos = Math.max(0, onlinePhotos - 1);
      img.onerror = null;
      restoreFallback(img);
      failedCount++;
      scheduled.delete(img);
      processed.delete(img);
      scheduleImage(img, true);
      setStatus();
    };
    // FIX116: the first-render bootstrap may already have loaded this exact curated URL.
    // Do not wait for a second load event that the browser will never emit for an unchanged src.
    const currentUrl = absoluteUrl(img.currentSrc || img.getAttribute('src') || '');
    const samePhotoAlreadyRequested = canonicalUrl(currentUrl) === canonicalUrl(photo.url);
    if (samePhotoAlreadyRequested && img.complete && img.naturalWidth >= 320 && img.naturalHeight >= 180) {
      img.dataset.photoFix90Loaded = '1';
      img.dataset.photoFix90VerifiedWidth = String(img.naturalWidth);
      img.dataset.photoFix90VerifiedHeight = String(img.naturalHeight);
      img.dataset.photoFix90State = 'online-photo';
      revealVerifiedPhotoCredit();
      setStatus();
      return true;
    }
    // FIX116: the first-render bootstrap may have a matching image still in flight.
    // Keep its original request and let the handlers registered above observe it.
    if (samePhotoAlreadyRequested && !img.complete) return true;
    // Register handlers before src assignment so cached/fast failures cannot race them.
    img.src = photo.url;
    return true;
  }
  function setAssignment(id, photo) {
    assignments.set(id, photo); assignmentState[id] = photo; reserve(photo); saveJson(ASSIGN_KEY, assignmentState);
  }
  function takeSeed(category, slotId = '') {
    const pool = seedPools.get(category);
    if (!pool?.length) return null;
    const isHomepageSlot = Object.prototype.hasOwnProperty.call(FIX106_HOME_SLOT_SEEDS, slotId);
    const mayUseSeed = photo => {
      const owner = FIX106_HOME_SEED_OWNER.get(photo.seedId);
      return !owner || owner === slotId;
    };
    const isValid = photo => mayUseSeed(photo) && !alreadyUsed(photo)
      && !failedUrls.has(canonicalUrl(photo.url)) && photo.category === category && isPhotoRelevantForSlot(photo, category, slotId);
    const preferred = FIX106_HOME_SLOT_SEEDS[slotId] || [];
    for (const seedId of preferred) {
      const index = pool.findIndex(photo => photo.seedId === seedId);
      if (index < 0) continue;
      const photo = pool.splice(index, 1)[0];
      if (isValid(photo)) return photo;
      // Keep a seed that is reserved for another homepage slot in the pool.
      if (FIX106_HOME_SEED_OWNER.has(photo.seedId) && FIX106_HOME_SEED_OWNER.get(photo.seedId) !== slotId) pool.push(photo);
    }
    // Iterate the initial pool length only. Reserved homepage seeds are rotated
    // to the end instead of being stolen by a method/tool/course photograph.
    const available = pool.length;
    for (let i = 0; i < available; i++) {
      const photo = pool.shift();
      if (isValid(photo)) return photo;
      if (FIX106_HOME_SEED_OWNER.has(photo.seedId) && FIX106_HOME_SEED_OWNER.get(photo.seedId) !== slotId) pool.push(photo);
    }
    return null;
  }
  function parseOpenverse(result, category) {
    const url = absoluteUrl(result.thumbnail) || absoluteUrl(result.url); const page = absoluteUrl(result.foreign_landing_url);
    const license = String(result.license || '').toLowerCase(); const author = clean(result.creator || '');
    if (!url || !page || !author || !licenseAllowed(license) || (result.category && result.category !== 'photograph') || Number(result.width || 0) < 320 || Number(result.height || 0) < 180) return null;
    const tags = [result.title || '', result.description || '', ...(Array.isArray(result.tags) ? result.tags.map(tag => typeof tag === 'string' ? tag : tag.name) : [])].join(' ');
    const photo = { url, page, originalUrl: absoluteUrl(result.url), providerId: `openverse:${result.id || canonicalUrl(page)}`, provider: `Openverse / ${clean(result.source || result.provider || '')}`, author, license: licenseLabel(license), licenseUrl: absoluteUrl(result.license_url) || page, title: clean(result.title), tags, category, width: Number(result.width || 0), height: Number(result.height || 0) };
    if (!isPhotoRelevant(photo, category)) return null;
    return photo;
  }
  function htmlText(value) { const node = document.createElement('div'); node.innerHTML = String(value || ''); return clean(node.textContent || node.innerText || ''); }
  function parseCommons(page, category) {
    const info = page?.imageinfo?.[0]; const meta = info?.extmetadata || {};
    const url = absoluteUrl(info?.thumburl || info?.url);
    const pageUrl = absoluteUrl(`https://commons.wikimedia.org/wiki/${encodeURIComponent(String(page?.title || '').replace(/ /g, '_'))}`);
    const license = htmlText(meta.LicenseShortName?.value || meta.License?.value || '');
    const author = htmlText(meta.Artist?.value || meta.Credit?.value || '');
    const description = htmlText(meta.ImageDescription?.value || '');
    const categories = htmlText(meta.Categories?.value || '');
    const objectName = htmlText(meta.ObjectName?.value || '');
    const title = clean(objectName || page?.title || '');
    const tags = [page?.title || '', title, description, categories].join(' ');
    if (!url || !pageUrl || !author || !licenseAllowed(license) || (info?.mime && !/^image\/(?:jpe?g|png|webp)$/i.test(info.mime))) return null;
    const photo = { url, page: pageUrl, originalUrl: absoluteUrl(info?.url), providerId: `commons:${page.pageid || page.title}`, provider: 'Wikimedia Commons', author, license: licenseLabel(license), licenseUrl: absoluteUrl(meta.LicenseUrl?.value) || pageUrl, title, tags, description, category, width: Number(info?.thumbwidth || info?.width || 0), height: Number(info?.thumbheight || info?.height || 0) };
    if (photo.width < 320 || photo.height < 180) return null;
    if (!isPhotoRelevant(photo, category)) return null;
    return photo;
  }
  async function fetchJson(url, provider) {
    if (!navigator.onLine) throw new Error('offline');
    if (provider === 'Openverse') {
      if (!canRequest()) throw new Error('Openverse: lokalny budżet zapytań dziennych osiągnięty lub limit aktywny.');
      const wait = Math.max(0, OPENVERSE_GAP_MS - (Date.now() - lastOpenverseAt)); if (wait) await new Promise(resolve => setTimeout(resolve, wait));
      lastOpenverseAt = Date.now(); addDailyRequest(); apiRequests++; lastProvider = provider;
    } else {
      const wait = Math.max(0, COMMONS_GAP_MS - (Date.now() - lastCommonsAt)); if (wait) await new Promise(resolve => setTimeout(resolve, wait));
      lastCommonsAt = Date.now(); apiRequests++; lastProvider = provider;
    }
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 18000) : null;
    try {
      const headers = { Accept: 'application/json' };
      if (provider === 'Commons') headers['Api-User-Agent'] = 'NaukaOdAdoZ/6.8.0 (https://naprawapclaptop.wex.pl/; naprawapclaptop1@gmail.com)';
      const response = await fetch(url, { method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store', headers, signal: controller?.signal });
      if (!response.ok) {
        const status = Number(response.status || 0);
        const retryHeader = response.headers?.get?.('retry-after');
        if (status === 429 || status === 503) {
          const delay = retryAfterDelayMs(retryHeader, Date.now(), 60000);
          if (provider === 'Openverse') pausedUntil = Math.max(Number.isFinite(pausedUntil) ? pausedUntil : 0, Date.now() + delay);
          else commonsPausedUntil = Math.max(Number.isFinite(commonsPausedUntil) ? commonsPausedUntil : 0, Date.now() + delay);
        }
        const error = new Error(`${provider} HTTP ${status || 'BŁĄD SIECI'}`);
        error.status = status;
        error.retryAfterMs = retryHeader ? retryAfterDelayMs(retryHeader) : 0;
        throw error;
      }
      lastProviderError = '';
      return await response.json();
    } finally { if (timer) clearTimeout(timer); }
  }
  function categorySearchQueries(category) {
    const def = CATEGORY[category] || CATEGORY.board;
    return [...new Set([def.query, def.alternate, def.third].filter(Boolean))].slice(0, OPENVERSE_QUERY_VARIANTS);
  }
  function commonsSearchQueries(category) {
    const def = CATEGORY[category] || CATEGORY.board;
    return [...new Set((def.commons || [def.query, def.alternate, def.third]).filter(Boolean))].slice(0, MAX_COMMONS_QUERY_VARIANTS);
  }
  function buildOpenverseUrl(category, page, queryText = '') {
    const query = clean(queryText || categorySearchQueries(category)[0]).slice(0, 200);
    const params = new URLSearchParams({
      q: query,
      page: String(Math.max(1, Math.floor(Number(page) || 1))),
      page_size: '20',
      license: 'cc0,by,by-sa,pdm',
      license_type: 'commercial',
      category: 'photograph',
      filter_dead: 'true',
      mature: 'false'
    });
    return `${OPENVERSE_ENDPOINT}?${params}`;
  }
  async function openversePage(category, page, queryText = '') {
    const data = await fetchJson(buildOpenverseUrl(category, page, queryText), 'Openverse');
    return { photos: (data.results || []).map(item => parseOpenverse(item, category)).filter(Boolean), pageCount: Number(data.page_count || 1), count: Number(data.result_count || 0) };
  }
  async function commonsSearch(category, offset = 0, queryText = '') {
    const queries = commonsSearchQueries(category);
    const query = clean(queryText || queries[0] || 'computer hardware').slice(0, 180);
    const params = new URLSearchParams({ action: 'query', format: 'json', origin: '*', generator: 'search', gsrnamespace: '6', gsrlimit: '20', gsroffset: String(Math.max(0, Number(offset) || 0)), gsrsearch: `${query} filetype:bitmap`, prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1280', redirects: '1' });
    const data = await fetchJson(`${COMMONS_ENDPOINT}?${params}`, 'Commons');
    const nextOffset = Number(data.continue?.gsroffset || (Number(offset || 0) + 20));
    return { photos: Object.values(data.query?.pages || {}).map(page => parseCommons(page, category)).filter(Boolean), nextOffset, hasMore: Boolean(data.continue?.gsroffset) };
  }
  async function probePhoto(photo) {
    if (typeof Image === 'undefined') return { ok: true, hash: '' };
    const load = useCors => new Promise(resolve => {
      const image = new Image(); let done = false;
      const finish = result => { if (done) return; done = true; clearTimeout(timer); resolve(result); };
      const timer = setTimeout(() => finish(null), 12000);
      image.onload = () => {
        const valid = image.naturalWidth >= 320 && image.naturalHeight >= 180;
        finish(valid ? { image, hash: perceptualHash(image), width: image.naturalWidth, height: image.naturalHeight } : null);
      };
      image.onerror = () => finish(null);
      image.referrerPolicy = 'strict-origin-when-cross-origin';
      if (useCors) image.crossOrigin = 'anonymous';
      image.src = photo.url;
    });
    // First try CORS so the same photo can be checked against local and online pHashes.
    const checked = await load(true);
    if (checked) return { ok: true, hash: checked.hash, width: checked.width, height: checked.height };
    // If the host doesn't expose CORS, still allow normal display; URL/provider identity is checked.
    const display = await load(false);
    return display ? { ok: true, hash: '', width: display.width, height: display.height } : { ok: false, hash: '' };
  }
  async function takeOnline(category, slotId = '') {
    let pool = candidatePools.get(category);
    if (!pool) { pool = []; candidatePools.set(category, pool); }
    const queries = categorySearchQueries(category).slice(0, OPENVERSE_QUERY_VARIANTS);
    const commonsQueries = commonsSearchQueries(category).slice(0, MAX_COMMONS_QUERY_VARIANTS);
    const state = pageState.get(category) || {
      queryIndex: 0, page: 1, pageCount: MAX_PAGES_PER_QUERY, queryFailures: 0, retryAt: 0,
      commonsOffset: 0, commonsPages: 0, commonsQueryIndex: 0, commonsTried: false, commonsHasMore: false, exhausted: false
    };
    if (state.exhausted) {
      if (Number(state.retryAt || 0) > Date.now()) return null;
      state.exhausted = false; state.retryAt = 0; state.queryIndex = 0; state.page = 1; state.pageCount = MAX_PAGES_PER_QUERY;
      state.queryFailures = 0; state.commonsOffset = 0; state.commonsPages = 0; state.commonsQueryIndex = 0; state.commonsTried = false; state.commonsHasMore = false;
      persistPageState(category, state);
    }
    for (let attempts = 0; attempts < 32; attempts++) {
      if (pool.length) {
        const deferredForOtherSlots = [];
        const scanCount = pool.length;
        let selected = null;
        for (let i = 0; i < scanCount; i++) {
          const photo = pool.shift();
          if (alreadyUsed(photo) || failedUrls.has(canonicalUrl(photo.url)) || photo.category !== category || !isPhotoRelevant(photo, category)) continue;
          if (!isPhotoRelevantForSlot(photo, category, slotId)) { deferredForOtherSlots.push(photo); continue; }
          selected = photo;
          break;
        }
        if (deferredForOtherSlots.length) pool.push(...deferredForOtherSlots);
        persistCandidatePools();
        if (selected) {
          // Openverse/Commons parsers enforce license and dimensions; this extra slot check
          // rejects topic-valid media that is not appropriate for this exact card.
          const accepted = { ...selected, hash: selected.hash || '' };
          if (alreadyUsed(accepted)) { failedUrls.add(canonicalUrl(selected.url)); continue; }
          lastProviderError = '';
          persistPageState(category, state);
          return accepted;
        }
      }

      const waitingForOpenverse = Date.now() < Number(state.retryAt || 0) || Date.now() < pausedUntil;
      if (state.queryIndex < queries.length && canRequest() && !waitingForOpenverse) {
        if (state.page > Math.min(state.pageCount || MAX_PAGES_PER_QUERY, MAX_PAGES_PER_QUERY)) {
          state.queryIndex++;
          state.page = 1;
          state.pageCount = MAX_PAGES_PER_QUERY;
          state.queryFailures = 0;
          persistPageState(category, state);
          continue;
        }
        const requestedPage = state.page;
        try {
          const result = await openversePage(category, requestedPage, queries[state.queryIndex]);
          state.page = requestedPage + 1;
          state.pageCount = Math.min(MAX_PAGES_PER_QUERY, Math.max(1, Number(result.pageCount || 1)));
          state.queryFailures = 0;
          state.retryAt = 0;
          pool.push(...result.photos.filter(photo => !alreadyUsed(photo)));
          persistCandidatePools();
          persistPageState(category, state);
          if (pool.length) continue;
          continue;
        } catch (error) {
          lastProvider = 'Openverse';
          lastProviderError = clean(error.message).slice(0, 140);
          console.warn('[PHOTO FIX108] Openverse', category, error.message);
          if (/429|503|limit|budżet|przerwa/i.test(error.message)) {
            const retryDelay = Number(error?.retryAfterMs) > 0 ? Number(error.retryAfterMs) : 60000;
            state.retryAt = Math.max(Number.isFinite(pausedUntil) ? pausedUntil : 0, Date.now() + retryDelay);
            pausedUntil = state.retryAt;
          } else {
            state.queryFailures = Number(state.queryFailures || 0) + 1;
            if (state.queryFailures >= 2) {
              state.queryIndex++;
              state.page = 1;
              state.pageCount = MAX_PAGES_PER_QUERY;
              state.queryFailures = 0;
              state.retryAt = 0;
            } else {
              state.retryAt = Date.now() + 15000;
            }
          }
          persistPageState(category, state);
          // Try Commons immediately; do not discard the current Openverse query state.
        }
      }

      if ((!state.commonsTried || (state.commonsHasMore && state.commonsPages < MAX_COMMONS_PAGES)) && Date.now() >= Math.max(Number(state.commonsRetryAt || 0), commonsPausedUntil)) {
        try {
          const commonsQuery = commonsQueries[state.commonsQueryIndex] || commonsQueries[0];
          const commons = await commonsSearch(category, state.commonsOffset || 0, commonsQuery);
          state.commonsPages = Number(state.commonsPages || 0) + 1;
          state.commonsFailures = 0;
          state.commonsRetryAt = 0;
          state.commonsOffset = commons.nextOffset;
          state.commonsHasMore = commons.hasMore;
          pool.push(...commons.photos.filter(photo => !alreadyUsed(photo)));
          persistCandidatePools();
          if (!commons.hasMore) {
            state.commonsQueryIndex = Number(state.commonsQueryIndex || 0) + 1;
            state.commonsOffset = 0;
            state.commonsHasMore = false;
            state.commonsTried = state.commonsQueryIndex >= commonsQueries.length;
          } else {
            state.commonsTried = false;
          }
          persistPageState(category, state);
          if (pool.length) continue;
          if (!state.commonsTried && state.commonsPages < MAX_COMMONS_PAGES) continue;
          if (state.commonsHasMore && state.commonsPages < MAX_COMMONS_PAGES) continue;
        } catch (error) {
          lastProvider = 'Wikimedia Commons';
          lastProviderError = clean(error.message).slice(0, 140);
          const status = Number(error?.status || String(error?.message || '').match(/HTTP (\d+)/)?.[1] || 0);
          const transient = !navigator.onLine || !status || status === 408 || status === 429 || status === 503 || status >= 500;
          console.warn('[PHOTO FIX108] Wikimedia Commons', category, error.message);
          if (transient) {
            state.commonsFailures = Number(state.commonsFailures || 0) + 1;
            const delay = Number(error?.retryAfterMs) > 0 ? Number(error.retryAfterMs) : commonsBackoffMs(state.commonsFailures);
            state.commonsRetryAt = Date.now() + delay;
            state.commonsTried = false; // Never discard the remaining queries after a transient provider failure.
          } else {
            state.commonsQueryIndex = Math.min(commonsQueries.length, Number(state.commonsQueryIndex || 0) + 1);
            state.commonsOffset = 0; state.commonsPages = 0; state.commonsHasMore = false;
            state.commonsTried = state.commonsQueryIndex >= commonsQueries.length;
          }
          persistPageState(category, state);
        }
      }

      // Openverse quota/backoff is a temporary state, not a permanently exhausted category.
      if ((state.queryIndex < queries.length && (Date.now() < Number(state.retryAt || 0) || !canRequest()))
        || ((!state.commonsTried && state.commonsQueryIndex < commonsQueries.length && state.commonsPages < MAX_COMMONS_PAGES)
          && (Date.now() < Number(state.commonsRetryAt || 0) || Date.now() < commonsPausedUntil))
        || (!state.commonsTried && state.commonsQueryIndex < commonsQueries.length && state.commonsPages < MAX_COMMONS_PAGES)
        || (state.commonsHasMore && state.commonsPages < MAX_COMMONS_PAGES)) {
        state.exhausted = false;
        persistPageState(category, state);
        return null;
      }
      state.exhausted = true;
      state.retryAt = Date.now() + 6 * 60 * 60 * 1000; // Retry after a cooldown; never permanently abandon a category.
      persistPageState(category, state);
      return null;
    }
    persistPageState(category, state);
    return null;
  }
  async function loadConfig() {
    try {
      const response = await fetch(CONFIG_URL, { cache: 'no-store', credentials: 'same-origin' });
      if (!response.ok) throw new Error(`manifest HTTP ${response.status}`);
      config = await response.json();
      const license = config.license || {};
      for (const item of config.photos || []) {
        const url = absoluteUrl(item.asset); const page = absoluteUrl(item.page);
        const author = clean(item.author || '');
        if (!url || !page || !author) continue;
        const cat = item.category || (item.topic ? categoryFor(item.topic) : categoryFor(item.id));
        const provider = clean(item.provider || 'Pexels');
        const photo = { seedId: clean(item.id), url, page, originalUrl: absoluteUrl(item.originalAsset) || url, providerId: `${provider.toLowerCase().replace(/[^a-z0-9]+/g, '-')}:${item.id}`, provider, author, license: item.license || 'Pexels License', licenseUrl: absoluteUrl(item.licenseUrl) || page, title: clean(item.topic || item.id), tags: clean([item.tags || '', item.topic || ''].join(' ')), description: clean(item.description || ''), category: cat };
        if (!licenseAllowed(photo.license) || !isPhotoRelevant(photo, cat)) { console.warn('[PHOTO FIX115] rejected curated seed: non-photo visual or topic mismatch', item.id, cat); continue; }
        curatedSeedIndex.push(photo);
        if (!seedPools.has(cat)) seedPools.set(cat, []);
        seedPools.get(cat).push(photo);
      }
      seedsReady = true;
    } catch (error) {
      console.warn('[PHOTO FIX115] photo source manifest unavailable:', error.message);
      config = { photos: [] }; seedsReady = true;
    }
  }
  function sourceLooksPhoto(src) { return /\.(?:jpe?g|png|webp|avif)(?:[?#]|$)/i.test(String(src || '')) && !/^data:image/i.test(String(src || '')); }
  function isInActiveView(img) {
    if (!img || !img.isConnected) return false;
    const view = img.closest?.('.view-section');
    if (view && (!view.classList?.contains?.('active') || view.hidden || view.getAttribute?.('aria-hidden') === 'true')) return false;
    // Many repair-result cards intentionally hide the IMG while showing a pending
    // overlay. Do not mistake the target image's own hidden attribute for a hidden
    // view; only hidden ancestors should block photo assignment.
    if (img.parentElement?.closest?.('[hidden]')) return false;
    return true;
  }
  function photoViewportAnchor(img) {
    if (!img) return null;
    const preferred = img.closest?.('.repair-row-photo-wrap,.diagnostic-feature-image,.repair-photo-stage,.method-card,.tool-card,.np30-module-photo,.np75-specialist-photo,.np640-slide,.np30-hero-photo-main,.np30-hero-photo-stack,.course-card,.lesson-card,.academy-video-cover,.video-card,.long-video-cover,.nwm-related-media,.fix51-photo-grid');
    const candidates = [img, preferred, img.parentElement].filter(Boolean);
    for (const candidate of candidates) {
      try {
        const rect = candidate.getBoundingClientRect?.();
        if (rect && rect.width > 0 && rect.height > 0) return { element: candidate, rect };
      } catch (_) { /* Try the next visible wrapper. */ }
    }
    return null;
  }
  function isNearActiveViewport(img, margin = ACTIVE_VIEW_MARGIN) {
    if (!isInActiveView(img)) return false;
    try {
      const anchor = photoViewportAnchor(img);
      const viewportHeight = Number(window.innerHeight || document.documentElement?.clientHeight || 0);
      if (!anchor || !viewportHeight) return false;
      const rect = anchor.rect;
      return rect.bottom >= -margin && rect.top <= viewportHeight + margin;
    } catch (_) { return false; }
  }
  function eligible(img) {
    if (!(img instanceof HTMLImageElement)) return false;
    if (img.dataset.photoIgnore === 'true' || img.dataset.photoEligible === 'false' || img.dataset.techVisualId) return false; // FIX122: homepage artwork is local SVG only.
    // FIX136: hidden carousel slides must not enter the initial photo queue or consume provider quota.
    const slide = img.closest?.('.np640-slide');
    if (slide && !slide.classList.contains('is-active')) return false;
    const current = img.getAttribute('src') || '';
    if (localRaster(current) && !img.dataset.photoForceOnline) return false; // Preserve the 13 individually assigned local home photographs.
    return sourceLooksPhoto(current) || isSvg(current) || Boolean(img.dataset.photoId || img.dataset.photoTitle || img.dataset.photoKind) || img.classList.contains('course-card-image') || img.classList.contains('catalog-card-art') || img.classList.contains('repair-row-art');
  }
  function recoverPhotoSlotId(img) {
    if (!img) return '';
    if (img.dataset.photoId) return img.dataset.photoId;
    const credits = img.parentElement?.querySelectorAll?.('.photo-credit-fix90, .np640-photo-credit, figcaption') || [];
    const saved = Array.from(credits).map(node => String(node.dataset?.photoCreditFor || '')).find(Boolean);
    if (saved) {
      img.dataset.photoId = saved;
      return saved;
    }
    // Production DOM credits have class names but no data-photo-credit-for attribute.
    // Rebuild the same deterministic slot identity from the current wrapper context.
    const hasVisibleCredit = credits.length > 0;
    const hasOnlineMarker = img.classList?.contains?.('photo-fix90-online');
    if (hasVisibleCredit && hasOnlineMarker) {
      const info = nodeInfo(img);
      img.dataset.photoId = info.id;
      if (!img.dataset.photoKind) img.dataset.photoKind = info.category;
      if (!img.dataset.photoTitle) img.dataset.photoTitle = info.title;
      return info.id;
    }
    return '';
  }
  function observeImage(img) {
    if (!eligible(img) || scheduled.has(img) || processed.has(img)) return;
    scheduled.add(img);
    recoverPhotoSlotId(img);
    if (!img.dataset.photoId) { const info = nodeInfo(img); img.dataset.photoId = info.id; img.dataset.photoKind = info.category; img.dataset.photoTitle = info.title; }
    if (!img.dataset.photoFix90Fallback) img.dataset.photoFix90Fallback = img.getAttribute('src') || '';
    const saved = assignments.get(img.dataset.photoId);
    if (saved && isInActiveView(img) && isNearActiveViewport(img)) { applyPhoto(img, saved); processed.add(img); return; }
    if (observer) observer.observe(img);
    else if (isNearActiveViewport(img)) scheduleImage(img);
    else pendingRetryImages.add(img);
  }
  function scan(root = document) {
    if (!root) return;
    if (root instanceof HTMLImageElement) observeImage(root);
    root.querySelectorAll?.(SELECTOR).forEach(observeImage);
  }
  function scheduleImage(img, retry = false) {
    if (!img || !img.dataset.photoId || !eligible(img)) return;
    if (!retry && processed.has(img)) return;
    processed.add(img); queuedCount++; queue.push(img); processQueue();
  }
  function categoryWaitingForProvider(category) {
    const state = pageState.get(category);
    if (!state) return false;
    const now = Date.now();
    if (Number(state.retryAt || 0) > now || pausedUntil > now || Number(state.commonsRetryAt || 0) > now || commonsPausedUntil > now) return true;
    if (state.exhausted) return Number(state.retryAt || 0) > 0;
    const queries = categorySearchQueries(category);
    return state.queryIndex < queries.length || (!state.commonsTried && state.commonsQueryIndex < commonsSearchQueries(category).length) || (state.commonsHasMore && state.commonsPages < MAX_COMMONS_PAGES);
  }
  function nextQueueRetryDelay() {
    const now = Date.now();
    const retryTimes = [];
    const categories = new Set(Array.from(pendingRetryImages).filter(img => img?.isConnected).map(img => nodeInfo(img).category));
    for (const category of categories) {
      const state = pageState.get(category) || {};
      if (state.queryIndex < categorySearchQueries(category).length && dailyState().requests < MAX_DAILY_REQUESTS) {
        retryTimes.push(Math.max(Number(state.retryAt || 0), pausedUntil));
      }
      if (!state.commonsTried || state.commonsHasMore) {
        retryTimes.push(Math.max(Number(state.commonsRetryAt || 0), commonsPausedUntil));
      }
    }
    const future = retryTimes.filter(value => Number.isFinite(value) && value > now).sort((a, b) => a - b)[0];
    if (future) return Math.min(5 * 60 * 1000, Math.max(12000, future - now + 1200));
    if (dailyState().requests >= MAX_DAILY_REQUESTS && !retryTimes.length) {
      const tomorrow = Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate() + 1, 0, 0, 10);
      return Math.max(60000, tomorrow - now);
    }
    return 12000;
  }
  function scheduleQueueRetry(img) {
    if (img?.isConnected) pendingRetryImages.add(img);
    if (queueRetryTimer || !pendingRetryImages.size) return;
    const delay = nextQueueRetryDelay();
    queueRetryTimer = setTimeout(() => {
      queueRetryTimer = null;
      if (!navigator.onLine) { setStatus(); return; }
      let queued = 0;
      for (const target of Array.from(pendingRetryImages)) {
        if (!target?.isConnected) { pendingRetryImages.delete(target); continue; }
        // FIX111: never spend provider requests for hidden tabs or distant cards.
        // Navigation/scroll/IntersectionObserver will activate them when relevant.
        if (!isInActiveView(target) || !isNearActiveViewport(target)) continue;
        pendingRetryImages.delete(target);
        processed.delete(target); scheduled.delete(target);
        if (observer) observer.unobserve(target);
        scheduleImage(target, true); queued++;
      }
      if (queued) processQueue(); else setStatus();
    }, delay);
  }
  function queueCatalogImages(root = document) {
    const found = new Set();
    if (root instanceof HTMLImageElement) found.add(root);
    root.querySelectorAll?.(SELECTOR).forEach(img => found.add(img));
    // FIX111 tracks every eligible slot but only fetches for the active view and
    // cards close to the viewport. Hidden/off-screen slots stay observed, not queued.
    const all = Array.from(found).filter(img => eligible(img) && !processed.has(img) && img.isConnected);
    for (const img of all) {
      recoverPhotoSlotId(img);
      if (!img.dataset.photoId) {
        const info = nodeInfo(img); img.dataset.photoId = info.id; img.dataset.photoKind = info.category; img.dataset.photoTitle = info.title;
      }
      const saved = assignments.get(img.dataset.photoId);
      if (saved && isInActiveView(img) && isNearActiveViewport(img)) {
        if (observer) observer.unobserve(img);
        scheduled.delete(img);
        applyPhoto(img, saved); processed.add(img);
        continue;
      }
      if (isInActiveView(img) && isNearActiveViewport(img)) {
        if (observer) observer.unobserve(img);
        scheduled.delete(img);
        scheduleImage(img, true);
      } else {
        observeImage(img);
        if (observer) observer.observe(img);
        else pendingRetryImages.add(img);
      }
    }
    return all.length;
  }
  function pruneQueueToActiveView() {
    if (!queue.length) return;
    const keep = [];
    for (const img of queue.splice(0)) {
      if (!img?.isConnected) { processed.delete(img); continue; }
      if (!eligible(img)) { processed.delete(img); scheduled.delete(img); pendingRetryImages.delete(img); continue; }
      if (isInActiveView(img) && isNearActiveViewport(img)) keep.push(img);
      else {
        processed.delete(img);
        pendingRetryImages.add(img);
        if (observer) observer.observe(img);
      }
    }
    queue.push(...keep);
  }
  function activatePendingImages(active) {
    if (!active) return 0;
    let queued = 0;
    for (const img of Array.from(pendingRetryImages)) {
      if (!img?.isConnected) { pendingRetryImages.delete(img); continue; }
      if (!active.contains(img) || !isNearActiveViewport(img)) continue;
      pendingRetryImages.delete(img);
      processed.delete(img); scheduled.delete(img);
      if (observer) observer.unobserve(img);
      scheduleImage(img, true); queued++;
    }
    return queued;
  }
  function queueActiveViewImages() {
    const active = document.querySelector?.('.view-section.active');
    if (!active || active.hidden || active.getAttribute?.('aria-hidden') === 'true') return 0;
    pruneQueueToActiveView();
    scan(active);
    if (active.id === 'view-home') queueHomeFirst(active);
    activatePendingImages(active);
    queueCatalogImages(active);
    setStatus();
    return active.querySelectorAll?.(SELECTOR).length || 0;
  }
  function queueHomeFirst() {
    const home = document.querySelector?.('#view-home');
    if (!home || !home.classList?.contains?.('active') || home.hidden || !home.querySelectorAll) return;
    home.querySelectorAll(HOME_PRIORITY_SELECTOR).forEach(img => {
      if (!eligible(img) || processed.has(img) || !isInActiveView(img)) return;
      recoverPhotoSlotId(img);
      if (!img.dataset.photoId) { const info = nodeInfo(img); img.dataset.photoId = info.id; img.dataset.photoKind = info.category; img.dataset.photoTitle = info.title; }
      if (!img.dataset.photoFix90Fallback) img.dataset.photoFix90Fallback = img.getAttribute('src') || '';
      // FIX136: promote only the visible top images; keep the lower card queue unchanged.
      try { img.loading = 'eager'; img.fetchPriority = 'high'; img.decoding = 'async'; } catch (_) { /* Older browsers ignore priority hints. */ }
      if (observer) observer.unobserve(img);
      scheduled.delete(img);
      if (assignments.has(img.dataset.photoId)) { applyPhoto(img, assignments.get(img.dataset.photoId)); processed.add(img); }
      else scheduleImage(img, true);
    });
  }
  function scheduleActiveViewQueue() {
    if (activeViewQueueTimer) return;
    activeViewQueueTimer = setTimeout(() => { activeViewQueueTimer = null; queueActiveViewImages(); }, 140);
  }
  async function processQueue() {
    if (running) return; running = true;
    try {
      while (queue.length) {
        const img = queue.shift();
        if (!img?.isConnected || img.dataset.photoFix90Assigned) continue;
        if (!eligible(img)) { processed.delete(img); scheduled.delete(img); pendingRetryImages.delete(img); continue; }
        if (!isInActiveView(img) || !isNearActiveViewport(img)) {
          processed.delete(img); pendingRetryImages.add(img);
          if (observer) observer.observe(img);
          continue;
        }
        const info = nodeInfo(img);
        const saved = assignments.get(info.id);
        if (saved) { applyPhoto(img, saved); continue; }
        if (!navigator.onLine) { restoreFallback(img); pendingRetryImages.add(img); continue; }
        let photo = takeSeed(info.category, info.id);
        if (!photo) photo = await takeOnline(info.category, info.id);
        if (photo) {
          setAssignment(info.id, photo); applyPhoto(img, photo); onlinePhotos++;
          pendingRetryImages.delete(img);
        } else {
          restoreFallback(img);
          if (categoryWaitingForProvider(info.category)) {
            pendingRetryImages.add(img);
          } else failedCount++;
        }
        // Stop at the global Openverse daily budget instead of walking 1,800 slots
        // and marking all of them failed. The remaining queue is kept for tomorrow.
        if (!photo && dailyState().requests >= MAX_DAILY_REQUESTS && categoryWaitingForProvider(info.category)) {
          queue.unshift(img);
          break;
        }
        setStatus();
      }
    } finally {
      running = false;
      if (pendingRetryImages.size) scheduleQueueRetry();
      setStatus();
    }
  }
  function installObservers() {
    ensureStatus();
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting && entry.target?.isConnected && eligible(entry.target) && isInActiveView(entry.target) && isNearActiveViewport(entry.target)) {
          observer.unobserve(entry.target); pendingRetryImages.delete(entry.target); scheduleImage(entry.target);
        }
      }, { root: null, rootMargin: `${ACTIVE_VIEW_MARGIN}px 0px`, threshold: 0.01 });
    }
    if ('MutationObserver' in window && document.body) {
      mutationObserver = new MutationObserver(records => {
        let viewChanged = false;
        let slideChanged = false;
        for (const record of records) {
          if (record.type === 'attributes' && record.target?.classList?.contains?.('view-section')) {
            if (record.target.classList.contains('active') && !record.target.hidden) viewChanged = true;
            continue;
          }
          if (record.type === 'attributes' && record.target?.matches?.('.np640-slide')) {
            const slideImage = record.target.querySelector?.(':scope > img');
            if (record.target.classList.contains('is-active')) {
              if (slideImage && !slideImage.dataset.photoFix90Assigned) { processed.delete(slideImage); scheduled.delete(slideImage); }
              slideChanged = true;
            }
            continue;
          }
          for (const node of record.addedNodes || []) if (node.nodeType === 1) {
            scan(node);
            if (document.querySelector?.('#view-home.active')) queueHomeFirst();
            queueCatalogImages(node);
          }
        }
        if (viewChanged || slideChanged) scheduleActiveViewQueue();
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
    }
    scan(document);
    // FIX111 registers all pre-rendered views, but only active near-viewport slots are fetched.
    // Hidden tabs and distant cards wait for navigation/scroll, preserving the daily API budget.
    queueCatalogImages(document);
    if (document.querySelector?.('#view-home.active')) queueHomeFirst();
    queueActiveViewImages();
    // Capture handlers may stop navigation clicks before this listener runs;
    // observing .view-section class/hidden mutations is therefore authoritative.
    document.addEventListener('click', event => {
      if (!event.target?.closest?.('.nav-item[data-view], [data-nav]')) return;
      setTimeout(queueActiveViewImages, 120);
      setTimeout(queueActiveViewImages, 500);
    });
    window.addEventListener?.('popstate', scheduleActiveViewQueue);
    window.addEventListener?.('hashchange', scheduleActiveViewQueue);
    window.addEventListener?.('scroll', scheduleActiveViewQueue, { passive: true });
    window.addEventListener?.('resize', scheduleActiveViewQueue, { passive: true });
    if (typeof window.setInterval === 'function') window.setInterval(() => {
      scan(document);
      queueCatalogImages(document);
      queueActiveViewImages();
      processQueue();
      setStatus();
    }, 5000);
  }
  function resume() {
    pausedUntil = 0;
    commonsPausedUntil = 0;
    if (queueRetryTimer) { clearTimeout(queueRetryTimer); queueRetryTimer = null; }
    for (const [category, state] of pageState) {
      if (state.exhausted) persistPageState(category, { queryIndex: 0, page: 1, pageCount: MAX_PAGES_PER_QUERY, queryFailures: 0, retryAt: 0, commonsOffset: 0, commonsPages: 0, commonsQueryIndex: 0, commonsTried: false, commonsHasMore: false, exhausted: false });
      else if (state.retryAt || state.commonsRetryAt) { state.retryAt = 0; state.commonsRetryAt = 0; persistPageState(category, state); }
    }
    document.querySelectorAll(SELECTOR).forEach(img => {
      if (!img?.isConnected) return;
      if (img.classList.contains('photo-fix90-offline-fallback') || img.dataset.photoFix90State === 'fallback') {
        scheduled.delete(img); processed.delete(img); delete img.dataset.photoFix90Assigned;
        observeImage(img);
        if (observer) { observer.unobserve(img); scheduleImage(img, true); }
      }
    });
    scan(document);
    queueCatalogImages(document);
    queueActiveViewImages();
    return processQueue();
  }
  function registerRepairRecords(repairs) {
    currentRepairs = Array.isArray(repairs) ? repairs : [];
    // The cards/details are rendered by app.js; the MutationObserver processes each real image slot.
    setTimeout(() => scan(document), 0);
    return Promise.resolve({ registered: currentRepairs.length, queued: queue.length, mode: 'global-unique-photo-catalog' });
  }
  function getMethodPhotoStats() {
    const images = Array.from(document.querySelectorAll('#view-methods .method-card > img.catalog-card-art'));
    const loaded = images.filter(img => img.dataset.photoFix90Loaded === '1' && img.naturalWidth >= 320 && img.naturalHeight >= 180 && img.classList.contains('photo-fix90-online')).length;
    const fallback = images.filter(img => img.dataset.photoFix90State === 'fallback' || isSvg(img.getAttribute('src') || '')).length;
    return { total: images.length, loaded, pending: Math.max(0, images.length - loaded), fallback, queued: queue.filter(img => img?.closest?.('#view-methods')).length, failed: failedCount, apiRequests, dailyRequests: dailyState().requests, dailyRequestLimit: MAX_DAILY_REQUESTS, lastProvider, lastProviderError };
  }
  function expose() {
    api.loadRepairPhotos = registerRepairRecords;
    api.resumePhotoDownload = resume;
    api.photoProvider = 'Pexels seed + Openverse + Wikimedia Commons';
    api.photoCatalogQueuePolicy = 'active-view-near-viewport-global-tracking-lazy';
    api.photoCatalogVersion = VERSION;
    api.photoCatalogAllHomeModulesAndSpecialistsFix98 = FIX98_ALL_MODULE_AND_SPECIALIST_PHOTOS;
    api.photoCatalogActiveViewLazyQueueFix106 = FIX106_ACTIVE_VIEW_LAZY_QUEUE;
    api.photoCatalogFullCatalogQueueFix109 = FIX109_FULL_CATALOG_BACKGROUND_QUEUE;
    api.photoCatalogActiveViewProgressiveQueueFix111 = FIX111_ACTIVE_VIEW_PROGRESSIVE_QUEUE;
    api.photoCatalogHomepageSeedOwnershipMigrationFix111 = FIX111_HOME_SEED_OWNERSHIP_MIGRATION;
    api.photoCatalogMethodTitleTopicMappingFix106 = FIX106_METHOD_TITLE_TOPIC_MAPPING;
    api.photoCatalogMethodRendererQueueHandoffFix106 = FIX106_METHOD_RENDERER_QUEUE_HANDOFF;
    api.photoCatalogMethodStatusPanelFix106 = FIX106_METHOD_STATUS_PANEL;
    api.photoCatalogProviderRecoveryFix108 = FIX108_PROVIDER_RECOVERY;
    api.photoCatalogCompatibleWithFix93Guards = true;
    api.photoCatalogTopicVerificationFix94 = true;
    api.photoCatalogStrictTopicEvidenceFix94 = true;
    api.photoCatalogLegacyGuardRecovery = true;
    api.photoCatalogEnabled = true;
    api.photoCatalogStats = { localPhotos: 0, onlinePhotos: 0, displayedPhotos: 0, queued: 0, failed: 0, version: VERSION, localHomepagePhotos: FIX96_HOME_LOCAL_PHOTOGRAPHY };
    api.getPhotoCatalogStats = () => ({ onlinePhotos, queued: queue.length, retryPending: pendingRetryImages.size, failed: failedCount, slots: document.querySelectorAll(SELECTOR).length, apiRequests, lastProvider, lastProviderError, version: VERSION });
    api.getPhotoCatalogAssignment = id => assignments.get(String(id)) || null;
    api.photoCount = onlinePhotos;
    window.NPA_PHOTO_CATALOG_FIX111 = {
      version: VERSION, primeAssignmentRegistrationFix117: FIX117_REGISTER_PRIMED_HOME_ASSIGNMENTS, providerRecovery: FIX108_PROVIDER_RECOVERY, fullCatalogQueue: FIX109_FULL_CATALOG_BACKGROUND_QUEUE, activeViewProgressiveQueue: FIX111_ACTIVE_VIEW_PROGRESSIVE_QUEUE, homepageSeedOwnershipMigration: FIX111_HOME_SEED_OWNERSHIP_MIGRATION, retryAfterDelayMs, commonsBackoffMs, categoryFor, methodCategoryFor, methodCategoryAliases: FIX106_METHOD_CATEGORY_ALIASES, methodTitleTopicMapping: FIX106_METHOD_TITLE_TOPIC_MAPPING, methodRendererQueueHandoff: FIX106_METHOD_RENDERER_QUEUE_HANDOFF, methodStatusPanel: FIX106_METHOD_STATUS_PANEL, normalizeLicense, licenseLabel, licenseAllowed, hasHumanSubjectMetadata, isVramPhotoRelevant, isPhotoRelevant, photoTopicText, parseOpenverse, nodeInfo, probePhoto, recoverPhotoSlotId, renderedOnlinePhotoCount, renderedLocalPhotoCount, buildOpenverseUrl, openversePage, categorySearchQueries, commonsSearchQueries, commonsSearch, takeOnline, queueCatalogImages, queueHomeFirst, queueActiveViewImages, isInActiveView, isNearActiveViewport,
      getPageState: category => pageState.get(category) || null, homeSlotSeedPreferences: FIX106_HOME_SLOT_SEEDS, homeSeedOwners: FIX106_HOME_SEED_OWNER, photoQuality: { strictMediaType: FIX115_STRICT_PHOTO_MEDIA_MATCH, legacyAssignmentsRevalidated: FIX115_REVALIDATE_LEGACY_ASSIGNMENTS }, storageKeys: { assignments: ASSIGN_KEY, legacyAssignments: LEGACY_ASSIGN_KEY_FIX111, daily: DAILY_KEY, legacyDaily: LEGACY_DAILY_KEY, pageState: PAGE_STATE_KEY, legacyPageState: LEGACY_PAGE_STATE_FIX108_KEY, candidatePools: CANDIDATE_POOL_KEY }, photoIdentity, normalizeUrl: canonicalUrl, parseCommons, takeSeed, resume, registerRepairRecords,
      getStats: () => ({ fullCatalogQueue: false, fullCatalogTrackedLazy: true, activeViewProgressiveQueue: FIX111_ACTIVE_VIEW_PROGRESSIVE_QUEUE, totalSlots: document.querySelectorAll(SELECTOR).length, hiddenPending: Array.from(pendingRetryImages).filter(img => img?.isConnected && !isInActiveView(img)).length, commonsPausedUntil, localPhotos: renderedLocalPhotoCount(), onlinePhotos: renderedOnlinePhotoCount(), displayedPhotos: renderedLocalPhotoCount() + renderedOnlinePhotoCount(), assignedPhotos: assignments.size, queued: queue.length, retryPending: pendingRetryImages.size, failed: failedCount, assignments: assignments.size, apiRequests, dailyRequests: dailyState().requests, dailyRequestLimit: MAX_DAILY_REQUESTS, lastProvider, lastProviderError, activeView: document.querySelector?.('.view-section.active')?.id || '', activeViewSlots: document.querySelector?.('.view-section.active')?.querySelectorAll?.(SELECTOR).length || 0, methods: getMethodPhotoStats(), primedHomeAssignments: Number(window.NPA_HOME_PHOTO_PRIME_REGISTERED_FIX118 || 0), staticHomeLibrary: FIX118_STATIC_HOME_PHOTO_LIBRARY, version: VERSION }),
      getMethodPhotoStats, methodCategoryFor, queueActiveViewImages,
      isEligibleSelector: SELECTOR
    };
    // FIX118 preserves older handles while exposing the active local-photo-library runtime.
    window.NPA_PHOTO_CATALOG_FIX118 = window.NPA_PHOTO_CATALOG_FIX111;
    window.NPA_PHOTO_CATALOG_FIX117 = window.NPA_PHOTO_CATALOG_FIX111;
    // Keep legacy handles, but route every consumer to the current engine.
    window.NPA_PHOTO_CATALOG_FIX109 = window.NPA_PHOTO_CATALOG_FIX111;
    window.NPA_PHOTO_CATALOG_FIX108 = window.NPA_PHOTO_CATALOG_FIX111;
    window.NPA_PHOTO_CATALOG_FIX106 = window.NPA_PHOTO_CATALOG_FIX111;
    window.NPA_PHOTO_CATALOG_FIX105 = window.NPA_PHOTO_CATALOG_FIX111;
    window.NPA_PHOTO_CATALOG_FIX104 = window.NPA_PHOTO_CATALOG_FIX111;
    window.NPA_PHOTO_CATALOG_FIX103 = window.NPA_PHOTO_CATALOG_FIX111;
    window.NPA_PHOTO_CATALOG_FIX102 = window.NPA_PHOTO_CATALOG_FIX111;
    window.NPA_PHOTO_CATALOG_FIX101 = window.NPA_PHOTO_CATALOG_FIX111;
    window.NPA_PHOTO_CATALOG_FIX100 = window.NPA_PHOTO_CATALOG_FIX111;
    window.NPA_PHOTO_CATALOG_FIX99 = window.NPA_PHOTO_CATALOG_FIX111;
    window.NPA_PHOTO_CATALOG_FIX98 = window.NPA_PHOTO_CATALOG_FIX111;
    window.NPA_PHOTO_CATALOG_FIX97 = window.NPA_PHOTO_CATALOG_FIX111;
    window.NPA_PHOTO_CATALOG_FIX96 = window.NPA_PHOTO_CATALOG_FIX111;
    window.NPA_PHOTO_CATALOG_FIX93 = window.NPA_PHOTO_CATALOG_FIX111;
    window.NPA_PHOTO_CATALOG_FIX92 = window.NPA_PHOTO_CATALOG_FIX111;
  }
  function boot() {
    expose(); ensureStatus();
    const homepagePrimeReady = Promise.resolve(window.__NPA_HOME_PHOTO_PRIME_PROMISE).catch(() => null);
    Promise.all([loadConfig(), restoreLocalPhotoHashes(), homepagePrimeReady]).finally(() => {
      restoreAssignments();
      installObservers();
      setStatus();
    });
  }
  window.addEventListener?.('online', () => resume());
  document.addEventListener('click', event => { if (event.target.closest('#repairPhotoRetry,#methodPhotoRetry,[data-fix90-retry]')) { resume(); if (event.target.closest('#methodPhotoRetry')) setTimeout(() => { queueActiveViewImages(); processQueue(); }, 0); } });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
