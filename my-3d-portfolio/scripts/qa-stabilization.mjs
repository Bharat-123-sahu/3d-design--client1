import { pathToFileURL } from 'node:url';
import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const url = process.env.QA_URL || 'http://127.0.0.1:4180';
const out = 'artifacts/qa/stabilization';
await mkdir(out, { recursive: true });
const report = { checks: [], layouts: [], errors: [], warnings: [], requests: [] };
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const watch = page => {
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('console', e => { if(e.type() === 'error') report.errors.push(e.text()); if(e.type() === 'warning') report.warnings.push(e.text()); });
  page.on('response', r => { if(r.status() >= 400) report.requests.push({url:r.url(),status:r.status()}); });
};
const ready = (page, path) => page.waitForFunction(p => document.documentElement.dataset.appState === 'content' && location.pathname === p && !!document.querySelector('main h1'), path, {timeout:45000});
async function start(page, path) {
  await page.locator('.thunder-intro[data-intro-state="READY"]').waitFor({timeout:45000});
  await page.locator('[data-intro-start]').click();
  if(path === 'world') await page.waitForFunction(() => document.documentElement.dataset.appState === 'world');
  else await ready(page,path);
}
const routes = [['home','/'],['work','/work'],['about','/about'],['value','/services'],['experience','/experience'],['contact','/contact'],['feedback','/feedback']];
async function nav(page,id,path) {
  if(await page.evaluate(p => location.pathname === p && document.documentElement.dataset.appState === 'content',path)) return;
  await page.locator('.character-nav__trigger:not([aria-disabled="true"])').click();
  await page.locator(`[data-destination="${id}"]`).click();
  await ready(page,path);
  await page.locator('.character-nav__trigger[aria-disabled="false"]').waitFor();
}
function pass(message) { report.checks.push(message); console.log('PASS',message); }
try {
  assert.equal((await readFile('dist/_redirects','utf8')).trim(),'/* /index.html 200');
  const files = await readdir('public',{recursive:true,withFileTypes:true});
  for(const file of files.filter(f=>f.isFile())) {
    const relative = `${file.parentPath || file.path}/${file.name}`.replaceAll('\\','/').replace(/^.*?public\//,'');
    assert.deepEqual(await readFile(`dist/${relative}`), await readFile(`public/${relative}`),relative);
  }
  pass('Production fallback and every public asset copied byte-for-byte');
  const context = await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const page = await context.newPage(); watch(page);
  await page.goto(url); await start(page,'world');
  assert.equal(await page.locator('main h1').count(),0);
  await nav(page,'home','/'); await page.reload(); await start(page,'/');
  pass('Fresh root START enters world; refresh after Home restores Home');
  for(const path of ['/home','/work','/about','/services','/experience','/contact','/feedback','/team','/company','/value','/work/']) {
    const canonical = path === '/home' ? '/' : path === '/value' ? '/services' : path.replace(/\/$/,'');
    const tab = await context.newPage(); watch(tab);
    const response = await tab.goto(url + path); assert.equal(response.status(),200);
    await start(tab,canonical);
    await tab.reload(); await start(tab,canonical);
    assert.equal(await tab.locator('#three-canvas canvas').count(),1);
    await tab.close(); pass(`Direct/new-tab + refresh ${path}`);
  }
  await nav(page,'work','/work'); await nav(page,'about','/about');
  await page.goBack(); await ready(page,'/work');
  await page.goForward(); await ready(page,'/about');
  pass('Browser Back and Forward restore destination content');
  await page.goto(url+'/work#work-grid'); await start(page,'/work');
  assert.ok(Math.abs(await page.locator('#work-grid').evaluate(e=>e.getBoundingClientRect().top))<100);
  pass('Direct hash deep link reaches Work grid');
  for(const width of [360,375,390,393,414,430,768,820,1024,1280,1440,1920]) {
    await page.setViewportSize({width,height:width<700?844:1000});
    await page.waitForTimeout(250);
    for(const [id,path] of routes) {
      await nav(page,id,path);
      const layout = await page.evaluate(() => ({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,main:!!document.querySelector('main h1'),canvases:document.querySelectorAll('#three-canvas canvas').length,fields:document.querySelectorAll('.sticker-field').length,controls:document.querySelectorAll('.jelly-controls').length}));
      assert.ok(layout.scrollWidth <= width,`${path} ${width}: ${layout.scrollWidth}`);
      assert.equal(layout.canvases,1); assert.equal(layout.fields,1); assert.ok(layout.controls<=1);
      report.layouts.push({path,...layout});
    }
    pass(`Seven destinations at ${width}px: no document overflow or duplicated render surfaces`);
  }
  await page.screenshot({path:`${out}/desktop.png`});
  await context.close();

  const touch = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3});
  const mobile = await touch.newPage(); watch(mobile);
  await mobile.goto(url+'/home'); await start(mobile,'/'); await mobile.waitForTimeout(1200);
  assert.equal(await mobile.locator('.cursor-ring').evaluate(e=>getComputedStyle(e).display),'none');
  const visible = await mobile.locator('.sticker-field > div').evaluateAll(es=>es.filter(e=>getComputedStyle(e).display!=='none').length);
  assert.ok(visible>=8 && visible<=15,`mobile sticker count ${visible}`);
  for(let i=0;i<4;i++) {
    await mobile.touchscreen.tap(195+i*8,422);
    await mobile.waitForFunction(() => /attached/.test(document.querySelector('[data-status]')?.textContent || ''));
    await mobile.waitForTimeout(500);
    assert.match(await mobile.locator('[data-status]').textContent(),/attached/);
  }
  pass('Real touch input attaches stickers; mobile background count bounded; cursor hidden');
  for(const [id,path] of routes.slice(1)) await nav(mobile,id,path);
  await nav(mobile,'home','/');
  await mobile.locator('.video-reveal').scrollIntoViewIfNeeded();
  await mobile.mouse.wheel(0,450); await mobile.waitForTimeout(1200);
  await mobile.screenshot({path:`${out}/mobile-reveal.png`});
  await mobile.mouse.wheel(0,-450); await mobile.waitForTimeout(1200);
  assert.ok(await mobile.locator('.video-reveal__rope-main').getAttribute('d'));
  assert.ok(await mobile.locator('.video-reveal__poster').evaluate(e=>e.complete&&e.naturalWidth>0));
  pass('Normal-motion touch navigation and forward/reverse reveal with valid poster/rope');
  await mobile.setViewportSize({width:844,height:390}); await mobile.waitForTimeout(300);
  await mobile.locator('.character-nav__trigger').tap();
  const menu = await mobile.locator('.character-nav__destinations').boundingBox();
  assert.ok(menu.x>=0&&menu.y>=0&&menu.y+menu.height<=390);
  await mobile.locator('.character-nav__close').tap();
  pass('Landscape touch navigation menu fits viewport');
  await touch.close();
  const fallback = await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const fallbackErrors = [];
  fallback.on('pageerror',e=>fallbackErrors.push(e.message));
  await fallback.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type,...args) {
      return /^webgl|experimental-webgl/.test(type) ? null : getContext.call(this,type,...args);
    };
  });
  await fallback.goto(url+'/work'); await ready(fallback,'/work');
  assert.ok(await fallback.locator('html.no-webgl').count());
  await fallback.locator('#hamburger-btn').click();
  await fallback.locator('.navbar__mobile-link[href="/about"]').click();
  await ready(fallback,'/about');
  assert.deepEqual(fallbackErrors,[]);
  await fallback.close();
  pass('WebGL unavailable: content and mobile navigation remain usable without uncaught errors');
  assert.deepEqual(report.errors,[]); assert.deepEqual(report.requests,[]);
} catch(error) { report.failure=error.stack; process.exitCode=1; console.error(error); }
finally { await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)); await browser.close(); }
