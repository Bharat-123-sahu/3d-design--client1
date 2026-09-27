import {pathToFileURL} from 'node:url';
import {writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const browser=await chromium.launch({channel:process.env.QA_BROWSER||'chrome',headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
const page=await context.newPage();
const report={checks:[],errors:[]};page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
const ready=path=>page.waitForFunction(p=>document.documentElement.dataset.appState==='content'&&location.pathname===p&&document.querySelector('.character-nav__trigger')?.getAttribute('aria-disabled')==='false',path,{timeout:30000});
async function nav(id,path){await page.locator('.character-nav__trigger').tap();await page.locator(`[data-destination="${id}"]`).tap();await ready(path);}
try {
 await page.goto('http://127.0.0.1:5173/work');await page.locator('.thunder-intro[data-intro-state="READY"]').waitFor();await page.locator('[data-intro-start]').tap();await ready('/work');
 for(const [id,path] of [['value','/services'],['about','/about'],['contact','/contact'],['work','/work'],['feedback','/feedback']])await nav(id,path);
 report.checks.push('touch-only direct Work > Services > About > Contact > Work > Feedback');
 await page.locator('.character-nav__trigger').tap();await page.screenshot({path:'artifacts/qa/touch-navigation.png'});await page.locator('.character-nav__close').tap();
 for(const width of [320,360,390,414,430]) {
  await page.setViewportSize({width,height:844});await page.waitForTimeout(250);
  const state=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,canvas:{width:document.querySelector('.character-nav canvas').width,height:document.querySelector('.character-nav canvas').height},main:{width:document.querySelector('#three-canvas canvas').width,height:document.querySelector('#three-canvas canvas').height}}));
  assert.ok(state.scroll<=width);assert.ok(state.canvas.width<=168*1.5);report.checks.push(state);
 }
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(250);await page.locator('.character-nav__trigger').tap();
 const rect=await page.locator('.character-nav__destinations').boundingBox();assert.ok(rect.x>=0&&rect.y>=0&&rect.y+rect.height<=390);await page.locator('.character-nav__close').tap();report.checks.push('landscape destinations fit');
 // Route completion must not overwrite a Back request received mid-travel.
 await page.setViewportSize({width:390,height:844});await nav('home','/');await nav('work','/work');
 await page.locator('.character-nav__trigger').tap();await page.locator('[data-destination="value"]').tap();await page.goBack();await ready('/');
 report.checks.push('Back during travel reconciles URL and visible Home');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:5173/value');await page.locator('.thunder-intro[data-intro-state="READY"]').waitFor();await page.locator('[data-intro-start]').tap();await ready('/services');report.checks.push('legacy /value direct URL resolves Services');
 assert.deepEqual(report.errors,[]);
} catch(e){report.failure=e.stack;process.exitCode=1;console.error(e);await page.screenshot({path:'artifacts/qa/touch-failure.png'});}
finally {await writeFile('artifacts/qa/touch-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();}
