import {pathToFileURL} from 'node:url';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:3});
const report={checks:[],errors:[]};page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
await page.addInitScript(()=>{window.navigationStarts=0;window.addEventListener('characterNavigating',()=>window.navigationStarts++);});
const ready=path=>page.waitForFunction(p=>document.documentElement.dataset.appState==='content'&&location.pathname===p&&document.querySelector('.character-nav__trigger')?.getAttribute('aria-disabled')==='false',path,{timeout:30000});
try {
 await page.goto('http://127.0.0.1:5173/about');await page.locator('.thunder-intro[data-intro-state="READY"]').waitFor();await page.locator('[data-intro-start]').tap();
 await page.waitForFunction(()=>document.documentElement.dataset.appState==='world'&&document.querySelector('.character-nav canvas'));await page.waitForTimeout(3000);
 assert.equal(await page.evaluate(()=>navigationStarts),0);assert.equal(await page.locator('main').innerHTML(),'');report.checks.push('390px deep URL still waits for explicit input after Start');
 await page.screenshot({path:'artifacts/qa/navigation-only-touch-waiting.png'});
 for(const [id,path] of [['work','/work'],['value','/services'],['about','/about'],['contact','/contact'],['work','/work'],['home','/']]){
  await page.locator('.character-nav__trigger').tap();
  const targets=await page.locator('.character-nav__orbit a').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().height));assert.ok(targets.every(h=>h>=44));
  await page.locator(`[data-destination="${id}"]`).tap();
  if(id==='value'){await page.waitForTimeout(450);await page.setViewportSize({width:360,height:780});}
  await ready(path);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const visible=await page.locator('.character-nav canvas').evaluate(canvas=>{const d=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;return d.some((v,i)=>i%4===3&&v>100);});assert.ok(visible);
  report.checks.push(`${id} selected by touch; character remains visible`);
 }
 await page.locator('.character-nav__trigger').tap();await page.screenshot({path:'artifacts/qa/navigation-only-touch-menu.png'});await page.locator('.character-nav__close').tap();
 const area=await page.locator('.character-nav__trigger').boundingBox();assert.ok(area.width>=100&&area.height>=150);report.checks.push('360px hit area retained and resize during travel completes safely');
 assert.deepEqual(report.errors,[]);
} catch(e){report.failure=e.stack;console.error(e);process.exitCode=1;}
finally{await writeFile('artifacts/qa/navigation-only-touch-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();}
