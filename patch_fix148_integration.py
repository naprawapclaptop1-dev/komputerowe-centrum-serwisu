from pathlib import Path
import json
R=Path('/mnt/data/fix148_work')
old='nauka-6.8.0-fix147-publisher-1083-lessons-20261114'
new='nauka-6.8.0-fix148-master-technician-suite-20261114'
build='6.8.0-fix148-master-technician-suite-20261114'
# Service worker cache namespace + offline CORE assets.
sw=R/'WEB_PUBLISH/service-worker.js'; t=sw.read_text(encoding='utf-8')
assert t.count(old)==1
t=t.replace(old,new,1)
needle="  '/assets/academy-master-hub-fix145.js?v=6.8.0-fix145', '/assets/academy-master-hub-fix145.css?v=6.8.0-fix145', '/assets/academy-expanded-practice-fix145.js?v=6.8.0-fix145',"
assert t.count(needle)==1
t=t.replace(needle,needle+"\n  '/assets/academy-pro-modules-fix148.js?v=6.8.0-fix148', '/assets/academy-pro-modules-fix148.css?v=6.8.0-fix148',",1)
sw.write_text(t,encoding='utf-8')
# Release metadata: promote active hotfix, keep prior FIX147 contract as a historical record.
rp=R/'WEB_PUBLISH/release.json'; rel=json.loads(rp.read_text(encoding='utf-8'))
assert rel['latestHotfix']=='FIX147' and rel['latestHotfixBuild']=='6.8.0-fix147-publisher-1083-lessons-20261114'
rel['latestHotfix']='FIX148'; rel['latestHotfixBuild']=build
rel['serviceWorkerCacheName']=new
for path in [rel]:
    pass
# All nested current service worker cache references rotate to the new app cache. Dedicated PHOTO_CACHE_NAME remains FIX135.
def replace_cache(obj):
    if isinstance(obj,dict):
        for k,v in list(obj.items()):
            if isinstance(v,str) and v==old: obj[k]=new
            else: replace_cache(v)
    elif isinstance(obj,list):
        for v in obj: replace_cache(v)
replace_cache(rel)
rel['currentLessonCatalog']['publisherContractHotfix']='FIX148'
rel['academyProModulesFix148']={
  'hotfix':'FIX148','productVersion':'6.8.0','view':'view-academypro','newViews':0,
  'modules':['boardview-pro-demo','service-workflow-simulator','pc-compatibility-master','printable-service-documentation','local-teacher-lesson-builder','fault-database-18-reference-cases','soldering-lab-checklist'],
  'dataStorage':'localStorage only; export JSON available','d1Migrations':False,'dataMigrations':False,'productionPublished':False,
  'safety':'Educational simulation only; no direct hardware control and no model-specific pinout claims.'
}
rel['features']=list(dict.fromkeys([*rel.get('features',[]),'fix148-master-technician-suite','boardview-educational-map','service-workflow-simulator','advanced-pc-compatibility-check','printable-local-service-report','teacher-lesson-draft-builder','fault-database-reference','soldering-safety-checklist']))
rp.write_text(json.dumps(rel,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
# Publisher changes.
p=R/'ONECLICK_AKADEMIA.js'; t=p.read_text(encoding='utf-8')
t=t.replace("releaseJson.latestHotfix !== 'FIX147' || releaseJson.latestHotfixBuild !== '6.8.0-fix147-publisher-1083-lessons-20261114' || !indexHtml.includes('content=\"FIX147\"')", "releaseJson.latestHotfix !== 'FIX148' || releaseJson.latestHotfixBuild !== '6.8.0-fix148-master-technician-suite-20261114' || !indexHtml.includes('content=\"FIX148\"')",1)
t=t.replace("FIX147: release metadata, HTML and the master learning hub must identify the active hotfix.","FIX148: release metadata, HTML and the master learning hub must identify the active hotfix.",1)
t=t.replace("const expectedServiceWorkerCache = '"+old+"';","const expectedServiceWorkerCache = '"+new+"';",1)
needle="  for (const asset of ['academy-master-hub-fix145.js','academy-master-hub-fix145.css','academy-expanded-practice-fix145.js']) if (!fs.existsSync(path.join(WEB,'assets',asset))) throw new Error(`FIX145: brak wymaganego zasobu Akademii PRO: ${asset}.`);"
assert t.count(needle)==1
t=t.replace(needle,needle+"\n  for (const asset of ['academy-pro-modules-fix148.js','academy-pro-modules-fix148.css']) if (!fs.existsSync(path.join(WEB,'assets',asset))) throw new Error(`FIX148: brak nowego modułu Centrum Mistrza: ${asset}.`);\n  for (const token of ['a148AdvancedHub','a148BoardList','a148ServiceForm','a148CompatForm','a148ReportForm','a148TeacherForm','a148FaultList','a148SolderSteps']) if (!indexHtml.includes(token)) throw new Error(`FIX148: brakuje nowego modułu/identyfikatora ${token}.`);",1)
# service worker must explicitly preload the new assets
needle2="  const expectedServiceWorkerCache = '"+new+"';"
assert needle2 in t
t=t.replace(needle2,needle2+"\n  if (!sw.includes('/assets/academy-pro-modules-fix148.js?v=6.8.0-fix148') || !sw.includes('/assets/academy-pro-modules-fix148.css?v=6.8.0-fix148')) throw new Error('FIX148: nowe moduły nie są uwzględnione w pamięci offline PWA.');",1)
p.write_text(t,encoding='utf-8')
# Watcher changes and asset contracts.
p=R/'AUTO_PUBLISH_WATCHER.js'; t=p.read_text(encoding='utf-8')
t=t.replace("localRelease.latestHotfix !== 'FIX147'","localRelease.latestHotfix !== 'FIX148'",1)
t=t.replace(old,new)
# Add local required asset contract next to master workshop checks.
needle="  for (const id of ['view-masterworkshop','nwmMasterWorkshop','nwmDomainGrid','nwmTopicDetail','nwmCasePicker','nwmExamPicker','nwmCaseForm','nwmNoteForm','nwmDatasheetSearch']) if (!html.includes(`id=\"${id}\"`)) throw new Error(`Brak Warsztatu Mistrza FIX12: ${id}.`);"
assert t.count(needle)==1
t=t.replace(needle,needle+"\n  for (const asset of ['academy-pro-modules-fix148.js','academy-pro-modules-fix148.css']) if (!fs.existsSync(path.join(WEB,'assets',asset))) throw new Error(`FIX148: brak zasobu Centrum technika: ${asset}.`);\n  if (!html.includes('academy-pro-modules-fix148.js?v=6.8.0-fix148') || !html.includes('academy-pro-modules-fix148.css?v=6.8.0-fix148') || !sw.includes('academy-pro-modules-fix148.js') || !sw.includes('academy-pro-modules-fix148.css')) throw new Error('FIX148: nowe moduły nie są prawidłowo dołączone do HTML i PWA.');",1)
# remote SW validation also checks suite resources
needle3="remoteCacheName === '"+new+"' && remoteServiceWorker.includes('PHOTO_CACHE_NAME')"
assert needle3 in t
t=t.replace(needle3,"remoteCacheName === '"+new+"' && remoteServiceWorker.includes('academy-pro-modules-fix148.js') && remoteServiceWorker.includes('academy-pro-modules-fix148.css') && remoteServiceWorker.includes('PHOTO_CACHE_NAME')",1)
p.write_text(t,encoding='utf-8')
# Scripts that verify active release/cache should target FIX148; leave log history and FIX147 changelog intact.
files=['scripts/test-pages-function-residue-fix133.mjs','scripts/test-fix136-release-integration.mjs','scripts/test-publisher-photo-cache-guard-fix137.mjs','scripts/test-fix136-top-photo-priority-and-home-preservation.mjs','scripts/test-fix147-publisher-lesson-count.mjs','scripts/photo-catalog-publication-contract-fix115.cjs']
for relpath in files:
 p=R/relpath; t=p.read_text(encoding='utf-8')
 t=t.replace(old,new).replace("'FIX147'","'FIX148'").replace('FIX147 consistently','FIX148 consistently').replace('active FIX147','active FIX148').replace('FIX147 release','FIX148 release').replace('FIX147 CACHE ROTATION','FIX148 CACHE ROTATION').replace('FIX147 publisher','FIX148 publisher').replace('FIX147 jest','FIX148 jest').replace('FIX147 cache','FIX148 cache').replace('FIX147 zachowuje','FIX148 zachowuje').replace('FIX147 jest akceptowany','FIX148 jest akceptowany')
 t=t.replace('6.8.0-fix147-publisher-1083-lessons-20261114',build)
 # The publisher lesson count test still validates 1083 but its expected message and build version now refer to FIX148.
 if relpath.endswith('test-fix147-publisher-lesson-count.mjs'):
  t=t.replace('FIX147','FIX148').replace('fix147-publisher-1083-lessons','fix148-master-technician-suite')
 if relpath.endswith('photo-catalog-publication-contract-fix115.cjs'):
  t=t.replace("'FIX147'", "'FIX147', 'FIX148'") if "'FIX148'" not in t else t
 p.write_text(t,encoding='utf-8')
# The publication photo contract treats FIX148 like later releases and keeps runtime FIX136.
p=R/'scripts/photo-catalog-publication-contract-fix115.cjs'; t=p.read_text(encoding='utf-8')
t=t.replace("'FIX136', 'FIX145', 'FIX147'", "'FIX136', 'FIX145', 'FIX147', 'FIX148'")
p.write_text(t,encoding='utf-8')
# Update runner label, include FIX148 test after it is created.
p=R/'scripts/run-tests-fix137.mjs'; t=p.read_text(encoding='utf-8')
t=t.replace('FIX147 LESSON COUNT','FIX147 LESSON COUNT + FIX148 MASTER TECHNICIAN SUITE')
t=t.replace("'scripts/test-fix147-publisher-lesson-count.mjs'", "'scripts/test-fix147-publisher-lesson-count.mjs','scripts/test-fix148-master-technician-suite.mjs'")
p.write_text(t,encoding='utf-8')
print('patched release, cache and publisher contracts')
