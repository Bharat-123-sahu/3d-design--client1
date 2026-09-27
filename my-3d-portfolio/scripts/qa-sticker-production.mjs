import { pathToFileURL } from 'node:url';
import { writeFile, mkdir, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const report = { checks: [], errors: [], failedRequests: [] };
page.on('pageerror', e => report.errors.push(e.message));
page.on('console', e => { if (e.type() === 'error') report.errors.push(e.text()); });
page.on('response', r => { if (r.status() >= 400) report.failedRequests.push(r.url()); });
const directory = 'artifacts/qa/sticker-folder';
await mkdir(directory, { recursive: true });
try {
  await page.goto(process.env.QA_URL || 'http://127.0.0.1:4175');
  await page.locator('.thunder-intro[data-intro-state="READY"]').waitFor();
  await page.locator('[data-intro-start]').click();
  await page.waitForFunction(() => document.documentElement.dataset.appState === 'world');
  await page.locator('.character-nav__trigger').click();
  await page.locator('[data-destination="home"]').click();
  await page.waitForFunction(() => document.documentElement.dataset.appState === 'content');
  await page.waitForTimeout(1600);
  const files = (await readdir('public/assets/stickers', { recursive: true })).filter(f => /\.svg$/i.test(f));
  await page.waitForFunction(count => document.querySelectorAll('.sticker-field img').length === count && [...document.querySelectorAll('.sticker-field img')].every(i => i.complete && i.naturalWidth), files.length);
  report.checks.push(`${files.length} production SVG images decoded`);
  for (let i = 0; i < 5; i++) {
    await page.mouse.move(640 + Math.cos(i*2.4)*60, 450 + Math.sin(i*2.4)*60);
    await page.waitForTimeout(80);
    const target = page.locator('.sticker-field [data-state="TARGETED"]');
    const id = await target.getAttribute('data-sticker-id');
    await page.mouse.down(); await page.mouse.up();
    const traveling = page.locator(`.sticker-field [data-sticker-id="${id}"]`);
    await page.waitForFunction(id => document.querySelector(`.sticker-field [data-sticker-id="${id}"]`)?.dataset.state === 'ATTACHING', id);
    await traveling.waitFor({ state: 'detached' });
    assert.match(await page.locator('[data-status]').textContent(), /attached/);
    report.checks.push(`Production target ${id} travels and attaches`);
  }
  await page.mouse.move(10, 100);
  await page.screenshot({ path: `${directory}/production.png` });
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []);
} catch (error) {
  report.failure = error.stack; process.exitCode = 1; console.error(error);
} finally {
  await writeFile(`${directory}/production-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  await browser.close();
}
