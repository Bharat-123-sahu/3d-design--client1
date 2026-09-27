import { pathToFileURL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const modulePath = process.env.PLAYWRIGHT_MODULE;
const {chromium, firefox} = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');
const channel = process.env.QA_BROWSER || 'chrome';
const browser = channel === 'firefox' ? await firefox.launch({headless:true}) : await chromium.launch({channel,headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const root = `artifacts/qa/${channel}`;
await mkdir(root,{recursive:true});
const report={browser:channel,checks:[],errors:[],failedRequests:[]};
const page=await browser.newPage({viewport:{width:1440,height:900}});
page.on('pageerror',e=>report.errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
page.on('response',r=>{if(r.status()>=400)report.failedRequests.push(`${r.status()} ${r.url()}`);});
const base=process.env.QA_URL||'http://127.0.0.1:5173';
async function record(name, fn) { const result=await fn(); report.checks.push({name,result}); console.log(`PASS ${name}`); }
async function instrument() {
 await page.evaluate(async()=>{
  window.__qa={arrivals:[],states:[],routes:[],frames:0};
  window.addEventListener('characterArrived',e=>window.__qa.arrivals.push(e.detail.node));
  window.addEventListener('characterStateChanged',e=>window.__qa.states.push(e.detail.state));
  window.addEventListener('routeChanged',e=>window.__qa.routes.push(e.detail.path));
  const moduleURL = name => performance.getEntriesByType('resource').find(entry => entry.name.includes(name))?.name;
  const {CharacterNavigationManager}=await import(moduleURL('/src/js/core/CharacterNavigationManager.js'));
  const update=CharacterNavigationManager.prototype.update;
  CharacterNavigationManager.prototype.update=function(delta){update.call(this,delta);window.__qa.manager=this;};
  const {ThreeScene}=await import(moduleURL('/src/js/three/ThreeScene.js'));
  const render=ThreeScene.prototype.renderCharacterView;
  ThreeScene.prototype.renderCharacterView=function(){render.call(this);window.__qa.scene=this;window.__qa.frames++;};
  const scrollModule = performance.getEntriesByType('resource').find(entry => entry.name.includes('/gsap_ScrollTrigger.js?v='));
  window.__qa.ST=(await import(scrollModule.name)).ScrollTrigger;
 });
}
async function enter(path='/') {
 await page.goto(base+path);
 await instrument();
 await page.locator('.thunder-intro[data-intro-state="READY"]').waitFor({timeout:30000});
 await page.locator('[data-intro-start]').click();
 await ready();
}
async function ready(path) {
 await page.waitForFunction(expected=>document.documentElement.dataset.appState==='content' && document.querySelector('.character-nav__trigger')?.getAttribute('aria-disabled')!=='true' && (!expected||location.pathname===expected),path,{timeout:30000});
}
async function navigate(id, path) {
 const trigger=page.locator('.character-nav__trigger');
 if(await trigger.getAttribute('aria-expanded')!=='true') await trigger.click();
 await page.locator(`[data-destination="${id}"]`).click();
 await ready(path);
 assert.equal(await page.locator('.character-nav').count(),1);
 assert.equal(await page.locator('.character-nav canvas').count(),1);
 const state=await page.evaluate(()=>({node:__qa.manager.currentNode,moving:__qa.manager.isMoving,pos:__qa.manager.model.root.position.toArray(),state:__qa.manager.navState}));
 assert.equal(state.node,id);assert.equal(state.moving,false);assert.equal(state.state,'idle');
 return state;
}
async function overflow() { return page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,nav:(()=>{const r=document.querySelector('.character-nav').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};})()})); }
try {
 await record('first load, intro, automatic Home',async()=>{await enter();await page.screenshot({path:`${root}/home.png`});return overflow();});
 await record('Home > Work > Services > About > Contact > Work through Pip',async()=>{
  const result=[];
  for(const [id,path] of [['work','/work'],['value','/services'],['about','/about'],['contact','/contact'],['work','/work']])result.push(await navigate(id,path));
  return result;
 });
 await record('Work forward and reverse scrub, Bird visible, no blank pin gaps',async()=>{
  const result=[];
  for(const id of ['radial','dice','bird'])for(const progress of [0.05,0.5,0.95,0.5,0.05]){
   await page.evaluate(({id,progress})=>{const t=__qa.ST.getById(`route:work-${id}`);window.scrollTo(0,t.start+(t.end-t.start)*progress);__qa.ST.update();},{id,progress});
   await page.waitForTimeout(140);
   const state=await page.evaluate(id=>{const t=__qa.ST.getById(`route:work-${id}`);const rect=t.trigger.getBoundingClientRect();const bird=document.querySelector('.story-bird');return {id,progress:t.progress,top:rect.top,height:rect.height,visibleCards:[...t.trigger.querySelectorAll('.cinema-card')].filter(c=>getComputedStyle(c).opacity!=='0').length,bird:bird&&getComputedStyle(bird).opacity};},id);
   assert.ok(Math.abs(state.progress-progress)<0.03,JSON.stringify(state));assert.ok(Math.abs(state.top)<3,JSON.stringify(state));
   if(id==='bird')assert.notEqual(state.bird,'0');result.push(state);
  }
  await page.screenshot({path:`${root}/work-bird.png`});return result;
 });
 await record('Work resize preserves pin order and no duplicate triggers',async()=>{
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);
  const triggers=await page.evaluate(()=>__qa.ST.getAll().filter(t=>t.vars.id?.startsWith('route:work-')).map(t=>({id:t.vars.id,start:t.start,end:t.end})));
  assert.equal(triggers.length,3);assert.ok(triggers[1].start>triggers[0].end);assert.ok(triggers[2].start>triggers[1].end);
  return triggers;
 });
 await record('route cleanup and re-entry',async()=>{
  await navigate('contact','/contact');assert.equal(await page.evaluate(()=>__qa.ST.getAll().filter(t=>t.vars.id?.startsWith('route:work-')).length),0);
  await navigate('work','/work');assert.equal(await page.evaluate(()=>__qa.ST.getAll().filter(t=>t.vars.id?.startsWith('route:work-')).length),3);return true;
 });
 await record('rapid clicks serialize character and route state',async()=>{
  await page.locator('.character-nav__trigger').click();
  await page.evaluate(()=>{document.querySelector('[data-destination="value"]').click();document.querySelector('[data-destination="about"]').click();document.querySelector('[data-destination="contact"]').click();});
  await ready('/services');assert.equal(await page.evaluate(()=>__qa.manager.currentNode),'value');return page.evaluate(()=>__qa.states.slice(-5));
 });
 await record('Feedback reactions, native radio keyboard controls, truthful submission',async()=>{
  await navigate('feedback','/feedback');
  const reactions=[];
  for(const value of ['loved','good','okay','improve']) {await page.locator(`input[value="${value}"]`).check();reactions.push(await page.evaluate(()=>__qa.manager.model.state));}
  assert.deepEqual(reactions,['celebrate','wave','thinking','curious']);
  await page.locator('input[value="loved"]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('input:checked').inputValue(),'good');
  await page.locator('#feedback-message').fill('A thoughtful experience.');await page.locator('.feedback-form [type="submit"]').click();
  assert.match(await page.locator('.feedback-status').innerText(),/not been sent/);assert.equal(await page.locator('#feedback-message').inputValue(),'A thoughtful experience.');
  await page.screenshot({path:`${root}/feedback-mobile.png`});return reactions;
 });
 await record('phone, tablet, desktop and ultrawide viewport matrix',async()=>{
  const result=[];
  for(const width of [320,360,375,390,414,430,768,1024,1280,1440,1920,2560]) {
   await page.setViewportSize({width,height:width<700?844:width<1100?1024:1080});await page.waitForTimeout(220);
   const state=await overflow();assert.ok(state.scroll<=width,JSON.stringify(state));assert.ok(state.nav.x>=0&&state.nav.right<=width&&state.nav.y>=0,JSON.stringify(state));
   await page.locator('.character-nav__trigger').click();
   await page.waitForTimeout(450);
   const panel=await page.locator('.character-nav__destinations').boundingBox();assert.ok(panel&&panel.x>=0&&panel.x+panel.width<=width+1&&panel.y>=0,JSON.stringify(panel));
   const targets=await page.locator('.character-nav__orbit a').evaluateAll(links=>links.map(a=>a.getBoundingClientRect().height));assert.ok(targets.every(h=>h>=44));
   await page.keyboard.press('Escape');assert.equal(await page.locator('.character-nav__trigger').getAttribute('aria-expanded'),'false');
   result.push(state);
  }return result;
 });
 await record('Home rope forward / reverse, cleanup, missing media has no failed request',async()=>{
  await page.setViewportSize({width:1440,height:900});await navigate('home','/');
  const samples=[];
  for(const progress of [0,0.5,1,0.5,0]){
   await page.evaluate(p=>{const t=__qa.ST.getById('route:home-rope');window.scrollTo(0,t.start+(t.end-t.start)*p);__qa.ST.update();},progress);await page.waitForTimeout(100);
   samples.push(await page.locator('.video-reveal__card').evaluate(e=>getComputedStyle(e).transform));
  }
  assert.equal(samples[0],samples[4]);assert.notEqual(samples[0],samples[2]);
  await page.screenshot({path:`${root}/rope.png`});await navigate('experience','/experience');assert.equal(await page.evaluate(()=>!!__qa.ST.getById('route:home-rope')),false);return samples;
 });
 await record('browser Back / Forward and refresh direct URL',async()=>{
  await page.goBack();await ready('/');await page.goForward();await ready('/experience');await enter('/about');assert.equal(await page.evaluate(()=>__qa.manager.currentNode),'about');await page.screenshot({path:`${root}/studio.png`});return true;
 });
 await record('reduced motion keeps character destination and removes scroll cinematics',async()=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(250);await navigate('work','/work');
  assert.equal(await page.evaluate(()=>__qa.ST.getAll().filter(t=>t.vars.id?.startsWith('route:work-')).length),0);
  await navigate('home','/');assert.equal(await page.evaluate(()=>!!__qa.ST.getById('route:home-rope')),false);
  return page.evaluate(()=>({node:__qa.manager.currentNode,profile:__qa.scene.profile,canvases:document.querySelectorAll('canvas').length}));
 });
 await record('all routes on smallest phone without horizontal overflow',async()=>{
  await page.setViewportSize({width:320,height:740});const result=[];
  for(const [id,path] of [['work','/work'],['value','/services'],['about','/about'],['contact','/contact'],['experience','/experience'],['feedback','/feedback'],['home','/']]){
   await navigate(id,path);const state=await overflow();assert.ok(state.scroll<=320,`${id}: ${JSON.stringify(state)}`);result.push({id,...state});
  }return result;
 });
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);
} catch(error) {report.failure=error.stack;console.error(error);await page.screenshot({path:`${root}/failure.png`}).catch(()=>{});process.exitCode=1;}
finally {await writeFile(`${root}/report.json`,JSON.stringify(report,null,2));await browser.close();}
