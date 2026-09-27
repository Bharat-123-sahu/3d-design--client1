import {pathToFileURL} from 'node:url';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1280,height:900}});
const report={checks:[],errors:[],failedRequests:[]};
page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});page.on('response',r=>{if(r.status()>=400)report.failedRequests.push(r.url());});
const ready=path=>page.waitForFunction(p=>document.documentElement.dataset.appState==='content'&&location.pathname===p&&document.querySelector('.character-nav__trigger')?.getAttribute('aria-disabled')==='false',path,{timeout:30000});
try {
 await page.goto('http://127.0.0.1:4173/work#work-grid');await page.locator('.thunder-intro[data-intro-state="READY"]').waitFor();await page.locator('[data-intro-start]').click();await ready('/work');
 assert.ok(await page.evaluate(()=>scrollY>1000));assert.ok(Math.abs(await page.locator('#work-grid').evaluate(e=>e.getBoundingClientRect().top))<100);report.checks.push('production direct /work#work-grid and intro preserves hash target');
 for(const [id,path] of [['value','/services'],['feedback','/feedback'],['home','/']]) {await page.locator('.character-nav__trigger').click();await page.locator(`[data-destination="${id}"]`).click();await ready(path);}
 report.checks.push('production Work > Services > Feedback > Home');
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedRequests,[]);
} catch(e){report.failure=e.stack;console.error(e);process.exitCode=1;}
finally{await writeFile('artifacts/qa/production-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();}
