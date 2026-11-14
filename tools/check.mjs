import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=process.cwd();let count=0;const ok=label=>{console.log('PASS '+label);count++;};
for(const file of ['rq-world.js','rq-sites-mars.js','rq-sites-moon.js','mars-polish.js','v4-upgrade.js','mars-games.js','mars-datapoints.js','mars-cinema.js','mars-experience.js']){new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});ok(file+' syntax');}
for(const file of ['index.html','moon.html','mars.html']){const html=fs.readFileSync(file,'utf8');for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){if(!m[1].includes('src='))new vm.Script(m[2],{filename:file+' inline'});}for(const m of html.matchAll(/(?:src|href)="([^"#?]+)[^"]*"/g)){if(m[1].includes(" + "))continue;const p=m[1].split('#')[0];if(/^(https?:|data:|javascript:|\$)/.test(p)||p.includes('${'))continue;assert(fs.existsSync(p),file+' missing '+p);}ok(file+' inline syntax and static local links');}
const manifest=JSON.parse(fs.readFileSync('data/hardware-images.json','utf8')),keys=new Set();
for(const p of manifest.items){const k=p.mission+'/'+p.component;assert(!keys.has(k),'duplicate '+k);keys.add(k);assert(p.source&&p.alt&&p.credit,k+' missing attribution');if(p.status==='locally_acquired'){assert(fs.existsSync(p.image),p.image+' missing');const b=fs.readFileSync(p.image);assert(b.length>1000,p.image+' suspiciously small');assert(b[0]===255&&b[1]===216||b.subarray(0,3).toString()==='GIF'||b[0]===137,p.image+' invalid image signature');}}
ok(manifest.items.length+' manifest entries; local image signatures, attribution, and unique keys');
const html=fs.readFileSync('mars.html','utf8');const embedded=JSON.parse(html.match(/const DEFAULT_PHOTOS = ([^\r\n]+);/)[1]);assert.deepEqual(embedded,manifest);ok('generated image fallback matches central manifest');
// These are logic tests, not browser or WebGL tests. No Three.js substitute is used.
function context(){const elements=new Map();const element=()=>({style:{setProperty(){}},classList:{add(){},remove(){}},appendChild(){},addEventListener(){},innerHTML:'',textContent:'',value:''});const listeners={};const c={console,Math,Date,setTimeout:()=>0,clearTimeout(){},localStorage:{getItem:()=>null,setItem(){}},document:{readyState:'loading',head:{appendChild(){}},body:{appendChild(){}},createElement:element,getElementById:id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);},querySelectorAll:()=>[],addEventListener(){}},addEventListener:(n,f)=>listeners[n]=f,renderTaskUI(){},highlight3DPart(){},saveState(){},curM:{n:'test'},taskState:{},completeCollaborativeTask:s=>c.completed=s};c.window=c;c.elements=elements;c.listeners=listeners;return vm.createContext(c);}
let c=context();vm.runInContext(fs.readFileSync('mars-polish.js','utf8'),c);
c.sojMissionAction('measure');assert(!c.completed);c.sojMissionAction('ramp','front');c.sojMissionAction('finish');assert(!c.completed);
c.sojMissionAction('ramp','rear');c.sojMissionAction('target','bill');
// A deliberately blocked path must not reach the target or allow APXS measurement.
c.sojMissionAction('move','1,0');c.sojMissionAction('move','0,1');c.sojMissionAction('move','1,0');c.sojMissionAction('align');c.sojMissionAction('measure');c.sojMissionAction('interpret',1);c.sojMissionAction('finish');assert(!c.completed);
// Navigate around the obstacle via the north row to A.
c.sojMissionAction('move','0,-1');for(let i=0;i<4;i++)c.sojMissionAction('move','1,0');c.sojMissionAction('move','0,1');c.sojMissionAction('align');c.sojMissionAction('measure');c.sojMissionAction('interpret',1);assert(!c.completed);
c.sojMissionAction('gap',0);c.sojMissionAction('measure');c.sojMissionAction('interpret',0);c.sojMissionAction('finish');assert(!c.completed);c.sojMissionAction('interpret',1);c.sojMissionAction('finish');assert(!c.completed);
for(const id of ['claim','evidence','uncertainty'])c.document.getElementById('soj-'+id).value='A supported scientific sentence.';c.sojMissionAction('finish');assert(c.completed?.includes('obstacle avoidance'));ok('Sojourner gates: ramp, obstacle, target, contact, inference, report');
c=context();vm.runInContext(fs.readFileSync('v4-upgrade.js','utf8'),c);
c.vikScoop('uv_surface');assert.equal(c.v4TaskState.vik.phase,0);c.vikScoop('subsurface');c.vikHeatOven(500);assert.equal(c.v4TaskState.vik.phase,1);c.vikHeatOven(200);c.vikHeatOven(500);c.vikSubmitHyp(0);assert(!c.completed);c.vikSubmitHyp(1);assert(c.completed);ok('Viking heating order and interpretation');
c.completed=null;c.spiAction('rat');c.spiAction('rat');c.spiAction('scan');assert.equal(c.v4TaskState.spi.phase,0);c.spiAction('trench');c.spiAction('scan');c.spiSubmitHyp(0);assert(!c.completed);c.spiSubmitHyp(1);assert(c.completed);ok('Spirit separates RAT target from silica trench');
c.completed=null;c.insStep('wts');assert.equal(c.v4TaskState.ins.wtsDown,false);c.insStep('seis');c.insStep('wts');c.insStep('verifyPick');assert.equal(c.v4TaskState.ins.phase,2);c.insStep('hyp',0);assert(!c.completed);c.insStep('hyp',1);assert(c.completed);ok('InSight deployment and synthetic arrival interpretation');
// Execute original Opportunity functions in isolation with their real state logic.
const start=html.indexOf('const OPP_TARGETS'),end=html.indexOf('function oppBody()',start);assert(start>=0);c=context();c.taskState={opp:null};c.M=Math;c.$=id=>c.document.getElementById(id);c.oppDraw=()=>{};c.beep=()=>{};vm.runInContext(html.slice(start,end),c);c.taskState.opp=c.oppInit();c.oppPick('B');c.oppShoot();assert(!c.taskState.opp.good);c.oppCover();c.oppShoot();assert(!c.taskState.opp.good);c.oppDist(68);c.oppShoot();assert(c.taskState.opp.good);c.oppMB('sphere');c.oppIntegrate();c.oppMB('matrix');c.oppIntegrate();c.oppHyp(0);c.oppSubmit();assert(!c.completed);vm.runInContext('OPP_EVID.forEach((e,i)=>{taskState.opp.picks[i]=!!e.ok}); taskState.opp.hyp=OPP_HYP.findIndex(h=>h.ok);',c);c.oppSubmit();assert(c.completed);ok('Opportunity: cover, working distance, measurements, evidence and interpretation');
// World switch + 9 Mars places (any 5) + 4 Moon sites (any 3), loaded with light stubs
function worldCtx(search){const w={location:{search},document:{documentElement:{classList:{add(){}}},title:''},URLSearchParams,console};w.window=w;vm.createContext(w);vm.runInContext(fs.readFileSync('rq-world.js','utf8'),w);return w;}
const wMars=worldCtx(''),wMoon=worldCtx('?world=moon');
assert.equal(wMars.RQ.W.required,5,'Mars must need 5 restorations');assert.equal(wMars.RQ.W.systems.length,5,'Mars has 5 ship systems');
assert.equal(wMars.RQ.W.key('rq.dpOrder'),'rq.dpOrder','Mars keeps original storage keys so old saves load');
assert.equal(wMoon.RQ.W.required,3,'Moon must need 3 restorations');assert.equal(wMoon.RQ.W.systems.length,3,'Moon has 3 ship systems');
assert.equal(wMoon.RQ.W.key('rq.dpOrder'),'rq.dpOrder.moon','Moon progress must use its own storage keys');
assert.equal(worldCtx('?world=jupiter').RQ.W.id,'mars','unknown world must fall back to Mars');
function sitesFor(world,file){const captured={};const noop=()=>{};const w={encodeURIComponent,console,Math};w.window=w;
 w.RQ={W:{id:world,isMoon:world==='moon',key:k=>k},me:{tier:()=>'scientist',ease:()=>1,hintMul:()=>1,t:o=>o.scientist||o.explorer},
  gfx:{esc:x=>String(x),clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),rr:noop,txt:noop,space:noop,fit:noop,gauge:noop,shuffle:a=>a,sfx:()=>({}),M3:{}},
  site:{add:(wid,arr)=>{captured[wid]=arr;},decorate:{},store:()=>({})}};
 vm.createContext(w);vm.runInContext(fs.readFileSync(file,'utf8'),w);return {sites:captured[world]||[],games:w.RQ.games||{}};}
const dpSrc=fs.readFileSync('mars-datapoints.js','utf8');
const legacy=['soj','mer','vik','phi'].filter(id=>dpSrc.includes('{ id: "'+id+'"'));
assert.equal(legacy.length,4,'Mars needs its 4 surface machines (Sojourner, Spirit & Opportunity, Viking 1 & 2, Phoenix & InSight)');
const ms=sitesFor('mars','rq-sites-mars.js'),mo=sitesFor('moon','rq-sites-moon.js');
assert.deepEqual(Array.from(ms.sites,x=>x.id),['ing','daw','nea','pio','kep'],'Mars needs Ingenuity + Dawn, NEAR, Pioneer and Kepler beacons');
assert.equal(legacy.length+ms.sites.length,9,'Mars must have 9 places to explore');
assert.deepEqual(Array.from(mo.sites,x=>x.id),['eag','lrv','sur','llr'],'Moon needs its 4 Apollo-era sites');
assert.equal(sitesFor('mars','rq-sites-moon.js').sites.length,0,'Moon sites must not load on Mars');
for(const [set,games] of [[ms.sites,ms.games],[mo.sites,mo.games]])for(const x of set){
 assert(x.final&&x.final.q&&Array.isArray(x.final.o)&&x.final.o.length>=3,x.id+' needs a final launch question');
 assert(Array.isArray(x.pos)&&x.pos.length===2,x.id+' needs a map position');
 assert(x.record,x.id+' needs an NSSDCA record id');
 const g=games[x.game||x.id];assert(g&&typeof g.init==='function'&&typeof g.draw==='function',x.id+' needs a playable mini-game');}
for(const x of ms.sites.filter(x=>x.kind==='beacon'))assert(x.status,x.id+' beacon must say where the real spacecraft is');
const moonRedirect=fs.readFileSync('moon.html','utf8');
assert(moonRedirect.includes('mars.html?world=moon')&&!moonRedirect.includes('moon.js'),'moon.html must redirect to the 3D Moon world');
ok('World switch, 9 Mars places (any 5) and 4 explorable Moon sites (any 3)');


// Offline Three.js bundle & no active network dependencies in core HTML
assert(html.includes('<script src="vendor/three.min.js"></script>'),'mars.html missing local Three.js');
assert(!html.includes('cdnjs.cloudflare.com'),'mars.html still references cdnjs CDN');
assert(fs.existsSync('vendor/THREE_LICENSE.txt'),'missing vendor/THREE_LICENSE.txt');
assert(html.includes('function loadOptionalVideo('),'missing click-to-load YouTube helper');
const vhStart=html.indexOf('function videoHTML('),vhEnd=html.indexOf('function photoOK(',vhStart);
assert(vhStart>=0&&!html.slice(vhStart,vhEnd).includes('<iframe'),'videoHTML auto-loads YouTube iframe without user click');
ok('Offline Three.js r128 bundle, license, and click-to-load video gate');

// Distinct pre/post checks across all 5 original Mars investigations (tested via real rendered markup)
c=context();
let dlgCapture='';c.dl=h=>{dlgCapture=h;};
vm.runInContext(fs.readFileSync('v4-upgrade.js','utf8'),c);
for(const m of ['Sojourner','Viking 1 Lander','Spirit Rover','Opportunity Rover','InSight Lander']){
 dlgCapture='';c.openAssessmentModal(m,'pre',()=>{});const preMarkup=dlgCapture;
 dlgCapture='';c.openAssessmentModal(m,'post',()=>{});const postMarkup=dlgCapture;
 assert(preMarkup&&postMarkup&&preMarkup!==postMarkup,m+' pre/post modals not distinct');
 assert(preMarkup.includes('DIAGNOSTIC PRE-CHECK')&&postMarkup.includes('DISTINCT TRANSFER POST-CHECK'),m+' missing assessment headers');
 assert(preMarkup.includes('GOAL:'),m+' missing learning objective');
}
ok('Distinct pre/post transfer questions and learning objectives for all 5 Mars investigations');

// Shared tamper-safe storage context for the Mars investigations
const memStore=new Map();
function storageCtx(seed){
 const base=context();
 base.localStorage={getItem:k=>memStore.has(k)?memStore.get(k):null,setItem:(k,v)=>memStore.set(k,String(v)),removeItem:k=>memStore.delete(k)};
 if(seed)Object.entries(seed).forEach(([k,v])=>memStore.set(k,typeof v==='string'?v:JSON.stringify(v)));
 base.location={hash:''};base.scrollTo=()=>{};
 const getEl=base.document.getElementById;
 const hmap=new Map();
 base.document.getElementById=id=>{const e=getEl(id);e.focus=()=>{};e.addEventListener=(n,f)=>hmap.set(id+':'+n,f);return e;};
 let btns={};
 base.document.querySelectorAll=sel=>{const key=sel.match(/^\[data-(.+)\]$/)?.[1];if(!key)return [];const m=base.document.getElementById('main').innerHTML;const re=new RegExp('data-'+key+'="([^" ]+)"','g');const list=[...m.matchAll(re)].map(x=>({dataset:{[key]:x[1]}}));btns[key]=list;return list;};
 return {c:base,hmap,getBtns:()=>btns};
}
// Mars Sojourner v2 & v4TaskState v2 storage corruption/forgery rejection + valid resume
memStore.clear();
memStore.set('btsm.soj.state.v2',JSON.stringify({version:2,state:{ramp:'rear',target:'bill',x:4,y:1,aligned:true,measured:true,hyp:1,submitted:true,done:true,claim:'bad',evidence:'x',uncertainty:'y'}}));
memStore.set('btsm.v4tasks.v2',JSON.stringify({v:2,tasks:{vik:{phase:9,depth:'subsurface',temp:200},spi:{phase:1,site:'trench',abraded:999}}}));
let sj=storageCtx();
vm.runInContext(fs.readFileSync('mars-polish.js','utf8'),sj.c);
sj.c.sojMissionAction('finish');assert(!sj.c.completed,'forged/invalid Sojourner report completed');
sj.c.sojMissionAction('ramp','rear');sj.c.sojMissionAction('target','bill');
sj.c.sojMissionAction('move','0,-1');for(let i=0;i<4;i++)sj.c.sojMissionAction('move','1,0');sj.c.sojMissionAction('move','0,1');sj.c.sojMissionAction('align');sj.c.sojMissionAction('measure');sj.c.sojMissionAction('interpret',1);
for(const [k,v] of [['claim','aaaaaaaa aaaaaaaa aaaaaaaa'],['evidence','bbbbbbbb bbbbbbbb bbbbbbbb'],['uncertainty','cccccccc cccccccc cccccccc']]){
 sj.c.document.getElementById('soj-'+k).value=v;
}
sj.c.sojMissionAction('finish');assert(!sj.c.completed,'repeated-letter mash should fail Sojourner validation');
let v4s=storageCtx();vm.runInContext(fs.readFileSync('v4-upgrade.js','utf8'),v4s.c);
assert.equal(v4s.c.v4TaskState.vik.phase,0,'out-of-range phase was not rejected');
assert.equal(v4s.c.v4TaskState.vik.temp,200,'valid mid-task temp did not restore');
assert.equal(v4s.c.v4TaskState.spi.abraded,0,'out-of-range RAT abrasion was not rejected');
assert.equal(v4s.c.v4TaskState.spi.site,'trench','valid Spirit trench site did not restore');
ok('Mars storage tamper validation and gibberish rejection');

// Regression: astronaut avatar + 3D/2D TARS companion must not depend on the intro sequence or desktop-only CSS
const marsSrc=fs.readFileSync('mars.html','utf8');
assert(/else if \(!AS\.g\.visible\) AS\.g\.visible = true;/.test(marsSrc),'astronaut is never made visible when the intro/exit sequence is skipped (mission picker path)');
assert(/if \(S\.mode != "intro" && S\.mode != "exit" && !TS\.g\.visible\) TS\.g\.visible = true;/.test(marsSrc),'3D TARS companion is never made visible when the intro/exit sequence is skipped');
assert(/function tars3D\(\)/.test(marsSrc) && /g\.name = "TARS"/.test(marsSrc),'3D TARS companion mesh builder is missing from mars.html');
assert(!/max-width:700px\)\{#tars-widget\{display:none/.test(marsSrc),'TARS widget must not be hidden outright on small screens');
assert(/max-width:700px\)\{#tars-widget\{[^}]*top:128px/.test(marsSrc),'TARS widget needs a compact small-screen placement');
assert(/id = "tars-widget"|id="tars-widget"/.test(fs.readFileSync('v4-upgrade.js','utf8')),'TARS widget is no longer built by v4-upgrade.js');
ok('Astronaut avatar and 3D/2D TARS companion visibility regression');

// Port 4173 launcher consistency, server path hardening, and clean release packaging
const runBat=fs.readFileSync('run.bat','utf8');
const serveSrc=fs.readFileSync('tools/serve.mjs','utf8');
const pwCfg=fs.readFileSync('playwright.config.mjs','utf8');
assert(runBat.includes('http://127.0.0.1:4173/index.html') && !runBat.includes('8000'),'run.bat must launch port 4173 and not port 8000');
assert(serveSrc.includes('4173') && pwCfg.includes('4173'),'tools/serve.mjs and playwright.config.mjs must agree on port 4173');
assert(serveSrc.includes('BLOCKED_PREFIXES') && serveSrc.includes('writeHead(403'),'tools/serve.mjs must block dotfiles and dev directories');
assert(!fs.existsSync('RoverQuest'),'nested RoverQuest/ directory must not exist inside workspace root');
ok('Launcher port 4173 consistency, server hardening, and clean directory layout');

// Movable Mars Radar, 3D Sojourner rock yard, and Opportunity flexible instrument strategy
const polishSrc=fs.readFileSync('mars-polish.js','utf8');
assert(marsSrc.includes('window.moveMarsRadar = moveMarsRadar') && marsSrc.includes('window.resetMarsRadarPosition = resetMarsRadarPosition'),'Mars Radar drag/reset helpers missing');
assert(marsSrc.includes('window.goToMachineFromRadar = goToMachineFromRadar') && marsSrc.includes('pl.radarTarget'),'Mars Radar click-to-move / roster Go navigation missing');
assert(polishSrc.includes('function ensureSoj3DProps()') && polishSrc.includes('SojournerRockYard3D') && polishSrc.includes('window.toggleSojSplitView'),'3D Sojourner rock yard and split-view toggle missing');
assert(marsSrc.includes('window.oppSwitchInstrument = function') && marsSrc.includes('IDD Turret Strategy (Flexible Order)'),'Opportunity flexible IDD instrument strategy switcher missing');
ok('Draggable Mars Radar, 3D Sojourner rock yard, and Opportunity strategy switcher');

// Unified branding, persistent synthetic-data disclosures, age 10-16 glossaries, and self-check checklists
const idxSrc=fs.readFileSync('index.html','utf8');
const moonHtmlSrc=fs.readFileSync('moon.html','utf8');
assert(idxSrc.includes('RoverQuest: Beyond the Silent Machines') && moonHtmlSrc.includes('RoverQuest: Beyond the Silent Machines') && marsSrc.includes('RoverQuest: Beyond the Silent Machines'),'unified title RoverQuest: Beyond the Silent Machines must appear in index.html, moon.html, and mars.html');
assert(polishSrc.includes('SYNTHETIC TEACHING DATA') && polishSrc.includes('Quick Science Terms (Ages 10–16)') && polishSrc.includes('Self-Check Explanation Checklist'),'mars-polish.js must include persistent synthetic badges, Quick Science Terms, and Self-Check Checklist');
assert(marsSrc.includes('Procedural Educational Approximation (Not Engineering CAD)'),'mars.html Stage 2 / Inspector must disclose procedural 3D models paired with real NASA photos');
ok('Unified branding, persistent synthetic badges, age 10-16 glossaries, and self-check checklists');

console.log(`\n${count} groups passed. Browser rendering, GPU, touch and remote images are covered in tests/e2e/roverquest.spec.mjs.`);
