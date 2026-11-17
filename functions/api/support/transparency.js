import { dbRequired, json } from '../../_lib.js';
export async function onRequestGet({env}){
  const missing=dbRequired(env);if(missing)return missing;
  const r=await env.DB.prepare(`SELECT id,period,category,amount_minor,currency,note,evidence_url,published_at FROM academy_support_costs WHERE status='published' ORDER BY period DESC,created_at DESC LIMIT 120`).all();
  const items=r.results||[];
  return json({items,totalMinor:items.reduce((sum,x)=>sum+Number(x.amount_minor||0),0),count:items.length,lastPeriod:items[0]?.period||null,currency:'PLN',verifiedOnly:true});
}
