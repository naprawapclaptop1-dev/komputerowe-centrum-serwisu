(() => {
  'use strict';

  const OWNER = 'naprawapclaptop1-dev';
  const REPO = 'komputerowe-centrum-serwisu';
  const REPOSITORY = `${OWNER}/${REPO}`;
  const RELEASES_API = `https://api.github.com/repos/${REPOSITORY}/releases?per_page=20`;
  const RELEASES_PAGE = `https://github.com/${REPOSITORY}/releases`;
  const ISSUES_PAGE = `https://github.com/${REPOSITORY}/issues/new`;
  const setupName = 'KomputeroweCentrumSerwisu_FIX137_INSTALATOR.exe';
  const portableName = 'KomputeroweCentrumSerwisu_FIX137_PORTABLE.exe';
  const checksumName = 'SHA256SUMS.txt';
  const productVersion = '1.0.0.73';

  const $ = (id) => document.getElementById(id);
  const elements = {
    releaseStatus: $('releaseStatus'), setupLink: $('setupDownload'), portableLink: $('portableDownload'),
    mobileMenuToggle: $('mobileMenuToggle'), primaryNav: $('primaryNav'),
    releaseVersion: $('releaseVersion'), releaseDownloads: $('releaseDownloads'), releaseMeta: $('releaseMeta'),
    releaseExtra: $('releaseExtra'), langSwitch: $('langSwitch'), year: $('year'), refreshRelease: $('refreshRelease'),
    deviceName: $('deviceName'), deviceDetails: $('deviceDetails'), deviceRecommendation: $('deviceRecommendation'),
    deviceBadge: $('deviceBadge'), checksumDownload: $('checksumDownload'), checksumForm: $('checksumForm'),
    verifyBinary: $('verifyBinary'), verifySums: $('verifySums'), verifyChecksumButton: $('verifyChecksumButton'),
    checksumResult: $('checksumResult'), stableState: $('stableState'), stableVersion: $('stableVersion'),
    stableDescription: $('stableDescription'), stableMeta: $('stableMeta'), stableReleaseLink: $('stableReleaseLink'),
    betaState: $('betaState'), betaVersion: $('betaVersion'), betaDescription: $('betaDescription'),
    betaMeta: $('betaMeta'), betaReleaseLink: $('betaReleaseLink'), releaseHistory: $('releaseHistory'),
    historyUpdated: $('historyUpdated'), knowledgeSearch: $('knowledgeSearch'), knowledgeCategory: $('knowledgeCategory'),
    knowledgeResults: $('knowledgeResults'), faqSearch: $('faqSearch'), faqList: $('faqList'),
    reportForm: $('reportForm'), reportType: $('reportType'), reportTitle: $('reportTitle'),
    reportDescription: $('reportDescription'), reportPublicAck: $('reportPublicAck'), reportResult: $('reportResult'), reportGithubLink: $('reportGithubLink')
  };

  let language = (navigator.language || 'en').toLowerCase().startsWith('pl') ? 'pl' : 'en';
  let releases = [];
  let stableRelease = null;
  let betaRelease = null;
  let stableAssets = null;
  let betaAssets = null;
  let systemInfo = { platform: 'unknown', architecture: 'unknown', isWindows: false };
  let loadInProgress = false;
  let lastReleaseCheck = 0;
  let currentStatusType = '';
  let currentStatusMessageKey = 'checking';

  const messages = {
    pl: {
      checking: 'Sprawdzam publiczne wydania i dostępność wymaganych plików na GitHub…',
      ready: 'Wydanie Stable i wymagane pliki zostały znalezione w oficjalnym GitHub Releases.',
      missing: 'Nie znaleziono publicznego wydania Stable z kompletem wymaganych plików.',
      error: 'Nie udało się sprawdzić GitHub Releases. Możesz otworzyć oficjalną stronę wydań.',
      rate: 'GitHub ograniczył liczbę zapytań. Spróbuj ponownie później lub otwórz stronę wydań.',
      published: 'Publikacja', installer: 'Instalator', portable: 'Portable', checksum: 'Pobierz sumy SHA-256',
      releasePage: 'Wszystkie wydania i historia zmian', checkingAgain: 'Odświeżam dane z GitHub…',
      statusUploaded: 'Plik przesłany i widoczny w GitHub Releases', statusMissing: 'Brak publicznego wydania Beta',
      betaManifest: 'Manifest Beta jest dostępny; wskazuje ten sam plik programu co bieżące Stable.',
      betaSeparate: 'Wykryto osobne publiczne wydanie testowe Beta.', betaUnavailable: 'Kanał Beta nie ma osobnego publicznego wydania ani manifestu w aktualnym Stable.',
      noHistory: 'Brak publicznych wydań do wyświetlenia.', noArticles: 'Nie znaleziono artykułów dla podanych kryteriów.',
      allCategories: 'Wszystkie kategorie', downloadCategory: 'Pobieranie', installCategory: 'Instalacja',
      securityCategory: 'Bezpieczeństwo', updatesCategory: 'Aktualizacje', supportCategory: 'Pomoc',
      verifySelect: 'Wybierz oba pliki, aby rozpocząć kontrolę.', verifyWorking: 'Obliczam SHA-256 lokalnie w przeglądarce…',
      verifyMatch: 'Zgodność potwierdzona. SHA-256 pliku jest identyczny z oficjalnym wpisem.',
      verifyMismatch: 'Niezgodność! SHA-256 pobranego pliku nie odpowiada oficjalnej sumie.',
      verifyNoEntry: 'Nie znaleziono wpisu dla nazwy wybranego pliku w SHA256SUMS.txt.',
      verifyUnsupported: 'Ta przeglądarka nie udostępnia bezpiecznego SHA-256. Otwórz sumę w pliku tekstowym i użyj narzędzia systemowego.',
      verifyError: 'Nie udało się obliczyć sumy. Sprawdź wybrane pliki i spróbuj ponownie.',
      windowsDetected: 'Wykryto Windows', otherDetected: 'Nie wykryto systemu Windows',
      installerRecommended: 'Polecany wybór: instalator Windows. Wersja portable jest dostępna jako alternatywa.',
      unknownArchitecture: 'Nie udało się wiarygodnie określić architektury przeglądarki.',
      supportDraft: 'Treść zgłoszenia została przygotowana lokalnie. Sprawdź ją na GitHub przed opublikowaniem.',
      supportTitlePrefix: '[KCS] ', release: 'Wydanie', downloads: 'Pobrań', stable: 'Stable', beta: 'Beta',
      noDescription: 'Brak opisu wydania.', checkedAt: 'Ostatnie sprawdzenie',
      issueTypes: { bug: 'Błąd programu lub strony', download: 'Problem z pobieraniem', install: 'Problem z instalacją', security: 'Weryfikacja / bezpieczeństwo', suggestion: 'Propozycja funkcji' }
    },
    en: {
      checking: 'Checking public releases and required assets on GitHub…',
      ready: 'Stable release and required assets were found in official GitHub Releases.',
      missing: 'No public Stable release with all required assets was found.',
      error: 'Could not check GitHub Releases. You can open the official releases page.',
      rate: 'GitHub rate-limited requests. Try again later or open the releases page.',
      published: 'Published', installer: 'Installer', portable: 'Portable', checksum: 'Download SHA-256 checksums',
      releasePage: 'All releases and changelog', checkingAgain: 'Refreshing GitHub data…',
      statusUploaded: 'Asset uploaded and listed in GitHub Releases', statusMissing: 'No public Beta release',
      betaManifest: 'Beta manifest is available; it points to the same program build as current Stable.',
      betaSeparate: 'A separate public Beta prerelease was found.', betaUnavailable: 'No separate public Beta release or Beta manifest was found.',
      noHistory: 'There are no public releases to display.', noArticles: 'No articles match these filters.',
      allCategories: 'All categories', downloadCategory: 'Downloads', installCategory: 'Installation',
      securityCategory: 'Security', updatesCategory: 'Updates', supportCategory: 'Support',
      verifySelect: 'Select both files to start verification.', verifyWorking: 'Calculating SHA-256 locally in your browser…',
      verifyMatch: 'Integrity confirmed. The file SHA-256 matches the official checksum.',
      verifyMismatch: 'Mismatch! The downloaded file SHA-256 does not match the official checksum.',
      verifyNoEntry: 'No checksum entry was found for the selected file name in SHA256SUMS.txt.',
      verifyUnsupported: 'This browser does not provide secure SHA-256. Open the checksum text file and use a system tool.',
      verifyError: 'Could not calculate the checksum. Check the selected files and try again.',
      windowsDetected: 'Windows detected', otherDetected: 'Windows was not detected',
      installerRecommended: 'Recommended: Windows installer. The portable version is available as an alternative.',
      unknownArchitecture: 'Could not reliably determine the browser architecture.',
      supportDraft: 'The issue draft was prepared locally. Review it on GitHub before publishing.',
      supportTitlePrefix: '[KCS] ', release: 'Release', downloads: 'Downloads', stable: 'Stable', beta: 'Beta',
      noDescription: 'No release notes provided.', checkedAt: 'Last checked',
      issueTypes: { bug: 'Application or website bug', download: 'Download problem', install: 'Installation problem', security: 'Verification / security', suggestion: 'Feature suggestion' }
    }
  };

  const knowledgeArticles = [
    { id: 'choose-download', category: 'download', title: { pl: 'Instalator czy wersja przenośna?', en: 'Installer or portable version?' }, body: { pl: 'Wybierz instalator, gdy chcesz dodać program do systemu i korzystać ze skrótów. Wersja portable jest przeznaczona do uruchamiania bez klasycznej instalacji. Pobieraj obie wersje wyłącznie z oficjalnego GitHub Releases.', en: 'Choose the installer to add the application to Windows and use shortcuts. The portable build is intended to run without a traditional installation. Download both versions only from official GitHub Releases.' }, link: '#pobierz', linkText: { pl: 'Przejdź do pobierania', en: 'Open downloads' } },
    { id: 'download-trouble', category: 'download', title: { pl: 'Pobieranie nie rozpoczyna się', en: 'A download does not start' }, body: { pl: 'Sprawdź, czy przyciski są aktywne i czy status wydania jest zielony. Kliknij „Sprawdź ponownie”. Gdy GitHub API jest chwilowo niedostępne, otwórz stronę wszystkich wydań i wybierz plik z oficjalnego repozytorium.', en: 'Check that the download buttons are enabled and the release status is green. Click “Check again”. If the GitHub API is temporarily unavailable, open all releases and choose the asset from the official repository.' }, link: '#pomoc-online', linkText: { pl: 'Zgłoś problem z pobieraniem', en: 'Report a download problem' } },
    { id: 'install-uac', category: 'install', title: { pl: 'Instalator pyta o uprawnienia administratora', en: 'The installer requests administrator permission' }, body: { pl: 'To może być normalne przy instalacji programu Windows. Przed zatwierdzeniem sprawdź, czy plik pochodzi z oficjalnego GitHub i czy jego SHA-256 zgadza się z opublikowanym plikiem sum. Nie zatwierdzaj nieoczekiwanych monitów.', en: 'This can be normal when installing a Windows application. Before approving, check that the file came from official GitHub and that its SHA-256 matches the published checksum file. Do not approve unexpected prompts.' }, link: '#bezpieczenstwo', linkText: { pl: 'Sprawdź SHA-256', en: 'Verify SHA-256' } },
    { id: 'verify-sha', category: 'security', title: { pl: 'Jak sprawdzić SHA-256?', en: 'How do I verify SHA-256?' }, body: { pl: 'Pobierz plik SHA256SUMS.txt i wybierz go razem z instalatorem lub plikiem portable w Centrum bezpieczeństwa. Strona obliczy sumę na Twoim urządzeniu i porówna ją z oficjalnym wpisem. Plik nie jest wysyłany na serwer.', en: 'Download SHA256SUMS.txt and select it together with the installer or portable file in the Security Center. The page calculates the hash on your device and compares it with the official entry. The file is not uploaded.' }, link: '#bezpieczenstwo', linkText: { pl: 'Otwórz kontrolę pliku', en: 'Open file verification' } },
    { id: 'smartscreen', category: 'security', title: { pl: 'Windows wyświetla ostrzeżenie SmartScreen', en: 'Windows displays a SmartScreen warning' }, body: { pl: 'Nie wyłączaj Microsoft Defender ani SmartScreen tylko po to, aby uruchomić plik. Najpierw potwierdź źródło pobrania i zgodność SHA-256. Jeśli ostrzeżenie nadal budzi wątpliwości, przerwij instalację i zgłoś problem.', en: 'Do not disable Microsoft Defender or SmartScreen just to run a file. First confirm the download source and SHA-256 integrity. If the warning still concerns you, stop the installation and report the issue.' }, link: '#pomoc-online', linkText: { pl: 'Zgłoś ostrzeżenie', en: 'Report a warning' } },
    { id: 'authenticode', category: 'security', title: { pl: 'Jak sprawdzić podpis cyfrowy Authenticode?', en: 'How do I check the Authenticode digital signature?' }, body: { pl: 'Kliknij plik EXE prawym przyciskiem, wybierz Właściwości i sprawdź kartę Podpisy cyfrowe, jeśli jest dostępna. Porównaj wydawcę i stan podpisu. Brak karty lub podpisu nie oznacza automatycznie złośliwego pliku — w takim przypadku szczególnie ważne jest pobranie z oficjalnego repozytorium i zgodność SHA-256. Ta strona nie wykonuje własnej weryfikacji Authenticode.', en: 'Right-click the EXE, choose Properties and inspect the Digital Signatures tab if present. Check the publisher and signature status. A missing tab or signature does not automatically mean a file is malicious; in that case, download only from the official repository and verify SHA-256. This website does not perform Authenticode verification itself.' }, link: '#bezpieczenstwo', linkText: { pl: 'Sprawdź SHA-256', en: 'Verify SHA-256' } },
    { id: 'browser-download', category: 'download', title: { pl: 'Gdzie sprawdzić postęp i wznowić pobieranie?', en: 'Where can I check progress and resume a download?' }, body: { pl: 'Plik jest pobierany bezpośrednio z GitHub. Pasek postępu, lokalizację zapisu i ewentualne wznowienie kontroluje Twoja przeglądarka lub jej menedżer pobierania. Gdy bezpośredni link nie działa, otwórz wszystkie wydania i wybierz wymagany plik w oficjalnym repozytorium.', en: 'The file downloads directly from GitHub. Your browser or its download manager controls progress, save location and any resume action. If the direct link does not work, open all releases and choose the required asset in the official repository.' }, link: '#pobierz', linkText: { pl: 'Otwórz centrum pobierania', en: 'Open download center' } },
    { id: 'stable-beta', category: 'updates', title: { pl: 'Czym różni się Stable od Beta?', en: 'What is the difference between Stable and Beta?' }, body: { pl: 'Stable oznacza publiczne wydanie stabilne. Beta to kanał testowy — może mieć osobne wydanie prerelease albo manifest wskazujący ten sam plik co Stable. Strona pokazuje to rozróżnienie na podstawie publicznych danych GitHub.', en: 'Stable is the public stable release. Beta is the testing channel — it may have a separate prerelease or a manifest pointing to the same asset as Stable. This page reports the distinction using public GitHub data.' }, link: '#wydania', linkText: { pl: 'Zobacz kanały i historię', en: 'View channels and history' } },
    { id: 'update-problem', category: 'updates', title: { pl: 'Aktualizacja nie jest dostępna', en: 'An update is not available' }, body: { pl: 'Odśwież status wydania i sprawdź historię. Jeśli GitHub nie pokazuje wymaganych assetów, aktualizacja nie powinna być traktowana jako gotowa. Nie pobieraj plików z nieoficjalnych mirrorów.', en: 'Refresh the release status and check the history. If GitHub does not list the required assets, the update should not be treated as ready. Do not download files from unofficial mirrors.' }, link: '#wydania', linkText: { pl: 'Sprawdź historię wydań', en: 'Check release history' } },
    { id: 'report', category: 'support', title: { pl: 'Jak przygotować zgłoszenie techniczne?', en: 'How do I prepare a technical report?' }, body: { pl: 'Opisz objawy, kroki prowadzące do błędu i dokładny komunikat. Formularz na tej stronie przygotowuje treść lokalnie, a następnie otwiera GitHub. Zgłoszenie publikujesz dopiero po własnym sprawdzeniu.', en: 'Describe the symptoms, steps that lead to the problem and the exact error message. The form on this page prepares the text locally and then opens GitHub. You publish the issue only after reviewing it yourself.' }, link: '#pomoc-online', linkText: { pl: 'Przygotuj zgłoszenie', en: 'Prepare an issue' } }
  ];

  function setLanguage(lang) {
    language = lang;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-pl][data-en]').forEach((el) => {
      const value = el.dataset[lang];
      if (value !== undefined) el.innerHTML = value;
    });
    document.querySelectorAll('[data-placeholder-pl][data-placeholder-en]').forEach((el) => {
      const value = el.dataset[`placeholder${lang === 'pl' ? 'Pl' : 'En'}`];
      if (value !== undefined) el.placeholder = value;
    });
    if (elements.langSwitch) {
      elements.langSwitch.textContent = lang === 'pl' ? 'EN' : 'PL';
      elements.langSwitch.setAttribute('aria-label', lang === 'pl' ? 'Change language to English' : 'Zmień język na polski');
    }
    const video = document.querySelector('.video-frame video');
    if (video) {
      video.querySelectorAll('track[kind="captions"]').forEach((track) => {
        const selected = (track.srclang || '').toLowerCase() === lang;
        track.default = selected;
        if (track.track) track.track.mode = selected ? 'showing' : 'disabled';
      });
    }
    document.title = lang === 'pl'
      ? 'Komputerowe Centrum Serwisu — bezpłatne narzędzie Windows'
      : 'Computer Service Center — free Windows toolkit';
    renderKnowledge();
    renderReleaseHistory();
    updateChannelCards();
    updateDeviceSummary();
    showStatus(currentStatusType, messages[language][currentStatusMessageKey] || messages[language].error, currentStatusMessageKey);
    updateCurrentReleaseMetadata();
    if (elements.reportResult && !elements.reportResult.hidden) {
      const paragraph = elements.reportResult.querySelector('p');
      if (paragraph) paragraph.textContent = messages[language].supportDraft;
    }
    filterFaq();
  }

  function textForCurrentLanguage(value) {
    return value && typeof value === 'object' ? (value[language] || value.pl || '') : String(value || '');
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value == null ? '' : String(value);
  }

  function showStatus(type, text, messageKey) {
    const root = elements.releaseStatus;
    if (!root) return;
    if (typeof messageKey === 'string') currentStatusMessageKey = messageKey;
    currentStatusType = type || '';
    root.className = `release-status ${currentStatusType}`;
    const label = root.lastElementChild;
    if (label) label.textContent = text;
  }

  function setVerificationResult(type, message, hashValue) {
    const root = elements.checksumResult;
    if (!root) return;
    root.className = `verification-result ${type || ''}`;
    root.replaceChildren();
    const icon = document.createElement('span');
    icon.className = 'result-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = type === 'success' ? '✓' : type === 'error' ? '!' : '◎';
    const label = document.createElement('span');
    label.textContent = message;
    root.append(icon, label);
    if (hashValue) {
      const code = document.createElement('code');
      code.textContent = hashValue;
      root.appendChild(code);
    }
  }

  function disableDownloads() {
    for (const link of [elements.setupLink, elements.portableLink]) {
      if (!link) continue;
      link.classList.add('disabled');
      link.setAttribute('aria-disabled', 'true');
      link.removeAttribute('download');
      link.href = RELEASES_PAGE;
    }
  }

  function isOfficialReleaseAssetUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' && parsed.hostname === 'github.com' && parsed.pathname.includes(`/${REPOSITORY}/releases/download/`);
    } catch (_) {
      return false;
    }
  }

  function enableDownload(link, url, name) {
    if (!link || !isOfficialReleaseAssetUrl(url)) throw new Error('Unexpected download host or URL.');
    link.href = url;
    link.classList.remove('disabled');
    link.removeAttribute('aria-disabled');
    link.setAttribute('download', name);
  }

  function getReleaseAsset(release, name) {
    if (!release || !Array.isArray(release.assets)) return null;
    const asset = release.assets.find((item) => item && item.name === name && item.state === 'uploaded' && Number(item.size) > 0);
    if (!asset || !isOfficialReleaseAssetUrl(asset.browser_download_url)) return null;
    return asset;
  }

  function collectReleaseAssets(release, channel) {
    const assets = {
      installer: getReleaseAsset(release, setupName),
      portable: getReleaseAsset(release, portableName),
      checksums: getReleaseAsset(release, checksumName),
      stableManifest: getReleaseAsset(release, 'manifest-stable.xml'),
      betaManifest: getReleaseAsset(release, 'manifest-beta.xml'),
      catalog: getReleaseAsset(release, 'releases.json')
    };
    const channelManifest = channel === 'beta' ? assets.betaManifest : assets.stableManifest;
    assets.complete = Boolean(assets.installer && assets.portable && assets.checksums && channelManifest);
    return assets;
  }

  function formatSize(bytes) {
    const value = Number(bytes) || 0;
    if (value >= 1024 * 1024 * 1024) return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`;
    if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
    return `${(value / 1024).toFixed(0)} KB`;
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function getReleaseDate(release) {
    return release && (release.published_at || release.created_at) || '';
  }

  function getTotalDownloads(assets) {
    if (!assets) return 0;
    return [assets.installer, assets.portable].reduce((sum, asset) => sum + (Number(asset && asset.download_count) || 0), 0);
  }

  function updateDeviceSummary() {
    const info = systemInfo;
    const isWindows = Boolean(info.isWindows);
    const platformName = isWindows ? messages[language].windowsDetected : messages[language].otherDetected;
    const archText = info.architecture === '64' ? '64-bit' : info.architecture === '32' ? '32-bit' : messages[language].unknownArchitecture;
    setText('deviceName', platformName);
    setText('deviceDetails', `${info.platformLabel || (isWindows ? 'Windows' : 'Unknown')} · ${archText}`);
    setText('deviceRecommendation', isWindows ? messages[language].installerRecommended : (language === 'pl' ? 'Pliki są przeznaczone dla systemu Windows; wybór pobierania pozostaje dostępny.' : 'Files are intended for Windows; download options remain available.'));
    setText('deviceBadge', isWindows ? (language === 'pl' ? 'WINDOWS' : 'WINDOWS') : (language === 'pl' ? 'RĘCZNY WYBÓR' : 'MANUAL'));
  }

  async function detectSystem() {
    const ua = navigator.userAgent || '';
    const uaData = navigator.userAgentData || null;
    let platform = (navigator.platform || '').toLowerCase();
    let architecture = /win64|x64|wow64|x86_64|amd64/i.test(ua) ? '64' : /wow32|win32|x86/i.test(ua) ? '32' : 'unknown';
    let platformLabel = '';
    if (uaData) {
      try {
        const high = typeof uaData.getHighEntropyValues === 'function'
          ? await uaData.getHighEntropyValues(['architecture', 'bitness', 'platformVersion'])
          : {};
        platformLabel = uaData.platform || '';
        if (high.bitness === '64') architecture = '64';
        else if (high.bitness === '32') architecture = '32';
        else if (high.architecture && /arm64|x86_64|x64/i.test(high.architecture)) architecture = '64';
        else if (high.architecture && /x86|arm/i.test(high.architecture)) architecture = '32';
      } catch (_) {
        platformLabel = uaData.platform || '';
      }
    }
    const combined = `${platform} ${platformLabel} ${ua}`.toLowerCase();
    const isWindows = /windows|win32|win64/i.test(combined);
    systemInfo = {
      platform: isWindows ? 'windows' : platform || 'unknown',
      architecture,
      isWindows,
      platformLabel: platformLabel || (isWindows ? 'Windows' : (navigator.platform || 'Nieznany system'))
    };
    updateDeviceSummary();
  }

  function appendTextElement(parent, tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    node.textContent = text;
    parent.appendChild(node);
    return node;
  }

  function buildReleaseCard(release) {
    const article = document.createElement('article');
    article.className = 'release-history-card';
    const header = document.createElement('div');
    header.className = 'release-history-top';
    const kind = document.createElement('span');
    kind.className = `channel-pill ${release.prerelease ? 'beta-pill' : 'stable-pill'}`;
    kind.textContent = release.prerelease ? messages[language].beta.toUpperCase() : messages[language].stable.toUpperCase();
    header.appendChild(kind);
    appendTextElement(header, 'time', 'muted-small', formatDate(getReleaseDate(release))).dateTime = getReleaseDate(release) || '';
    article.appendChild(header);
    appendTextElement(article, 'h4', 'release-history-version', release.tag_name || release.name || '—');
    const body = String(release.body || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    appendTextElement(article, 'p', 'release-history-notes', body.slice(0, 190) || messages[language].noDescription);
    const footer = document.createElement('div');
    footer.className = 'release-history-footer';
    const downloads = (Array.isArray(release.assets) ? release.assets : []).reduce((sum, asset) => sum + (Number(asset.download_count) || 0), 0);
    appendTextElement(footer, 'span', 'muted-small', `${messages[language].downloads}: ${downloads.toLocaleString(language === 'pl' ? 'pl-PL' : 'en-US')}`);
    const link = document.createElement('a');
    link.className = 'text-link';
    link.href = release.html_url && /^https:\/\/github\.com\//i.test(release.html_url) ? release.html_url : RELEASES_PAGE;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = language === 'pl' ? 'Szczegóły wydania ↗' : 'Release details ↗';
    footer.appendChild(link);
    article.appendChild(footer);
    return article;
  }

  function renderReleaseHistory() {
    if (!elements.releaseHistory) return;
    elements.releaseHistory.replaceChildren();
    if (!releases.length) {
      appendTextElement(elements.releaseHistory, 'p', 'empty-state', messages[language].noHistory);
      return;
    }
    releases.slice(0, 8).forEach((release) => elements.releaseHistory.appendChild(buildReleaseCard(release)));
  }

  function updateChannelCards() {
    if (!stableRelease) {
      setText('stableState', messages[language].missing);
      setText('stableVersion', '—');
      setText('stableMeta', '');
    } else {
      setText('stableState', messages[language].statusUploaded);
      setText('stableVersion', stableRelease.tag_name || stableRelease.name || '—');
      const stableCount = getTotalDownloads(stableAssets);
      setText('stableMeta', `${messages[language].published}: ${formatDate(getReleaseDate(stableRelease))} · ${messages[language].downloads}: ${stableCount.toLocaleString(language === 'pl' ? 'pl-PL' : 'en-US')}`);
      if (elements.stableReleaseLink) elements.stableReleaseLink.href = stableRelease.html_url || RELEASES_PAGE;
    }
    if (betaRelease && betaAssets && betaAssets.complete) {
      setText('betaState', messages[language].statusUploaded);
      setText('betaVersion', betaRelease.tag_name || betaRelease.name || '—');
      setText('betaDescription', messages[language].betaSeparate);
      setText('betaMeta', `${messages[language].published}: ${formatDate(getReleaseDate(betaRelease))} · ${messages[language].downloads}: ${getTotalDownloads(betaAssets).toLocaleString(language === 'pl' ? 'pl-PL' : 'en-US')}`);
      if (elements.betaReleaseLink) elements.betaReleaseLink.href = betaRelease.html_url || RELEASES_PAGE;
    } else if (stableRelease && stableAssets && stableAssets.betaManifest) {
      setText('betaState', language === 'pl' ? 'MANIFEST DOSTĘPNY' : 'MANIFEST AVAILABLE');
      setText('betaVersion', stableRelease.tag_name || stableRelease.name || '—');
      setText('betaDescription', messages[language].betaManifest);
      setText('betaMeta', language === 'pl' ? 'Ten sam instalator i plik portable co w Stable.' : 'Same installer and portable asset as Stable.');
      if (elements.betaReleaseLink) elements.betaReleaseLink.href = stableRelease.html_url || RELEASES_PAGE;
    } else {
      setText('betaState', messages[language].statusMissing);
      setText('betaVersion', '—');
      setText('betaDescription', messages[language].betaUnavailable);
      setText('betaMeta', '');
    }
  }

  function updateCurrentReleaseMetadata() {
    if (!stableRelease || !stableAssets || !stableAssets.complete) return;
    setText('releaseVersion', stableRelease.tag_name || stableRelease.name || '—');
    setText('releaseDownloads', getTotalDownloads(stableAssets).toLocaleString(language === 'pl' ? 'pl-PL' : 'en-US'));
    setText('releaseMeta', `${messages[language].published}: ${formatDate(getReleaseDate(stableRelease))} · ${messages[language].installer}: ${formatSize(stableAssets.installer.size)} · ${messages[language].portable}: ${formatSize(stableAssets.portable.size)}`);
    if (elements.releaseExtra) {
      elements.releaseExtra.replaceChildren();
      const sumLink = document.createElement('a');
      sumLink.href = stableAssets.checksums.browser_download_url;
      sumLink.target = '_blank';
      sumLink.rel = 'noopener';
      sumLink.textContent = `${messages[language].checksum} ↗`;
      elements.releaseExtra.appendChild(sumLink);
      const releaseLink = document.createElement('a');
      releaseLink.href = stableRelease.html_url || RELEASES_PAGE;
      releaseLink.target = '_blank';
      releaseLink.rel = 'noopener';
      releaseLink.textContent = `${messages[language].releasePage} ↗`;
      elements.releaseExtra.appendChild(releaseLink);
    }
    if (elements.checksumDownload) elements.checksumDownload.href = stableAssets.checksums.browser_download_url;
    if (lastReleaseCheck && elements.historyUpdated) {
      elements.historyUpdated.textContent = `${messages[language].checkedAt}: ${new Date(lastReleaseCheck).toLocaleTimeString(language === 'pl' ? 'pl-PL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
  }

  async function loadRelease(force) {
    const now = Date.now();
    if (loadInProgress) return;
    if (!force && releases.length && now - lastReleaseCheck < 5 * 60 * 1000) return;
    loadInProgress = true;
    if (elements.refreshRelease) elements.refreshRelease.disabled = true;
    if (force) showStatus('', messages[language].checkingAgain, 'checkingAgain');
    else showStatus('', messages[language].checking, 'checking');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      let response;
      try {
        response = await fetch(RELEASES_API, {
          headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
          cache: 'no-cache', signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }
      if (response.status === 403 || response.status === 429) throw new Error(messages[language].rate);
      if (!response.ok) throw new Error(`GitHub API HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('GitHub Releases returned an unexpected response.');
      releases = data.filter((release) => release && !release.draft && release.tag_name).sort((a, b) => {
        return new Date(getReleaseDate(b)).getTime() - new Date(getReleaseDate(a)).getTime();
      });
      stableRelease = releases.find((release) => !release.prerelease && collectReleaseAssets(release, 'stable').complete) || null;
      betaRelease = releases.find((release) => release.prerelease && collectReleaseAssets(release, 'beta').complete) || null;
      stableAssets = stableRelease ? collectReleaseAssets(stableRelease, 'stable') : null;
      betaAssets = betaRelease ? collectReleaseAssets(betaRelease, 'beta') : null;
      lastReleaseCheck = Date.now();
      if (!stableRelease || !stableAssets || !stableAssets.complete) {
        disableDownloads();
        setText('releaseVersion', '—');
        setText('releaseDownloads', '—');
        setText('releaseMeta', messages[language].missing);
        setText('releaseExtra', '');
        showStatus('warning', messages[language].missing, 'missing');
      } else {
        enableDownload(elements.setupLink, stableAssets.installer.browser_download_url, setupName);
        enableDownload(elements.portableLink, stableAssets.portable.browser_download_url, portableName);
        setText('releaseVersion', stableRelease.tag_name || stableRelease.name || '—');
        const downloadTotal = getTotalDownloads(stableAssets);
        setText('releaseDownloads', downloadTotal.toLocaleString(language === 'pl' ? 'pl-PL' : 'en-US'));
        setText('releaseMeta', `${messages[language].published}: ${formatDate(getReleaseDate(stableRelease))} · ${messages[language].installer}: ${formatSize(stableAssets.installer.size)} · ${messages[language].portable}: ${formatSize(stableAssets.portable.size)}`);
        if (elements.checksumDownload) elements.checksumDownload.href = stableAssets.checksums.browser_download_url;
        if (elements.releaseExtra) {
          elements.releaseExtra.replaceChildren();
          const sumLink = document.createElement('a');
          sumLink.href = stableAssets.checksums.browser_download_url;
          sumLink.target = '_blank';
          sumLink.rel = 'noopener';
          sumLink.textContent = `${messages[language].checksum} ↗`;
          elements.releaseExtra.appendChild(sumLink);
          const releaseLink = document.createElement('a');
          releaseLink.href = stableRelease.html_url || RELEASES_PAGE;
          releaseLink.target = '_blank';
          releaseLink.rel = 'noopener';
          releaseLink.textContent = `${messages[language].releasePage} ↗`;
          elements.releaseExtra.appendChild(releaseLink);
        }
        showStatus('success', messages[language].ready, 'ready');
      }
      renderReleaseHistory();
      updateChannelCards();
      setText('historyUpdated', `${messages[language].checkedAt}: ${new Date(lastReleaseCheck).toLocaleTimeString(language === 'pl' ? 'pl-PL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`);
    } catch (error) {
      disableDownloads();
      setText('releaseVersion', '—');
      setText('releaseDownloads', '—');
      const message = error && error.name === 'AbortError' ? messages[language].error : (error && error.message ? error.message : messages[language].error);
      showStatus('error', message, message === messages[language].rate ? 'rate' : 'error');
      if (elements.releaseMeta) {
        const link = document.createElement('a');
        link.className = 'text-link';
        link.href = RELEASES_PAGE;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = `${messages[language].releasePage} ↗`;
        elements.releaseMeta.replaceChildren(link);
      }
      updateChannelCards();
    } finally {
      loadInProgress = false;
      if (elements.refreshRelease) elements.refreshRelease.disabled = false;
    }
  }

  function categoryName(category) {
    const map = {
      download: messages[language].downloadCategory,
      install: messages[language].installCategory,
      security: messages[language].securityCategory,
      updates: messages[language].updatesCategory,
      support: messages[language].supportCategory
    };
    return map[category] || messages[language].allCategories;
  }

  function renderKnowledge() {
    if (!elements.knowledgeResults) return;
    const query = (elements.knowledgeSearch && elements.knowledgeSearch.value || '').trim().toLocaleLowerCase(language === 'pl' ? 'pl-PL' : 'en-US');
    const category = elements.knowledgeCategory ? elements.knowledgeCategory.value : 'all';
    const filtered = knowledgeArticles.filter((article) => {
      if (category !== 'all' && article.category !== category) return false;
      const text = `${textForCurrentLanguage(article.title)} ${textForCurrentLanguage(article.body)}`.toLocaleLowerCase(language === 'pl' ? 'pl-PL' : 'en-US');
      return !query || text.includes(query);
    });
    elements.knowledgeResults.replaceChildren();
    if (!filtered.length) {
      appendTextElement(elements.knowledgeResults, 'p', 'empty-state', messages[language].noArticles);
      return;
    }
    filtered.forEach((article) => {
      const card = document.createElement('article');
      card.className = 'knowledge-card';
      appendTextElement(card, 'span', 'knowledge-category', categoryName(article.category));
      appendTextElement(card, 'h3', '', textForCurrentLanguage(article.title));
      appendTextElement(card, 'p', '', textForCurrentLanguage(article.body));
      const link = document.createElement('a');
      link.className = 'text-link';
      link.href = article.link;
      link.textContent = `${textForCurrentLanguage(article.linkText)} ↗`;
      card.appendChild(link);
      elements.knowledgeResults.appendChild(card);
    });
  }

  function filterFaq() {
    if (!elements.faqList) return;
    const query = (elements.faqSearch && elements.faqSearch.value || '').trim().toLocaleLowerCase(language === 'pl' ? 'pl-PL' : 'en-US');
    elements.faqList.querySelectorAll('details').forEach((item) => {
      const searchable = item.textContent.toLocaleLowerCase(language === 'pl' ? 'pl-PL' : 'en-US');
      item.hidden = Boolean(query) && !searchable.includes(query);
    });
  }

  async function verifyLocalChecksum(event) {
    event.preventDefault();
    const binary = elements.verifyBinary && elements.verifyBinary.files && elements.verifyBinary.files[0];
    const sums = elements.verifySums && elements.verifySums.files && elements.verifySums.files[0];
    if (!binary || !sums) {
      setVerificationResult('error', messages[language].verifySelect);
      return;
    }
    if (!window.crypto || !window.crypto.subtle || typeof binary.arrayBuffer !== 'function' || typeof sums.text !== 'function') {
      setVerificationResult('error', messages[language].verifyUnsupported);
      return;
    }
    if (binary.size <= 0 || binary.size > 500 * 1024 * 1024) {
      setVerificationResult('error', language === 'pl' ? 'Plik jest pusty lub przekracza limit 500 MB tej kontroli.' : 'The file is empty or exceeds this check’s 500 MB limit.');
      return;
    }
    if (elements.verifyChecksumButton) elements.verifyChecksumButton.disabled = true;
    setVerificationResult('', messages[language].verifyWorking);
    try {
      const sumsText = await sums.text();
      const escapedName = binary.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`^([a-f0-9]{64})\\s+\\*?${escapedName}\\s*$`, 'im');
      const match = sumsText.match(regex);
      if (!match) {
        setVerificationResult('error', messages[language].verifyNoEntry);
        return;
      }
      const bytes = await binary.arrayBuffer();
      const digest = await window.crypto.subtle.digest('SHA-256', bytes);
      const actual = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
      const expected = match[1].toLowerCase();
      if (actual === expected) setVerificationResult('success', messages[language].verifyMatch, actual);
      else setVerificationResult('error', messages[language].verifyMismatch, actual);
    } catch (error) {
      setVerificationResult('error', messages[language].verifyError);
    } finally {
      if (elements.verifyChecksumButton) elements.verifyChecksumButton.disabled = false;
    }
  }

  function prepareSupportReport(event) {
    event.preventDefault();
    const title = (elements.reportTitle && elements.reportTitle.value || '').trim();
    const description = (elements.reportDescription && elements.reportDescription.value || '').trim();
    const type = elements.reportType ? elements.reportType.value : 'bug';
    if (title.length < 5 || description.length < 20 || !elements.reportPublicAck || !elements.reportPublicAck.checked) return;
    const category = messages[language].issueTypes[type] || messages[language].issueTypes.bug;
    const issueTitle = `${messages[language].supportTitlePrefix}${category}: ${title}`.slice(0, 180);
    const context = [
      `Product version: ${productVersion}`,
      `Website build: FIX118`,
      `Detected platform: ${systemInfo.platformLabel || systemInfo.platform}`,
      `Detected architecture: ${systemInfo.architecture}`,
      `Browser: ${(navigator.userAgent || 'unknown').slice(0, 350)}`,
      `Language: ${language}`
    ].join('\n');
    const body = `${description}\n\n---\n${context}\n\nIMPORTANT: GitHub issues in this public repository are public. Do not include passwords, access tokens, license keys, customer data, serial numbers, email addresses or private diagnostic reports.`;
    const url = new URL(ISSUES_PAGE);
    url.searchParams.set('title', issueTitle);
    url.searchParams.set('body', body);
    if (elements.reportGithubLink) elements.reportGithubLink.href = url.toString();
    if (elements.reportResult) elements.reportResult.hidden = false;
    const paragraph = elements.reportResult && elements.reportResult.querySelector('p');
    if (paragraph) paragraph.textContent = messages[language].supportDraft;
  }

  if (elements.langSwitch) {
    elements.langSwitch.addEventListener('click', () => setLanguage(language === 'pl' ? 'en' : 'pl'));
  }
  if (elements.mobileMenuToggle && elements.primaryNav) {
    const setMobileMenuOpen = (open, returnFocus = false) => {
      elements.primaryNav.classList.toggle('is-open', open);
      elements.mobileMenuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      const label = open
        ? (language === 'pl' ? 'Zamknij menu' : 'Close menu')
        : (language === 'pl' ? 'Otwórz menu' : 'Open menu');
      elements.mobileMenuToggle.setAttribute('aria-label', label);
      elements.mobileMenuToggle.title = label;
      if (returnFocus) elements.mobileMenuToggle.focus();
    };
    elements.mobileMenuToggle.addEventListener('click', () => {
      const open = !elements.primaryNav.classList.contains('is-open');
      setMobileMenuOpen(open);
    });
    elements.primaryNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMobileMenuOpen(false));
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && elements.primaryNav.classList.contains('is-open')) {
        event.preventDefault();
        setMobileMenuOpen(false, true);
      }
    });
    document.addEventListener('click', (event) => {
      if (elements.primaryNav.classList.contains('is-open') &&
          !elements.primaryNav.contains(event.target) &&
          !elements.mobileMenuToggle.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    });
  }
  if (elements.refreshRelease) elements.refreshRelease.addEventListener('click', () => loadRelease(true));
  if (elements.checksumForm) elements.checksumForm.addEventListener('submit', verifyLocalChecksum);
  if (elements.knowledgeSearch) elements.knowledgeSearch.addEventListener('input', renderKnowledge);
  if (elements.knowledgeCategory) elements.knowledgeCategory.addEventListener('change', renderKnowledge);
  if (elements.faqSearch) elements.faqSearch.addEventListener('input', filterFaq);
  if (elements.reportForm) elements.reportForm.addEventListener('submit', prepareSupportReport);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) loadRelease(false);
  });

  if (elements.year) elements.year.textContent = new Date().getFullYear();
  setLanguage(language);
  disableDownloads();
  detectSystem();
  loadRelease(true);
})();
