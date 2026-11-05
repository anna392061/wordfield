/* Wordfield v1.3 — Bahasa V3.7-aligned repetition and next-day review. */
(() => {
'use strict';
const KEY='wordfield-v1-snapshot';
const $=q=>document.querySelector(q);
const id=()=>globalThis.crypto?.randomUUID?.()||`id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attrs=x=>esc(x);
const nDate=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const atEnd=(v)=>new Date(v).toLocaleDateString('zh-CN',{month:'short',day:'numeric'});
const fmtDate=(v)=>new Date(v).toLocaleDateString('zh-CN',{year:'numeric',month:'short',day:'numeric'});
const now=()=>Date.now();
const stateFactory=()=>({version:2,books:[{id:'book-ai-industry',title:'AI Industry English',description:'AI 专业词汇 + 行业常用英语表达',createdAt:new Date().toISOString(),icon:'✦'}],entries:(window.WORDFIELD_SEED||[]).map((e,i)=>({...e,id:`ai-${String(i+1).padStart(4,'0')}`,bookId:'book-ai-industry',createdAt:new Date().toISOString(),introducedAt:null,recognition:null,production:null})),settings:{activeBook:'book-ai-industry',dailyNew:10,reviewAll:true},activity:[],studySessions:{}});
let data=null,db=null,storageKind='浏览器本地存储',page='learn',libraryBookId=null,filterText='',filterCategory='',studyMode='recognition',studySession=null,answerVisible=false,modal=null,pendingImport=null,toastTimer=null,typedDraft='',writeQueue=Promise.resolve(),voiceLastKey='';
function openDb(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window)){reject(new Error('IndexedDB unavailable'));return;}const req=indexedDB.open('wordfield-database',1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('kv'))req.result.createObjectStore('kv');};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function dbGet(){return new Promise((resolve,reject)=>{const tx=db.transaction('kv','readonly');const rq=tx.objectStore('kv').get('snapshot');rq.onsuccess=()=>resolve(rq.result);rq.onerror=()=>reject(rq.error);});}
function dbPut(snapshot){return new Promise((resolve,reject)=>{const tx=db.transaction('kv','readwrite');tx.objectStore('kv').put(snapshot,'snapshot');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
function save(){const snapshot=JSON.stringify(data);writeQueue=writeQueue.then(async()=>{if(db){await dbPut(snapshot);}else if(storageKind!=='临时会话（请导出备份）'){localStorage.setItem(KEY,snapshot);}}).catch(err=>{console.error('Save error:',err);toast('保存失败：请立刻导出备份，并检查浏览器空间。');});return writeQueue;}
async function init(){let raw=null;try{db=await openDb();raw=await dbGet();storageKind='IndexedDB 本地存储';}catch(err){console.warn('IndexedDB unavailable; fallback to localStorage',err);db=null;storageKind='LocalStorage 本地存储';try{raw=localStorage.getItem(KEY);}catch(_){storageKind='临时会话（请导出备份）';}}try{data=raw?(typeof raw==='string'?JSON.parse(raw):raw):stateFactory();if(!isValidData(data))throw Error('Malformed data');}catch(err){console.warn('Invalid saved data:',err);data=stateFactory();toast('检测到无法读取的存档。已加载初始词书，请检查历史备份。');}data.studySessions=data.studySessions||{};const scheduleWasMigrated=migrateFirstDaySchedules();data.settings={activeBook:data.books[0]?.id||null,dailyNew:10,reviewAll:false,...data.settings};const goalsMigrated=upgradeBookSettings(),sessionsMigrated=migrateStudySessionKeys(),personalAdded=syncPersonalBook();if(!data.books.some(b=>b.id===data.settings.activeBook))data.settings.activeBook=data.books[0]?.id||null;data.settings.dailyNew=bookGoal(data.settings.activeBook);data.settings.reviewAll=false;libraryBookId=data.settings.activeBook;const versionBefore=Number(data.version)||0;data.version=3;if(!raw||scheduleWasMigrated||goalsMigrated||sessionsMigrated||personalAdded||versionBefore<3)save();$('#top-date').textContent=new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'long'}).format(new Date());render();openWordfieldImportLink();}
function isValidData(d){return d&&Array.isArray(d.books)&&Array.isArray(d.entries)&&d.settings&&Array.isArray(d.activity)&&d.books.every(b=>typeof b.id==='string'&&typeof b.title==='string')&&d.entries.every(e=>typeof e.id==='string'&&typeof e.term==='string'&&typeof e.bookId==='string');}
function toast(message){const el=$('#toast');if(!el)return;el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3600);}
const bookById=bid=>data.books.find(b=>b.id===bid);
const wordsOf=bid=>data.entries.filter(e=>e.bookId===bid);
const norm=x=>String(x??'').trim().toLocaleLowerCase().replace(/\s+/g,' ');
const sessionKey=(mode,bid)=>mode+'::'+bid;
function bookGoal(bid){const n=Number(bookById(bid)?.dailyNew);return [5,10,15,20,25].includes(n)?n:10;}
function upgradeBookSettings(){let changed=false;for(const b of data.books){if(![5,10,15,20,25].includes(Number(b.dailyNew))){b.dailyNew=[5,10,15,20,25].includes(Number(data.settings.dailyNew))?Number(data.settings.dailyNew):10;changed=true;}}return changed;}
function migrateStudySessionKeys(){let changed=false;for(const mode of ['recognition','production']){const old=data.studySessions[mode];if(old?.bookId){const k=sessionKey(mode,old.bookId);if(!data.studySessions[k])data.studySessions[k]=old;delete data.studySessions[mode];changed=true;}}return changed;}
function syncPersonalBook(){
 const source=window.WORDFIELD_PERSONAL;
 if(!Array.isArray(source)||source.length!==39)return false;
 const title='Personal Expressions · 口语积累',fixedId='book-personal-expressions-2026-11-05';
 let b=data.books.find(x=>x.id===fixedId)||data.books.find(x=>norm(x.title)===norm(title));
 let changed=false;
 if(!b){b={id:fixedId,title,description:'精选口语词汇、固定搭配与可迁移句型 · 39 张',icon:'✦',createdAt:new Date().toISOString(),dailyNew:10};data.books.push(b);changed=true;}
 if(![5,10,15,20,25].includes(Number(b.dailyNew))){b.dailyNew=10;changed=true;}
 const existingIds=new Set(data.entries.map(e=>e.id)),existingTerms=new Set(wordsOf(b.id).map(e=>norm(e.term)));
 for(let i=0;i<source.length;i++){
  const raw=source[i],sid='personal-expression-'+String(i+1).padStart(3,'0'),key=norm(raw.term);
  if(existingIds.has(sid)||existingTerms.has(key))continue;
  const entry=createWord(raw,b.id);entry.id=sid;data.entries.push(entry);
  existingIds.add(sid);existingTerms.add(key);changed=true;
 }
 return changed;
}

function learned(e){return Boolean(e.introducedAt||e.recognition?.reviews>0);}
function mastered(e,mode='recognition'){const s=e[mode];return !!(s&&s.reviews>=3&&s.interval>=21&&s.lastRating>=2);}
function due(e,mode){const s=e[mode];if(mode==='production'&&!canPracticeProduction(e))return false;if(s?.learningPending)return true;if(!s||!s.reviews)return mode==='production'?!!e.recognition?.reviews:!!e.introducedAt;return !s.due||localDay(s.due)<=nDate();}
const bookStats=bid=>{const a=wordsOf(bid);return{total:a.length,learned:a.filter(learned).length,mastered:a.filter(e=>mastered(e)).length,produced:a.filter(e=>e.production?.reviews>0).length};};
const pct=(a,b)=>b?Math.round(100*a/b):0;
function countNewToday(bid=data.settings.activeBook){return wordsOf(bid).filter(e=>e.introducedAt===nDate()).length;}
function dueRecCount(bid=data.settings.activeBook){return wordsOf(bid).filter(e=>learned(e)&&due(e,'recognition')).length;}
function dueProdCount(bid=data.settings.activeBook){return wordsOf(bid).filter(e=>due(e,'production')).length;}
function noteHtml(){return `本地存储：${esc(storageKind)} · 学习记录只保存在当前浏览器。请定期在「Progress」中导出完整备份；无账号同步功能。`;}
function nav(){document.querySelectorAll('[data-nav]').forEach(e=>e.classList.toggle('active',e.dataset.nav===page));}
function render(){nav();$('#storage-note').textContent=noteHtml();if(page==='learn')renderLearn();else if(page==='books')renderBooks();else renderProgress();if(modal)renderModal();}
function bookSelectHtml(vid){return `<select class="select selector" id="${esc(vid)}" aria-label="当前学习的单词书">${data.books.map(b=>`<option value="${attrs(b.id)}" ${b.id===data.settings.activeBook?'selected':''}>${esc(b.title)}</option>`).join('')}</select>`;}
function progressHtml(v){return `<div class="progress-bar"><div class="progress-inner" style="width:${Math.max(0,Math.min(100,v))}%"></div></div>`;}
/* Mirror Bahasa V3.7 scheduling: FSRS-5/90%, new cards return the next day,
   old cards update their long-term state only on the first recall of the day. */
const DAY_MS=86400000;
const FSRS_W=[0.40255,1.18385,3.173,15.69105,7.1949,0.5345,1.4604,0.0046,1.54575,0.1192,1.01925,1.9395,0.11,0.29605,2.2698,0.2315,2.9898,0.51655,0.6621];
const MAX_ATTEMPTS=12,MAX_MISSES=7,DESIRED_RETENTION=.90;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function addDays(day,increment){const [y,m,d]=day.split('-').map(Number),x=new Date(y,m-1,d,12);x.setDate(x.getDate()+increment);return nDate(x);}
function localDay(value){if(!value)return '';if(/^\d{4}-\d{2}-\d{2}$/.test(value))return value;const d=new Date(value);return Number.isNaN(d.getTime())?'':nDate(d);}
function dayDue(day){return new Date(day+'T12:00:00').toISOString();}
function elapsedDays(a,b){const first=new Date(a+'T12:00:00'),last=new Date(b+'T12:00:00');return Math.max(0,Math.round((last-first)/DAY_MS));}
/* Preserve the old review log and books. Migrate only first-time cards that V1.2
   mistakenly scheduled several days past their mandatory next-day review. */
function migrateFirstDaySchedules(){
 let changed=false;
 for(const e of (data?.entries||[]))for(const mode of ['recognition','production']){
  const s=e[mode];if(!s||s.reviews!==1||!s.due||!s.lastReviewed||s.learningPending)continue;
  const start=localDay(s.lastReviewed),next=addDays(start,1);
  const initiallyLearned=mode==='recognition'?e.introducedAt===start:!!s.history?.[0]&&localDay(s.history[0].at)===start;
  if(!initiallyLearned||localDay(s.due)<=next)continue;
  s.originalFirstDue=s.originalFirstDue||s.due;
  s.originalFirstInterval=s.originalFirstInterval||s.interval;
  s.interval=1;s.due=dayDue(next);
  if(Array.isArray(s.history)&&s.history.length===1){s.history[0].originalDue=s.history[0].originalDue||s.history[0].due;s.history[0].due=s.due;}
  changed=true;
 }
 return changed;
}
function fsrsUpdate(prev,remembered){
 const w=FSRS_W,g=remembered?3:1,rating=remembered?2:0;
 const reps=Number(prev?.reviews)||0;
 let d,stability;
 if(!reps){d=clamp(w[4]-Math.exp(w[5]*(g-1))+1,1,10);stability=w[g-1];}
 else{
  const old=prev.fsrs||{difficulty:5,stability:Math.max(.25,Number(prev.interval)||1)};
  const S=clamp(Number(old.stability)||1,.01,36500),D=clamp(Number(old.difficulty)||5,1,10);
  const elapsed=elapsedDays(localDay(prev.lastReviewed)||nDate(),nDate());
  const R=Math.pow(1+19*elapsed/(81*S),-.5);
  const newD=clamp(w[7]*(w[4]-Math.exp(w[5]*3)+1)+(1-w[7])*(D-w[6]*(g-3)*(10-D)/9),1,10);
  if(elapsed===0)stability=S*Math.exp(w[17]*(g-3+w[18]));
  else if(g===1)stability=Math.min(w[11]*Math.pow(D,-w[12])*(Math.pow(S+1,w[13])-1)*Math.exp(w[14]*(1-R)),S);
  else stability=S*(1+Math.exp(w[8])*(11-D)*Math.pow(S,-w[9])*(Math.exp(w[10]*(1-R))-1));
  d=newD;
 }
 stability=clamp(Number.isFinite(stability)?stability:1,.01,36500);
 const interval=g===1?1:clamp(Math.round((81/19)*stability*(Math.pow(DESIRED_RETENTION,-2)-1)),1,36500);
 return {difficulty:d,stability,interval,rating};
}
function longTermReview(e,mode,remembered,newGraduation=false){
 const previous=e[mode]||{interval:0,ease:2.5,reviews:0,history:[]};
 const next=fsrsUpdate(previous,remembered),stamp=new Date().toISOString();
 // Bahasa V3.7 guarantees the FIRST review after a newly learned word is tomorrow.
 const interval=newGraduation?1:next.interval;
 const nextDue=dayDue(addDays(nDate(),interval));
 e[mode]={...previous,fsrs:{difficulty:next.difficulty,stability:next.stability},interval,
  reviews:(previous.reviews||0)+1,due:nextDue,lastReviewed:stamp,lastRating:next.rating,
  learningPending:false,history:[...(previous.history||[]),{at:stamp,rating:next.rating,due:nextDue,algorithm:'FSRS-5 · Bahasa V3.7'}]};
}
function activeSession(mode=studyMode){const key=sessionKey(mode,data.settings.activeBook),ss=data.studySessions?.[key];if(!ss)return null;if(ss.day!==nDate()){delete data.studySessions[key];save();return null;}return ss;}
function buildQueue(mode){
 const active=data.settings.activeBook,pool=wordsOf(active);
 if(mode==='recognition'){
  const old=pool.filter(e=>learned(e)&&due(e,'recognition')).sort((a,b)=>new Date(a.recognition?.due||0)-new Date(b.recognition?.due||0));
  const newWords=wordsOf(active).filter(e=>!learned(e)).sort((a,b)=>(a.priority||2)-(b.priority||2)).slice(0,Math.max(0,bookGoal(data.settings.activeBook)-countNewToday(data.settings.activeBook)));
  return [...old,...newWords].map((e,i)=>({id:e.id,mode,isNew:!learned(e),needed:(!e.recognition?.reviews)?2:1,streak:0,attempts:0,firstResult:null,hadFailure:false,scored:false,completed:false,nextAt:0,afterTurn:0,seq:i}));
 }
 return pool.filter(e=>due(e,'production')&&canPracticeProduction(e)).sort((a,b)=>(a.production?.reviews||0)-(b.production?.reviews||0)||new Date(a.production?.due||0)-new Date(b.production?.due||0)).map((e,i)=>({id:e.id,mode,isNew:!e.production?.reviews,needed:(!e.production?.reviews)?2:1,streak:0,attempts:0,firstResult:null,hadFailure:false,scored:false,completed:false,nextAt:0,afterTurn:0,seq:i}));
}
function startStudy(){
 const existing=activeSession();if(existing){studySession=existing;answerVisible=false;typedDraft='';renderLearn();autoSpeakCurrent();return;}
 const items=buildQueue(studyMode);if(!items.length){toast('当前没有待学习的词');return;}
 studySession={mode:studyMode,bookId:data.settings.activeBook,day:nDate(),items,turn:0,currentId:null,done:0};
 data.studySessions[sessionKey(studyMode,data.settings.activeBook)]=studySession;answerVisible=false;typedDraft='';save();renderLearn();autoSpeakCurrent();
}
function pickCurrent(ss){
 if(ss.currentId){const current=ss.items.find(t=>t.id===ss.currentId&&!t.completed);if(current)return current;ss.currentId=null;}
 const pending=ss.items.filter(t=>!t.completed);if(!pending.length)return null;
 // Bahasa V3.7: an unseen card has readyAt=0, so it is shown before queued retries.
 // This prevents an answer from being repeated immediately while other new cards remain.
 const eligible=pending.filter(t=>(t.afterTurn||0)<=ss.turn);
 const pool=eligible.length?eligible:pending;
 pool.sort((a,b)=>(a.afterTurn||0)-(b.afterTurn||0)||a.attempts-b.attempts||a.seq-b.seq);
 const picked=pool.find(t=>t.id!==ss.lastId)||pool[0];
 if(picked)ss.currentId=picked.id;
 return picked||null;
}
/* Contextual output cards: two authentic bilingual uses per AI term.
   Keep prompts tied to actual examples instead of auto-inventing translations.
   The original book and saved learning histories remain unmodified. */
const OUTPUT_CONTEXT_FIXES={
  'multimodal':{1:{prompt:'这个多模态模型可以接收文本、图像和音频作为输入。',answer:'The multimodal model accepts text, images, and audio as input.'}},
  'context window':{2:{prompt:'模型的表现可能会随上下文窗口长度而变化。',answer:'Model performance may vary with context window length.'}},
  'reward model':{2:{prompt:'校准不佳的奖励模型可能诱发意外行为。',answer:'A poorly calibrated reward model can encourage unintended behavior.'}},
  'self-supervised learning':{2:{prompt:'预训练通常依赖自监督学习目标。',answer:'Pretraining often relies on self-supervised learning objectives.'}},
  'mixture of experts':{2:{prompt:'混合专家架构旨在提高计算效率。',answer:'A mixture-of-experts architecture aims to improve compute efficiency.'}},
  'prompt engineering':{2:{prompt:'他们运用提示词工程为常见任务设计模板。',answer:'They used prompt engineering to create templates for common tasks.'}},
  'go-to-market':{2:{prompt:'有力的市场进入计划可以加快产品普及。',answer:'A strong go-to-market plan can accelerate adoption.'}},
  'capital expenditure':{2:{prompt:'投资者正密切关注与 AI 有关的资本支出。',answer:'Investors are watching AI-related capital expenditure closely.'}}
};
function productionExercises(e){
  if(Array.isArray(e.productionExercises)&&e.productionExercises.length){
    const entries=e.productionExercises.filter(x=>x&&String(x.prompt||'').trim()&&String(x.answer||'').trim());
    if(entries.length)return entries.map(x=>({prompt:String(x.prompt).trim(),answer:String(x.answer).trim()}));
  }
  const cards=[];
  const isAI=e.bookId==='book-ai-industry';
  for(let i=1;i<=2;i++){
    const override=isAI?OUTPUT_CONTEXT_FIXES[norm(e.term)]?.[i]:null;
    const prompt=override?.prompt||e['translation'+i];
    const answer=override?.answer||e['example'+i];
    if(String(prompt||'').trim()&&String(answer||'').trim())cards.push({prompt:String(prompt).trim(),answer:String(answer).trim()});
  }
  // A manually entered bespoke output exercise may be used when bilingual examples are absent.
  if(!cards.length){
    for(let i=1;i<=2;i++){
      const suffix=i===1?'':String(i);
      const prompt=e['productionPrompt'+suffix],answer=e['productionAnswer'+suffix];
      if(String(prompt||'').trim()&&String(answer||'').trim()&&String(answer).trim()!==String(e.term).trim())
        cards.push({prompt:String(prompt).trim(),answer:String(answer).trim()});
    }
  }
  return cards;
}
function practiceFor(e,task){
  const cards=productionExercises(e);
  // Rotate the example on EVERY retry; on a new day rotate by previous long-term reviews.
  const index=((Number(e.production?.reviews)||0)+(Number(task.attempts)||0))%Math.max(1,cards.length);
  return cards[index]||null;
}
function canPracticeProduction(e){return learned(e)&&productionExercises(e).length>0;}
function autoSpeakCurrent(){if(!studySession||studySession.mode!=='recognition')return;const task=pickCurrent(studySession);if(!task)return;const key=`${studySession.day}:${studySession.mode}:${studySession.turn}:${task.id}`;if(voiceLastKey===key)return;voiceLastKey=key;const e=data.entries.find(w=>w.id===task.id);if(e)speak(e.term,true);}
function reviewAnswerHtml(e,output,task){
 if(output){
  const practice=practiceFor(e,task);
  return `${typedDraft.trim()?`<div class="answer-feedback"><div class="small muted strong">你的表达</div><div>${esc(typedDraft)}</div></div>`:''}
   <div class="answer-title">参考表达</div>
   <div class="output-reference"><div class="output-answer">${esc(practice?.answer||'暂无参考答案')}</div><button class="example-speak output-speak" data-action="speak" data-text="${attrs(practice?.answer||e.term)}" aria-label="朗读参考答案">🔊</button></div>
   ${e.patterns?.length?`<div class="patterns-title">COMMON PATTERNS</div><div class="patterns">${e.patterns.map(p=>`<span class="pattern">${esc(p)}</span>`).join('')}</div>`:''}
   <div class="output-check">表达准确、符合中文语境且自然使用了 <strong>${esc(e.term)}</strong>（允许词形变化），即可选择「记住了」。参考答案不是唯一正确表达。</div>`;
 }
 return `<div class="flash-meaning">${esc(e.meaning)}</div>${e.patterns?.length?`<div class="patterns-title">COMMON PATTERNS</div><div class="patterns">${e.patterns.map(p=>`<span class="pattern">${esc(p)}</span>`).join('')}</div>`:''}${e.example1?`<div class="example"><div class="example-en">${esc(e.example1)} <button class="example-speak" data-action="speak" data-text="${attrs(e.example1)}" aria-label="朗读例句1">🔊</button></div><div class="example-zh">${esc(e.translation1)}</div></div>`:''}${e.example2?`<div class="example"><div class="example-en">${esc(e.example2)} <button class="example-speak" data-action="speak" data-text="${attrs(e.example2)}" aria-label="朗读例句2">🔊</button></div><div class="example-zh">${esc(e.translation2)}</div></div>`:''}`;
}
function studyHtml(ss){
 const task=pickCurrent(ss),total=ss.items.length,progress=pct(ss.done,total);
 if(!task){if(ss.done>=total){const deferred=ss.items.filter(t=>t.deferred).length;return `<div class="panel empty complete-card"><div class="empty-icon">✓</div><h3>今日巩固完成</h3><p>已完成 ${ss.done} 个词条的练习，后续复习已安排。${deferred?`其中 ${deferred} 个难词尚未达到巩固标准，明天会继续复习。`:``}</p><button class="btn primary large" data-action="finish-study">完成学习</button></div>`;}
 // Defensive recovery: an unfinished session must never display a timed waiting screen.
 return `<div class="panel empty pause-card"><h3>本轮词卡已完成</h3><button class="btn primary" data-action="finish-study">返回学习</button></div>`;}
 const e=data.entries.find(w=>w.id===task.id);if(!e){task.completed=true;ss.done++;ss.currentId=null;return studyHtml(ss);}
 const output=ss.mode==='production';let html=`<div class="study-card-wrap"><div class="panel study-card"><div class="card-top"><span class="pill ${output?'pink':'green'}">${output?'ACTIVE OUTPUT':'WORD RECOGNITION'}</span><div class="study-progress"><span class="small muted">${ss.done} / ${total}</span>${progressHtml(progress)}</div></div>`;
 if(output){
  const exercise=practiceFor(e,task);
  html+=`<div class="output-word-row"><div><div class="output-word-label">TARGET WORD</div><div class="output-target">${esc(e.term)}</div></div><button class="btn small speak-btn" data-action="speak" data-text="${attrs(e.term)}" aria-label="朗读目标词">🔊 发音</button></div>
   <div class="output-context-label">真实语境 · 中文句子 ${productionExercises(e).length>1?`<span class="context-variant">${((Number(e.production?.reviews)||0)+task.attempts)%productionExercises(e).length+1}/${productionExercises(e).length}</span>`:''}</div>
   <div class="production-prompt">${esc(exercise?.prompt||'')}</div>
   ${!answerVisible?`<div class="answer-area"><textarea class="textarea" id="typed-answer" placeholder="写下英文句子，也可以直接口头造句（可留空）" spellcheck="false" aria-label="我的英文句子"></textarea></div>`:''}`;
 }
 else{html+=`<div class="flash-word">${esc(e.term)}</div><div class="word-meta"><span>${esc(e.pos||'')}</span><button class="btn small speak-btn" data-action="speak" data-text="${attrs(e.term)}" aria-label="朗读单词">🔊 发音</button></div>`;}
 if(answerVisible){html+=reviewAnswerHtml(e,output,task);}
 else{html+=`<div class="reveal-area"><button class="btn primary reveal-btn" data-action="show-answer">显示答案 <span aria-hidden="true">→</span></button></div>`;}
 html+='</div>';
 if(answerVisible){html+=`<div class="study-controls"><button class="btn again" data-action="grade" data-rating="0"><span aria-hidden="true">✕</span> 忘记了</button><button class="btn good" data-action="grade" data-rating="2"><span aria-hidden="true">✓</span> 记住了</button></div>`;}
 html+=`<div class="study-foot"><span>${esc(bookById(e.bookId)?.title||'')} · ${esc(e.category||'未分类')}${task.attempts?` · 第 ${task.attempts+1} 次回忆`:''}</span><button class="btn ghost small" data-action="stop-study">暂时退出</button></div></div>`;
 return html;
}
function grade(rating){
 if(!studySession||!answerVisible)return;
 const ss=studySession;if(ss.day!==nDate()){studySession=null;answerVisible=false;renderLearn();toast('已进入新的一天，请开始今日复习。');return;}const task=pickCurrent(ss);if(!task)return;
 const e=data.entries.find(w=>w.id===task.id);if(!e)return;
 const remembered=rating===2,first=task.attempts===0;
 if(!e.introducedAt&&task.mode==='recognition')e.introducedAt=nDate();
 if(first)task.firstResult=remembered;
 if(!remembered){task.hadFailure=true;task.needed=2;task.streak=0;task.misses=(task.misses||0)+1;}
 else task.streak++;
 task.attempts++;ss.turn++;ss.lastId=task.id;
 if(!e[task.mode])e[task.mode]={interval:0,ease:2.5,reviews:0,history:[],learningPending:true};
 // The first attempt of a previously graduated due card determines its FSRS result.
 // Any same-day relearning steps cannot erase that forgotten result.
 const wasGraduated=(e[task.mode].reviews||0)>0;
 if(wasGraduated&&first&&!task.scored){longTermReview(e,task.mode,remembered);task.scored=true;}
 if(remembered&&task.streak>=task.needed){
  task.completed=true;ss.done++;
  if(!task.scored){longTermReview(e,task.mode,true,true);task.scored=true;}
  e[task.mode].learningPending=false;
 }else if(task.attempts>=MAX_ATTEMPTS||(task.misses||0)>=MAX_MISSES){
  // As in Bahasa, difficult cards return tomorrow if not yet consolidated today.
  task.completed=true;task.deferred=true;ss.done++;
  if(!task.scored){longTermReview(e,task.mode,false,true);task.scored=true;}
  e[task.mode].learningPending=false;
  e[task.mode].due=dayDue(addDays(nDate(),1));
  e[task.mode].interval=1;
  if(e[task.mode].history?.length)e[task.mode].history.at(-1).due=e[task.mode].due;
 }else{
  e[task.mode].learningPending=true;
  // Same turn-based placement as Bahasa V3.7, without any timed waiting.
  task.afterTurn=ss.turn+Math.min(4,2+Math.floor(task.attempts/3));
  task.nextAt=0;
 }
 const stamp=new Date().toISOString();data.activity.push({entryId:e.id,bookId:e.bookId,mode:task.mode,rating,date:nDate(),at:stamp,kind:'intraday',completed:task.completed,deferred:!!task.deferred});
 ss.currentId=null;answerVisible=false;typedDraft='';save();renderLearn();autoSpeakCurrent();
}
function renderLearn(){
 if(studySession&&(studySession.day!==nDate()||studySession.bookId!==data.settings.activeBook))studySession=null;
 const bid=data.settings.activeBook,book=bookById(bid),stats=book?bookStats(bid):{total:0,learned:0,mastered:0};
 const left=Math.max(0,bookGoal(bid)-countNewToday(bid)),newDone=bookGoal(bid)-left,dueR=dueRecCount(bid),dueP=dueProdCount(bid);
 if(studySession&&studySession.mode!==studyMode)studySession=null;
 const session=studySession&&studySession.mode===studyMode?studySession:null;
 const pending=session?session.items.filter(t=>t.attempts>0&&!t.completed).length:0;
 const pendingSession=activeSession(studyMode);
 let body=`<div class="learn-head"><div><div class="eyebrow">YOUR DAILY WORDS</div><h1>Wordfield <span class="v-tag">V1.5</span></h1></div><button class="btn settings-btn" data-action="settings" aria-label="学习设置">⚙ 设置</button></div>
 <div class="study-head"><div class="seg" role="tablist" aria-label="练习模式"><button data-action="study-mode" data-mode="recognition" class="${studyMode==='recognition'?'active':''}">识别 <span>Recognition</span></button><button data-action="study-mode" data-mode="production" class="${studyMode==='production'?'active':''}">运用 <span>Production</span></button></div></div>
 <div class="today-stats"><div class="today-chip"><span class="chip-icon lavender">▤</span><div><strong>今日新词</strong><span>${newDone} / ${bookGoal(bid)}</span></div></div><div class="today-chip"><span class="chip-icon blush">◷</span><div><strong>待巩固</strong><span>${pending||dueR}</span></div></div></div>
 <div class="learn-book-row"><div><div class="small muted">当前单词书</div>${bookSelectHtml('active-book')}</div><button class="btn small" data-nav="books">全部词书 →</button></div>`;
 const dailyPlan='<div class="panel pad mt24"><div class="row between wrap"><h3>每本词书 · 今日学习任务</h3><span class="small muted">独立新词额度与复习进度</span></div><div class="detail-grid">'+data.books.map(b=>{const goal=bookGoal(b.id),done=countNewToday(b.id),dueN=dueRecCount(b.id);return '<div class="panel pad"><div class="strong">'+esc(b.title)+'</div><p class="small muted">今日新词 '+done+' / '+goal+' · 待复习 '+dueN+'</p>'+progressHtml(pct(done,goal))+'<button class="btn small mt16" data-action="study-book" data-id="'+attrs(b.id)+'">'+(b.id===data.settings.activeBook?'继续这本':'学习这本')+'</button></div>';}).join('')+'</div></div>';
 body+=dailyPlan;
 if(session){body+=studyHtml(session);}
 else{
  const available=studyMode==='recognition'?dueR+Math.min(left,wordsOf(bid).filter(e=>!learned(e)).length):dueP;
  body+=`<div class="panel empty start-card"><div class="empty-icon">✦</div><h3>${studyMode==='recognition'?'今天的词汇练习':'主动输出练习'}</h3><p>${studyMode==='recognition'?`${dueR} 个到期复习词 · 最多 ${left} 个新词`:`${dueP} 个待练习的表达（需有中英对照例句）`}</p><button class="btn primary large" data-action="start-study" ${available||pendingSession?'':'disabled'}>${pendingSession?'继续学习':available?`开始学习 · ${available} 词`:'今日已完成'}</button></div>`;
 }
 $('#content').innerHTML=body;
}
function renderBooks(){if(!bookById(libraryBookId))libraryBookId=data.books[0]?.id||null;const b=bookById(libraryBookId),bookWords=b?wordsOf(b.id):[],categories=[...new Set(bookWords.map(e=>e.category||'未分类'))].sort();let list=bookWords.filter(e=>(!filterText||norm(e.term+' '+e.meaning+' '+e.category).includes(norm(filterText)))&&(!filterCategory||e.category===filterCategory));list.sort((a,b)=>a.term.localeCompare(b.term,'en'));
const html=`<div class="page-head"><div><div class="eyebrow">02 / LIBRARY</div><h1>你的每一本单词书，都值得保留。</h1><p class="subtext">可以创建新书、继续追加、切换学习，历史记录不会因导入新书而清空。</p></div><div class="toolbar"><button class="btn" data-action="new-book">＋ 新建词书</button><button class="btn primary" data-action="import">⇧ 导入词库</button></div></div><div class="book-list">${data.books.map(bk=>{const s=bookStats(bk.id),sel=bk.id===libraryBookId;return `<div class="panel book ${sel?'selected':''}" data-action="choose-library-book" data-id="${attrs(bk.id)}" role="button" tabindex="0"><div class="row between"><div class="book-icon">${esc(bk.icon||'▤')}</div>${bk.id===data.settings.activeBook?'<span class="pill green">当前学习</span>':''}</div><h3>${esc(bk.title)}</h3><p>${esc(bk.description||'个人词汇收藏')}</p><div class="progress-bar"><div class="progress-inner" style="width:${pct(s.learned,s.total)}%"></div></div><footer><span>${s.learned} / ${s.total} 已学习</span><span>${pct(s.learned,s.total)}%</span></footer></div>`}).join('')}<button class="panel book" data-action="new-book" style="border-style:dashed;background:transparent;text-align:left"><div class="book-icon">＋</div><h3>创建一本新书</h3><p>收集下一个领域的词汇与表达</p></button></div>
${b?`<div class="section-title"><h2>${esc(b.title)} <span class="muted small">· ${bookWords.length} 词 · 每日 ${bookGoal(b.id)} 新词</span></h2><div class="toolbar"><button class="btn small" data-action="book-goal" data-id="${attrs(b.id)}">⚙ 每日目标</button><button class="btn small" data-action="set-active" data-id="${attrs(b.id)}" ${b.id===data.settings.activeBook?'disabled':''}>${b.id===data.settings.activeBook?'✓ 当前书':'设为当前学习'}</button><button class="btn small" data-action="add-word">＋ 添加单词</button></div></div><div class="panel pad"><div class="toolbar"><input class="field searchbar" id="word-search" placeholder="搜索英文、中文或类别…" value="${attrs(filterText)}"><select class="select selector" id="category-filter"><option value="">全部类别</option>${categories.map(c=>`<option value="${attrs(c)}" ${c===filterCategory?'selected':''}>${esc(c)}</option>`).join('')}</select><span class="small muted toolbar-end" id="word-count">显示 ${list.length} 词</span></div><div id="word-rows">${wordRows(list)}</div></div>`:`<div class="panel empty mt24">还没有单词书，先创建一本吧。</div>`}`;
$('#content').innerHTML=html;}
function wordRows(list){if(!list.length)return `<div class="empty"><p>没有找到匹配的词汇。</p></div>`;return `<div class="wordlist">${list.slice(0,500).map(e=>`<div class="wordrow" data-action="word-detail" data-id="${attrs(e.id)}" role="button" tabindex="0"><div style="min-width:0"><div class="wordname">${esc(e.term)} <span class="muted small" style="font-weight:400">${esc(e.pos||'')}</span></div><div class="wordmeta">${esc(e.meaning)} · ${esc(e.category||'未分类')}</div></div><div class="status-badges">${mastered(e)?'<span class="pill green">已掌握</span>':learned(e)?'<span class="pill">学习中</span>':'<span class="pill">未学习</span>'}${e.production?.reviews?'<span class="pill amber">输出已练</span>':''}</div></div>`).join('')}${list.length>500?'<p class="muted small">为保证浏览器流畅，仅显示前 500 条；可以通过搜索查找其他词。</p>':''}</div>`;}
function filterRows(){const b=bookById(libraryBookId);if(!b)return;const items=wordsOf(b.id).filter(e=>(!filterText||norm(e.term+' '+e.meaning+' '+e.category).includes(norm(filterText)))&&(!filterCategory||e.category===filterCategory)).sort((a,b)=>a.term.localeCompare(b.term,'en'));$('#word-rows').innerHTML=wordRows(items);$('#word-count').textContent=`显示 ${items.length} 词`;}
function renderProgress(){const total=data.entries.length,learnedN=data.entries.filter(learned).length,masteredN=data.entries.filter(e=>mastered(e)).length,prodN=data.entries.filter(e=>e.production?.reviews).length,allReviews=data.activity.length;const last7=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const day=nDate(d);return{day,count:data.activity.filter(a=>a.date===day).length};});const max=Math.max(1,...last7.map(x=>x.count));
$('#content').innerHTML=`<div class="page-head"><div><div class="eyebrow">03 / PROGRESS</div><h1>学过的每个词，都有自己的历史。</h1><p class="subtext">单词书完成后也会一直保留。识别与主动运用采用独立复习记录。</p></div><button class="btn" data-action="backup">↧ 数据备份与恢复</button></div><div class="grid-3"><div class="panel stat"><div class="stat-label">累计学过</div><div class="stat-number">${learnedN}</div><div class="stat-foot">共收录 ${total} 词</div></div><div class="panel stat"><div class="stat-label">识别熟练</div><div class="stat-number">${masteredN}</div><div class="stat-foot">经过多轮间隔复习</div></div><div class="panel stat"><div class="stat-label">主动输出练过</div><div class="stat-number">${prodN}</div><div class="stat-foot">累计 ${allReviews} 次练习</div></div></div><div class="section-title"><h2>最近 7 天学习活动</h2></div><div class="panel pad"><div style="display:flex;align-items:flex-end;gap:12px;justify-content:space-between;height:155px;padding:8px 0">${last7.map(x=>`<div style="display:flex;flex:1;flex-direction:column;align-items:center;gap:7px;height:100%;justify-content:flex-end"><span class="small muted">${x.count}</span><div style="width:100%;max-width:46px;height:${Math.max(5,x.count/max*104)}px;background:${x.count?'#7ba58b':'#e8ece7'};border-radius:7px 7px 2px 2px"></div><span class="tiny muted">${x.day.slice(5)}</span></div>`).join('')}</div></div><div class="section-title"><h2>各单词书进度</h2></div><div class="detail-grid">${data.books.map(b=>{const s=bookStats(b.id);return `<div class="panel progress-book"><div class="row between"><h3>${esc(b.title)}</h3><span class="pill">${s.learned===s.total&&s.total?'已全部学过':'持续学习'}</span></div>${progressHtml(pct(s.learned,s.total))}<p class="small muted mt8 mb0">${s.learned}/${s.total} 已学习 · ${s.mastered} 熟练 · ${s.produced} 练过输出</p></div>`}).join('')}</div><div class="panel pad mt24"><div class="row between wrap"><div><h3>你的学习数据</h3><p class="small mb0">导出所有单词书、释义、例句、学习状态和完整复习历史。建议每周备份一次。</p></div><button class="btn primary" data-action="export-backup">导出完整 JSON 备份</button></div></div>`;}
function modalShell(title,content,footer=''){return `<div class="modal" role="dialog" aria-modal="true" aria-label="${attrs(title)}"><div class="modal-header"><h2>${esc(title)}</h2><button class="close" data-action="close-modal" aria-label="关闭">×</button></div>${content}${footer?`<div class="row between wrap mt24">${footer}</div>`:''}</div>`;}
function renderModal(){let h='';if(modal?.type==='bookGoal'){const b=bookById(modal.bookId);h=modalShell('每日新词目标 · '+(b?.title||''),'<div class="formrow"><label class="formlabel">这本词书每天学习多少个新词？</label><select class="select" id="book-daily-goal">'+[5,10,15,20,25].map(n=>'<option value="'+n+'" '+(n===bookGoal(b?.id)?'selected':'')+'>'+n+' 词 / 天</option>').join('')+'</select></div><p class="hint">仅修改这本词书；其他词书的新词任务和复习进度不变。</p>','<button class="btn" data-action="close-modal">取消</button><button class="btn primary" data-action="save-book-goal">保存目标</button>');}else if(modal?.type==='newBook'){h=modalShell('创建单词书',`<div class="formrow"><label class="formlabel" for="new-book-name">单词书名称 *</label><input class="field" id="new-book-name" maxlength="100" placeholder="例如：Business English"></div><div class="formrow"><label class="formlabel" for="new-book-desc">描述（可选）</label><input class="field" id="new-book-desc" maxlength="200" placeholder="你希望用这本书学习什么？"></div><p class="hint">新书创建后不会影响旧书或已有学习记录。</p>`,`<button class="btn" data-action="close-modal">取消</button><button class="btn primary" data-action="confirm-new-book">创建</button>`);}else if(modal?.type==='addWord'){const b=bookById(libraryBookId);h=modalShell(`添加单词 · ${b?.title||''}`,`<div class="twofields"><div class="formrow"><label class="formlabel">英文单词 / 表达 *</label><input class="field" id="add-term" placeholder="leverage"></div><div class="formrow"><label class="formlabel">中文释义 *</label><input class="field" id="add-meaning" placeholder="利用；发挥优势"></div></div><div class="twofields"><div class="formrow"><label class="formlabel">词性</label><input class="field" id="add-pos" placeholder="v."></div><div class="formrow"><label class="formlabel">类别</label><input class="field" id="add-category" placeholder="行业常用英语"></div></div><div class="formrow"><label class="formlabel">常见搭配（英文分号分隔）</label><input class="field" id="add-patterns" placeholder="leverage data; leverage existing tools"></div><div class="formrow"><label class="formlabel">英文例句 1</label><input class="field" id="add-example1" placeholder="The team leveraged its expertise."></div><div class="formrow"><label class="formlabel">对应中文翻译</label><input class="field" id="add-trans1" placeholder="团队发挥了自身的专业优势。"></div><div class="formrow"><label class="formlabel">英文例句 2</label><input class="field" id="add-example2"></div><div class="formrow"><label class="formlabel">对应中文翻译</label><input class="field" id="add-trans2"></div><p class="hint">可先只填英文和中文；后续可通过导入完整词书来添加丰富内容。不会自动生成未经验证的例句。</p>`,`<button class="btn" data-action="close-modal">取消</button><button class="btn primary" data-action="confirm-add-word">保存单词</button>`);}else if(modal?.type==='word'){const e=data.entries.find(w=>w.id===modal.id);if(!e){closeModal();return;}h=modalShell(e.term,`<div class="row between"><span class="pill green">${esc(e.category||'未分类')}</span><button class="btn small" data-action="speak" data-text="${attrs(e.term)}">♫ 发音</button></div><div class="flash-meaning">${esc(e.meaning)}</div><div class="small muted">${esc(e.pos||'')}</div>${e.patterns?.length?`<div class="patterns">${e.patterns.map(p=>`<span class="pattern">${esc(p)}</span>`).join('')}</div>`:''}${e.usageNote?`<div class="hint mt16"><strong>用法提醒：</strong>${esc(e.usageNote)}</div>`:''}<hr class="card-divider"><div class="example"><div class="example-en">${esc(e.example1||'暂无例句')}</div><div class="example-zh">${esc(e.translation1||'')}</div></div><div class="example"><div class="example-en">${esc(e.example2||'')}</div><div class="example-zh">${esc(e.translation2||'')}</div></div><hr class="card-divider"><div class="detail-grid"><div><div class="small muted">识别记忆</div><div class="strong">${e.recognition?.reviews||0} 次复习</div><div class="hint">${e.recognition?.due?`下次 ${fmtDate(e.recognition.due)}`:'未开始'}</div></div><div><div class="small muted">主动输出</div><div class="strong">${e.production?.reviews||0} 次复习</div><div class="hint">${e.production?.due?`下次 ${fmtDate(e.production.due)}`:'未开始'}</div></div></div>`,`<span class="small muted">${esc(bookById(e.bookId)?.title||'')}</span><button class="btn" data-action="close-modal">完成</button>`);}else if(modal?.type==='settings'){h=modalShell('学习设置',`<div class="formrow"><label class="formlabel">当前词书 · 每日新词数量</label><select class="select" id="setting-daily">${[5,10,15,20,25].map(n=>`<option value="${n}" ${n===data.settings.dailyNew?'selected':''}>${n} 词 / 天</option>`).join('')}</select></div><p class="hint">每本词书独立安排新词与复习，切换词书不影响其他词书的学习记录。</p><p class="hint mt16">识别与主动输出各自拥有独立记忆进度。主动输出需要先学习对应的识别词卡。</p>`,`<button class="btn" data-action="close-modal">取消</button><button class="btn primary" data-action="save-settings">保存设置</button>`);}else if(modal?.type==='backup'){h=modalShell('完整备份与恢复',`<h3>导出完整备份</h3><p class="small">导出所有单词书、释义、例句、当前设置和完整复习历史。可在另一台设备上恢复。</p><button class="btn primary" data-action="export-backup">↧ 导出 JSON 备份</button><div class="divider"></div><h3>恢复历史备份</h3><p class="small">恢复会<strong>用备份文件中的全部数据替换当前浏览器中的数据</strong>。操作前会自动下载一份当前数据备份，并要求再次确认。</p><input type="file" class="field" id="restore-file" accept="application/json,.json"><div class="hint">仅支持从 Wordfield 导出的完整 JSON 备份。</div><div class="mt16"><button class="btn danger" data-action="restore-backup">检查并恢复备份</button></div>`);}else if(modal?.type==='import'){h=modalShell(modal.source==='link'?'从 ChatGPT 导入':'导入单词书',`<p class="small">${modal.source==='link'?'已读取导入链接中的词卡。请核对内容并选择目标词书，确认前不会写入数据。':'支持 UTF-8 CSV 或 JSON。可创建新词书，也可向已有词书追加；已存在的同名词条会跳过，不会覆盖学习记录。'}</p><div class="formrow"><label class="formlabel">上传 CSV / JSON 文件</label><input class="field" type="file" id="import-file" accept=".csv,.json,text/csv,application/json"></div><div class="quote"><strong>最低必填字段</strong>：term, meaning（也支持 word, translation）。可选：pos, category, patterns, example1, translation1, example2, translation2, productionPrompt。CSV 首行为列名。</div><div class="formrow mt16"><label class="formlabel">导入至</label><select class="select" id="import-mode"><option value="new">创建新单词书</option><option value="existing">追加到已有单词书</option></select></div><div class="formrow" id="import-new-wrap"><label class="formlabel">新单词书名称</label><input class="field" id="import-book-title" placeholder="例如：Reading Notes"></div><div class="formrow" id="import-existing-wrap" style="display:none"><label class="formlabel">选择已有单词书</label><select class="select" id="import-existing-book">${data.books.map(b=>`<option value="${attrs(b.id)}" ${b.id===data.settings.activeBook?'selected':''}>${esc(b.title)}</option>`).join('')}</select></div><div id="import-preview">${pendingImport?importPreviewHtml(pendingImport):'<div class="hint">选择文件后，会先显示词条数和预览，不会立即写入。</div>'}</div>`,`<button class="btn" data-action="close-modal">取消</button><button class="btn primary" data-action="confirm-import" ${pendingImport?.entries.length?'':'disabled'}>确认导入</button>`);}
$('#modal-root').innerHTML=h;$('#modal-root').classList.add('open');document.body.style.overflow='hidden';}
function importPreviewHtml(p){return `<div class="import-preview"><strong>已读取 ${p.entries.length} 条有效词汇</strong>${p.invalid?` · <span style="color:var(--red)">${p.invalid} 条缺少必要字段，已跳过</span>`:''}<ul>${p.entries.slice(0,7).map(e=>`<li><strong>${esc(e.term)}</strong> — ${esc(e.meaning)}</li>`).join('')}</ul>${p.entries.length>7?'<div class="hint">仅展示前 7 条作为预览。</div>':''}</div>`;}
function closeModal(){modal=null;pendingImport=null;$('#modal-root').classList.remove('open');$('#modal-root').innerHTML='';document.body.style.overflow='';}
function createBook(title,description=''){const b={id:id(),title,description,createdAt:new Date().toISOString(),icon:'▤',dailyNew:10};data.books.push(b);return b;}
function createWord(raw,bookId){return{id:id(),bookId,term:raw.term.trim(),meaning:raw.meaning.trim(),pos:raw.pos||'',category:raw.category||'自定义词汇',priority:Number(raw.priority)||2,patterns:raw.patterns||[],example1:raw.example1||'',translation1:raw.translation1||'',example2:raw.example2||'',translation2:raw.translation2||'',productionPrompt:raw.productionPrompt||`用英文表达：${raw.meaning}`,productionAnswer:raw.productionAnswer||raw.term,productionPrompt2:raw.productionPrompt2||'',productionAnswer2:raw.productionAnswer2||'',productionExercises:Array.isArray(raw.productionExercises)?raw.productionExercises:undefined,usageNote:raw.usageNote||'',createdAt:new Date().toISOString(),introducedAt:null,recognition:null,production:null};}
function normalizeImport(r){if(typeof r==='string')return null;const pick=(...keys)=>{for(const k of keys)if(r[k]!=null&&String(r[k]).trim())return String(r[k]).trim();return'';};const term=pick('term','word','english','单词','词汇','英文'),meaning=pick('meaning','translation','definition','chinese','中文','释义');if(!term||!meaning)return null;const patterns=r.patterns instanceof Array?r.patterns.map(String):pick('patterns','collocations','搭配').split(/[;；]/).map(s=>s.trim()).filter(Boolean);return {term,meaning,pos:pick('pos','partOfSpeech','词性'),category:pick('category','group','类别')||'导入词汇',priority:Number(pick('priority')||2),patterns,example1:pick('example1','example','例句1'),translation1:pick('translation1','exampleTranslation1','例句翻译1'),example2:pick('example2','例句2'),translation2:pick('translation2','exampleTranslation2','例句翻译2'),productionPrompt:pick('productionPrompt','输出提示'),productionAnswer:pick('productionAnswer','输出答案'),productionPrompt2:pick('productionPrompt2','输出提示2'),productionAnswer2:pick('productionAnswer2','输出答案2'),usageNote:pick('usageNote','note','用法提醒'),productionExercises:Array.isArray(r.productionExercises)?r.productionExercises.filter(x=>x&&typeof x.prompt==='string'&&typeof x.answer==='string').map(x=>({prompt:x.prompt.trim(),answer:x.answer.trim()})):undefined};}
function parseCSV(text){text=text.replace(/^\uFEFF/,'');let rows=[],row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c;}else if(c==='"')quoted=true;else if(c===','){row.push(cell);cell='';}else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(s=>s.trim()))rows.push(row);row=[];cell='';}else cell+=c;}row.push(cell);if(row.some(s=>s.trim()))rows.push(row);if(quoted)throw Error('CSV 引号未闭合');if(!rows.length)return[];const header=rows[0].map(x=>x.trim().replace(/^\uFEFF/,''));return rows.slice(1).map(arr=>Object.fromEntries(header.map((h,i)=>[h,arr[i]||''])));}
async function loadImportFile(file){if(!file)return;if(file.size>12*1024*1024){toast('文件超过 12 MB，请拆分词库。');return;}try{const txt=await file.text();let raw;if(file.name.toLowerCase().endsWith('.csv'))raw=parseCSV(txt);else{const parsed=JSON.parse(txt);if(parsed?.kind==='wordfield-backup')throw Error('这是完整备份文件，请从「数据备份与恢复」中操作。');raw=Array.isArray(parsed)?parsed:parsed.entries;if(!Array.isArray(raw))throw Error('JSON 格式应为词条数组或包含 entries 数组的对象。');}const cleaned=raw.map(normalizeImport).filter(Boolean);const deduped=[...new Map(cleaned.map(e=>[norm(e.term),e])).values()];pendingImport={entries:deduped,invalid:raw.length-cleaned.length+(cleaned.length-deduped.length)};updateImportPreview();const confirm=$('[data-action="confirm-import"]');if(confirm)confirm.disabled=!deduped.length;if(!$('#import-book-title').value)$('#import-book-title').value=file.name.replace(/\.(csv|json)$/i,'').replace(/[_-]/g,' ');toast(`读取成功：${deduped.length} 个不重复词条`);}catch(err){pendingImport=null;$('#import-preview').textContent='无法读取文件：'+err.message;toast('导入解析失败，请检查文件格式。');}}

/* ChatGPT import links: #wf-import=<encodeURIComponent(JSON.stringify(payload))>.
   The URL fragment stays client-side. Nothing is saved until confirmation. */
function updateImportPreview(){
 if(!pendingImport)return;
 const preview=$('#import-preview');
 if(!preview)return;
 const book=$('#import-mode')?.value==='existing'?bookById($('#import-existing-book')?.value):null;
 const existing=book?new Set(wordsOf(book.id).map(e=>norm(e.term))):new Set();
 const duplicates=pendingImport.entries.filter(e=>existing.has(norm(e.term))).length;
 preview.innerHTML=importPreviewHtml(pendingImport)+(book?'<p class="hint">'+duplicates+' 个词条已存在于目标词书中，将在确认时跳过；不会覆盖已有学习进度。</p>':'');
}
function openWordfieldImportLink(){
 const hash=window.location.hash||'';
 if(!hash.startsWith('#wf-import='))return;
 try{
  if(hash.length>20000)throw new Error('导入链接过长，请改用 JSON 文件导入');
  const payload=JSON.parse(decodeURIComponent(hash.slice('#wf-import='.length)));
  if(!payload||payload.kind!=='wordfield-import'||payload.version!==1||!Array.isArray(payload.entries))throw new Error('不是受支持的 Word Field 导入链接');
  if(payload.entries.length<1||payload.entries.length>25)throw new Error('链接最多支持 25 张词卡');
  const valid=payload.entries.filter(e=>e&&typeof e==='object'&&!Array.isArray(e)).map(normalizeImport).filter(Boolean);
  const entries=[...new Map(valid.map(e=>[norm(e.term),e])).values()];
  if(!entries.length)throw new Error('没有有效词卡（需要 term 和 meaning）');
  const title=typeof payload.book==='string'&&payload.book.trim()?payload.book.trim().slice(0,100):'Speaking Expressions';
  pendingImport={entries,invalid:payload.entries.length-entries.length,source:'link'};
  modal={type:'import',source:'link'};
  renderModal();
  const existingBook=data.books.find(b=>norm(b.title)===norm(title));
  if(existingBook){
   $('#import-mode').value='existing';
   $('#import-existing-book').value=existingBook.id;
   $('#import-new-wrap').style.display='none';
   $('#import-existing-wrap').style.display='';
  }else{
   $('#import-mode').value='new';
   $('#import-book-title').value=title;
   $('#import-new-wrap').style.display='';
   $('#import-existing-wrap').style.display='none';
  }
  updateImportPreview();
  toast('已读取 '+entries.length+' 张词卡，请检查后确认导入。');
 }catch(err){
  toast('无法解析导入链接：'+err.message);
 }finally{
  // Remove sensitive payload from visible URL/history after parsing.
  try{window.history.replaceState(window.history.state,'',window.location.pathname+window.location.search);}catch(_){}
 }
}
function confirmImport(){if(!pendingImport?.entries.length)return;const mode=$('#import-mode')?.value;let b;if(mode==='existing'){b=bookById($('#import-existing-book').value);if(!b){toast('请选择单词书');return;}}else{const title=$('#import-book-title')?.value.trim();if(!title){toast('请输入新单词书名称');return;}b=createBook(title,'手动导入的词汇');}const existing=new Set(wordsOf(b.id).map(e=>norm(e.term)));let added=0,skipped=0;for(const raw of pendingImport.entries){if(existing.has(norm(raw.term))){skipped++;continue;}existing.add(norm(raw.term));data.entries.push(createWord(raw,b.id));added++;}libraryBookId=b.id;data.settings.activeBook=b.id;data.settings.dailyNew=bookGoal(b.id);studySession=null;filterText='';filterCategory='';save();closeModal();page='books';render();toast(`已添加 ${added} 词${skipped?`，跳过 ${skipped} 个同名词条`:''}。旧词和学习记录未受影响。`);}
function downloadJSON(obj,filename){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);}
function exportBackup(){downloadJSON({kind:'wordfield-backup',version:3,exportedAt:new Date().toISOString(),...data},`wordfield-backup-${nDate()}.json`);toast('备份已准备下载。请将文件存放在安全的位置。');}
async function restoreBackup(){const file=$('#restore-file')?.files?.[0];if(!file){toast('请选择备份文件');return;}try{const raw=JSON.parse(await file.text());if(raw.kind!=='wordfield-backup'||!isValidData(raw))throw Error('不是有效的 Wordfield 完整备份');if(!confirm(`将使用备份中的 ${raw.books.length} 本词书和 ${raw.entries.length} 个词条替换当前所有数据。确定继续吗？`))return;exportBackup();if(!confirm('已触发当前数据的备份下载。再次确认：替换当前所有学习记录并恢复备份？'))return;const restored={version:3,books:raw.books,entries:raw.entries,settings:raw.settings,activity:raw.activity,studySessions:raw.studySessions||{}};data=restored;migrateFirstDaySchedules();studySession=null;libraryBookId=data.settings.activeBook;await save();closeModal();page='progress';render();toast('备份恢复成功。');}catch(err){toast('恢复失败：'+err.message);}}
function speak(text,automatic=false){if(!('speechSynthesis' in window)){if(!automatic)toast('当前浏览器不支持语音朗读');return;}try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.9;u.pitch=1;speechSynthesis.speak(u);}catch(err){if(!automatic)toast('发音失败：请检查浏览器语音设置。');}}
function click(ev){if(ev.target=== $('#modal-root')){closeModal();return;}const el=ev.target.closest('[data-action],[data-nav]');if(!el)return;if(el.dataset.nav){page=el.dataset.nav;studySession=null;closeModal();window.scrollTo({top:0,behavior:'instant'});render();return;}const action=el.dataset.action;
switch(action){case'study-mode':studyMode=el.dataset.mode;studySession=null;answerVisible=false;renderLearn();break;case'start-study':startStudy();break;case'study-book':data.settings.activeBook=el.dataset.id;data.settings.dailyNew=bookGoal(el.dataset.id);studyMode='recognition';studySession=null;save();startStudy();break;case'show-answer':typedDraft=$('#typed-answer')?.value||'';answerVisible=true;renderLearn();break;case'grade':grade(Number(el.dataset.rating));break;case'stop-study':studySession=null;answerVisible=false;renderLearn();break;case'finish-study':if(studySession)delete data.studySessions[sessionKey(studySession.mode,studySession.bookId)];studySession=null;save();renderLearn();break;case'settings':modal={type:'settings'};renderModal();break;case'book-goal':modal={type:'bookGoal',bookId:el.dataset.id};renderModal();break;case'save-book-goal':{const b=bookById(modal?.bookId);if(b){b.dailyNew=Number($('#book-daily-goal').value);if(b.id===data.settings.activeBook)data.settings.dailyNew=b.dailyNew;save();closeModal();render();toast('这本词书的每日目标已更新');}break;}case'save-settings':data.settings.dailyNew=Number($('#setting-daily').value);bookById(data.settings.activeBook).dailyNew=data.settings.dailyNew;data.settings.reviewAll=false;studySession=null;save();closeModal();render();toast('设置已保存');break;case'choose-library-book':libraryBookId=el.dataset.id;filterCategory='';filterText='';renderBooks();break;case'set-active':data.settings.activeBook=el.dataset.id;data.settings.dailyNew=bookGoal(el.dataset.id);studySession=null;save();renderBooks();toast('已切换当前单词书');break;case'new-book':modal={type:'newBook'};renderModal();$('#new-book-name')?.focus();break;case'confirm-new-book':{const title=$('#new-book-name').value.trim();if(!title){toast('请填写单词书名称');break;}const b=createBook(title,$('#new-book-desc').value.trim());libraryBookId=b.id;data.settings.activeBook=b.id;data.settings.dailyNew=bookGoal(b.id);studySession=null;save();closeModal();page='books';render();toast('新单词书已创建');break;}case'add-word':modal={type:'addWord'};renderModal();break;case'confirm-add-word':{const term=$('#add-term').value.trim(),meaning=$('#add-meaning').value.trim();if(!term||!meaning){toast('英文与中文释义必须填写');break;}if(wordsOf(libraryBookId).some(e=>norm(e.term)===norm(term))){toast('这本词书已经包含同名词条，未进行覆盖');break;}const raw={term,meaning,pos:$('#add-pos').value.trim(),category:$('#add-category').value.trim()||'自定义词汇',patterns:$('#add-patterns').value.split(/[;；]/).map(s=>s.trim()).filter(Boolean),example1:$('#add-example1').value.trim(),translation1:$('#add-trans1').value.trim(),example2:$('#add-example2').value.trim(),translation2:$('#add-trans2').value.trim()};data.entries.push(createWord(raw,libraryBookId));save();closeModal();renderBooks();toast(`已添加 ${term}`);break;}case'word-detail':modal={type:'word',id:el.dataset.id};renderModal();break;case'close-modal':closeModal();break;case'import':pendingImport=null;modal={type:'import'};renderModal();break;case'confirm-import':confirmImport();break;case'backup':modal={type:'backup'};renderModal();break;case'export-backup':exportBackup();break;case'restore-backup':restoreBackup();break;case'speak':speak(el.dataset.text);break;default:break;}}
function changes(e){if(e.target.id==='active-book'){data.settings.activeBook=e.target.value;data.settings.dailyNew=bookGoal(e.target.value);studySession=null;save();renderLearn();}if(e.target.id==='category-filter'){filterCategory=e.target.value;filterRows();}if(e.target.id==='import-file')loadImportFile(e.target.files[0]);if(e.target.id==='import-mode'){$('#import-new-wrap').style.display=e.target.value==='new'?'':'none';$('#import-existing-wrap').style.display=e.target.value==='existing'?'':'none';updateImportPreview();}if(e.target.id==='import-existing-book')updateImportPreview();}
function onInput(e){if(e.target.id==='word-search'){filterText=e.target.value;filterRows();}}
function keydown(e){if(e.key==='Escape'&&modal){closeModal();return;}if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role="button"][data-action]')){e.preventDefault();e.target.click();}}
document.addEventListener('click',click);document.addEventListener('change',changes);document.addEventListener('input',onInput);document.addEventListener('keydown',keydown);window.addEventListener('hashchange',openWordfieldImportLink);init();
})();
