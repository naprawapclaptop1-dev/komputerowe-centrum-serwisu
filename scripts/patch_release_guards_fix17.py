from pathlib import Path
root=Path('/mnt/data/nauka_fix15_work')
# ONECLICK local release and guards
p=root/'ONECLICK_AKADEMIA.js'; s=p.read_text(encoding='utf-8')
s=s.replace("releaseJson.release !== '6.5.0' || !String(releaseJson.build || '').startsWith('6.5.0-')", "releaseJson.release !== '6.6.0' || !String(releaseJson.build || '').startsWith('6.6.0-')")
s=s.replace("nie zgadza się z wersją 6.5.0 FIX16.", "nie zgadza się z wersją 6.6.0 FIX17.")
s=s.replace("'master-academy-650-ultimate.js','master-academy-650-ultimate.css','pwa-icon.svg'", "'master-academy-650-ultimate.js','master-academy-650-ultimate.css','master-academy-660-center.js','master-academy-660-center.css','pwa-icon.svg'")
needle="  if (!indexHtml.includes('master-academy-650-ultimate.js?v=6.5.0-fix16') || !indexHtml.includes('master-academy-650-ultimate.css?v=6.5.0-fix16') || !fix16Runtime.includes('NPA_MASTER_ACADEMY_650') || !fix16Runtime.includes('AES-GCM') || !fix16Runtime.includes('PBKDF2') || !indexHtml.includes('data-m64-pane=\\\"measurements\\\"') || !fix16Css.includes('.n65-measure-grid')) throw new Error('Brak modułów ULTIMATE REPAIR CENTER FIX16.');"
# actual file has double quotes in check fragment
if needle not in s:
    needle="  if (!indexHtml.includes('master-academy-650-ultimate.js?v=6.5.0-fix16') || !indexHtml.includes('master-academy-650-ultimate.css?v=6.5.0-fix16') || !fix16Runtime.includes('NPA_MASTER_ACADEMY_650') || !fix16Runtime.includes('AES-GCM') || !fix16Runtime.includes('PBKDF2') || !fix16Runtime.includes('data-m64-pane=\\\"measurements\\\"') || !fix16Css.includes('.n65-measure-grid')) throw new Error('Brak modułów ULTIMATE REPAIR CENTER FIX16.');"
# do direct location after line by substring
marker="  if (!indexHtml.includes('master-academy-650-ultimate.js?v=6.5.0-fix16') || !indexHtml.includes('master-academy-650-ultimate.css?v=6.5.0-fix16') || !fix16Runtime.includes('NPA_MASTER_ACADEMY_650') || !fix16Runtime.includes('AES-GCM') || !fix16Runtime.includes('PBKDF2') || !fix16Css.includes('.n65-measure-grid')) throw new Error('Brak modułów ULTIMATE REPAIR CENTER FIX16.');"
if marker not in s:
    # actual check in file has data-m64 attr; find line starting
    lines=s.splitlines()
    idx=next(i for i,line in enumerate(lines) if "Brak modułów ULTIMATE REPAIR CENTER FIX16" in line)
    marker=lines[idx]
insert="""  const fix17Runtime = fs.readFileSync(path.join(WEB,'assets','master-academy-660-center.js'),'utf8');
  const fix17Css = fs.readFileSync(path.join(WEB,'assets','master-academy-660-center.css'),'utf8');
  if (!indexHtml.includes('master-academy-660-center.js?v=6.6.0-fix17') || !indexHtml.includes('master-academy-660-center.css?v=6.6.0-fix17') || !fix17Runtime.includes('NPA_MASTER_CENTER_660') || !fix17Runtime.includes('function analyzeSymptom') || !fix17Runtime.includes('function parseDelimited') || !fix17Runtime.includes('AES-GCM') && fix17Runtime.includes('fetch(') || !fix17Css.includes('.n66-pane')) throw new Error('Brak modułów MASTER SERVICE CENTER FIX17.');
"""
if 'const fix17Runtime' not in s:
    s=s.replace(marker, marker+'\n'+insert.rstrip())
p.write_text(s,encoding='utf-8')

# Watcher release, assets and remote verification
p=root/'AUTO_PUBLISH_WATCHER.js'; s=p.read_text(encoding='utf-8')
s=s.replace("const RELEASE = '6.5.0';", "const RELEASE = '6.6.0';")
# add local required assets to the local release guard array
s=s.replace("'master-academy-650-ultimate.js','master-academy-650-ultimate.css','pwa-icon.svg'", "'master-academy-650-ultimate.js','master-academy-650-ultimate.css','master-academy-660-center.js','master-academy-660-center.css','pwa-icon.svg'")
# remote URLs
s=s.replace("      const fix16CssUrl = `${STABLE_URL}/assets/master-academy-650-ultimate.css?v=6.5.0-fix16&verify=${Date.now()}`;", "      const fix16CssUrl = `${STABLE_URL}/assets/master-academy-650-ultimate.css?v=6.5.0-fix16&verify=${Date.now()}`;\n      const fix17AssetUrl = `${STABLE_URL}/assets/master-academy-660-center.js?v=6.6.0-fix17&verify=${Date.now()}`;\n      const fix17CssUrl = `${STABLE_URL}/assets/master-academy-660-center.css?v=6.6.0-fix17&verify=${Date.now()}`;")
s=s.replace("fix16AssetResponse, fix16CssResponse, supportVideoCheck] = await Promise.all([", "fix16AssetResponse, fix16CssResponse, fix17AssetResponse, fix17CssResponse, supportVideoCheck] = await Promise.all([")
s=s.replace("        fetch(fix16CssUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),\n        checkPublicMediaAsset(supportVideoUrl)", "        fetch(fix16CssUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),\n        fetch(fix17AssetUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),\n        fetch(fix17CssUrl,{cache:'no-store',headers:{'cache-control':'no-cache, no-store',pragma:'no-cache'}}),\n        checkPublicMediaAsset(supportVideoUrl)")
s=s.replace("      const remoteFix16Css = await fix16CssResponse.text();", "      const remoteFix16Css = await fix16CssResponse.text();\n      const remoteFix17Asset = await fix17AssetResponse.text();\n      const remoteFix17Css = await fix17CssResponse.text();")
s=s.replace("      const remoteFix16CssValid = fix16CssResponse.ok && remoteFix16Css.includes('.n65-measure-grid') && remoteFix16Css.includes('.n65-board-stage');", "      const remoteFix16CssValid = fix16CssResponse.ok && remoteFix16Css.includes('.n65-measure-grid') && remoteFix16Css.includes('.n65-board-stage');\n      const remoteFix17Valid = fix17AssetResponse.ok && remoteFix17Asset.includes('NPA_MASTER_CENTER_660') && remoteFix17Asset.includes('function analyzeSymptom') && remoteFix17Asset.includes('function parseDelimited') && remoteFix17Asset.includes('NPA-MASTER-CENTER-FIX17') && ['sequence','netlist','instruments','brain','audit','orders','practical','privacy'].every(tab=>remoteFix17Asset.includes(`data-m64-pane=\\\"${tab}\\\"`));\n      const remoteFix17CssValid = fix17CssResponse.ok && remoteFix17Css.includes('.n66-pane') && remoteFix17Css.includes('.n66-stage') && remoteFix17Css.includes('.n66-wave-chart');")
s=s.replace("        ultimateRepairCenterFix16: html.includes('master-academy-650-ultimate.js?v=6.5.0-fix16') && html.includes('master-academy-650-ultimate.css?v=6.5.0-fix16') && ['codes','measurements','boardview','hardware','cases','trainer','academies','security'].every(tab=>remoteFix16Valid && remoteFix16Asset.includes(`data-m64-pane=\\\"${tab}\\\"`)) && remoteFix16Valid && remoteFix16CssValid,", "        ultimateRepairCenterFix16: html.includes('master-academy-650-ultimate.js?v=6.5.0-fix16') && html.includes('master-academy-650-ultimate.css?v=6.5.0-fix16') && ['codes','measurements','boardview','hardware','cases','trainer','academies','security'].every(tab=>remoteFix16Valid && remoteFix16Asset.includes(`data-m64-pane=\\\"${tab}\\\"`)) && remoteFix16Valid && remoteFix16CssValid,\n        masterServiceCenterFix17: html.includes('master-academy-660-center.js?v=6.6.0-fix17') && html.includes('master-academy-660-center.css?v=6.6.0-fix17') && remoteFix17Valid && remoteFix17CssValid,")
s=s.replace("&& html.includes('master-academy-650-ultimate.js?v=6.5.0-fix16') && html.includes('master-academy-650-ultimate.css?v=6.5.0-fix16');", "&& html.includes('master-academy-650-ultimate.js?v=6.5.0-fix16') && html.includes('master-academy-650-ultimate.css?v=6.5.0-fix16') && html.includes('master-academy-660-center.js?v=6.6.0-fix17') && html.includes('master-academy-660-center.css?v=6.6.0-fix17');")
s=s.replace('Ultimate Repair Center FIX16 i przebudowanym filmem wsparcia FIX9', 'Ultimate Repair Center FIX16, Master Service Center FIX17 i przebudowanym filmem wsparcia FIX9')
p.write_text(s,encoding='utf-8')
