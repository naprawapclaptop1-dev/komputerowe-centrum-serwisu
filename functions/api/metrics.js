import { CONSENT_VERSION, dbRequired, json } from '../_lib.js';
export async function onRequestGet({env}){
  const missing=dbRequired(env);if(missing)return missing;
  const r=await env.DB.prepare(`WITH opted AS (
      SELECT id FROM academy_users WHERE consent_at IS NOT NULL AND consent_version=?
    )
    SELECT
      (SELECT COUNT(*) FROM opted) AS opted_in_users,
      (SELECT COUNT(*) FROM academy_events WHERE user_id IN (SELECT id FROM opted) AND event_type IN ('page_view','section_view')) AS tracked_views,
      (SELECT COUNT(*) FROM academy_events WHERE user_id IN (SELECT id FROM opted) AND event_type='lesson_open') AS lesson_opens,
      (SELECT COUNT(*) FROM academy_events WHERE user_id IN (SELECT id FROM opted) AND event_type='lesson_complete') AS lessons_completed,
      (SELECT COUNT(*) FROM academy_messages WHERE user_id IN (SELECT id FROM opted) AND role='user') AS questions,
      (SELECT COUNT(*) FROM academy_knowledge_submissions) AS community_submissions,
      (SELECT COUNT(*) FROM academy_knowledge_approved) AS approved_cases,
      (SELECT COUNT(*) FROM academy_users WHERE last_seen_at >= datetime('now','-30 days') AND consent_at IS NOT NULL AND consent_version=?) AS active_users_30d,
      (SELECT COUNT(*) FROM academy_conversations WHERE user_id IN (SELECT id FROM opted)) AS conversations,
      (SELECT COUNT(*) FROM academy_message_feedback WHERE user_id IN (SELECT id FROM opted)) AS chat_feedback`).bind(CONSENT_VERSION,CONSENT_VERSION).first();
  const top=await env.DB.prepare(`SELECT e.resource_id AS id,MAX(e.title) AS title,COUNT(*) AS opens
    FROM academy_events e JOIN academy_users u ON u.id=e.user_id
    WHERE e.event_type='lesson_open' AND e.resource_id IS NOT NULL
      AND u.consent_at IS NOT NULL AND u.consent_version=?
    GROUP BY e.resource_id ORDER BY opens DESC LIMIT 8`).bind(CONSENT_VERSION).all();
  return json({ok:true,trackedWithConsent:true,metrics:r||{},topLessons:top.results||[],note:'Statystyki wspólne obejmują wyłącznie użytkowników z aktualną, dobrowolną zgodą na synchronizację. Nie są licznikiem wszystkich anonimowych odsłon strony.'});
}
