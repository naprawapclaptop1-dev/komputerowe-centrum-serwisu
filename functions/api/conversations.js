import { dbRequired, getSession, json, nowIso, readJson, requireConsent, sameOrigin, text, rateLimit } from '../_lib.js';

function safeSources(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).map(item => {
    const title = text(item?.title, 180);
    const group = text(item?.group, 40);
    const id = text(item?.id, 100);
    if (group && id && ['faults','courseLessons','beginnerLessons','courseTopics','htmlArticles','manualChapters','tools','methods','components','glossary','sources','library','powerRails'].includes(group)) return { title:title || id, kind:text(item?.kind,80), group, id };
    let url = '';
    try { const parsed = new URL(text(item?.url, 500)); if (parsed.protocol === 'https:') url = parsed.href; } catch {}
    const kind = text(item?.kind, 80);
    return url ? { title: title || new URL(url).hostname, url, kind } : null;
  }).filter(Boolean);
}

export async function onRequestGet({request,env}) {
  const missing=dbRequired(env);if(missing)return missing;
  const user=await getSession(request,env);if(!requireConsent(user))return json({error:'CONSENT_REQUIRED'},401);
  const r=await env.DB.prepare(`SELECT c.id,c.title,c.created_at,c.updated_at,(SELECT COUNT(*) FROM academy_messages m WHERE m.conversation_id=c.id AND m.user_id=c.user_id) AS message_count FROM academy_conversations c WHERE c.user_id=? ORDER BY c.updated_at DESC LIMIT 40`).bind(user.id).all();
  return json({ok:true,conversations:r.results||[]});
}

// Imports only the current visitor's own local chat archive after explicit cloud-sync consent.
// Local IDs are stable, so retrying this request cannot duplicate an imported conversation.
export async function onRequestPost({request,env}) {
  const missing=dbRequired(env);if(missing)return missing;
  if(!sameOrigin(request))return json({error:'ORIGIN_REJECTED'},403);
  const user=await getSession(request,env);if(!requireConsent(user))return json({error:'CONSENT_REQUIRED'},401);
  if(!await rateLimit(env,`conversation-import:${user.id}`,20,3600))return json({error:'RATE_LIMIT'},429);
  let body;try{body=await readJson(request,350000)}catch(e){return json({error:e.message},400)}
  if(!Array.isArray(body.conversations))return json({error:'CONVERSATIONS_REQUIRED'},400);
  const items=body.conversations.slice(0,10);let imported=0,alreadyPresent=0,messagesImported=0;
  for(const item of items) {
    const localId=text(item?.id,80);
    if(!(/^(?:local-[a-zA-Z0-9-]{8,72}|[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i).test(localId))continue;
    const title=text(item?.title,120)||'Importowana rozmowa';
    const messages=Array.isArray(item?.messages)?item.messages.slice(-30):[];
    const cleaned=messages.map(m=>({
      role:m?.role==='assistant'?'assistant':m?.role==='user'?'user':'',
      content:text(m?.content,6000),
      id:text(m?.id,100),
      sources:safeSources(m?.sources)
    })).filter(m=>m.role&&m.content.length>0);
    if(!cleaned.length)continue;
    const existing=await env.DB.prepare('SELECT id,user_id FROM academy_conversations WHERE id=?').bind(localId).first();
    if(existing && existing.user_id!==user.id) continue;
    const at=nowIso();
    const statements=[];
    if(!existing) statements.push(env.DB.prepare('INSERT INTO academy_conversations(id,user_id,title,created_at,updated_at) VALUES(?,?,?,?,?)').bind(localId,user.id,title,at,at));
    else alreadyPresent++;
    let appended=0;
    for(const m of cleaned) {
      const incomingId=text(m.id,100);
      const msgId=/^[a-zA-Z0-9_-]{8,100}$/.test(incomingId)?incomingId:crypto.randomUUID();
      statements.push(env.DB.prepare('INSERT OR IGNORE INTO academy_messages(id,conversation_id,user_id,role,content,sources_json,created_at) VALUES(?,?,?,?,?,?,?)').bind(msgId,localId,user.id,m.role,m.content,JSON.stringify(m.sources),at));
      appended++;
    }
    if(existing) statements.push(env.DB.prepare('UPDATE academy_conversations SET updated_at=?,title=? WHERE id=? AND user_id=?').bind(at,title,localId,user.id));
    if(statements.length) await env.DB.batch(statements);
    if(!existing) imported++;
    messagesImported+=appended;
  }
  return json({ok:true,imported,alreadyPresent,messagesImported,message:'Lokalne rozmowy zostały przeniesione do historii konta. Akademia nie używa importowanej historii do treningu ani fine-tuningu modelu.'});
}
