import {pathToFileURL} from 'node:url';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:320,height:740},reducedMotion:'reduce'});
const visualOnly=process.env.QA_VISUAL_ONLY==='1';
const report={layouts:[],errors:[],checks:[]};
page.on('pageerror',e=>report.errors.push(e.message));
page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
const ready=path=>page.waitForFunction(p=>document.documentElement.dataset.appState==='content'&&location.pathname===p&&document.querySelector('.character-nav__trigger')?.getAttribute('aria-disabled')==='false',path,{timeout:30000});
const routes=[['home','/'],['work','/work'],['value','/services'],['about','/about'],['experience','/experience'],['contact','/contact'],['feedback','/feedback']];
try {
 await page.goto('http://127.0.0.1:5173');await page.locator('.thunder-intro[data-intro-state="READY"]').waitFor();await page.locator('[data-intro-start]').click();await ready('/');
 for(const width of (visualOnly?[390]:[320,360,375,390,414,430,768,1024,1280,1440,1920,2560])) {
  await page.setViewportSize({width,height:width<700?844:1080});await page.waitForTimeout(200);
  for(const [id,path] of routes) {
   if(new URL(page.url()).pathname!==path){await page.locator('.character-nav__trigger').click();await page.locator(`[data-destination="${id}"]`).click();await ready(path);}
   const state=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,heading:document.querySelector('main h1')?.getBoundingClientRect().width}));
   assert.ok(state.scroll<=width,`${id} at ${width}: overflow ${state.scroll}`);report.layouts.push({id,...state});
  }
 }
 report.checks.push(`${report.layouts.length} route/viewport combinations with reduced motion for layout isolation`);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/qa/feedback-top-mobile.png'});
 await page.locator('.character-nav__trigger').focus();await page.keyboard.press('Enter');await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>document.activeElement.dataset.destination),'work');await page.keyboard.press('Escape');assert.ok(await page.locator('.character-nav__trigger').evaluate(e=>e===document.activeElement));report.checks.push('keyboard Enter, arrows, Escape and focus return');
 await page.locator('.character-nav__trigger').click();await page.locator('[data-destination="home"]').click();await ready('/');await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(450);
 await page.locator('.video-reveal').scrollIntoViewIfNeeded();await page.waitForTimeout(600);const mediaRatio=await page.locator('.video-reveal__card img').evaluate(e=>e.clientWidth/e.clientHeight);assert.ok(Math.abs(mediaRatio-16/9)<0.02);report.checks.push('mobile poster maintains 16:9 aspect');await page.screenshot({path:'artifacts/qa/rope-revealed-mobile.png'});
 await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(450);await page.locator('.video-reveal').scrollIntoViewIfNeeded();await page.waitForTimeout(600);await page.screenshot({path:'artifacts/qa/rope-revealed-desktop.png'});
 await page.locator('.character-nav__trigger').click();await page.locator('[data-destination="about"]').click();await ready('/about');await page.waitForTimeout(1800);await page.screenshot({path:'artifacts/qa/studio-final.png'});
 await page.locator('.character-nav__trigger').hover();await page.waitForTimeout(600);await page.screenshot({path:'artifacts/qa/navigation-final.png'});
 await page.locator('.character-nav__close').click();
 const context=await page.evaluate(()=>{const canvas=document.querySelector('.character-nav canvas');const gl=canvas.getContext('webgl2');const extension=gl.getExtension('WEBGL_lose_context');if(!extension)return false;window.__restore=extension;extension.loseContext();return true;});
 if(context){await page.waitForTimeout(250);assert.ok(await page.locator('.has-context-loss').count());await page.evaluate(()=>window.__restore.restoreContext());await page.waitForTimeout(600);assert.equal(await page.locator('.has-context-loss').count(),0);report.checks.push('companion WebGL context loss and restoration');}
 assert.deepEqual(report.errors,[]);
} catch(e){report.failure=e.stack;console.error(e);process.exitCode=1;}
finally {await writeFile(visualOnly?'artifacts/qa/visual-report.json':'artifacts/qa/layout-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({layouts:report.layouts.length,checks:report.checks,errors:report.errors,failure:report.failure}));await browser.close();}
