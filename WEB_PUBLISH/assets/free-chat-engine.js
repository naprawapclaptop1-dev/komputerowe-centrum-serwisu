/* AKADEMIA SERWISU PRO 3.8.1 — bezpłatny lokalny asystent wiedzy bez płatnego API. */
(() => {
  'use strict';
  const DATA=window.ACADEMY_DATA||{};
  const stop=new Set('oraz albo ale dla do na nad pod od po przy przez jest są to ta ten tej tego tejże jak co czy gdzie kiedy który która które jeśli aby oraz że nie tak się się może można być mam ma mało dużo jego jej ich już też bez ze od tego tej tego'.split(' '));
  const aliases={
    'nie wlacza':['brak zasilania','brak reakcji','power no power','komputer nie startuje'],
    'nie laduje':['ładowanie','usb-c power delivery','adapter','dc-in'],
    'czarny ekran':['matryca','eDP','podświetlenie','display'],
    'nie widzi dysku':['nvme','ssd','hdd','uefi','storage'],
    'nie ma obrazu':['gpu','display','matryca','post'],
    'przegrzewa':['chłodzenie','wentylator','thermal throttling','radiator'],
    'nie startuje':['POST','BIOS','zasilanie','sekwencja startowa'],
    'blue screen':['BSOD','bugcheck','minidump','Windows recovery'],
    'zwarcie':['rezystancja','linia zasilania','MOSFET','pomiar']
  };
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}+.#_-]+/gu,' ').trim();
  const tokens=s=>norm(s).split(/\s+/).filter(t=>t.length>=2&&!stop.has(t));
  const flatten=v=>Array.isArray(v)?v.map(flatten).join(' '):v&&typeof v==='object'?Object.values(v).map(flatten).join(' '):String(v??'');
  const docs=[];
  const add=(group,items,fields,titleField='title')=>{
    for(const item of items||[]){
      const title=String(item?.[titleField]||item?.name||item?.term||item?.id||'Materiał Akademii');
      const parts=[];for(const k of fields)if(item?.[k]!=null)parts.push(`${k}: ${flatten(item[k])}`);
      const text=parts.join('\n').slice(0,10000);if(!text.trim())continue;
      docs.push({group,id:String(item.id||item.term||title),title,category:String(item.category||item.categoryEn||group),text,raw:item});
    }
  };
  add('faults',DATA.faults,['title','titleEn','category','symptom','symptomEn','focus','causes','checks','steps','tests','repair','verify','stop']);
  add('courseLessons',DATA.courseLessons,['title','titleEn','category','description','descriptionEn','body','bodyEn','symptoms','symptomsEn','diagnosis','diagnosisEn','repair','repairEn','verify','verifyEn','steps','stepsEn','warning','warningEn']);
  add('beginnerLessons',DATA.beginnerLessons,['title','titleEn','category','description','descriptionEn','body','bodyEn','symptoms','diagnosis','repair','verify','steps','stepsEn','warning']);
  add('courseTopics',DATA.courseTopics,['title','titleEn','category','description','descriptionEn','body','bodyEn','steps','stepsEn','diagnosis','repair','verify']);
  add('htmlArticles',DATA.htmlArticles,['title','titleEn','category','description','descriptionEn','body','bodyEn','content','contentEn']);
  add('manualChapters',DATA.manualChapters,['title','titleEn','description','body','bodyEn','content','steps']);
  add('sourceVersions',DATA.sourceVersions,['title','version','source','description','step']);
  add('library',DATA.library,['title','category','description','type','path']);
  add('tools',window.ACADEMY_TOOL_CATALOG,['name','purpose','method','devices','caution','reference'],'name');
  add('methods',window.ACADEMY_REPAIR_METHODS,['name','diagnosis','procedure','verification','tools','devices','risk'],'name');
  add('components',window.ACADEMY_COMPONENTS?.components,['name','english','ref','category','role','symptoms','diagnosis','repair','risk'],'name');
  add('glossary',window.ACADEMY_COMPONENTS?.glossary,['term','name','description','context'],'term');
  add('powerRails',(window.ACADEMY_COMPONENTS?.powerRails||[]).map(x=>({id:x[0],title:x[0],category:'Linia zasilania',description:x[1]})),['title','category','description']);
  add('sources',window.ACADEMY_ONLINE_SOURCES,['title','category','desc','tags','url'],'title');
  const expanded=q=>{
    const base=norm(q), out=[base];
    for(const [k,v] of Object.entries(aliases))if(base.includes(norm(k)))out.push(...v.map(norm));
    return [...new Set(out.join(' ').split(/\s+/).filter(Boolean))];
  };
  const corpusTokens=docs.map(d=>new Set(tokens(`${d.title} ${d.category} ${d.text}`)));
  const df=new Map();for(const set of corpusTokens)for(const t of set)df.set(t,(df.get(t)||0)+1);
  const idf=t=>Math.log(1+(docs.length-(df.get(t)||0)+.5)/((df.get(t)||0)+.5));
  function search(question,history=[]){
    let q=String(question||'').trim();const prior=(history||[]).filter(x=>x.role==='user').slice(-2).map(x=>x.content||'').join(' ');
    if(tokens(q).length<=3&&prior)q=`${prior} ${q}`;
    const ts=expanded(q).filter(t=>t.length>=2&&!stop.has(t));
    if(!ts.length)return [];
    const qNorm=norm(q);
    const scored=[];
    for(let i=0;i<docs.length;i++){
      const d=docs[i], title=norm(d.title), cat=norm(d.category), text=norm(d.text);
      let score=0, matched=0;
      for(const t of ts){
        const inTitle=title.includes(t),inCat=cat.includes(t),count=(text.match(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length;
        if(inTitle){score+=9*idf(t);matched++;}
        if(inCat)score+=3*idf(t);
        if(count){score+=(1+Math.min(count,5)*.22)*idf(t);matched++;}
      }
      if(qNorm.length>6&&title.includes(qNorm))score+=16;
      if(matched>=1)scored.push({doc:d,score,matched});
    }
    scored.sort((a,b)=>b.score-a.score||a.doc.title.localeCompare(b.doc.title));
    const unique=[], seen=new Set();
    for(const x of scored){const key=x.doc.group+':'+x.doc.id;if(seen.has(key))continue;seen.add(key);unique.push(x);if(unique.length>=6)break;}
    return unique;
  }
  const isEn=()=>{try{return localStorage.getItem('academyLanguage')==='en'}catch{return false}};
  const choose=(item,pl,en)=>{if(isEn()&&item?.[en])return flatten(item[en]);return flatten(item?.[pl]??'');};
  function makeAnswer(question,history=[]){
    const matches=search(question,history), en=isEn();
    if(!matches.length){
      return {mode:'free-local-library',answer:en?`I could not find a sufficiently close match in the built-in Academy library. Please add the exact computer/laptop model, board revision (if known), symptoms, LED/beep codes and tests already performed. Do not guess voltages or firmware values. This assistant works offline from the bundled Academy knowledge and does not query a paid AI API.`:`Nie znalazłem wystarczająco dopasowanego materiału w lokalnej bazie Akademii. Podaj dokładny model komputera/laptopa, rewizję płyty (jeśli znana), objawy, kody diod/beep oraz wyniki wykonanych testów. Nie zgaduj napięć ani firmware. Ten bezpłatny asystent korzysta z wbudowanej bazy Akademii i nie odpytuje płatnego API.`,sources:[]};
    }
    const headings=en?{intro:'Matches in the Academy library',sym:'Symptoms / context',causes:'Possible causes',checks:'Diagnostic order',repair:'Repair / verification',safety:'Safety limits',note:'Important'}:{intro:'Dopasowane materiały w bazie Akademii',sym:'Objawy i kontekst',causes:'Możliwe przyczyny',checks:'Kolejność diagnostyki',repair:'Naprawa i weryfikacja',safety:'Bezpieczeństwo',note:'Ważne'};
    const lines=[];
    lines.push(`${headings.intro}: ${matches.length}`);
    const top=matches.slice(0,4);
    top.forEach((m,i)=>{
      const d=m.doc,r=d.raw;lines.push(`\n${i+1}. ${d.title} — ${d.category}`);
      const fields=d.group==='faults' ? [['sym',choose(r,'symptom','symptomEn')],['causes',choose(r,'causes','causesEn')],['checks',choose(r,'checks','checksEn')],['repair',choose(r,'repair','repairEn')],['repair',choose(r,'verify','verifyEn')],['safety',choose(r,'stop','stopEn')]] : d.group==='tools' ? [['sym',r.purpose],['checks',r.method],['safety',r.caution]] : d.group==='components' ? [['sym',r.role],['causes',r.symptoms],['checks',r.diagnosis],['repair',r.repair],['safety',r.risk]] : [['sym',choose(r,'description','descriptionEn')||choose(r,'symptoms','symptomsEn')],['checks',choose(r,'diagnosis','diagnosisEn')||choose(r,'steps','stepsEn')],['repair',choose(r,'repair','repairEn')||choose(r,'verify','verifyEn')],['safety',choose(r,'warning','warningEn')]];
      const seen=new Set();for(const [label,value] of fields){const val=String(value||'').trim();if(!val||seen.has(val))continue;seen.add(val);const head=headings[label]||label;lines.push(`${head}: ${val.slice(0,700)}`);}
    });
    const safety=en?'Stop immediately for swelling battery, smoke, burning smell, liquid, arcing or exposed mains voltage. Never open a mains PSU, bridge fuses or short unknown pins. Resistance/continuity checks require a de-energized circuit and safe discharge.':'Przerwij natychmiast przy spuchniętej baterii, dymie, zapachu spalenizny, cieczy, iskrzeniu lub odsłoniętym napięciu sieciowym. Nie otwieraj zasilacza sieciowego, nie mostkuj bezpieczników i nie zwieraj nieznanych pinów. Rezystancję/ciągłość mierz wyłącznie w obwodzie bez zasilania i po bezpiecznym rozładowaniu.';
    lines.push(`\n${headings.safety}: ${safety}`);
    lines.push(`\n${headings.note}: ${en?'This is a free local knowledge search and structured explanation, not a generative LLM and not a confirmed diagnosis. Check the exact OEM model, PCB revision and source documentation before repair.':'To bezpłatne lokalne wyszukiwanie wiedzy i uporządkowane objaśnienie, a nie generatywny model LLM ani potwierdzona diagnoza. Przed naprawą sprawdź dokładny model OEM, rewizję PCB i dokumentację źródłową.'}`);
    return {mode:'free-local-library',answer:lines.join('\n'),sources:top.map(m=>({title:m.doc.title,kind:m.doc.group,group:m.doc.group,id:m.doc.id}))};
  }
  window.ACADEMY_FREE_CHAT={answer:(q,h=[])=>makeAnswer(q,h),search,stats:{indexed:docs.length,version:'3.8.1'}};
})();
