import {pathToFileURL} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
const report={checks:[],errors:[],requests:[]};
page.on('pageerror',e=>report.errors.push(e.message));
page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
page.on('response',r=>{if(r.status()>=400)report.requests.push(r.url());});
const url=process.env.QA_URL||'http://127.0.0.1:4180';
const ready=path=>page.waitForFunction(p=>location.pathname===p&&document.documentElement.dataset.appState==='content'&&document.querySelector('.character-nav__trigger')?.getAttribute('aria-disabled')==='false',path,{timeout:45000});
async function start(path){await page.locator('.thunder-intro[data-intro-state="READY"]').waitFor();await page.locator('[data-intro-start]').tap();await ready(path);}
async function nav(id,path){await page.locator('.character-nav__trigger').tap();await page.locator(`[data-destination="${id}"]`).tap();await ready(path);}
const pass=s=>{report.checks.push(s);console.log('PASS',s);};
try {
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 for(const path of ['/home','/work','/about','/services','/experience','/contact','/feedback']){
  await page.goto(url+path);await start(path==='/home'?'/':path);
  await cdp.send('Network.clearBrowserCache');
  await page.reload();await start(path==='/home'?'/':path);
  pass(`Cache-disabled hard refresh ${path}`);
 }
 await nav('home','/');await nav('work','/work');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(300);
 await page.locator('.character-nav__trigger').tap();await page.locator('[data-destination="value"]').tap();
 await page.goBack();await ready('/');
 await page.goForward();await ready('/work');
 pass('Back during animated travel reconciles URL/content; Forward restores Work');
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.requests,[]);
}catch(e){report.failure=e.stack;process.exitCode=1;console.error(e);}
finally{await mkdir('artifacts/qa/stabilization',{recursive:true});await writeFile('artifacts/qa/stabilization/history-report.json',JSON.stringify(report,null,2));await browser.close();}
