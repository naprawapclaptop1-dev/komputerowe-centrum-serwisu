/* MAPA WIEDZY 6.1.0 — liczniki liczone z katalogu lekcji. */
(()=>{'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const domains=[
 ['Płyty główne i PCB','▦',/pły(t|ty)|pcb|płyta główna|board/i],
 ['Zasilanie i VRM','ϟ',/zasil|vrm|mosfet|dc-in|przetworn|power good/i],
 ['CPU i sockety','▣',/cpu|procesor|socket|lga|vcore/i],
 ['GPU i VRAM','◈',/gpu|grafik|vram|gddr|pcie/i],
 ['RAM i pamięć','▤',/ram|ddr|pamięć|spd|memory/i],
 ['BIOS, UEFI i EC','⌘',/bios|uefi|firmware|spi|ec\b|secure boot|tpm/i],
 ['USB-C i Power Delivery','⌁',/usb-c|usb c|power delivery|\bpd\b|thunderbolt/i],
 ['Lutowanie SMD / BGA','♨',/lutow|bga|reball|hot-air|hot air|smd|padów|ścieżk/i],
 ['Chłodzenie i termika','❄',/chłod|term|wentylator|thermal|radiator|throttl/i],
 ['Matryce i eDP','▱',/matryc|wyświetl|display|edp|ekran|podświetl|zawias/i],
 ['Dyski i odzysk danych','▰',/dysk|nvme|ssd|sata|smart|odzysk|raid/i],
 ['Pomiary i oscyloskop','⌁',/pomiar|oscyloskop|multimetr|zasilacz laboratoryjny|rezystancj|napięci/i],
 ['Sieć i łączność','⌁',/wifi|wi-fi|ethernet|sieć|wlan|dns|lan/i],
 ['Windows i rozruch','⊞',/windows|winre|sfc|dism|bcd|bsod|sterownik/i],
 ['Diagnostyka i POST','⌕',/diagnost|post|zwar|brak obrazu|uruchom/i],
 ['Bezpieczeństwo ESD','⬡',/esd|bezpieczeń|uziem|bateria|bhp/i],
 ['Procedury serwisowe','☑',/serwis|karta napraw|kosztorys|raport|jakość|klient/i],
 ['Kontrola końcowa i dokumentacja','✓',/kontrol|weryfik|dokument|test końc|archiwiz|raport/i]
];
let selected='';let visibleLimit=36;
function lessons(){const a=window.ACADEMY_DATA?.courseLessons;return Array.isArray(a)?a:[];}
function countFor(rx){return lessons().filter(x=>rx.test([x.title,x.category,x.tags,x.description].join(' '))).length;}
function renderDomains(){const root=$('#k610DomainGrid');if(!root)return;root.innerHTML=domains.map(([name,icon,rx])=>`<button type="button" class="k610-domain" data-k610-domain="${esc(name)}" aria-pressed="${selected===name}"><span class="k610-icon">${icon}</span><span><b>${esc(name)}</b><small>Otwórz tematy i lekcje</small></span><em>${countFor(rx)}</em></button>`).join('');}
function matches(){const q=($('#k610Search')?.value||'').trim().toLowerCase();let rows=lessons();if(selected){const d=domains.find(x=>x[0]===selected);if(d)rows=rows.filter(x=>d[2].test([x.title,x.category,x.tags,x.description].join(' ')));}if(q)rows=rows.filter(x=>[x.title,x.titleEn,x.category,x.tags,x.description,x.body].join(' ').toLowerCase().includes(q));return rows;}
function renderList(){const root=$('#k610LessonList');if(!root)return;const rows=matches();const total=rows.length;const c=$('#k610ResultCount');if(c)c.textContent=new Intl.NumberFormat('pl-PL').format(total)+' lekcji';if(!rows.length){root.innerHTML='<div class="k610-empty">Nie znaleziono materiałów. Zmień wyszukiwaną frazę lub wybierz inny dział.</div>';return;}const visible=rows.slice(0,visibleLimit);root.innerHTML=visible.map((x,i)=>`<button type="button" class="k610-lesson-row" data-k610-lesson="${esc(x.id)}"><span class="k610-lesson-num">${String(i+1).padStart(2,'0')}</span><span><b>${esc(x.title)}</b><small>${esc(x.category||'Akademia')} · ${Number(x.minutes||0)||'—'} min · ${esc(x.level||'Poziom nieokreślony')}</small></span></button>`).join('');if(total>visibleLimit){root.insertAdjacentHTML('beforeend',`<button type="button" class="k610-load-more" data-k610-more>Wczytaj kolejne ${Math.min(36,total-visibleLimit)} z ${total-visibleLimit} pozostałych lekcji ↓</button>`);}}
function init(){if(!$('#k610DomainGrid'))return;renderDomains();renderList();$('#k610Search')?.addEventListener('input',()=>{visibleLimit=36;renderList();});$('#k610Clear')?.addEventListener('click',()=>{if($('#k610Search'))$('#k610Search').value='';selected='';visibleLimit=36;renderDomains();renderList();});$('#k610DomainGrid').addEventListener('click',e=>{const b=e.target.closest('[data-k610-domain]');if(!b)return;selected=selected===b.dataset.k610Domain?'':b.dataset.k610Domain;visibleLimit=36;renderDomains();renderList();});$('#k610LessonList').addEventListener('click',e=>{const more=e.target.closest('[data-k610-more]');if(more){visibleLimit+=36;renderList();return;}const b=e.target.closest('[data-k610-lesson]');if(b)window.ACADEMY_OPEN_SOURCE?.('courseLessons',b.dataset.k610Lesson);});$('#k610BrowseAll')?.addEventListener('click',()=>{selected='';if($('#k610Search'))$('#k610Search').value='';visibleLimit=36;window.ACADEMY_SHOW_VIEW?.('courses');});window.ACADEMY_KNOWLEDGE_HUB_610={refresh:()=>{renderDomains();renderList();},domains:()=>domains.map(x=>({name:x[0],count:countFor(x[2])})),total:()=>lessons().length};}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
