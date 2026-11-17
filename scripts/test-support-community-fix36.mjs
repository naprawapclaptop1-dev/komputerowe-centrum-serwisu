import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const html = read('WEB_PUBLISH/index.html');
const js = read('WEB_PUBLISH/assets/support-community-fix36.js');
const css = read('WEB_PUBLISH/assets/support-community-fix36.css');
const sw = read('WEB_PUBLISH/service-worker.js');
const release = JSON.parse(read('WEB_PUBLISH/release.json'));
const publisher = read('ONECLICK_AKADEMIA.js');
const watcher = read('AUTO_PUBLISH_WATCHER.js');
const build = '6.8.0-fix51-visual-academy-pro-20261105';
assert.equal(release.build, build);
assert.ok(html.includes(`content="${build}"`));
assert.ok(read('functions/api/auth/status.js').includes(build));
assert.ok(publisher.includes('release.json') && publisher.includes('expectedBuild'), 'publisher must bind build from release.json');
assert.ok(watcher.includes('const EXPECTED_BUILD') && watcher.includes("release.json"), 'watcher must bind build from release.json');
assert.ok(sw.includes(build) && sw.includes('support-community-fix36.css') && sw.includes('support-community-fix36.js'));
assert.ok(sw.includes('fix39-support-community-guard-20261104'));

const require = createRequire(import.meta.url);
const { verifySupportViewStructure } = require('./support-view-guard-fix35.js');
const structure = verifySupportViewStructure(html);
assert.equal(structure.viewCount, 35);
assert.equal(structure.supportNodes, 16);
const supportStart = html.indexOf('id="view-support"');
const supportEnd = html.indexOf('id="view-legal"', supportStart);
assert.ok(supportStart > 0 && supportEnd > supportStart);
const support = html.slice(supportStart, supportEnd);
for (const id of [
  'supportReleaseJournal','supportCommunityCenter','supportProposalForm','supportProposalList',
  'supportCaseCenter','supportCaseForm','supportMyCases','supportTransparencyCenter','supportCostsList',
  'supportThanksCenter','supportThanksForm','supportFollowCenter','supportUpdatesSubscribe',
  'supportAnnouncementsList','supportAnnouncementUnread','supportMarkAnnouncementsRead','supportDataRefresh'
]) assert.ok(support.includes(`id="${id}"`), `support view misses ${id}`);
assert.ok(html.includes('id="supportAdminCenter"') && html.includes('id="view-admin"'));
assert.ok(html.includes('Otwórz kolejkę przypadków serwisowych'));
assert.ok(support.includes('78640187') && support.includes('https://pay.sumup.com/b2c/QON3J042'));
assert.ok(support.includes('akademia-dlaczego-warto-wspierac.mp4') && support.includes('akademia-dlaczego-warto-wspierac.vtt'));
assert.ok(support.includes('nie wysyłamy e-maili ani powiadomień push'));
assert.ok(support.includes('Brak kwot nie oznacza zerowych kosztów'));

const migration = read('migrations/0016_support_community_center.sql');
for (const table of ['academy_support_proposals','academy_support_proposal_votes','academy_support_thanks','academy_support_subscriptions','academy_support_costs','academy_support_announcements']) {
  assert.ok(migration.includes(`CREATE TABLE IF NOT EXISTS ${table}`), `migration misses ${table}`);
}
for (const contract of ['UNIQUE(proposal_id,user_id)','show_public INTEGER NOT NULL DEFAULT 0','last_seen_at TEXT','amount_minor INTEGER NOT NULL CHECK(amount_minor > 0)',"currency TEXT NOT NULL DEFAULT 'PLN' CHECK(currency='PLN')"]) assert.ok(migration.includes(contract), `migration misses constraint ${contract}`);
assert.doesNotMatch(migration, /DROP\s+TABLE|DELETE\s+FROM|ALTER\s+TABLE\s+academy_users/i);

const proposals = read('functions/api/support/proposals.js');
assert.ok(proposals.includes("p.status='approved'") && proposals.includes("proposal.status!=='approved'"));
assert.ok(proposals.includes('getSession') && proposals.includes('rateLimit') && proposals.includes('sameOrigin'));
assert.ok(proposals.includes("action==='vote'||action==='unvote'") && proposals.includes('UNIQUE(proposal_id,user_id)') === false);
const thanks = read('functions/api/support/thanks.js');
assert.ok(thanks.includes('show_public=1') && thanks.includes('PUBLIC_CONSENT_REQUIRED'));
assert.ok(thanks.includes("if(b.showPublic!==true)") && thanks.includes("DELETE FROM academy_support_thanks WHERE user_id=?"));
assert.ok(thanks.includes('getSession') && thanks.includes('sameOrigin') && thanks.includes('rateLimit'));
const updates = read('functions/api/support/updates.js');
assert.ok(updates.includes("status='published'") && updates.includes('last_seen_at') && updates.includes("b.action==='mark-read'"));
assert.ok(updates.includes('sameOrigin') && updates.includes('getSession') && updates.includes('rateLimit'));
const transparency = read('functions/api/support/transparency.js');
assert.ok(transparency.includes("WHERE status='published'") && transparency.includes('totalMinor') && transparency.includes('verifiedOnly:true'));
const admin = read('functions/api/admin/support.js');
assert.ok(admin.includes('checkAdmin') && admin.includes('sameOrigin'));
assert.ok(admin.includes("action==='publish-cost'") && admin.includes("action==='publish-announcement'"));
assert.ok(admin.includes('EVIDENCE_REQUIRED') && admin.includes("u.protocol==='https:'"));
assert.ok(admin.includes("action==='review-proposal'") && admin.includes('academy_audit_log'));
const knowledge = read('functions/api/knowledge.js');
assert.ok(knowledge.includes("url.searchParams.get('mine')==='1'") && knowledge.includes('WHERE user_id=?'));
assert.ok(knowledge.includes("status:'pending'") && knowledge.includes('rightsConfirmed'));

for (const token of ['/support/proposals','/support/thanks','/support/updates','/support/transparency','/admin/support','/knowledge?mine=1','markAnnouncementsRead','supportMarkAnnouncementsRead','supportDataRefresh','data-support-publish-cost','data-support-publish-announcement']) assert.ok(js.includes(token), `client script misses ${token}`);
for (const token of ['credentials:\'same-origin\'','new FormData(form)','escape']) assert.ok(js.includes(token), `client safety/interaction contract misses ${token}`);
const supportEnhancements = read('WEB_PUBLISH/assets/support-enhancements-fix35.js');
assert.ok(supportEnhancements.includes('navigator.clipboard') && html.includes('assets/support-enhancements-fix35.js'), 'legacy share/copy support must remain connected');
for (const selector of ['.support-release-timeline','.support-proposal-card','.support-case-layout','.support-cost-row','.support-thanks-card','.support-announcement-card','.support-admin-forms','.support-unread-bar','.support-announcement-card.is-unread','.support-jump-nav #supportDataRefresh']) assert.ok(css.includes(selector), `missing style ${selector}`);

for (const apiFile of [
  'functions/api/support/proposals.js','functions/api/support/thanks.js','functions/api/support/updates.js',
  'functions/api/support/transparency.js','functions/api/admin/support.js'
]) assert.ok(fs.existsSync(path.join(root, apiFile)), `missing route ${apiFile}`);
assert.ok(publisher.includes('0016_support_community_center.sql') && publisher.includes('supportMarkAnnouncementsRead') && publisher.includes('.support-jump-nav #supportDataRefresh'));
assert.ok(watcher.includes('.support-jump-nav #supportDataRefresh') && watcher.includes('refreshSupportData'));
assert.ok(watcher.includes('remoteSupportApiValid') && watcher.includes('remoteSupportPwaValid') && watcher.includes('supportApiHttp'));
assert.ok(release.fix36_support_community_center?.production_published === false);
assert.ok(release.fix36_support_community_center?.d1_migrations_executed === false);
console.log('PASS FIX36: 6 additive D1 tables; proposals/voting; moderated service cases; opt-in thanks/revocation; evidence-backed cost ledger; in-app unread announcements; admin publish workflow; 35 separate views (33 legacy + Global Academy PRO + FIX145 Centrum Mistrza PRO) and legacy support retained.');
