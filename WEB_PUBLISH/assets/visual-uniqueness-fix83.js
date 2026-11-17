/* FIX83 — globalny silnik unikalnych, tematycznych ilustracji technicznych.
   Każdy obraz jest generowany lokalnie z tożsamości lekcji i zakresu widoku.
   VRAM jest osobną kategorią: pokazuje kości GDDR/BGA, nigdy moduł DIMM/SO-DIMM. */
(() => {
  'use strict';
  const api = window.ACADEMY_ART || (window.ACADEMY_ART = {});
  const VERSION = '6.8.0-fix83-topic-correct-global-visuals';
  const assigned = new Map();
  const usedVisuals = new Set();
  const usedStaticSources = new Map();
  let domAuditScheduled = false;
  let domVisualSequence = 0;

  const clean = value => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' }[c]));
  const hash32 = value => { let h = 2166136261; for (const c of String(value)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const hash64 = value => `${hash32(`a|${value}`).toString(16).padStart(8,'0')}${hash32(`b|${value}`).toString(16).padStart(8,'0')}`;
  const textOf = item => [item?.id, item?.title, item?.titleEn, item?.name, item?.category, item?.categoryEn, item?.tags, item?.purpose, item?.devices, item?.description, item?.symptom].filter(Boolean).join(' ').toLowerCase();

  function kind(item = {}) {
    const t = textOf(item);
    const direct=String(item.category || item.kind || '').toLowerCase();
    const directMap={vram:'vram',ram:'ram',gpu:'gpu',cpu:'cpu',storage:'storage',bios:'bios',power:'power',cooling:'cooling',display:'display',port:'port',network:'network',audio:'audio',battery:'battery',safety:'safety',meter:'meter',software:'software',board:'board',laptop:'laptop',diagnostics:'safety'};
    if (directMap[direct]) return directMap[direct];
    // Kolejność jest krytyczna: VRAM nie może wpadać do ogólnej kategorii RAM.
    if (/\bvram\b|gddr[34567x]?|hbm[23e]?|high bandwidth memory|video memory|pamięć graficzna|pamięć karty graficznej|kości pamięci graficznej/.test(t)) return 'vram';
    if (/\bram\b|\bddr[345]\b|so[- ]?dimm|\bdimm\b|pamięć operacyjna|moduł pamięci/.test(t)) return 'ram';
    if (/\bgpu\b|karta graficzna|graphics card|graphics processor|radeon|geforce/.test(t)) return 'gpu';
    if (/\bcpu\b|procesor|processor|socket am[45]|\blga\s?\d/.test(t)) return 'cpu';
    if (/nvme|m\.2|\bssd\b|\bhdd\b|dysk|storage|raid|nośnik|pamięć masowa/.test(t)) return 'storage';
    if (/bios|uefi|firmware|spi flash|ec\/|kbc|boot|rozruch|post code/.test(t)) return 'bios';
    if (/vrm|mosfet|przetwornica|buck|power stage|sekcja zasilania|cewka|dławik/.test(t)) return 'power';
    if (/chłod|temperatur|wentyl|fan|thermal|radiator|heat.?pipe|pasta termiczna/.test(t)) return 'cooling';
    if (/matryc|ekran|monitor|display|screen|zawias|edp|lvds|podświetlenie/.test(t)) return 'display';
    if (/usb.?c|usb4|thunderbolt|port|złącze|dock|hdmi|displayport/.test(t)) return 'port';
    if (/wi.?fi|wifi|bluetooth|ethernet|router|sieć|network|lan|antenna/.test(t)) return 'network';
    if (/audio|dźwięk|mikrofon|kamera|speaker|sound|kodek/.test(t)) return 'audio';
    if (/bater|akumulator|battery|ogniwo|cell pack/.test(t)) return 'battery';
    if (/bezpieczeń|esd|obudow|zalani|koroz|safety|shield|antystaty/.test(t)) return 'safety';
    if (/multimetr|oscyloskop|pomiar|test|diagnost|miernik|measurement|zasilacz laboratoryjny|sonda/.test(t)) return 'meter';
    if (/windows|system|sterownik|driver|bsod|software|program|bitlocker|secure boot/.test(t)) return 'software';
    if (/płyta główna|motherboard|boardview|pcb|bga|smd|lutow|chipset/.test(t)) return 'board';
    return 'laptop';
  }

  const palette = {
    vram:['#55e7ff','#a38bff'], ram:['#65f6a3','#56b8ff'], gpu:['#ff8b68','#62cfff'], cpu:['#f7c76b','#72dcff'],
    storage:['#8be5ff','#a68bff'], bios:['#ffc76e','#ff806f'], power:['#ffb66b','#ff6f90'], cooling:['#58e8ff','#83efa8'],
    display:['#84caff','#a98dff'], port:['#66e5ff','#ffc96f'], network:['#76e6c5','#6cb9ff'], audio:['#d49bff','#75d9ff'],
    battery:['#a7ed75','#ffd16b'], safety:['#74edaf','#75c9ff'], meter:['#78e6ff','#ffb76b'], software:['#80d5ff','#b798ff'],
    board:['#66e7cc','#8ab9ff'], laptop:['#6bdcff','#9f8bff']
  };

  function sceneFor(type, seed, item = {}) {
    const v = seed % 7;
    const tag = (x,y,text,color) => `<text x="${x}" y="${y}" fill="${color}" font-family="Arial,sans-serif" font-size="12" font-weight="700">${esc(text)}</text>`;
    const pin = (x,y,w=10,h=5) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1" fill="#c5d4d9" opacity=".85"/>`;
    const chip = (x,y,w,h,label,color) => `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="#101c2b" stroke="${color}" stroke-width="3"/><rect x="${x+8}" y="${y+8}" width="${w-16}" height="${h-16}" rx="4" fill="#253c51" stroke="#9cb7c7" stroke-opacity=".45"/>${tag(x+w/2,y+h/2+4,label,'#eafaff')}${Array.from({length:4},(_,i)=>pin(x+12+i* Math.max(10,(w-28)/4),y-5,7,5)+pin(x+12+i*Math.max(10,(w-28)/4),y+h,7,5)).join('')}</g>`;
    const traces = Array.from({length:6},(_,i)=>{const y=92+i*34+(v%3)*3;return `<path d="M28 ${y}h${58+(seed+i*19)%115}v${10+(i%3)*7}h${80+(seed+i*29)%125}" fill="none" stroke="#48b9d3" stroke-opacity=".42" stroke-width="2.2"/>`;}).join('');
    switch(type) {
      case 'vram': {
        // Tylko dyskretne kości GDDR/HBM w obudowach BGA; nigdy długi moduł RAM/DIMM.
        const title=textOf(item);
        const board=`<rect x="54" y="64" width="532" height="264" rx="18" fill="#0b3d35" stroke="#2b967f" stroke-width="4"/>${traces}`;
        if(/bga|jedna kość|pakiet/.test(title)) {
          const balls=Array.from({length:64},(_,i)=>{const x=232+(i%8)*25,y=132+Math.floor(i/8)*18;return `<circle cx="${x}" cy="${y}" r="4" fill="#d5bd83"/>`;}).join('');
          return `${board}<rect x="194" y="92" width="252" height="184" rx="18" fill="#172537" stroke="${palette.vram[0]}" stroke-width="5"/><rect x="214" y="108" width="212" height="116" rx="10" fill="#33475d" stroke="#adc5d3" stroke-width="2"/><text x="320" y="172" fill="#f2fbff" text-anchor="middle" font-size="24" font-weight="700">GDDR6</text>${balls}${tag(86,50,'VRAM BGA PACKAGE · SOLDER BALLS',palette.vram[0])}${tag(430,316,'MEMORY CHIP ONLY',palette.vram[1])}`;
        }
        if(/magistrala|bus/.test(title)) {
          const memory=Array.from({length:4},(_,i)=>chip(92+i*116,94+(i%2)*126,82,62,i%2?'GDDR6X':'GDDR6',palette.vram[0])).join('');
          const bus=Array.from({length:5},(_,i)=>`<path d="M${132+i*92} 186v${i%2?24:-24}h${28+(i*19)%50}" fill="none" stroke="#f3cb77" stroke-width="3" stroke-linecap="round"/>`).join('');
          return `${board}${memory}${bus}${tag(72,50,'GDDR MEMORY BUS / DATA LANES',palette.vram[0])}${tag(430,316,'VRAM TO GPU INTERFACE',palette.vram[1])}`;
        }
        const count=4+(seed%5),cols=2+(seed%3),rows=Math.ceil(count/cols),cw=68+(seed%3)*7,ch=50+(seed%2)*9,gapX=34+(seed%4)*8,gapY=28+(seed%3)*7;
        const totalW=cols*cw+(cols-1)*gapX,totalH=rows*ch+(rows-1)*gapY,startX=(640-totalW)/2,startY=(380-totalH)/2+4;
        const chips=Array.from({length:count},(_,i)=>{const x=startX+(i%cols)*(cw+gapX),y=startY+Math.floor(i/cols)*(ch+gapY);return chip(Math.round(x),Math.round(y),cw,ch,i%3===0?'GDDR6X':(i%2?'GDDR6':'GDDR7'),palette.vram[0]);}).join('');
        return `${board}${chips}${tag(72,50,'DISCRETE GDDR / BGA MEMORY',palette.vram[0])}${tag(430,316,`${count} VRAM PACKAGES`,palette.vram[1])}`;
      }
      case 'ram': {
        const title=textOf(item);
        if(/kanał|channel/.test(title)) {
          const module=(y,label,color)=>`<rect x="108" y="${y}" width="424" height="76" rx="12" fill="#15503d" stroke="${color}" stroke-width="4"/>${Array.from({length:7},(_,i)=>`<rect x="${132+i*55}" y="${y+12}" width="38" height="48" rx="5" fill="#16283b" stroke="#a8d8e6" stroke-width="2"/>`).join('')}<path d="M125 ${y+76}h390l-12 12H137z" fill="#c2a65d"/>${tag(130,y+45,label,'#f1fbff')}`;
          return `${module(105,'CHANNEL A',palette.ram[0])}${module(225,'CHANNEL B',palette.ram[1])}<path d="M320 188v31m-14-10l14 12 14-12" stroke="#fff0b1" stroke-width="5" fill="none"/>${tag(210,64,'DUAL-CHANNEL MEMORY',palette.ram[0])}`;
        }
        if(/ram-modules|moduły pamięci/.test(title)) return `<rect x="92" y="112" width="456" height="80" rx="14" transform="rotate(-9 320 152)" fill="#16533e" stroke="${palette.ram[0]}" stroke-width="4"/>${Array.from({length:7},(_,i)=>`<rect x="${128+i*54}" y="132" width="34" height="48" rx="5" transform="rotate(-9 ${145+i*54} 156)" fill="#15283c" stroke="${palette.ram[1]}" stroke-width="2"/>`).join('')}<rect x="130" y="211" width="380" height="68" rx="12" transform="rotate(8 320 245)" fill="#1a5b42" stroke="${palette.ram[1]}" stroke-width="4"/>${tag(165,78,'RAM MODULES / DIMM',palette.ram[0])}${tag(170,312,'MEMORY BANKS',palette.ram[1])}`;
        const compact=/so[- ]?dimm|sodimm|laptop/.test(title),width=compact?330:420,x=320-width/2,count=6+(seed%5),chipW=compact?25:34,gap=(width-44-count*chipW)/(count-1),chipY=compact?155:146,chipH=compact?48:64;
        const chips=Array.from({length:count},(_,i)=>`<rect x="${Math.round(x+22+i*(chipW+gap))}" y="${chipY+(i%3===0?0:((seed>>i)%5))}" width="${chipW}" height="${chipH}" rx="5" fill="#15283c" stroke="${i%2?palette.ram[0]:palette.ram[1]}" stroke-width="2.5"/>` ).join('');
        const module=`<rect x="${x}" y="${compact?132:116}" width="${width}" height="${compact?106:136}" rx="16" fill="#16533e" stroke="${palette.ram[0]}" stroke-width="4"/><path d="M${x+18} ${compact?238:252}h${width-36}l-14 18h-${width-64}z" fill="#c2a65d"/>${chips}`;
        return `${module}${tag(86,78,compact?'SO-DIMM LAPTOP RAM':'DIMM DESKTOP RAM',palette.ram[0])}${tag(438,302,`DDR${4+(seed%2)} · ${count} CHIPS`,palette.ram[1])}`;
      }
      case 'gpu':
        if (/pc hardware|podzespoł|komputer/.test(textOf(item))) return `<rect x="165" y="56" width="310" height="282" rx="24" fill="#17283c" stroke="${palette.gpu[0]}" stroke-width="5"/><rect x="190" y="84" width="260" height="210" rx="12" fill="#0e1b2b"/><circle cx="320" cy="180" r="60" fill="#21374b" stroke="${palette.gpu[1]}" stroke-width="5"/><circle cx="320" cy="180" r="18" fill="#9abccc"/>${tag(218,322,'PC HARDWARE / GPU / CPU',palette.gpu[0])}`;
        return `<rect x="70" y="112" width="500" height="155" rx="18" fill="#172438" stroke="${palette.gpu[0]}" stroke-width="4"/><rect x="112" y="137" width="420" height="105" rx="12" fill="#26384c" stroke="#92bbcd" stroke-width="2"/><circle cx="238" cy="188" r="54" fill="#101a28" stroke="${palette.gpu[1]}" stroke-width="5"/><circle cx="238" cy="188" r="16" fill="#7fa5b7"/>${Array.from({length:7},(_,i)=>`<path d="M238 136q${(i-3)*7} 18 ${Math.cos(i)*38} 42" stroke="${palette.gpu[0]}" stroke-width="5" fill="none"/>`).join('')}<rect x="350" y="155" width="92" height="70" rx="9" fill="#101b2d" stroke="#6ce6ff" stroke-width="3"/><text x="396" y="196" text-anchor="middle" fill="#fff">GPU</text><path d="M92 270h430l-12 20H104z" fill="#c7a967"/>${tag(86,88,'GRAPHICS CARD / PCIe',palette.gpu[0])}`;
      case 'cpu':
        if (/npu|ai pc|neural/.test(textOf(item))) return `<rect x="80" y="80" width="480" height="244" rx="20" fill="#14283e" stroke="${palette.cpu[0]}" stroke-width="4"/><rect x="112" y="150" width="116" height="88" rx="12" fill="#20384e" stroke="${palette.cpu[1]}" stroke-width="3"/><rect x="262" y="150" width="116" height="88" rx="12" fill="#20384e" stroke="${palette.cpu[1]}" stroke-width="3"/><rect x="412" y="150" width="116" height="88" rx="12" fill="#20384e" stroke="${palette.cpu[1]}" stroke-width="3"/><text x="170" y="204" text-anchor="middle" fill="#ffffff" font-size="18">CPU</text><text x="320" y="204" text-anchor="middle" fill="#ffffff" font-size="18">GPU</text><text x="470" y="204" text-anchor="middle" fill="#ffffff" font-size="18">NPU</text>${tag(130,118,'AI PC COMPUTE BLOCKS',palette.cpu[0])}${tag(140,288,'CPU · GPU · NEURAL ACCELERATOR',palette.cpu[1])}`;
        return `<rect x="165" y="70" width="310" height="240" rx="24" fill="#a9b4b8" stroke="${palette.cpu[0]}" stroke-width="5"/><rect x="196" y="101" width="248" height="178" rx="15" fill="#202e3d" stroke="#d5e7eb" stroke-width="3"/><rect x="235" y="138" width="170" height="105" rx="9" fill="#536b7d" stroke="${palette.cpu[1]}" stroke-width="3"/><path d="M178 56v-18m42 18v-18m42 18v-18m42 18v-18m42 18v-18m42 18v-18m42 18v-18m42 18v-18M178 310v18m42-18v18m42-18v18m42-18v18m42-18v18m42-18v18m42-18v18m42-18v18" stroke="#d7c18d" stroke-width="5"/>${tag(282,196,'CPU DIE','#ffffff')}${tag(210,338,'PROCESSOR PACKAGE',palette.cpu[0])}`;
      case 'storage':
        if (/ramssd|wymiana ram|ram.*ssd|ssd.*ram/.test(textOf(item))) return `<rect x="64" y="86" width="512" height="240" rx="18" fill="#142b3c" stroke="${palette.storage[0]}" stroke-width="4"/><rect x="92" y="146" width="214" height="86" rx="12" fill="#16533e" stroke="${palette.ram[0]}" stroke-width="3"/><path d="M108 232h182l-12 16H120z" fill="#c2a65d"/>${Array.from({length:5},(_,i)=>`<rect x="${112+i*34}" y="164" width="22" height="44" rx="4" fill="#15283c" stroke="${palette.ram[1]}" stroke-width="2"/>`).join('')}<rect x="340" y="162" width="208" height="66" rx="10" fill="#183c4a" stroke="${palette.storage[1]}" stroke-width="3"/><rect x="360" y="174" width="40" height="42" rx="5" fill="#102033"/><rect x="412" y="174" width="40" height="42" rx="5" fill="#102033"/><rect x="464" y="174" width="40" height="42" rx="5" fill="#102033"/>${tag(102,120,'RAM DIMM',palette.ram[0])}${tag(356,146,'NVMe M.2 SSD',palette.storage[0])}${tag(140,296,'UPGRADE / INSTALLATION',palette.storage[1])}`;
        if (/smart|health|kondycj/.test(textOf(item))) return `<rect x="76" y="76" width="488" height="250" rx="18" fill="#111f31" stroke="${palette.storage[0]}" stroke-width="4"/><text x="104" y="116" fill="#e8f6ff" font-size="20" font-weight="700">SMART HEALTH</text>${Array.from({length:5},(_,i)=>`<rect x="108" y="145" width="${250+(seed+i*29)%170}" height="20" rx="8" fill="${i===4?'#ff8b68':palette.storage[0]}" opacity=".85"/>`).join('')}${tag(105,300,'TEMPERATURE · HOURS · ERRORS',palette.storage[1])}`;
        if (/data-storage|nośniki danych|storage solutions/.test(textOf(item))) return `<rect x="70" y="92" width="500" height="228" rx="18" fill="#132c40" stroke="${palette.storage[0]}" stroke-width="4"/><rect x="104" y="137" width="132" height="128" rx="12" fill="#1d3d50" stroke="#9ecbd7" stroke-width="3"/><circle cx="170" cy="201" r="39" fill="#cad8de"/><circle cx="170" cy="201" r="11" fill="#4f677b"/><rect x="270" y="158" width="250" height="72" rx="12" fill="#174336" stroke="${palette.storage[1]}" stroke-width="3"/><rect x="294" y="173" width="48" height="42" rx="5" fill="#16283b"/><rect x="356" y="173" width="48" height="42" rx="5" fill="#16283b"/><rect x="418" y="173" width="48" height="42" rx="5" fill="#16283b"/>${tag(118,64,'HDD · SSD · NVMe',palette.storage[0])}`;
        if (/hdd|talerz|platter|mechanic/.test(textOf(item))) return `<circle cx="320" cy="190" r="130" fill="#aeb8c1" stroke="#e0c57d" stroke-width="4"/><circle cx="320" cy="190" r="93" fill="#dfe7eb"/><circle cx="320" cy="190" r="24" fill="#576c80"/><path d="M320 190L478 106l-68 110-90-20" fill="#f1ca78" stroke="#9b753d" stroke-width="5"/>${tag(90,52,'HDD / MAGNETIC PLATTER',palette.storage[0])}`;
        return `<rect x="74" y="155" width="492" height="88" rx="14" fill="#1d3847" stroke="${palette.storage[0]}" stroke-width="4"/><rect x="100" y="170" width="72" height="56" rx="7" fill="#101b2a" stroke="#91bfd2" stroke-width="2"/><rect x="190" y="170" width="94" height="56" rx="7" fill="#101b2a" stroke="#91bfd2" stroke-width="2"/><rect x="302" y="170" width="94" height="56" rx="7" fill="#101b2a" stroke="#91bfd2" stroke-width="2"/><rect x="415" y="170" width="72" height="56" rx="7" fill="#101b2a" stroke="#91bfd2" stroke-width="2"/><path d="M92 244l10 18h420l10-18" fill="#c7a867"/>${tag(90,125,'M.2 / NVMe SSD',palette.storage[0])}`;
      case 'bios':
        if (/secure.?boot|bitlocker|certyfikat/.test(textOf(item))) return `<rect x="76" y="76" width="488" height="258" rx="18" fill="#14273b" stroke="${palette.bios[0]}" stroke-width="4"/><path d="M320 112l86 32v68q0 70-86 100q-86-30-86-100v-68z" fill="#1b493c" stroke="${palette.bios[1]}" stroke-width="4"/><path d="M286 211l24 24 48-56" fill="none" stroke="#a5efbd" stroke-width="10"/><rect x="116" y="135" width="78" height="118" rx="10" fill="#26384c" stroke="#b8cbd3" stroke-width="3"/><circle cx="155" cy="175" r="14" fill="#d8c28a"/><path d="M155 189v38" stroke="#d8c28a" stroke-width="6"/>${tag(112,58,'SECURE BOOT / BITLOCKER',palette.bios[0])}${tag(430,314,'UEFI TRUST CHAIN',palette.bios[1])}`;
        if (/programat|programmer|clip|ch341|soic/.test(textOf(item))) return `<rect x="72" y="128" width="210" height="134" rx="18" fill="#1b2f42" stroke="${palette.bios[0]}" stroke-width="4"/><rect x="102" y="157" width="150" height="56" rx="8" fill="#0a1725" stroke="#9ab9c6" stroke-width="2"/><text x="177" y="192" fill="#e9faff" text-anchor="middle" font-size="16">SPI USB</text><path d="M282 195h104q45 0 45-42v-20" stroke="${palette.bios[1]}" stroke-width="8" fill="none"/><rect x="394" y="78" width="112" height="82" rx="10" fill="#182537" stroke="${palette.bios[0]}" stroke-width="4"/><path d="M410 160v36m16-36v36m16-36v36m16-36v36m16-36v36" stroke="#d8c08b" stroke-width="4"/>${tag(86,90,'CH341A / SPI PROGRAMMER',palette.bios[0])}${tag(390,245,'SOIC8 CLIP',palette.bios[1])}`;
        return `${chip(220,130,200,110,'SPI FLASH',palette.bios[0])}${traces}${tag(214,90,'BIOS / UEFI FIRMWARE',palette.bios[0])}${tag(236,296,'CS · CLK · MOSI · MISO',palette.bios[1])}`;
      case 'power':
        if (/mosfet/.test(textOf(item))) return `<rect x="64" y="82" width="512" height="242" rx="18" fill="#202a3d" stroke="${palette.power[0]}" stroke-width="4"/>${Array.from({length:4},(_,i)=>{const x=116+(i%2)*208,y=122+Math.floor(i/2)*96;return `<g transform="rotate(${(i%2?1:-1)*6} ${x+62} ${y+35})"><rect x="${x}" y="${y}" width="124" height="64" rx="8" fill="#111c2c" stroke="${palette.power[1]}" stroke-width="3"/><rect x="${x+18}" y="${y+12}" width="88" height="32" rx="4" fill="#3b4c5e"/><path d="M${x+36} ${y+64}v14m26-14v14m26-14v14" stroke="#d6bd83" stroke-width="6"/></g>`;}).join('')}${tag(112,60,'SMD MOSFET PACKAGES',palette.power[0])}${tag(158,306,'GATE · DRAIN · SOURCE',palette.power[1])}`;
        if (/gpu-vrm|gpu vrm|karta graficzna/.test(textOf(item))) return `<rect x="68" y="78" width="504" height="248" rx="18" fill="#123b34" stroke="${palette.power[0]}" stroke-width="4"/><rect x="245" y="150" width="150" height="96" rx="12" fill="#1a2d42" stroke="#b6d5df" stroke-width="4"/><text x="320" y="205" text-anchor="middle" fill="#f2fbff" font-size="18">GPU</text>${Array.from({length:6},(_,i)=>`<rect x="${100+(i%3)*146}" y="${112+Math.floor(i/3)*158}" width="48" height="42" rx="6" fill="#1b2a3f" stroke="${palette.power[1]}" stroke-width="3"/>`).join('')}${tag(90,54,'GPU VRM PHASES',palette.power[0])}`;
        return `<rect x="60" y="92" width="520" height="220" rx="18" fill="#113c35" stroke="${palette.power[0]}" stroke-width="3"/>${traces}${[120,230,340,450].map((x,i)=>`<rect x="${x}" y="150" width="58" height="60" rx="7" fill="#182638" stroke="${palette.power[1]}" stroke-width="3"/><path d="M${x+9} 154v52m12-52v52m12-52v52m12-52v52" stroke="#e3b96d" stroke-width="3"/>`).join('')}${tag(80,68,'VRM / MOSFET / INDUCTORS',palette.power[0])}${tag(84,288,'POWER STAGES',palette.power[1])}`;
      case 'cooling':
        if (/thermal|pasta/.test(textOf(item))) return `<rect x="108" y="112" width="424" height="190" rx="18" fill="#1b2e43" stroke="${palette.cooling[0]}" stroke-width="4"/><rect x="240" y="151" width="160" height="104" rx="10" fill="#344a5b" stroke="#b7cad2" stroke-width="3"/><path d="M145 95l35-32 35 32-35 32z" fill="#a5c6d3"/><path d="M180 95l120 0" stroke="${palette.cooling[1]}" stroke-width="8"/><path d="M300 95q22-18 44 0t44 0t44 0" stroke="${palette.cooling[0]}" stroke-width="10" fill="none"/>${tag(125,65,'THERMAL PASTE APPLICATION',palette.cooling[0])}${tag(242,285,'CPU / GPU CONTACT SURFACE',palette.cooling[1])}`;
        if (/heat.?pipe|heatpipe|rurka/.test(textOf(item))) return `<rect x="72" y="92" width="496" height="224" rx="18" fill="#172a3d" stroke="${palette.cooling[0]}" stroke-width="4"/><path d="M135 260V156q0-35 35-35h300q35 0 35 35v104M190 260V190q0-28 28-28h204q28 0 28 28v70" fill="none" stroke="${palette.cooling[1]}" stroke-width="13" stroke-linecap="round"/>${tag(125,68,'HEATPIPE HEAT TRANSFER',palette.cooling[0])}${tag(193,300,'VAPOR CHAMBER / FINS',palette.cooling[1])}`;
        return `<circle cx="230" cy="186" r="110" fill="#152437" stroke="${palette.cooling[0]}" stroke-width="5"/><circle cx="230" cy="186" r="24" fill="#afc7d0"/>${Array.from({length:7},(_,i)=>`<path d="M230 162 Q${130+i*28} 70 ${230+Math.cos(i)*98} 186 Q${230+Math.cos(i)*40} 202 230 162" fill="#3c7184" stroke="#9cdded" stroke-width="2"/>`).join('')}<path d="M350 124h205v28H350m0 32h180v28H350m0 32h205v28H350" fill="none" stroke="${palette.cooling[1]}" stroke-width="11" stroke-linecap="round"/>${tag(90,52,'FAN · HEATPIPE · RADIATOR',palette.cooling[0])}`;
      case 'display':
        if (/edp|lvds|taśm|cable|kabel|zawias/.test(textOf(item))) return `<rect x="78" y="88" width="484" height="224" rx="18" fill="#14283b" stroke="${palette.display[0]}" stroke-width="4"/><path d="M132 185h70q22 0 22 22v35q0 20 20 20h150q20 0 20-20v-50q0-25 25-25h65" fill="none" stroke="#e1c77d" stroke-width="12" stroke-linecap="round"/><rect x="112" y="154" width="60" height="60" rx="6" fill="#233b52" stroke="#b7d2df" stroke-width="3"/><rect x="452" y="150" width="70" height="70" rx="6" fill="#233b52" stroke="#b7d2df" stroke-width="3"/>${tag(120,65,'EDP / LVDS DISPLAY FLEX CABLE',palette.display[0])}${tag(194,296,'SIGNAL + BACKLIGHT CONNECTION',palette.display[1])}`;
        return `<rect x="104" y="54" width="432" height="250" rx="18" fill="#0b1524" stroke="${palette.display[0]}" stroke-width="6"/><rect x="122" y="72" width="396" height="210" rx="8" fill="#263d63"/><path d="M135 240l115-112 80 74 64-56 110 136H135z" fill="#5c9bba"/><path d="M90 309h462l-22 22H112z" fill="#9fb7c1"/>${tag(120,43,'LCD / eDP DISPLAY',palette.display[0])}`;
      case 'port':
        if (/hdmi|displayport/.test(textOf(item))) return `<rect x="86" y="105" width="468" height="190" rx="20" fill="#152b40" stroke="${palette.port[0]}" stroke-width="4"/><path d="M185 150h270l-25 95H210z" fill="#080f1b" stroke="#a9c7d3" stroke-width="5"/><path d="M214 171h212l-10 47H224z" fill="#24394b"/>${Array.from({length:19},(_,i)=>`<rect x="${224+i*10}" y="184" width="5" height="23" rx="1" fill="${palette.port[1]}"/>`).join('')}${tag(170,78,'HDMI / DISPLAYPORT CONNECTOR',palette.port[0])}${tag(211,280,'SIGNAL PIN ARRAY',palette.port[1])}`;
        return `<rect x="74" y="110" width="492" height="194" rx="20" fill="#15384a" stroke="${palette.port[0]}" stroke-width="4"/><rect x="194" y="146" width="250" height="112" rx="48" fill="#080f1b" stroke="#a7c8d4" stroke-width="5"/><rect x="232" y="172" width="174" height="60" rx="28" fill="#26394c"/>${Array.from({length:12},(_,i)=>`<rect x="${246+i*13}" y="185" width="6" height="32" rx="2" fill="${palette.port[1]}"/>`).join('')}${tag(150,80,'USB-C CONNECTOR',palette.port[0])}${tag(202,286,'CC1 · CC2 · VBUS · GND',palette.port[1])}`;
      case 'network':
        if (/usb4|thunderbolt|wifi7|wi-fi 7/.test(textOf(item))) return `<rect x="70" y="90" width="500" height="236" rx="18" fill="#142d42" stroke="${palette.network[0]}" stroke-width="4"/><rect x="98" y="154" width="180" height="96" rx="10" fill="#174338" stroke="${palette.network[1]}" stroke-width="3"/><path d="M120 154V104m136 50v-50" stroke="#d2e2e8" stroke-width="5"/><path d="M140 138q48-55 96 0m-76-3q28-30 56 0" stroke="${palette.network[0]}" stroke-width="5" fill="none"/><rect x="340" y="160" width="190" height="76" rx="34" fill="#091725" stroke="${palette.port[0]}" stroke-width="4"/><rect x="362" y="180" width="146" height="36" rx="16" fill="#263a4d"/>${tag(104,68,'WI-FI 7 / MLO',palette.network[0])}${tag(350,265,'USB4 / THUNDERBOLT 5',palette.port[0])}`;
        if (/ethernet|nic|lan/.test(textOf(item))) return `<rect x="86" y="120" width="468" height="154" rx="18" fill="#143d36" stroke="${palette.network[0]}" stroke-width="4"/><rect x="120" y="152" width="106" height="85" rx="8" fill="#1b2b42" stroke="#9ccbd5" stroke-width="3"/><rect x="360" y="154" width="130" height="78" rx="8" fill="#091929" stroke="${palette.network[1]}" stroke-width="3"/><path d="M386 174h78m-78 19h78m-78 19h78" stroke="#a7c5cf" stroke-width="5"/>${tag(126,92,'ETHERNET NIC / RJ45',palette.network[0])}${tag(362,260,'PCIe NETWORK CARD',palette.network[1])}`;
        if (/wi.?fi|bluetooth|wifi/.test(textOf(item))) return `<rect x="100" y="142" width="440" height="120" rx="16" fill="#174337" stroke="${palette.network[0]}" stroke-width="4"/><rect x="230" y="158" width="160" height="88" rx="8" fill="#17283c" stroke="${palette.network[1]}" stroke-width="3"/><path d="M250 158V90m120 68V90" stroke="#d1e3e8" stroke-width="5"/><path d="M270 138q40-42 80 0m-66 0q26-25 52 0" fill="none" stroke="${palette.network[0]}" stroke-width="6"/>${tag(112,112,'M.2 WIFI / BLUETOOTH MODULE',palette.network[0])}${tag(244,232,'WLAN / BT',palette.network[1])}`;
        return `<rect x="130" y="150" width="380" height="160" rx="20" fill="#142d43" stroke="${palette.network[0]}" stroke-width="4"/><path d="M190 150V65m260 85V65" stroke="#c3d6df" stroke-width="7"/><circle cx="320" cy="222" r="35" fill="#0a1828" stroke="${palette.network[1]}" stroke-width="4"/><path d="M230 120q90-88 180 0m-145 30q55-52 110 0" stroke="${palette.network[0]}" stroke-width="8" fill="none" stroke-linecap="round"/>${tag(172,335,'WIFI / ROUTER / NIC',palette.network[0])}`;
      case 'audio':
        if (/speaker|głośnik/.test(textOf(item))) return `<rect x="92" y="86" width="456" height="236" rx="20" fill="#172b3e" stroke="${palette.audio[0]}" stroke-width="4"/><circle cx="320" cy="203" r="92" fill="#0d1928" stroke="${palette.audio[1]}" stroke-width="5"/><circle cx="320" cy="203" r="56" fill="#45677e"/><circle cx="320" cy="203" r="20" fill="#b9d0da"/>${tag(158,62,'LAPTOP SPEAKER / DRIVER',palette.audio[0])}`;
        return `<rect x="85" y="105" width="470" height="210" rx="20" fill="#162a3d" stroke="${palette.audio[0]}" stroke-width="4"/><rect x="270" y="147" width="100" height="90" rx="12" fill="#111f30" stroke="${palette.audio[1]}" stroke-width="3"/><path d="M115 185h50l50-42v126l-50-42h-50z" fill="#53748b" stroke="#d1e6ef" stroke-width="3"/><path d="M395 165q85 45 0 90m20-115q130 70 0 140" stroke="${palette.audio[0]}" fill="none" stroke-width="6"/>${tag(180,76,'CODEC · DAC · SPEAKER',palette.audio[0])}`;
      case 'battery':
        if (/health|kondycj|diagnost/.test(textOf(item))) return `<rect x="80" y="92" width="480" height="236" rx="18" fill="#172b3e" stroke="${palette.battery[0]}" stroke-width="4"/><rect x="116" y="142" width="86" height="130" rx="14" fill="#243e3a" stroke="${palette.battery[1]}" stroke-width="3"/><path d="M139 128h40" stroke="#d3dce0" stroke-width="10"/><path d="M137 240l18-28 16 16 26-50" fill="none" stroke="#9be77c" stroke-width="7"/>${tag(240,142,'BATTERY HEALTH',palette.battery[0])}${tag(240,185,'CAPACITY / CYCLES',palette.battery[1])}${tag(240,228,'CELL VOLTAGE',palette.battery[0])}${tag(240,286,'WEAR LEVEL / WH',palette.battery[1])}`;
        return `<rect x="104" y="102" width="432" height="220" rx="20" fill="#23303a" stroke="${palette.battery[0]}" stroke-width="4"/><rect x="250" y="80" width="120" height="22" rx="5" fill="#d8e0e1"/>${[142,236,330,424].map(x=>`<rect x="${x}" y="140" width="72" height="144" rx="24" fill="#354b43" stroke="${palette.battery[1]}" stroke-width="3"/><path d="M${x+36} 163v98" stroke="#a8ed75" stroke-width="5"/>`).join('')}${tag(166,62,'LITHIUM-ION CELL PACK',palette.battery[0])}`;
      case 'meter':
        if (/posttest|verification|kontrola jakości/.test(textOf(item))) return `<rect x="72" y="78" width="496" height="254" rx="18" fill="#12273b" stroke="${palette.meter[0]}" stroke-width="4"/><path d="M122 143h286m-286 50h286m-286 50h286" stroke="#819dab" stroke-width="4"/><path d="M438 132l18 18 34-42m-52 92l18 18 34-42m-52 92l18 18 34-42" fill="none" stroke="#8fe9ad" stroke-width="8"/>${tag(110,56,'POST-REPAIR VERIFICATION',palette.meter[0])}${tag(114,300,'TESTS · RESULTS · SERVICE REPORT',palette.meter[1])}`;
        if (/electronics-measurement|pomiary elektroniki/.test(textOf(item))) return `<rect x="72" y="82" width="496" height="246" rx="18" fill="#12243a" stroke="${palette.meter[0]}" stroke-width="4"/><rect x="102" y="118" width="190" height="120" rx="8" fill="#061522" stroke="#80d5ee" stroke-width="3"/><path d="M114 180h24l18-34 18 64 22-44 18 18h62" fill="none" stroke="#8bf0be" stroke-width="4"/><rect x="342" y="130" width="190" height="112" rx="8" fill="#164338" stroke="${palette.meter[1]}" stroke-width="3"/><path d="M366 130l52 84m85-84l-48 84" stroke="#ff8d72" stroke-width="7"/><circle cx="418" cy="214" r="8" fill="#f9d58d"/><circle cx="456" cy="214" r="8" fill="#f9d58d"/>${tag(106,64,'ELECTRONICS BENCH MEASUREMENTS',palette.meter[0])}${tag(355,288,'SIGNAL + CIRCUIT',palette.meter[1])}`;
        if (/oscyloskop|oscilloscope|waveform/.test(textOf(item))) return `<rect x="70" y="76" width="500" height="248" rx="18" fill="#101d30" stroke="${palette.meter[0]}" stroke-width="4"/><rect x="96" y="112" width="448" height="178" rx="8" fill="#081827" stroke="#6ca7ba" stroke-width="2"/><path d="M110 205h50l22-65 25 126 28-110 28 49h40l18-45 20 90 26-80 22 35h140" fill="none" stroke="#79efbd" stroke-width="5"/>${tag(106,60,'OSCILLOSCOPE · SIGNAL TRACE',palette.meter[0])}${tag(100,310,'TIMEBASE / VOLTS PER DIV',palette.meter[1])}`;
        if (/zwarc|short|probe|sonda/.test(textOf(item))) return `<rect x="72" y="76" width="496" height="252" rx="18" fill="#121f30" stroke="${palette.meter[0]}" stroke-width="4"/><rect x="96" y="118" width="138" height="142" rx="12" fill="#d2a04a" stroke="#f7d68e" stroke-width="3"/><rect x="116" y="140" width="98" height="54" rx="6" fill="#0d1b2a"/><text x="165" y="178" text-anchor="middle" fill="#88f1bd" font-size="24">0.0 Ω</text><rect x="302" y="116" width="220" height="150" rx="12" fill="#0f4539" stroke="#65d6bb" stroke-width="3"/><path d="M326 138h172v104H326z" fill="none" stroke="#9ac3cf" stroke-width="2" stroke-dasharray="8 6"/><circle cx="370" cy="184" r="10" fill="#e4c477"/><circle cx="452" cy="212" r="10" fill="#e4c477"/><path d="M234 158l136 26m-136 34l82-6" stroke="#ff7c73" stroke-width="6"/><path d="M370 184l-10-16m10 16l-18 2m-52 26l-10-16m10 16l-18 2" stroke="#ecf4fa" stroke-width="4"/>${tag(108,94,'METER',palette.meter[0])}${tag(332,290,'SHORT CIRCUIT TRACE',palette.meter[1])}`;
        if (/multimeter-pcb|pomiary|measurement|na płycie/.test(textOf(item))) return `<rect x="76" y="84" width="488" height="236" rx="18" fill="#143b35" stroke="${palette.meter[0]}" stroke-width="4"/><rect x="208" y="142" width="224" height="122" rx="10" fill="#17283c" stroke="#b6d0da" stroke-width="3"/><path d="M105 104q55-12 90 35l20 36m320-72q-56-12-90 35l-20 36" fill="none" stroke="#ff846f" stroke-width="7"/><circle cx="215" cy="176" r="9" fill="#ffe09b"/><circle cx="425" cy="176" r="9" fill="#ffe09b"/>${tag(108,64,'MULTIMETER PROBES ON PCB',palette.meter[0])}${tag(210,292,'VOLTAGE · RESISTANCE · CONTINUITY',palette.meter[1])}`;
        if (/bench|stanowisko/.test(textOf(item))) return `<rect x="74" y="100" width="492" height="206" rx="18" fill="#1b2c3d" stroke="${palette.meter[0]}" stroke-width="4"/><path d="M92 252h455" stroke="#b9c9d0" stroke-width="8"/><rect x="152" y="144" width="128" height="88" rx="10" fill="#d0a14d" stroke="#fae0a2" stroke-width="3"/><rect x="330" y="138" width="160" height="96" rx="10" fill="#0f1d2d" stroke="${palette.meter[1]}" stroke-width="3"/><text x="410" y="195" text-anchor="middle" fill="#8df5c4" font-size="30">0.000</text>${tag(148,68,'ELECTRONICS TEST BENCH',palette.meter[0])}`;
        return `<rect x="180" y="60" width="280" height="280" rx="28" fill="#d3a34e" stroke="#f5d58a" stroke-width="4"/><rect x="216" y="92" width="208" height="98" rx="10" fill="#102334" stroke="#8ddaf1" stroke-width="3"/><text x="320" y="152" font-family="Arial" fill="#7fffc5" text-anchor="middle" font-size="36">0.000</text>${[250,320,390].map(x=>`<circle cx="${x}" cy="255" r="17" fill="#202b38" stroke="#f2d68b" stroke-width="3"/>`).join('')}${tag(225,45,'DIGITAL MULTIMETER',palette.meter[0])}`;
      case 'laptop':
        if (/exploded|warstw|budowa/.test(textOf(item))) return `<rect x="118" y="82" width="404" height="54" rx="8" fill="#a9c0cb" stroke="${palette.laptop[0]}" stroke-width="3"/><rect x="146" y="154" width="348" height="46" rx="8" fill="#23445a" stroke="#a9cfde" stroke-width="3"/><rect x="166" y="217" width="308" height="32" rx="7" fill="#183c32" stroke="${palette.laptop[1]}" stroke-width="3"/><rect x="190" y="264" width="260" height="30" rx="7" fill="#596f7e" stroke="#b8d5df" stroke-width="3"/>${tag(140,56,'LAPTOP EXPLODED LAYERS',palette.laptop[0])}`;
        if (/narzędzia|tools/.test(textOf(item))) return `<rect x="72" y="78" width="496" height="250" rx="18" fill="#1b2c3e" stroke="${palette.laptop[0]}" stroke-width="4"/>${[130,240,350,460].map((x,i)=>`<rect x="${x}" y="142" width="${i===2?26:20}" height="110" rx="9" transform="rotate(${i%2?18:-18} ${x+10} 197)" fill="#b9c8ce" stroke="${palette.laptop[1]}" stroke-width="3"/>`).join('')}${tag(132,58,'PRECISION REPAIR TOOLKIT',palette.laptop[0])}${tag(152,292,'SPUDGER · TORX · TWEEZERS',palette.laptop[1])}`;
        return `<rect x="92" y="82" width="456" height="230" rx="20" fill="#1b2d42" stroke="${palette.laptop[0]}" stroke-width="4"/><rect x="122" y="112" width="396" height="152" rx="10" fill="#315b72"/><path d="M75 310h490l-22 26H97z" fill="#9ab3c0"/>${tag(188,56,'LAPTOP CHASSIS',palette.laptop[0])}`;
      case 'safety':
        if (/esd|antystat|wrist strap/.test(textOf(item))) return `<rect x="74" y="88" width="492" height="244" rx="18" fill="#152f36" stroke="${palette.safety[0]}" stroke-width="4"/><path d="M100 260h440M140 280h360" stroke="#6a9e96" stroke-width="5"/><path d="M230 150q90-110 180 0v72q-90 80-180 0z" fill="#1f5a4d" stroke="${palette.safety[1]}" stroke-width="4"/><path d="M320 166v60m-28-30h56" stroke="#c1f3d4" stroke-width="8"/><path d="M140 130q40-42 80 0v28q-40 42-80 0z" fill="#28465a" stroke="#9ec6d0" stroke-width="4"/>${tag(108,64,'ESD GROUNDING / ANTISTATIC MAT',palette.safety[0])}${tag(192,310,'WRIST STRAP · EARTH',palette.safety[1])}`;
        if (/team|wspóln|nauka praktyczna/.test(textOf(item))) return `<rect x="72" y="94" width="496" height="226" rx="18" fill="#162d3c" stroke="${palette.safety[0]}" stroke-width="4"/><circle cx="230" cy="168" r="35" fill="#9bbecb"/><circle cx="410" cy="168" r="35" fill="#9bbecb"/><path d="M172 270q58-110 116 0m64 0q58-110 116 0" fill="#3f7581" stroke="#a8eac3" stroke-width="4"/><rect x="260" y="200" width="120" height="64" rx="8" fill="#112235" stroke="${palette.safety[1]}" stroke-width="3"/>${tag(150,65,'PRACTICAL TEAM LEARNING',palette.safety[0])}`;
        return `<rect x="90" y="100" width="460" height="210" rx="18" fill="#1f3442" stroke="${palette.safety[0]}" stroke-width="4"/><path d="M150 150h340M150 190h340M150 230h340" stroke="#8ca7b2" stroke-width="3" stroke-dasharray="10 8"/><path d="M320 112l56 20v60q0 62-56 90q-56-28-56-90v-60z" fill="#1a493d" stroke="${palette.safety[1]}" stroke-width="4"/><path d="M290 198l20 20 44-52" fill="none" stroke="#a4f0bd" stroke-width="10"/>${tag(165,72,'ESD SAFE WORKSPACE',palette.safety[0])}`;
      case 'software':
        if (/bsod|blue screen|stop code/.test(textOf(item))) return `<rect x="70" y="70" width="500" height="270" rx="18" fill="#0758a8" stroke="#79c8ff" stroke-width="5"/><text x="116" y="150" fill="#ffffff" font-size="56" font-family="Arial">:(</text><text x="120" y="206" fill="#ffffff" font-size="22" font-family="Arial">Your PC ran into a problem</text><text x="120" y="246" fill="#d8edff" font-size="15" font-family="Arial">STOP CODE · MEMORY / DRIVER / KERNEL</text>${tag(120,306,'BSOD DIAGNOSTICS',palette.software[0])}`;
        return `<rect x="66" y="68" width="510" height="270" rx="16" fill="#101b2b" stroke="${palette.software[0]}" stroke-width="4"/><rect x="66" y="68" width="510" height="40" rx="14" fill="#1d3550"/><circle cx="94" cy="88" r="6" fill="#ff837e"/><circle cx="116" cy="88" r="6" fill="#f2cc70"/><circle cx="138" cy="88" r="6" fill="#81e5a9"/><text x="98" y="158" fill="#8af3c0" font-size="17" font-family="monospace">C:\\WINDOWS&gt; sfc /scannow</text><text x="98" y="200" fill="#d9eaff" font-size="16" font-family="monospace">Verification 100% complete</text><text x="98" y="242" fill="#8af3c0" font-size="16" font-family="monospace">No integrity violations found</text>${tag(98,310,'SYSTEM / DRIVER DIAGNOSTICS',palette.software[0])}`;
      case 'board':
        if (/pcie-lanes|pcie|magistrala pci/.test(textOf(item))) return `<rect x="74" y="104" width="492" height="182" rx="18" fill="#172e42" stroke="${palette.board[0]}" stroke-width="4"/><path d="M110 160h410M110 178h410M110 196h410M110 214h410M110 232h410" stroke="#71c9df" stroke-width="5"/>${Array.from({length:16},(_,i)=>`<rect x="${126+i*24}" y="144" width="10" height="100" rx="3" fill="${i%2?palette.board[1]:palette.board[0]}" opacity=".9"/>`).join('')}${tag(116,70,'PCI EXPRESS LANES / x16 BUS',palette.board[0])}${tag(150,316,'SERIAL DATA CHANNELS',palette.board[1])}`;
        if (/electronics-work|stanowisku|electronics workbench/.test(textOf(item))) return `<rect x="68" y="244" width="504" height="62" rx="12" fill="#806341"/><rect x="112" y="122" width="178" height="108" rx="12" fill="#153c34" stroke="${palette.board[0]}" stroke-width="4"/><path d="M360 210l74-118 22 14-74 118z" fill="#c8d6db" stroke="${palette.board[1]}" stroke-width="3"/><path d="M434 92l20-26 24 16-22 24" fill="#e6c77e"/><rect x="332" y="220" width="150" height="20" rx="8" fill="#27394b" stroke="#a9c7d5" stroke-width="2"/>${tag(112,88,'ELECTRONICS WORKBENCH',palette.board[0])}${tag(350,296,'SOLDERING / REPAIR TOOLS',palette.board[1])}`;
        if (/laptop-motherboard|płyta główna laptopa/.test(textOf(item))) return `<path d="M112 92l350-18 74 212-402 22z" fill="#123d34" stroke="${palette.board[0]}" stroke-width="4"/>${traces}<rect x="250" y="142" width="112" height="78" rx="8" fill="#15283d" stroke="#b9d1da" stroke-width="3"/><rect x="142" y="152" width="70" height="44" rx="6" fill="#1d3045" stroke="${palette.board[1]}" stroke-width="3"/><rect x="394" y="152" width="90" height="58" rx="6" fill="#1d3045" stroke="${palette.board[1]}" stroke-width="3"/>${tag(135,54,'LAPTOP MAINBOARD LAYOUT',palette.board[0])}`;
        if (/microscop|inspection|inspekcj|pcb-microscope/.test(textOf(item))) return `<rect x="72" y="206" width="496" height="120" rx="16" fill="#0f3c32" stroke="${palette.board[0]}" stroke-width="4"/><rect x="128" y="242" width="384" height="48" rx="6" fill="#173046"/><path d="M322 62v44q0 38-36 38h-42q-30 0-30 32v22m108-136q0 34 34 34h16q30 0 30 30v18" fill="none" stroke="#c4d5dc" stroke-width="18" stroke-linecap="round"/><circle cx="322" cy="190" r="46" fill="#182e42" stroke="${palette.board[1]}" stroke-width="6"/><circle cx="322" cy="190" r="19" fill="#7bb2c8"/><path d="M288 290l-18 24m88-24l18 24" stroke="#d2ba7d" stroke-width="4"/>${tag(130,52,'MICROSCOPE LENS / PCB INSPECTION',palette.board[0])}`;
        if (/smd|lutow|rework|solder/.test(textOf(item))) return `<rect x="72" y="82" width="496" height="244" rx="18" fill="#103b34" stroke="${palette.board[0]}" stroke-width="4"/><rect x="215" y="145" width="220" height="100" rx="10" fill="#16283c" stroke="#b9d4dd" stroke-width="3"/><path d="M112 110l112 88m302-90L430 190" stroke="#f3c97e" stroke-width="7"/><circle cx="220" cy="200" r="10" fill="#f1d18c"/><circle cx="430" cy="190" r="10" fill="#f1d18c"/>${tag(112,64,'SMD REWORK / MICRO-SOLDERING',palette.board[0])}${tag(236,285,'PAD · TRACE · COMPONENT',palette.board[1])}`;
        if (/boardview|pcb map|płyta główna/.test(textOf(item))) return `<rect x="70" y="62" width="500" height="270" rx="18" fill="#123f35" stroke="${palette.board[0]}" stroke-width="4"/>${traces}${Array.from({length:8},(_,i)=>`<rect x="${108+(i%4)*110}" y="${105+Math.floor(i/4)*112}" width="62" height="52" rx="6" fill="#1c2c42" stroke="${palette.board[1]}" stroke-width="2"/>`).join('')}${tag(95,48,'PCB BOARDVIEW / COMPONENT MAP',palette.board[0])}`;
        return `<rect x="70" y="62" width="500" height="270" rx="18" fill="#123d34" stroke="${palette.board[0]}" stroke-width="4"/>${traces}<rect x="220" y="122" width="130" height="100" rx="10" fill="#17253a" stroke="#a4c5d0" stroke-width="3"/><rect x="390" y="112" width="92" height="62" rx="8" fill="#1a2940" stroke="${palette.board[1]}" stroke-width="3"/><rect x="110" y="235" width="112" height="42" rx="7" fill="#223047" stroke="#9bc2d4" stroke-width="3"/>${tag(95,48,'PCB / BOARDVIEW',palette.board[0])}`;
      default:
        return `<rect x="80" y="80" width="480" height="245" rx="20" fill="#182b40" stroke="${palette.laptop[0]}" stroke-width="4"/><rect x="132" y="111" width="376" height="160" rx="12" fill="#0e1e30" stroke="#9ec4d4" stroke-width="3"/><path d="M115 286h410l-22 28H137z" fill="#91a9b5"/>${tag(170,190,'LAPTOP / SYSTEM',palette.laptop[0])}`;
    }
  }

  function makeSvg(item = {}, scope = 'lesson', salt = 0) {
    const type = kind(item);
    const title = clean(item.title || item.name || item.titleEn || item.category || type.toUpperCase()) || type.toUpperCase();
    const identity = [scope, item.id, item.title, item.titleEn, item.name, item.category, item.categoryEn, item.tags, salt].filter(Boolean).join('|');
    const seed = hash32(identity);
    const uid = hash64(identity);
    const [a,b] = palette[type] || palette.laptop;
    const visual = sceneFor(type, seed, item);
    const dots = Array.from({length:10},(_,i)=>{const x=30+((seed >>> ((i%4)*5))%580),y=80+((seed >>> (((i+1)%4)*5))%230);return `<circle cx="${x}" cy="${y}" r="${2+(i%3)}" fill="${i%2?a:b}" opacity=".58"/>`;}).join('');
    // Każda plansza dostaje własny układ ścieżek/znaczników na obrzeżach. To nie jest tylko inna nazwa lub ID.
    const signature = Array.from({length:7},(_,i)=>{const h=hash32(`${identity}|signature|${i}`),x=18+(h%580),y=48+((h>>>8)%278),w=28+((h>>>16)%126),hh=16+((h>>>24)%72),r=5+(h%12);return `<g opacity=".17"><path d="M${x} ${y}h${w}v${hh}h${Math.round(w*.42)}" fill="none" stroke="${i%2?a:b}" stroke-width="${2+i%3}" stroke-linecap="round"/><circle cx="${x+w}" cy="${y+hh}" r="${r}" fill="none" stroke="${i%2?b:a}" stroke-width="2"/></g>`;}).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 380" role="img" aria-labelledby="title-${uid}" data-npa-visual-id="${uid}" data-npa-visual-kind="${type}"><title id="title-${uid}">${esc(title)}</title><desc>Unikalna ilustracja techniczna: ${esc(title)}. Kategoria: ${type.toUpperCase()}.</desc><defs><linearGradient id="bg-${uid}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#10243b"/><stop offset="1" stop-color="#050c18"/></linearGradient><pattern id="grid-${uid}" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#66c8df" stroke-opacity=".08" stroke-width="1"/></pattern></defs><rect width="640" height="380" rx="22" fill="url(#bg-${uid})"/><rect width="640" height="380" rx="22" fill="url(#grid-${uid})"/><g>${signature}</g><g opacity=".3">${dots}</g><g>${visual}</g><path d="M26 350H614" stroke="${a}" stroke-opacity=".65" stroke-width="2"/><text x="30" y="31" fill="${a}" font-family="Arial,sans-serif" font-size="12" font-weight="700" letter-spacing="2.4">NAUKA OD A DO Z · ${type.toUpperCase()}</text><text x="30" y="372" fill="#e8f6ff" font-family="Arial,sans-serif" font-size="16" font-weight="700">${esc(title.slice(0,58))}</text><text x="610" y="372" text-anchor="end" fill="${b}" font-family="Arial,sans-serif" font-size="10">${uid.slice(0,8).toUpperCase()}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function uniqueVisualUrl(item = {}, scope = 'lesson') {
    const identity = [scope, item?.id, item?.title, item?.titleEn, item?.name, item?.category, item?.categoryEn, item?.tags, item?.purpose].filter(Boolean).join('|') || `${scope}|anonymous`;
    if (assigned.has(identity)) return assigned.get(identity);
    let url = '', salt = 0;
    do { url = makeSvg(item, scope, salt++); } while (usedVisuals.has(url) && salt < 12);
    usedVisuals.add(url);
    assigned.set(identity, url);
    return url;
  }

  const GALLERY_ITEMS = [
    ['vram-gddr6','VRAM — pojedyncze kości GDDR6','vram'],['vram-bga','Kości pamięci GDDR w obudowie BGA','vram'],['gpu-card','Karta graficzna i rdzeń GPU','gpu'],
    ['ram-dimm','Moduł pamięci RAM DIMM','ram'],['ram-sodimm','Moduł pamięci RAM SO-DIMM','ram'],['cpu-package','Procesor CPU i rdzeń krzemowy','cpu'],
    ['nvme-m2','Dysk SSD NVMe M.2','storage'],['hdd-platter','Dysk HDD — talerze i głowica','storage'],['bios-spi','Pamięć BIOS SPI Flash','bios'],
    ['vrm-power','Sekcja zasilania VRM','power'],['mosfet','Tranzystory MOSFET','power'],['cooling-fan','Wentylator i radiator','cooling'],
    ['heatpipe','Heatpipe i odprowadzanie ciepła','cooling'],['lcd-panel','Matryca LCD i podświetlenie','display'],['edp-cable','Taśma sygnałowa eDP','display'],
    ['usb-c-port','Złącze USB-C','port'],['usb-pd','Kontroler USB-C Power Delivery','port'],['wifi-card','Karta Wi-Fi / Bluetooth','network'],
    ['router-board','Router i płyta urządzenia','network'],['audio-codec','Kodek audio i wyjście dźwięku','audio'],['battery-pack','Pakiet ogniw baterii laptopa','battery'],
    ['multimeter','Multimetr cyfrowy','meter'],['oscilloscope','Oscyloskop i przebieg sygnału','meter'],['esd-workbench','Stanowisko ochrony ESD','safety'],
    ['pcb-boardview','Płyta główna PCB / BoardView','board'],['smd-rework','Elementy SMD i lutowanie','board'],['windows-repair','Naprawa systemu Windows','software'],
    ['bsod-analysis','Analiza błędu BSOD','software'],['laptop-exploded','Budowa laptopa — warstwy','laptop'],['gpu-memory-bus','Magistrala pamięci GPU','vram'],
    ['ssd-smart','SMART dysku SSD','storage'],['battery-health','Diagnostyka kondycji baterii','battery'],['thermal-paste','Pasta termoprzewodząca','cooling'],
    ['hdmi-port','Złącze HDMI / DisplayPort','port'],['ethernet-nic','Karta sieciowa Ethernet','network'],['speaker-module','Moduł głośnika laptopa','audio'],
    ['spi-programmer','Programator SPI BIOS','bios'],['cpu-socket','Gniazdo procesora CPU','cpu'],['ram-channels','Kanały pamięci RAM','ram'],
    ['gpu-vrm','Sekcja VRM karty graficznej','power'],['board-short','Diagnostyka zwarcia na PCB','meter'],['pcie-lanes','Magistrala PCI Express i linie sygnałowe','board'],
    ['pcb-microscope','Mikroskopowa inspekcja PCB','board'],['electronics-work','Praca z elektroniką na stanowisku','board'],['motherboard-closeup','Zbliżenie płyty głównej','board'],
    ['multimeter-pcb','Pomiary multimetrem na PCB','meter'],['laptop-motherboard','Płyta główna laptopa','board'],['pc-hardware','Podzespoły komputera PC','gpu'],
    ['laptop-repair-tools','Narzędzia serwisowe laptopa','laptop'],['electronics-measurement','Pomiary elektroniki','meter'],['ram-modules','Moduły pamięci RAM','ram'],
    ['team-learning','Wspólna analiza usterki','diagnostics'],['data-storage','Technologie przechowywania danych','storage'],['multimeter-bench','Stanowisko pomiarowe','meter']
  ].map(([id,title,kind]) => ({id,title,name:title,kind,category:kind,url:`visual:${id}`,page:'',author:'NAUKA OD A DO Z'}));

  api.kind = kind;
  api.dataUrl = (item = {}, scope = 'lesson') => uniqueVisualUrl(item, scope);
  api.uniqueVisualUrl = uniqueVisualUrl;
  api.onlinePhotos = GALLERY_ITEMS;
  api.photoCount = 0; // FIX83 nie udaje, że autorskie ilustracje SVG są fotografiami.
  api.visualCount = GALLERY_ITEMS.length;
  api.onlineFirst = false;
  api.localFirst = true;
  api.uniquePhotoEngineVersion = VERSION;
  api.uniquePhotoEnginePolicy = {globalSingleAssignment:true,uniqueByLessonAndView:true,topicSpecificFallback:true,offlineAlwaysAvailable:true,vramDistinctFromRam:true,perceptualAuditForRaster:true};

  function isDecorative(img) {
    const text = `${img.className || ''} ${img.id || ''} ${img.getAttribute('src') || ''} ${img.alt || ''}`.toLowerCase();
    return img.hasAttribute('data-npa-visual-exempt') || /logo|favicon|pwa-icon|support-qr|sumup|flag|avatar|badge|brandmark|sprite|payment-icon/.test(text) || !!img.closest('.nav-icon,.icon-only,.brand-logo,.site-logo,.payment-methods');
  }
  function imageContext(img) {
    const card = img.closest('article,figure,section,button,.card,.lesson-card,.course-card,.repair-row,.tool-card,.method-card') || img.parentElement;
    const heading = card?.querySelector('h1,h2,h3,h4,b,strong,figcaption')?.textContent || '';
    const title = clean(img.getAttribute('data-image-title') || img.alt || img.title || heading || card?.textContent || 'Ilustracja edukacyjna');
    const label = `${img.alt || ''} ${img.title || ''} ${heading || ''} ${card?.textContent || ''}`;
    return {id:`dom-${domVisualSequence++}`,title,name:title,category:kind({title:label})};
  }
  function sourceKey(img) {
    const raw = img.currentSrc || img.getAttribute('src') || '';
    if (!raw) return '';
    try { const u = new URL(raw, location.href); u.hash = ''; u.search = ''; return u.href.toLowerCase(); }
    catch (_) { return raw.split(/[?#]/)[0].toLowerCase(); }
  }
  // FIX93: distinguish a real online photograph from an offline SVG that replaced it.
  // A previous FIX77/FIX83 audit could overwrite the image src but leave the catalog
  // credit beside it. Keep that slot intact so the catalog can restore its saved photo.
  function hasCatalogPhotoCredit(img) {
    const slot = String(img?.dataset?.photoId || '');
    const scope = img?.parentElement;
    // The real homepage DOM uses class-only credits: .photo-credit-fix90,
    // .np640-photo-credit or figcaption; data-photo-credit-for is not guaranteed.
    const nodes = scope?.querySelectorAll?.('.photo-credit-fix90, .np640-photo-credit, figcaption') || [];
    return Array.from(nodes).some(node => {
      const nodeSlot = String(node.dataset?.photoCreditFor || '');
      return !slot || !nodeSlot || nodeSlot === slot;
    });
  }
  function isOnlineCatalogPhoto(img) {
    if (!img || !img.dataset || typeof img.classList?.contains !== 'function' || !img.classList.contains('photo-fix90-online')) return false;
    const src = String(img.getAttribute?.('src') || img.currentSrc || '');
    const remoteRaster = /^https:\/\//i.test(src) && !/\.svg(?:[?#]|$)/i.test(src);
    const assigned = Boolean(img.dataset.photoFix90Assigned || img.dataset.photoFix90State === 'online-photo' || img.dataset.photoFix90Loaded === '1');
    return remoteRaster && (assigned || hasCatalogPhotoCredit(img));
  }
  function isCatalogManagedSlot(img) {
    if (!img || typeof img.classList?.contains !== 'function' || !img.classList.contains('photo-fix90-online')) return false;
    return isOnlineCatalogPhoto(img) || hasCatalogPhotoCredit(img);
  }

  function makeFallback(img, reason='brak obrazu') {
    if (!img || isDecorative(img) || isCatalogManagedSlot(img) || img.dataset.npaFix83Generated === '1') return;
    img.classList?.remove?.('photo-fix90-online');
    delete img.dataset.photoFix90Assigned;
    if (img.dataset.photoFix90State === 'online-photo') img.dataset.photoFix90State = 'fallback';
    const item = imageContext(img);
    const scope = `static-fix83:${item.id}:${reason}`;
    img.src = uniqueVisualUrl(item, scope);
    img.alt = `Unikalna ilustracja techniczna: ${item.title}`;
    img.dataset.npaFix83Generated = '1';
    img.dataset.npaVisualKind = item.category;
    img.removeAttribute('srcset');
    img.classList.add('npa-fix83-visual');
  }
  function auditDom() {
    if (typeof document === 'undefined') return {checked:0,duplicates:0,generated:0};
    const seen = new Map(); let checked = 0, duplicates = 0, generated = 0;
    const images = [...document.querySelectorAll('img')];
    images.forEach((img,index) => {
      if (isDecorative(img)) return;
      checked++;
      const src = sourceKey(img);
      if (!src) { if (img.alt || img.closest('article,figure,.lesson-card,.course-card,.repair-row,.tool-card,.method-card')) { makeFallback(img,'pusty-slot'); generated++; } return; }
      // Trust the catalog's explicit assignment marker; the catalog itself performs
      // global provider-ID, landing-page, URL and best-effort perceptual deduplication.
      // Do not compare online photo URLs against the legacy 13-file local allowlist.
      if (isOnlineCatalogPhoto(img)) {
        const onlineOwner = seen.get(src);
        if (onlineOwner && onlineOwner !== img) {
          duplicates++;
          console.warn('[FIX83/FIX93] Online photo duplicate blocked by catalog audit:', src);
          return;
        }
        seen.set(src, img);
        return;
      }
      const owner = seen.get(src);
      if (owner && owner !== img) { duplicates++; makeFallback(img,`duplikat-${index}`); generated++; return; }
      seen.set(src,img);
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) { makeFallback(img,'blad-ladowania'); generated++; }
    });
    const result = {checked,duplicates,generated,uniqueSourceCount:seen.size,passed:duplicates===0};
    window.NPA_VISUAL_AUDIT_FIX83 = result;
    const status = document.getElementById('np77PhotoAudit');
    if (status) { status.dataset.state = result.duplicates ? 'repaired' : 'passed'; status.textContent = result.duplicates ? `FIX83: wykryto i naprawiono ${result.duplicates} powtórzeń; ${result.uniqueSourceCount} różnych grafik.` : `FIX83: kontrola unikalności OK · ${result.uniqueSourceCount} różnych grafik w ${result.checked} elementach.`; }
    return result;
  }
  const scheduleAudit = () => {
    if (domAuditScheduled || typeof requestAnimationFrame !== 'function') return;
    domAuditScheduled = true;
    requestAnimationFrame(() => { domAuditScheduled = false; auditDom(); });
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('error', event => {
      const img = event.target;
      // FIX93_CATALOG_IMAGE_ERROR_OWNER: a remote photo's own onerror must try the original URL first.
      if (img && img.tagName === 'IMG' && !isCatalogManagedSlot(img)) makeFallback(img,'blad-ladowania');
    }, true);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auditDom, {once:true}); else auditDom();
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(scheduleAudit);
      observer.observe(document.documentElement, {subtree:true,childList:true,attributes:true,attributeFilter:['src','srcset']});
    }
  }

  window.NPA_UNIQUE_VISUALS_FIX83 = Object.freeze({version:VERSION,kind,makeSvg,uniqueVisualUrl,auditDom,isOnlineCatalogPhoto,isCatalogManagedSlot,get assignedCount(){return assigned.size;},galleryItems:GALLERY_ITEMS});
  console.info(`[FIX83] Włączono tematyczne ilustracje: ${GALLERY_ITEMS.length} wpisów w galerii; VRAM ≠ RAM; silnik offline.`);
})();
