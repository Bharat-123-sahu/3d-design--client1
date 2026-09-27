import {pathToFileURL} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const channel=process.env.QA_BROWSER||'chrome';
const browser=await chromium.launch({channel,headless:true});
const directory=`artifacts/qa/destinations-${channel}`;await mkdir(directory,{recursive:true});
const report={browser:channel,checks:[],errors:[],failedRequests:[]};
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.addInitScript(()=>{
 window.__webglContexts=new Set();const getContext=HTMLCanvasElement.prototype.getContext;
 HTMLCanvasElement.prototype.getContext=function(type,...args){const context=getContext.call(this,type,...args);if(context&&/^webgl/.test(type))window.__webglContexts.add(context);return context;};
});
page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)report.failedRequests.push(`${r.status()} ${r.url()}`);});
const ready=path=>page.waitForFunction(p=>document.documentElement.dataset.appState==='content'&&location.pathname===p&&document.querySelector('.character-nav__trigger')?.getAttribute('aria-disabled')==='false',path,{timeout:30000});
async function instrument(){await page.evaluate(async()=>{
 window.__qa={samples:[],routes:[],starts:[]};
 const url=name=>performance.getEntriesByType('resource').find(entry=>entry.name.includes(name)).name;
 const {SceneController}=await import(url('/src/js/core/SceneController.js'));
 const setState=SceneController.prototype.setState;
 SceneController.prototype.setState=function(state){const result=setState.call(this,state);window.__qa.controller=this;return result;};
 const {CharacterNavigationManager}=await import(url('/src/js/core/CharacterNavigationManager.js'));const update=CharacterNavigationManager.prototype.update;
 CharacterNavigationManager.prototype.update=function(delta){update.call(this,delta);window.__qa.manager=this;if(this.isMoving)window.__qa.samples.push({time:performance.now(),speed:this.travelSpeed,state:this.navState,pose:this.model.state,position:this.model.root.position.toArray(),rotation:this.model.root.rotation.y});};
 const {ThreeScene}=await import(url('/src/js/three/ThreeScene.js'));const render=ThreeScene.prototype.renderCharacterView;
 ThreeScene.prototype.renderCharacterView=function(){render.call(this);window.__qa.scene=this;};
 window.addEventListener('routeChanged',e=>window.__qa.routes.push(e.detail.path));window.addEventListener('characterNavigating',e=>window.__qa.starts.push(e.detail));
});}
async function snapshot(){return page.evaluate(()=>{
 const canvas=document.querySelector('.character-nav canvas');const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let visible=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>50)visible++;
 const rect=document.querySelector('.character-nav__trigger').getBoundingClientRect();
 return {scale:__qa.manager.model.root.scale.x,node:__qa.manager.currentNode,state:__qa.manager.navState,position:__qa.manager.model.root.position.toArray(),visiblePixels:visible,contexts:__webglContexts.size,secondRenderer:!!__qa.scene.characterRenderer,hit:{width:rect.width,height:rect.height},overflow:document.documentElement.scrollWidth>innerWidth};
});}
async function select(id,path){await page.locator('.character-nav__trigger').click();await page.locator(`[data-destination="${id}"]`).click();await ready(path);const state=await snapshot();assert.equal(state.node,id);assert.equal(state.state,'idle');assert.ok(state.visiblePixels>100);assert.equal(state.contexts,1);assert.equal(state.secondRenderer,false);assert.equal(state.overflow,false);return state;}
async function check(name,fn){const result=await fn();report.checks.push({name,result});console.log(`PASS ${name}`);}
try {
 await page.goto('http://127.0.0.1:5173');await instrument();await page.locator('.thunder-intro[data-intro-state="READY"]').waitFor();await page.locator('[data-intro-start]').click();
 await page.waitForFunction(()=>document.documentElement.dataset.appState==='world'&&window.__qa.manager?.isLocked===false);
 await check('waits ten seconds after Start without automatic destination',async()=>{
  const before=await snapshot();await page.waitForTimeout(10000);const after=await snapshot();assert.equal(after.node,null);assert.equal(after.state,'idle');assert.deepEqual(after.position,before.position);assert.equal(await page.evaluate(()=>__qa.starts.length),0);assert.equal(await page.locator('main').innerHTML(),'');assert.equal(after.scale,0.7);assert.equal(after.contexts,1);assert.ok(after.visiblePixels>100);await page.screenshot({path:`${directory}/waiting.png`});return after;
 });
 await check('world character itself opens destinations',async()=>{
  const point=await page.evaluate(async()=>{const position=__qa.manager.model.root.position.clone();position.y+=0.55;position.project(__qa.scene.camera);return {x:(position.x+1)/2*innerWidth,y:(1-position.y)/2*innerHeight};});
  await page.mouse.click(point.x,point.y);assert.equal(await page.locator('.character-nav__trigger').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');return point;
 });
 await check('first selection Work; slower accelerated curved travel',async()=>{
  await page.evaluate(()=>__qa.samples=[]);const state=await select('work','/work');const samples=await page.evaluate(()=>__qa.samples);const moving=samples.filter(s=>s.speed>0.03);
  assert.ok(moving.length>20);const peak=Math.max(...moving.map(s=>s.speed));assert.ok(peak<=2.7);assert.ok(moving[0].speed<peak*0.3);assert.ok(moving.at(-1).speed<peak*0.3);assert.ok(samples.some(s=>s.state==='arriving'));assert.ok(samples.some(s=>s.pose==='walk'));assert.ok((moving.at(-1).time-moving[0].time)>1800);
  return {state,durationMs:moving.at(-1).time-moving[0].time,peakSpeed:peak,firstSpeed:moving[0].speed,lastSpeed:moving.at(-1).speed,poses:[...new Set(samples.map(s=>s.pose))]};
 });
 await check('Work > Services > About > Contact > Work without hamburger',async()=>{const result=[];for(const pair of [['value','/services'],['about','/about'],['contact','/contact'],['work','/work']])result.push(await select(...pair));await page.screenshot({path:`${directory}/work.png`});return result;});
 await check('every registered destination activates its configured environment',async()=>{
  const nodes=await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(e=>e.name.includes('/src/js/data/navigationData.js')).name;const {navigationNodes}=await import(url);return Object.values(navigationNodes).map(n=>({id:n.id,route:n.route,effect:n.environment.effect,marker:n.environment.marker}));});
  const results=[];
  for(const node of nodes){await select(node.id,node.route);await page.waitForTimeout(1700);const result=await page.evaluate(()=>({state:__qa.controller.currentState,effect:__qa.controller.activeEffect,marker:__qa.scene.worldScene.activeNode,heading:!!document.querySelector('main h1'),companions:document.querySelectorAll('.character-nav').length,visibleEffects:Object.entries(__qa.scene.sceneEffects).filter(([key,e])=>(e.group||e.container||e.mesh)?.visible).map(([key])=>key)}));assert.equal(result.state,node.id);assert.equal(result.effect,node.effect);assert.equal(result.marker,node.marker);assert.equal(result.heading,true);assert.equal(result.companions,1);assert.deepEqual(result.visibleEffects,[node.effect]);results.push(result);}
  await select('work','/work');return results;
 });
 await check('long journey starts walking, runs at speed, returns to walking before stop',async()=>{
  await page.evaluate(()=>__qa.samples=[]);await select('about','/about');const poses=await page.evaluate(()=>__qa.samples.map(s=>s.pose).filter((p,i,a)=>p!==a[i-1]));assert.ok(poses.includes('run'));assert.ok(poses.indexOf('walk')<poses.indexOf('run'));assert.ok(poses.lastIndexOf('walk')>poses.indexOf('run'));return poses;
 });
 await check('rapid clicks cannot start competing travel',async()=>{
  const before=await page.evaluate(()=>__qa.starts.length);await page.locator('.character-nav__trigger').click();await page.evaluate(()=>{document.querySelector('[data-destination="value"]').click();document.querySelector('[data-destination="contact"]').click();document.querySelector('[data-destination="home"]').click();});await ready('/services');assert.equal(await page.evaluate(()=>__qa.starts.length),before+1);return snapshot();
 });
 await check('resize preserves model, hit area, single renderer and no overflow',async()=>{
  const result=[];for(const width of [1920,1440,1280,1024,768,390,360]){await page.setViewportSize({width,height:width<600?844:900});await page.waitForFunction(expected=>window.__qa.manager.model.root.scale.x===expected,width<=600?0.64:width<=1024?0.76:0.7);await page.waitForFunction(()=>{const c=document.querySelector(".character-nav canvas");const p=c.getContext("2d").getImageData(0,0,c.width,c.height).data;let visible=0;for(let i=3;i<p.length;i+=4)if(p[i]>50)visible++;return visible>100;});const state=await snapshot();assert.equal(state.scale,width<=600?0.64:width<=1024?0.76:0.7);assert.ok(state.hit.width>100&&state.hit.height>150);assert.ok(state.visiblePixels>100);assert.equal(state.contexts,1);assert.equal(state.overflow,false);result.push({width,...state});}await page.screenshot({path:`${directory}/mobile.png`});return result;
 });
 await check('keyboard destinations remain available after arrival',async()=>{await page.locator('.character-nav__trigger').focus();await page.keyboard.press('Enter');await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>document.activeElement.dataset.destination),'work');await page.keyboard.press('Escape');assert.ok(await page.locator('.character-nav__trigger').evaluate(e=>e===document.activeElement));return true;});
 await check('reduced motion and navigation remain usable',async()=>{await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(200);return select('experience','/experience');});
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);
} catch(e){report.failure=e.stack;console.error(e);process.exitCode=1;await page.screenshot({path:`${directory}/failure.png`}).catch(()=>{});}
finally{await writeFile(`${directory}/report.json`,JSON.stringify(report,null,2));await browser.close();}

