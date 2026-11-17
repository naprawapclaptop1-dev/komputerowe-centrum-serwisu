/* Katalog orientacyjnych rodzin laptopów i komputerów. Nie jest pełną listą SKU ani bazą schematów OEM. */
window.ACADEMY_DEVICE_CATALOG = {
  updated: '2026-11-01',
  note: 'Rodziny produktowe i przykładowe serie. Dokładny model, MTM/Service Tag, numer płyty i rewizję PCB zawsze odczytaj z etykiety urządzenia oraz samej płyty.',
  brands: [
    { brand:'Lenovo', region:'ThinkPad / IdeaPad / Legion', families:[
      ['ThinkPad T','T14, T14s, T16, T15, T490, T480'],['ThinkPad X','X1 Carbon, X1 Yoga, X13, X390'],['ThinkPad L / E','L14, L15, E14, E15, E16'],['ThinkPad P','P1, P14s, P15, P16, P16s'],['IdeaPad','IdeaPad 3, 5, Slim 3, Slim 5, Yoga Slim'],['Legion / LOQ','Legion 5, 5 Pro, 7, 9, LOQ 15, LOQ 16']
    ]},
    { brand:'HP', region:'EliteBook / ProBook / ZBook / Pavilion', families:[
      ['EliteBook','840, 850, 860, 1040, 830, x360'],['ProBook','430, 440, 450, 445, 455, 650'],['ZBook','Firefly, Power, Studio, Fury'],['Pavilion','Pavilion 14, 15, 16, x360'],['Victus','Victus 15, Victus 16'],['OMEN','OMEN 15, 16, 17, Transcend']
    ]},
    { brand:'Dell', region:'Latitude / Precision / XPS / Inspiron', families:[
      ['Latitude','3000, 5000, 7000, 2-in-1, 54xx, 55xx, 74xx'],['Precision','3000, 5000, 7000, 35xx, 55xx, 75xx'],['XPS','XPS 13, 14, 15, 16, 17'],['Inspiron','Inspiron 14, 15, 16, 2-in-1'],['Vostro','Vostro 34xx, 35xx, 54xx, 56xx'],['G / Alienware','G15, G16, Alienware m16, x16']
    ]},
    { brand:'ASUS', region:'ExpertBook / VivoBook / Zenbook / ROG', families:[
      ['ExpertBook','B1, B3, B5, B9'],['VivoBook','14, 15, 16, S, Flip, Pro'],['Zenbook','14, 14X, 15, 16X, S'],['TUF Gaming','A15, A16, F15, F16'],['ROG Zephyrus','G14, G16, M16, Duo'],['ROG Strix / ProArt','Strix G, Strix SCAR, ProArt StudioBook']
    ]},
    { brand:'Acer', region:'Aspire / Swift / TravelMate / Nitro', families:[
      ['Aspire','Aspire 3, 5, 7, Vero'],['Swift','Swift 3, Go, Edge, X'],['TravelMate','P2, P4, P6, Spin'],['Extensa','Extensa 15, 16'],['Nitro','Nitro 5, V 15, Nitro 16, Nitro 17'],['Predator','Helios 300, Helios Neo, Helios 16, Triton']
    ]},
    { brand:'MSI', region:'Modern / Prestige / Katana / Raider', families:[
      ['Modern','Modern 14, Modern 15'],['Prestige / Summit','Prestige 13, 14, 16; Summit E13, E16'],['Creator','Creator M, Creator Z, CreatorPro'],['Thin / Cyborg','Thin 15, Thin GF, Cyborg 14, Cyborg 15'],['Katana / Sword','Katana 15, Katana 17, Sword 16'],['Gaming high-end','Raider GE, Stealth, Titan GT, Vector GP']
    ]},
    { brand:'Gigabyte', region:'G Series / AORUS / AERO', families:[
      ['G Series','G5, G6, G7'],['AORUS','AORUS 15, 16, 17, 17X'],['AERO','AERO 14, 15, 16, AERO OLED']
    ]},
    { brand:'Microsoft', region:'Surface Laptop / Surface Pro', families:[
      ['Surface Laptop','Laptop 4, 5, 6, 7, Laptop Go'],['Surface Pro','Pro 7, 8, 9, 10, 11'],['Surface Book / Studio','Book 2, Book 3, Laptop Studio, Studio 2+']
    ]},
    { brand:'Apple', region:'MacBook Air / MacBook Pro', families:[
      ['MacBook Air','Air 11, 13, 15; Intel oraz Apple Silicon'],['MacBook Pro','Pro 13, 14, 16; Intel oraz Apple Silicon']
    ]},
    { brand:'Fujitsu', region:'LIFEBOOK', families:[
      ['LIFEBOOK U','U731x, U741x, U751x, U931x'],['LIFEBOOK E','E541x, E551x, E5xx'],['LIFEBOOK A','A351x, A3511, A series']
    ]},
    { brand:'Dynabook / Toshiba', region:'Satellite / Tecra / Portégé', families:[
      ['Satellite Pro','C, L, E series'],['Tecra','A, X, Z series'],['Portégé','X, Z series']
    ]},
    { brand:'Framework', region:'Modular Laptop', families:[
      ['Framework Laptop 13','Intel Core, AMD Ryzen, różne generacje płyt'],['Framework Laptop 16','modułowa płyta, GPU expansion bay']
    ]}
  ]
};

// Przykładowe konkretne modele handlowe — nie są potwierdzeniem konkretnej płyty ani rewizji.
(() => {
  const models = {
    'Lenovo': [
      ['ThinkPad T','T480'],['ThinkPad T','T490'],['ThinkPad T','T14 Gen 1'],['ThinkPad T','T14 Gen 2'],['ThinkPad X','X1 Carbon Gen 6'],['ThinkPad X','X1 Carbon Gen 9'],['ThinkPad L','L14 Gen 2'],['ThinkPad P','P15 Gen 2'],['IdeaPad','IdeaPad 5 15ITL05'],['Legion','Legion 5 15ACH6']
    ],
    'HP': [
      ['EliteBook','EliteBook 840 G5'],['EliteBook','EliteBook 840 G8'],['EliteBook','EliteBook 840 G10'],['ProBook','ProBook 450 G7'],['ProBook','ProBook 450 G8'],['ZBook','ZBook Firefly 14 G8'],['Pavilion','Pavilion 15-cs'],['Victus','Victus 16'],['OMEN','OMEN 15-en']
    ],
    'Dell': [
      ['Latitude','Latitude 7490'],['Latitude','Latitude 5420'],['Latitude','Latitude 7420'],['Latitude','Latitude 5520'],['Precision','Precision 5540'],['XPS','XPS 13 9370'],['XPS','XPS 15 9500'],['Inspiron','Inspiron 15 5510'],['G Series','G15 5511']
    ],
    'ASUS': [
      ['VivoBook','VivoBook 15 X515'],['VivoBook','VivoBook S15 S533'],['Zenbook','ZenBook 14 UX425'],['Zenbook','ZenBook 14 UM425'],['TUF Gaming','TUF Gaming A15 FA506'],['ROG Zephyrus','ROG Zephyrus G14 GA401'],['ROG Strix','ROG Strix G15 G513'],['ExpertBook','ExpertBook B9450']
    ],
    'Acer': [
      ['Aspire','Aspire 5 A515-56'],['Aspire','Aspire 7 A715-42G'],['Swift','Swift 3 SF314-59'],['TravelMate','TravelMate P2 TMP215'],['Nitro','Nitro 5 AN515-57'],['Nitro','Nitro 5 AN515-58'],['Predator','Predator Helios 300 PH315-54']
    ],
    'MSI': [
      ['Modern','Modern 14 B11M'],['Prestige','Prestige 14 Evo'],['GF Series','GF63 Thin 11SC'],['Katana','Katana 15 B12V'],['Raider','Raider GE76'],['Stealth','Stealth 15M']
    ],
    'Gigabyte': [
      ['G Series','G5 GD'],['AORUS','AORUS 15P'],['AERO','AERO 15 OLED']
    ],
    'Microsoft': [
      ['Surface Laptop','Surface Laptop 4 13.5'],['Surface Laptop','Surface Laptop 5 15'],['Surface Pro','Surface Pro 7'],['Surface Pro','Surface Pro 8'],['Surface Book','Surface Book 3']
    ],
    'Apple': [
      ['MacBook Air','MacBook Air A1932'],['MacBook Air','MacBook Air M1 A2337'],['MacBook Pro','MacBook Pro 13 A1989'],['MacBook Pro','MacBook Pro 16 A2141'],['MacBook Pro','MacBook Pro 14 A2442']
    ],
    'Fujitsu': [['LIFEBOOK','LIFEBOOK U7410'],['LIFEBOOK','LIFEBOOK U9311'],['LIFEBOOK','LIFEBOOK E5511']],
    'Dynabook / Toshiba': [['Tecra','Tecra A40-J'],['Portégé','Portégé X30-J'],['Satellite Pro','Satellite Pro C50-J']],
    'Framework': [['Framework Laptop 13','Framework Laptop 13 Intel 11th Gen'],['Framework Laptop 13','Framework Laptop 13 AMD Ryzen 7040'],['Framework Laptop 16','Framework Laptop 16 AMD Ryzen 7040']]
  };
  for (const brand of (window.ACADEMY_DEVICE_CATALOG?.brands || [])) {
    const rows = models[brand.brand] || [];
    brand.models = rows.map(([series, model]) => [series, model, 'laptop']);
  }
})();


// Rozszerzenie katalogu referencyjnego 5.2.2: dodatkowi producenci i komputery stacjonarne.
(() => {
  const catalog = window.ACADEMY_DEVICE_CATALOG;
  if (!catalog || !Array.isArray(catalog.brands)) return;
  const extra = [
    {brand:'Samsung',region:'Galaxy Book / Notebook',families:[['Galaxy Book','Galaxy Book, Book2, Book3, Book4'],['Galaxy Book Pro','Book Pro 360, Book3 Pro 360, Book4 Pro'],['Notebook','Notebook 7, Notebook 9']],models:[['Galaxy Book','Galaxy Book3 Pro 360 NP960QFG','laptop'],['Galaxy Book','Galaxy Book4 Pro 14','laptop'],['Galaxy Book','Galaxy Book2 360 NP730QED','laptop']]},
    {brand:'LG',region:'gram / UltraPC',families:[['LG gram','gram 14, 15, 16, 17'],['LG gram Pro','gram Pro 16, Pro 17'],['UltraPC','UltraPC 14, 15']],models:[['gram','LG gram 14Z90R','laptop'],['gram','LG gram 16Z90R','laptop'],['gram Pro','LG gram Pro 16 16Z90SP','laptop']]},
    {brand:'Huawei',region:'MateBook / MateBook X',families:[['MateBook D','D14, D15, D16'],['MateBook','MateBook 14, 16'],['MateBook X','X Pro, X'],['MateBook E','E 2-in-1']],models:[['MateBook D','MateBook D14 2021','laptop'],['MateBook','MateBook 14 2023','laptop'],['MateBook X Pro','MateBook X Pro 2022','laptop']]},
    {brand:'Xiaomi',region:'Mi Notebook / RedmiBook',families:[['RedmiBook','RedmiBook 14, 15, Pro'],['Mi Notebook','Mi Notebook Air, Pro'],['Book Pro','Book Pro 14, 15']],models:[['RedmiBook','RedmiBook 15','laptop'],['Mi Notebook Pro','Mi Notebook Pro 15','laptop'],['RedmiBook Pro','RedmiBook Pro 14','laptop']]},
    {brand:'Razer',region:'Blade gaming laptops',families:[['Blade 14','Blade 14 gaming'],['Blade 15','Base, Advanced'],['Blade 16 / 17 / 18','Blade 16, 17, 18']],models:[['Blade 15','Razer Blade 15 Base 2020','laptop'],['Blade 15','Razer Blade 15 Advanced 2021','laptop'],['Blade 16','Razer Blade 16','laptop']]},
    {brand:'HONOR',region:'MagicBook',families:[['MagicBook','MagicBook 14, 15, 16'],['MagicBook X','MagicBook X 14, X 15'],['MagicBook Pro','MagicBook Pro 16']],models:[['MagicBook','HONOR MagicBook 14 2021','laptop'],['MagicBook X','HONOR MagicBook X 15','laptop'],['MagicBook Pro','HONOR MagicBook Pro 16','laptop']]},
    {brand:'MEDION',region:'AKOYA / ERAZER',families:[['AKOYA','AKOYA E, S, P series'],['ERAZER','Beast, Deputy, Crawler'],['Convertible','S-series 2-in-1']],models:[['AKOYA','MEDION AKOYA E15303','laptop'],['ERAZER','MEDION ERAZER Beast X25','laptop'],['ERAZER','MEDION ERAZER Deputy P25','laptop']]},
    {brand:'CHUWI',region:'CoreBook / GemiBook / HeroBook',families:[['CoreBook','CoreBook X, CoreBook Pro'],['GemiBook','GemiBook, GemiBook Plus'],['HeroBook','HeroBook Pro, HeroBook Air']],models:[['CoreBook','CHUWI CoreBook X','laptop'],['GemiBook','CHUWI GemiBook Plus','laptop'],['HeroBook','CHUWI HeroBook Pro','laptop']]},
    {brand:'Panasonic',region:"TOUGHBOOK / Let's note",families:[['TOUGHBOOK','CF-54, CF-55, FZ-55, FZ-40'],["Let's note",'FV, SV, QV series']],models:[['TOUGHBOOK','Panasonic TOUGHBOOK CF-54','laptop'],['TOUGHBOOK','Panasonic TOUGHBOOK FZ-55','laptop'],["Let's note",'Panasonic Let’s note FV','laptop']]},
    {brand:'Clevo / Tongfang',region:'Barebone / ODM platforms',families:[['Clevo','NH55, NH70, PB series'],['Tongfang','GK5, GM series'],['XMG / Schenker','Neo, Core, Apex']],models:[['Clevo','Clevo NH55 barebone','laptop'],['Tongfang','Tongfang GK5 platform','laptop'],['XMG','Schenker XMG Neo 15','laptop']]}
  ];
  const names = new Set(catalog.brands.map(x => x.brand));
  for (const item of extra) if (!names.has(item.brand)) catalog.brands.push(item);
  const desktops = [
    ['ThinkCentre','Lenovo ThinkCentre M720q Tiny','desktop'],['ThinkCentre','Lenovo ThinkCentre M920q Tiny','desktop'],['ThinkStation','Lenovo ThinkStation P330 Tiny','workstation'],
    ['OptiPlex','Dell OptiPlex 7060 SFF','desktop'],['OptiPlex','Dell OptiPlex 7090 SFF','desktop'],['Precision','Dell Precision 3660 Tower','workstation'],
    ['ProDesk','HP ProDesk 600 G5 SFF','desktop'],['EliteDesk','HP EliteDesk 800 G6 Mini','mini-pc'],['Z Workstation','HP Z2 G9 Tower','workstation'],
    ['ExpertCenter','ASUS ExpertCenter D7 SFF','desktop'],['BRIX','Gigabyte BRIX GB-BRi','mini-pc'],['Cubi','MSI Cubi 5','mini-pc'],
    ['iMac','Apple iMac 24-inch M1','all-in-one'],['Mac mini','Apple Mac mini M2','mini-pc'],['Surface Studio','Microsoft Surface Studio 2+','all-in-one']
  ];
  const desktopBrand = {Lenovo:'Lenovo',Dell:'Dell',HP:'HP',ASUS:'ASUS',Gigabyte:'Gigabyte',MSI:'MSI',Apple:'Apple',Microsoft:'Microsoft'};
  const byName = new Map(catalog.brands.map(x => [x.brand,x]));
  for (const [series,model,type] of desktops) {
    const bName = Object.keys(desktopBrand).find(k => model.startsWith(k+' ')) || (model.startsWith('HP ')?'HP':model.startsWith('ASUS ')?'ASUS':model.startsWith('Gigabyte ')?'Gigabyte':model.startsWith('MSI ')?'MSI':model.startsWith('Apple ')?'Apple':model.startsWith('Microsoft ')?'Microsoft':null);
    const brand = bName ? byName.get(desktopBrand[bName]) : null;
    if (brand) {
      brand.models = Array.isArray(brand.models) ? brand.models : [];
      if (!brand.models.some(x => x[1] === model)) brand.models.push([series,model,type]);
    }
  }
  catalog.modelCount = catalog.brands.reduce((n,b)=>n+(b.models||[]).length,0);
  catalog.manufacturerCount = catalog.brands.length;
  catalog.note = (catalog.note || '') + ' Katalog zawiera także przykładowe serie komputerów stacjonarnych, mini-PC, workstation i all-in-one. Pozycje referencyjne nie potwierdzają rewizji płyty.';
})();


// Rozszerzenie katalogu 5.2.2: producenci gamingowi, rugged, regionalni i mobilni.
(() => {
  const catalog = window.ACADEMY_DEVICE_CATALOG;
  if (!catalog || !Array.isArray(catalog.brands)) return;
  const extra = [
    {brand:'Alienware',region:'Dell Gaming / Area-51 / Aurora',families:[['m Series','m15, m16, m18'],['x Series','x14, x15, x16'],['Area-51','Area-51m, Area-51'],['Aurora','Aurora R gaming desktop']],models:[['m15','Alienware m15 R7','laptop'],['m16','Alienware m16 R2','laptop'],['x15','Alienware x15 R2','laptop'],['Area-51m','Alienware Area-51m R2','laptop']]},
    {brand:'VAIO',region:'SX / FE / Z',families:[['SX Series','SX12, SX14'],['FE Series','FE14, FE15, FE16'],['Z Series','VAIO Z Carbon']],models:[['SX','VAIO SX14 VJS146','laptop'],['FE','VAIO FE14 2023','laptop'],['Z','VAIO Z VJZ141','laptop']]},
    {brand:'Getac',region:'Rugged notebooks / tablets',families:[['S Series','S410, S510'],['B Series','B360, B360 Pro'],['X Series','X600, X600 Pro']],models:[['S410','Getac S410 G4','laptop'],['B360','Getac B360 G2','laptop'],['X600','Getac X600 Pro','laptop']]},
    {brand:'NEC',region:'VersaPro / LAVIE',families:[['VersaPro','VKT, VKT16, VKT44'],['LAVIE N','N15, N14'],['LAVIE Pro','Pro Mobile']],models:[['VersaPro','NEC VersaPro VKT16','laptop'],['VersaPro','NEC VersaPro VKT44','laptop'],['LAVIE','NEC LAVIE N15','laptop']]},
    {brand:'Gateway',region:'Ultra Slim / Creator / Gaming',families:[['Ultra Slim','14.1, 15.6'],['Creator','Creator Series'],['Gaming','Creator/Gaming RTX series']],models:[['Ultra Slim','Gateway GWTN156-1','laptop'],['Creator','Gateway Creator Series GWTN156-2','laptop'],['Gaming','Gateway Gaming GWTN156-3','laptop']]},
    {brand:'Packard Bell',region:'EasyNote / EN series',families:[['EasyNote','TE, TS, LS series'],['EN Series','EN15, EN17'],['Dot','Dot S, Dot M']],models:[['EasyNote','Packard Bell EasyNote TE11','laptop'],['EasyNote','Packard Bell EasyNote TS11','laptop'],['EN Series','Packard Bell ENTF71','laptop']]},
    {brand:'eMachines',region:'E Series / G Series',families:[['E Series','E525, E725, E627'],['G Series','G725, G627']],models:[['E Series','eMachines E725','laptop'],['E Series','eMachines E627','laptop'],['G Series','eMachines G725','laptop']]},
    {brand:'TUXEDO Computers',region:'InfinityBook / Stellaris / Pulse',families:[['InfinityBook','InfinityBook Pro 14, Pro 16'],['Stellaris','Stellaris 16, 17'],['Pulse','Pulse 14, 15']],models:[['InfinityBook','TUXEDO InfinityBook Pro 14 Gen9','laptop'],['Stellaris','TUXEDO Stellaris 16 Gen5','laptop'],['Pulse','TUXEDO Pulse 15 Gen3','laptop']]},
    {brand:'SCHENKER / XMG',region:'VIA / CORE / NEO / KEY',families:[['VIA','VIA 14 Pro, VIA 15 Pro'],['CORE','XMG CORE 15, CORE 16'],['NEO','XMG NEO 16, NEO 17'],['KEY','XMG KEY 15']],models:[['VIA','SCHENKER VIA 14 Pro','laptop'],['CORE','XMG CORE 15 M24','laptop'],['NEO','XMG NEO 16 E24','laptop']]},
    {brand:'Eurocom',region:'Mobile workstation / Sky / Nightsky',families:[['Sky','Sky Z7, Sky X9'],['Nightsky','Nightsky RX15, RX17'],['Raptor','Raptor X17']],models:[['Sky','Eurocom Sky Z7 R2','laptop'],['Nightsky','Eurocom Nightsky RX15','laptop'],['Raptor','Eurocom Raptor X17','laptop']]},
    {brand:'Star Labs',region:'StarBook / StarFighter',families:[['StarBook','StarBook Mk V, Mk VI'],['StarFighter','StarFighter 16'],['StarLite','StarLite Mk V']],models:[['StarBook','Star Labs StarBook Mk V','laptop'],['StarBook','Star Labs StarBook Mk VI','laptop'],['StarFighter','Star Labs StarFighter 16','laptop']]}
  ];
  const names = new Set(catalog.brands.map(x => x.brand));
  for (const item of extra) if (!names.has(item.brand)) catalog.brands.push(item);
  catalog.modelCount = catalog.brands.reduce((n,b)=>n+(b.models||[]).length,0);
  catalog.manufacturerCount = catalog.brands.length;
  catalog.note = (catalog.note || '') + ' Rozszerzony katalog zawiera również producentów specjalistycznych, rugged, gamingowych i regionalnych; dokładne board ID i rewizje wymagają weryfikacji na urządzeniu.';
})();
