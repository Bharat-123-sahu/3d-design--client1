import {pathToFileURL} from 'node:url';
import {mkdir,writeFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
page.setDefaultTimeout(45000);
page.setDefaultNavigationTimeout(90000);
const report={checks:[],assets:[],errors:[],warnings:[],requests:[]};
const out='artifacts/qa/stabilization';await mkdir(out,{recursive:true});
page.on('pageerror',e=>report.errors.push(e.message));
page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());if(e.type()==='warning')report.warnings.push(e.text());});
page.on('response',r=>{if(r.status()>=400)report.requests.push(r.url());});
const pass=s=>{report.checks.push(s);console.log('PASS',s);};
async function nav(id) {
 await page.locator('.character-nav__trigger:not([aria-disabled="true"])').click();
 await page.locator(`[data-destination="${id}"]`).click();
 await page.waitForFunction(id=>document.documentElement.dataset.appState==='content'&&__controller.destination===id&&!__scene.navManager.isMoving,id);
 await page.waitForTimeout(1000);
}
try {
 await page.goto(process.env.QA_URL||'http://127.0.0.1:5180',{waitUntil:'domcontentloaded'});
 await page.evaluate(async()=>{
  const loaded=path=>performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname===path)?.name||path;
  const {SceneController}=await import(loaded('/src/js/core/SceneController.js'));
  const state=SceneController.prototype.setState;
  SceneController.prototype.setState=function(...args){window.__controller=this;return state.apply(this,args);};
  const {ThreeScene}=await import(loaded('/src/js/three/ThreeScene.js'));
  const render=ThreeScene.prototype.renderCharacterView;
  ThreeScene.prototype.renderCharacterView=function(){window.__scene=this;return render.call(this);};
  const {ScrollTrigger}=await import(loaded('/node_modules/.vite/deps/gsap_ScrollTrigger.js'));
  window.__ST=ScrollTrigger;
 });
 await page.locator('.thunder-intro[data-intro-state="READY"]').waitFor();await page.locator('[data-intro-start]').click();
 await page.waitForFunction(()=>document.documentElement.dataset.appState==='world');await nav('home');
 await page.evaluate(()=>__scene.liquidBlob.stickerField.ready);
 report.assets=await page.evaluate(()=>[...__scene.liquidBlob.surfaceStickers.assets].map(([id,a])=>({id,status:a.status,visiblePixels:a.visiblePixels,animated:a.animated,complex:a.complex})));
 assert.equal(report.assets.length,(await readdir('public/assets/stickers')).filter(f=>f.endsWith('.svg')).length);
 for(const a of report.assets){assert.equal(a.status,'ready',a.id);assert.ok(a.visiblePixels>0,a.id);}
 pass('All 40 original SVGs parsed, decoded and rasterized, including complex and animated artwork');
 const seen=new Set();
 for(let i=0;i<40;i++) {
  const c=await page.evaluate(()=>__controller.ballCenter());
  await page.mouse.move(c.x,c.y);await page.waitForTimeout(50);
  const id=await page.evaluate(()=>__scene.liquidBlob.stickerField.target?.id);assert.ok(id);seen.add(id);
  await page.mouse.click(c.x,c.y);
  await page.waitForFunction(()=>__scene.liquidBlob.stickerField.records.some(r=>r.state==='ATTACHING'));
  await page.waitForFunction(n=>__scene.liquidBlob.stickers.length===n,i+1);
 }
 assert.equal(seen.size,40);pass('Every SVG targeted by pointer, flown and attached exactly once');
 const before=await page.evaluate(()=>__scene.liquidBlob.stickers[0].center.toArray());
 const c=await page.evaluate(()=>__controller.ballCenter());
 for(let i=0;i<70;i++){await page.mouse.click(c.x+Math.cos(i)*40,c.y+Math.sin(i)*40);await page.waitForTimeout(45);}
 await page.waitForFunction(()=>__scene.liquidBlob.stickers.length===110);
 assert.deepEqual(await page.evaluate(()=>__scene.liquidBlob.stickers[0].center.toArray()),before);
 pass('110 rapid attachments retain first anchor and grow the existing instanced geometry');
 for(const width of [360,375,390,393,414,430,768,820,1024,1280,1440]){
  await page.setViewportSize({width,height:844});await page.waitForTimeout(350);
  const ball=await page.evaluate(()=>{const b=__scene.liquidBlob;const c=__controller.ballCenter();return {...c,r:b.stickerField.radius,w:innerWidth,h:innerHeight};});
  assert.ok(ball.x-ball.r>=0&&ball.x+ball.r<=ball.w&&ball.y-ball.r>=0&&ball.y+ball.r<=ball.h,JSON.stringify(ball));
 }
 pass('Orb framing fits every requested phone/tablet/desktop width');
 await nav('work');
 assert.equal(await page.evaluate(()=>__scene.liquidBlob.stickers.length),110);
 const ids=await page.evaluate(()=>__ST.getAll().filter(t=>t.vars.id?.startsWith('route:work-')).map(t=>t.vars.id));
 assert.deepEqual(ids,['route:work-radial','route:work-dice','route:work-bird']);
 for(const id of ids)for(const p of [0.15,0.8,0.3]){
  await page.evaluate(({id,p})=>{const t=__ST.getById(id);window.scrollTo(0,t.start+(t.end-t.start)*p);__ST.update();},{id,p});
  await page.waitForTimeout(250);
  assert.ok(Math.abs(await page.evaluate(id=>__ST.getById(id).progress,id)-p)<0.03);
 }
 await nav('about');assert.equal(await page.evaluate(()=>__ST.getAll().filter(t=>t.vars.id?.startsWith('route:work-')).length),0);
 await nav('work');assert.equal(await page.evaluate(()=>__ST.getAll().filter(t=>t.vars.id?.startsWith('route:work-')).length),3);
 pass('Three Work timelines scrub forward/reverse, dispose on exit and recreate once');
 await nav('home');
 const rope=[];
 for(const p of [0.2,0.8,0.3]){
  await page.evaluate(p=>{const t=__ST.getById('route:home-video-reveal');scrollTo(0,t.start+(t.end-t.start)*p);__ST.update();},p);
  await page.waitForTimeout(1200);
  rope.push(await page.locator('.video-reveal__rope-main').getAttribute('d'));
 }
 assert.notEqual(rope[0],rope[1]);assert.notEqual(rope[1],rope[2]);
 await nav('about');assert.equal(await page.evaluate(()=>!!__ST.getById('route:home-video-reveal')),false);
 pass('Video rope follows scrub/reverse and disposes on route exit');
 await page.evaluate(()=>{window.__loss=__scene.renderer.getContext().getExtension('WEBGL_lose_context');__loss.loseContext();});
 await page.waitForTimeout(250);assert.equal(await page.locator('.has-context-loss').count(),1);
 await page.evaluate(()=>__loss.restoreContext());await page.waitForTimeout(1000);assert.equal(await page.locator('.has-context-loss').count(),0);
 pass('Shared WebGL context loss/restoration retains navigation');
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.requests,[]);
}catch(e){report.failure=e.stack;console.error(e);process.exitCode=1;await page.screenshot({path:`${out}/runtime-failure.png`});}
finally{await writeFile(`${out}/runtime-report.json`,JSON.stringify(report,null,2));await browser.close();}
