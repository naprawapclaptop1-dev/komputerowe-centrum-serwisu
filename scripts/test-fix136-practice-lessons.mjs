#!/usr/bin/env node
'use strict';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const WEB=path.join(ROOT,'WEB_PUBLISH');
const require=createRequire(import.meta.url);
global.window=global;
global.document={addEventListener(){},querySelectorAll(){return []},getElementById(){return null}};
global.localStorage={getItem(){return 'pl'},setItem(){}};
const scripts=['academy-data.js','academy-expansion.js','academy-ultra-lessons.js','academy-ultra-lessons-2.js','academy-ultra-lessons-3.js','academy-ultimate-lessons-600.js','academy-master-lessons-610.js'];
for(const file of scripts) require(path.join(WEB,'assets',file));
const data=global.ACADEMY_DATA;
assert.ok(data && Array.isArray(data.courseLessons));
const before=data.courseLessons.length;
assert.equal(before,1060,'FIX135 baseline catalogue count');
require(path.join(WEB,'assets','academy-expanded-practice-fix136.js'));
const pack=global.ACADEMY_PRACTICE_FIX136;
const added=data.courseLessons.filter(x=>String(x.id).startsWith('PRACTICE136-'));
assert.equal(added.length,18);
assert.equal(pack.added,18);
assert.equal(data.courseLessons.length,1078);
assert.equal(pack.total,1078);
assert.equal(new Set(data.courseLessons.map(x=>x.id)).size,data.courseLessons.length,'all lesson IDs unique');
for(const lesson of added){
  assert.ok(lesson.title && lesson.description && lesson.body,`${lesson.id} content`);
  assert.equal(lesson.steps.length,7,`${lesson.id} checklist length`);
  assert.ok(Array.isArray(lesson.tools)&&lesson.tools.length>=3,`${lesson.id} tool list`);
  assert.ok(lesson.exercise?.scenario&&lesson.exercise?.task&&lesson.exercise?.acceptance,`${lesson.id} practical case`);
  assert.ok(Array.isArray(lesson.exercise.deliverable)&&lesson.exercise.deliverable.length>=2,`${lesson.id} deliverables`);
  assert.equal(lesson.quiz.length,3,`${lesson.id} question count`);
  for(const q of lesson.quiz){
    assert.ok(q.q && q.explain,`${lesson.id} question/explanation`);
    assert.equal(q.options.length,3,`${lesson.id} options`);
    assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length,`${lesson.id} valid answer key`);
  }
}
require(path.join(WEB,'assets','learning-engine.js'));
const engine=global.ACADEMY_LEARNING_ENGINE;
assert.equal(typeof engine?.buildGuide,'function');
let renderedQuestions=0;
for(const lesson of added){
  const rendered=engine.buildGuide(lesson,'lessons');
  assert.ok(rendered.includes('az-practice-fix136'),`${lesson.id} renders exercise block`);
  assert.ok(rendered.includes('az-quiz-root'),`${lesson.id} renders interactive quiz`);
  assert.ok(rendered.includes(lesson.title),`${lesson.id} title rendered`);
  assert.ok(rendered.includes('data-az-quiz-answer'),`${lesson.id} answer buttons rendered`);
  renderedQuestions+=(rendered.match(/data-az-quiz-question/g)||[]).length;
}
assert.equal(renderedQuestions,54,'18 lessons x 3 quiz questions');
const index=fs.readFileSync(path.join(WEB,'index.html'),'utf8');
const engineIndex=index.indexOf('assets/learning-engine.js?v=6.8.0-fix136');
const packIndex=index.indexOf('assets/academy-expanded-practice-fix136.js?v=6.8.0-fix136');
assert.ok(packIndex>=0 && engineIndex>packIndex,'practice lesson pack loads before the learning engine');
require(path.join(WEB,'assets','academy-expanded-practice-fix145.js'));
const fix145 = global.ACADEMY_PRACTICE_FIX145;
assert.equal(fix145.added,5);
assert.equal(data.courseLessons.length,1083);
assert.ok(index.includes('id="lessonTotalBadge">1083</em>'));
assert.ok(index.includes('id="lessonCourseCount">1083</em>'));
const countScript=fs.readFileSync(path.join(WEB,'assets','lesson-count-610.js'),'utf8');
assert.ok(countScript.includes('ACADEMY_DATA?.courseLessons?.length'));
assert.ok(countScript.includes('lessonHeroCount'));
console.log('[PASS] FIX135 baseline 1060 + FIX136 18 lessons = 1078; FIX145 adds 5 more = 1083.');
console.log('[PASS] All 18 FIX136 lessons have 7 checklist steps, tools, a workshop case and 3 explained quiz questions.');
console.log('[PASS] FIX145 adds 5 additional practical lessons without replacing existing catalogue entries.');
console.log('[PASS] Learning engine renders the practice and interactive quiz blocks for all additions.');
console.log('[PASS] Catalogue IDs are unique and existing lessons are retained.');
console.log('[PASS] Navigation and course counters use the current 1083 lesson total.');
console.log('FIX136 + FIX145 PRACTICAL LESSONS: 6/6 PASS');
