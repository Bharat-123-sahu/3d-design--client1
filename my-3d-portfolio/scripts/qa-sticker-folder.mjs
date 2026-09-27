import { pathToFileURL } from 'node:url';
import { mkdir, writeFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const directory = 'artifacts/qa/sticker-folder';
await mkdir(directory, { recursive: true });
const report = { assets: [], interactions: [], checks: [], errors: [], failedRequests: [] };
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, hasTouch: true });
page.on('pageerror', e => report.errors.push(e.message));
page.on('console', e => { if (e.type() === 'error') report.errors.push(e.text()); });
page.on('response', r => { if (r.status() >= 400) report.failedRequests.push(r.url()); });
const count = () => page.evaluate(() => __scene.liquidBlob.stickers.length);
async function select(id) {
  await page.locator('.character-nav__trigger').click();
  await page.locator(`[data-destination="${id}"]`).click();
  await page.waitForFunction(id => document.documentElement.dataset.appState === 'content' && __controller.destination === id && document.querySelector('.character-nav__trigger')?.getAttribute('aria-disabled') === 'false', id, { timeout: 35000 });
  await page.waitForTimeout(1200);
}
async function clickSticker() {
  const c = await page.evaluate(() => __controller.ballCenter());
  await page.mouse.move(c.x, c.y);
  // An actual mouse event selects; subsequent clicks select the next available record.
  await page.waitForTimeout(40);
  const target = await page.evaluate(() => __scene.liquidBlob.stickerField.target?.id);
  const before = await count();
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForFunction(() => __scene.liquidBlob.stickerField.records.some(r => r.state === 'ATTACHING'));
  const flight = await page.evaluate(() => {
    const r = __scene.liquidBlob.stickerField.records.find(r => r.state === 'ATTACHING');
    window.__flightRecord = r;
    return { id: r.id, slot: r.slot, state: r.state, start: r.start.toArray(), transform: r.element.style.transform, source: r.element.querySelector('img').src };
  });
  await page.waitForFunction(() => __flightRecord.flightProgress > 0.12);
  const mid = await page.evaluate(() => ({ transform: __flightRecord.element.style.transform, progress: __flightRecord.flightProgress }));
  assert.equal(flight.id, target, 'Highlighted ID is the exact traveling ID');
  assert.notEqual(mid.transform, flight.transform);
  if (!before) await page.screenshot({ path: `${directory}/travel.png` });
  await page.waitForFunction(n => __scene.liquidBlob.stickers.length === n + 1, before);
  const attached = await page.evaluate(() => {
    const b = __scene.liquidBlob, r = __flightRecord;
    const saved = b.stickers.find(s => s.record === r);
    const attributes = b.surfaceStickers.mesh.geometry.attributes;
    return { id: saved.id, sameRecord: saved.record === r, state: r.state, elementRemoved: r.element === null,
      tile: attributes.aMark.getX(r.index), expectedTile: b.surfaceStickers.ids.indexOf(r.id),
      parent: b.surfaceStickers.mesh.parent === b.mesh,
      error: Math.hypot(attributes.aCenter.getX(r.index)-r.center.x, attributes.aCenter.getY(r.index)-r.center.y, attributes.aCenter.getZ(r.index)-r.center.z) };
  });
  assert.equal(attached.id, flight.id); assert.equal(attached.sameRecord, true); assert.equal(attached.state, 'ATTACHED');
  assert.equal(attached.elementRemoved, true); assert.equal(attached.parent, true); assert.equal(attached.tile, attached.expectedTile); assert.ok(attached.error < 1e-6);
  report.interactions.push({ ...flight, moving: true, attached });
  console.log(`PASS ${flight.id}: native image > target > curved travel > same surface record`);
}
try {
  await page.goto(process.env.QA_URL || 'http://127.0.0.1:5175');
  await page.evaluate(async () => {
    const loaded = path => performance.getEntriesByType('resource').find(entry => new URL(entry.name).pathname === path)?.name || path;
    const { SceneController } = await import(loaded('/src/js/core/SceneController.js'));
    const state = SceneController.prototype.setState;
    SceneController.prototype.setState = function(s) { window.__controller = this; return state.call(this, s); };
    const { ThreeScene } = await import(loaded('/src/js/three/ThreeScene.js'));
    const render = ThreeScene.prototype.renderCharacterView;
    ThreeScene.prototype.renderCharacterView = function() { window.__scene = this; return render.call(this); };
  });
  await page.locator('.thunder-intro[data-intro-state="READY"]').waitFor();
  await page.locator('[data-intro-start]').click();
  await page.waitForFunction(() => document.documentElement.dataset.appState === 'world' && window.__scene?.navManager?.isLocked === false);
  await select('home');
  await page.evaluate(() => __scene.liquidBlob.stickerField.ready);
  report.assets = await page.evaluate(() => {
    const s = __scene.liquidBlob.surfaceStickers;
    return s.ids.map(id => { const a = s.assets.get(id); return { id, animated: a.animated, complex: a.complex, visiblePixels: a.visiblePixels, status: a.status, src: a.src }; });
  });
  const files = (await readdir('public/assets/stickers', { recursive: true })).filter(f => /\.svg$/i.test(f));
  assert.equal(report.assets.length, files.length);
  assert.deepEqual(report.assets.map(a => a.id).sort(), files.map(f => f.replaceAll('\\', '/').replace(/\.svg$/i, '')).sort());
  for (const asset of report.assets) { assert.equal(asset.status, 'ready'); assert.ok(asset.visiblePixels > 0, asset.id); }
  await page.screenshot({ path: `${directory}/desktop-field.png` });
  const floatingBefore = await page.evaluate(() => __scene.liquidBlob.stickerField.records.map(r => r.element.style.transform));
  await page.waitForTimeout(400);
  const floatingAfter = await page.evaluate(() => __scene.liquidBlob.stickerField.records.map(r => r.element.style.transform));
  floatingBefore.forEach((value, i) => assert.notEqual(value, floatingAfter[i]));
  report.checks.push('All assets parse, decode, rasterize with nontransparent pixels, enter field and float');
  // Native images next to their exact atlas tiles: review originals vs attachment artwork.
  const catalog = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  const atlas = await page.evaluate(() => __scene.liquidBlob.surfaceStickers.canvas.toDataURL());
  const grid = await page.evaluate(() => __scene.liquidBlob.surfaceStickers.grid);
  await catalog.setContent(`<body style="margin:0;background:#10111c;color:#ddd;font:12px system-ui;display:grid;grid-template-columns:repeat(5,1fr)"></body>`);
  await catalog.evaluate(({ assets, atlas, grid }) => {
    assets.forEach((a, i) => {
      const cell = document.createElement('div'); cell.style.cssText='height:155px;padding:12px;border:1px solid #222';
      const image = document.createElement('img'); image.src = a.src; image.style.cssText='width:112px;height:112px;object-fit:contain'; image.dataset.id=a.id;
      const tile = document.createElement('span'); tile.style.cssText=`display:inline-block;width:112px;height:112px;background-image:url(${atlas});background-size:${grid*112}px ${grid*112}px;background-position:-${i%grid*112}px -${Math.floor(i/grid)*112}px`;
      const label = document.createElement('div'); label.textContent=`${a.id} | ${a.animated?'animated':'static'}`;
      cell.append(image,tile,label); document.body.append(cell);
    });
  }, { assets: report.assets, atlas, grid });
  await catalog.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth));
  await catalog.screenshot({ path: `${directory}/all-artwork.png`, fullPage: true });
  for (const asset of report.assets.filter(a => a.animated)) {
    const image = catalog.locator(`img[data-id="${asset.id}"]`);
    const first = await image.screenshot({ animations: 'allow' });
    await catalog.waitForTimeout(230);
    const second = await image.screenshot({ animations: 'allow' });
    asset.nativeAnimationChanges = !first.equals(second);
    assert.equal(asset.nativeAnimationChanges, true, `Native SVG animation: ${asset.id}`);
  }
  await catalog.close();
  report.checks.push('Every animated SVG changes pixels in native browser presentation');
  for (let i = 0; i < files.length; i++) await clickSticker();
  assert.equal(new Set(report.interactions.map(r => r.id)).size, files.length);
  report.checks.push('Every SVG completed the real pointer/click pipeline with exact record identity and local surface anchor');
  await page.screenshot({ path: `${directory}/attached.png` });
  // Exercise growth across the old 64-instance boundary with real pointer clicks.
  const firstAnchor = await page.evaluate(() => __scene.liquidBlob.stickers[0].center.toArray());
  const c = await page.evaluate(() => __controller.ballCenter());
  for (let i = 0; i < 70; i++) { await page.mouse.click(c.x + Math.cos(i*2.4)*85, c.y + Math.sin(i*2.4)*85); await page.waitForTimeout(35); }
  await page.waitForFunction(() => __scene.liquidBlob.stickers.length === 110);
  const stress = await page.evaluate(() => { const b=__scene.liquidBlob; return { count:b.stickers.length, instances:b.surfaceStickers.mesh.geometry.instanceCount, capacity:b.surfaceStickers.capacity, anchor:b.stickers[0].center.toArray() }; });
  assert.equal(stress.count, 110); assert.equal(stress.instances, 110); assert.ok(stress.capacity >= 110); assert.deepEqual(stress.anchor, firstAnchor);
  report.checks.push({ retained110: stress });
  await select('work');
  assert.equal(await count(), 110);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `${directory}/mobile-field.png` });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.locator('.jelly-controls__place').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => __scene.liquidBlob.stickers.length === 111);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(500);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => __scene.liquidBlob.stickers.length === 112);
  await page.locator('.jelly-controls__place').evaluate(el => el.blur());
  const mobileCenter = await page.evaluate(() => __controller.ballCenter());
  await page.touchscreen.tap(mobileCenter.x, mobileCenter.y);
  await page.waitForFunction(() => __scene.liquidBlob.stickers.length === 113);
  await page.evaluate(() => scrollTo(0, innerHeight));
  await page.waitForTimeout(500);
  assert.equal(await count(), 113);
  await page.evaluate(() => scrollTo(0, 0));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await select('home');
  assert.equal(await count(), 113);
  assert.equal(await page.locator('.sticker-field').count(), 1);
  report.checks.push('Attachments survive navigation and scrolling; mobile overflow, touch, keyboard and reduced-motion placement pass; one field after re-entry');
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedRequests, []);
} catch (error) {
  report.failure = error.stack; console.error(error); process.exitCode = 1;
  await page.screenshot({ path: `${directory}/failure.png` }).catch(() => {});
} finally {
  await writeFile(`${directory}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
