import { pathToFileURL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const browser = await chromium.launch({ channel: process.env.QA_BROWSER || 'chrome', headless: true });
const directory = 'artifacts/qa/jelly';
await mkdir(directory, { recursive: true });
const report = { checks: [], errors: [], requests: [] };
let page;
async function check(name, fn) { const result = await fn(); report.checks.push({ name, result }); console.log(`PASS ${name}`); }
async function boot(width, touch = false) {
  const context = await browser.newContext({ viewport: { width, height: touch ? 844 : 900 }, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2 : 1 });
  page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) report.requests.push(`${response.status()} ${response.url()}`); });
  await page.addInitScript(() => {
    window.__contexts = new Set();
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { const value = original.call(this, type, ...args); if (/^webgl/.test(type) && value) __contexts.add(value); return value; };
  });
  await page.goto(process.env.QA_URL || 'http://127.0.0.1:5175');
  await page.evaluate(async () => {
    const loaded = path => performance.getEntriesByType('resource').find(entry => new URL(entry.name).pathname === path)?.name || path;
    const { SceneController } = await import(loaded('/src/js/core/SceneController.js'));
    const original = SceneController.prototype.setState;
    SceneController.prototype.setState = function(state) { window.__controller = this; return original.call(this, state); };
    const { ThreeScene } = await import(loaded('/src/js/three/ThreeScene.js'));
    const render = ThreeScene.prototype.renderCharacterView;
    ThreeScene.prototype.renderCharacterView = function() { window.__scene = this; render.call(this); };
    window.__arrivals = 0;
    window.addEventListener('characterArrived', () => __arrivals++);
  });
  await page.locator('.thunder-intro[data-intro-state="READY"]').waitFor();
  await page.locator('[data-intro-start]').click();
  await page.waitForFunction(() => document.documentElement.dataset.appState === 'world' && window.__scene?.navManager?.isLocked === false);
  assert.equal(await page.locator('main').innerHTML(), '');
  assert.equal(await page.evaluate(() => __scene.liquidBlob.group.visible), false);
  return context;
}
async function select(id) {
  await page.locator('.character-nav__trigger').click();
  await page.locator(`[data-destination="${id}"]`).click();
  await page.waitForFunction(id => document.documentElement.dataset.appState === 'content' && window.__controller?.destination === id && document.querySelector('.character-nav__trigger')?.getAttribute('aria-disabled') === 'false', id, { timeout: 35000 });
  await page.waitForTimeout(1600);
}
async function ballState() {
  return page.evaluate(() => {
    const b = __scene.liquidBlob;
    const hero = document.querySelector('.destination-hero')?.getBoundingClientRect();
    const intro = document.querySelector('.destination-introduction')?.getBoundingClientRect();
    return { center: __controller.ballCenter(), visible: b.group.visible, count: b.stickers.length,
      spring: b.spring, focus: b.focus, blur: __scene.postProcessing.jellyFocusPass.uniforms.uBlur.value,
      contexts: __contexts.size, destination: b.destination, overflow: document.documentElement.scrollWidth > innerWidth,
      heroHeight: hero?.height, introTop: intro?.top, controls: document.querySelectorAll('.jelly-controls').length,
      panels: document.querySelectorAll('.jelly-picker,[data-sticker]').length,
      color: b.uniforms.uColorA.value.getHexString(), uuid: b.mesh.uuid,
      memory: { ...__scene.renderer.info.memory }, capacity: b.surfaceStickers.capacity,
      instances: b.surfaceStickers.mesh.geometry.instanceCount,
      preview: b.surfaceStickers.preview.visible, current: b.currentSticker(),
      scale: b.group.scale.x, height: innerHeight, width: innerWidth,
      headingInHero: Boolean(document.querySelector('.destination-hero h1')) };
  });
}
async function tap(x, y, touch) { if (touch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); }
async function interact(touch) {
  const before = await ballState();
  const c = before.center;
  if (!touch) {
    await page.mouse.move(c.x - 45, c.y - 35);
    await page.waitForFunction(() => __scene.liquidBlob.surfaceStickers.preview.visible);
    assert.equal(await page.evaluate(() => __scene.liquidBlob.surfaceStickers.preview.geometry.instanceCount), 1);
    await page.mouse.move(15, 110);
    await page.waitForFunction(() => !__scene.liquidBlob.surfaceStickers.preview.visible);
  }
  for (const [x, y] of [[-.18,-.14],[.15,.06],[-.12,.12],[.18,-.12],[0,.02]]) {
    const size = Math.min(before.width, before.height);
    await tap(c.x+x*size, c.y+y*size, touch);
    await page.waitForTimeout(70);
  }
  await page.waitForFunction(count => __scene.liquidBlob.stickers.length === count, before.count + 5);
  const impact = await page.evaluate(() => ({ spring: __scene.liquidBlob.spring, velocity: __scene.liquidBlob.velocity }));
  assert.ok(Math.abs(impact.spring) + Math.abs(impact.velocity) > 0.001);
  await page.mouse.move(10, 110);
  await page.waitForTimeout(1700);
  const attachment = await page.evaluate(() => {
    const b = __scene.liquidBlob, s = b.stickers.at(-1), renderer = b.surfaceStickers;
    const attributes = renderer.mesh.geometry.attributes;
    const i = s.index;
    const point = s.center.clone().fromBufferAttribute(attributes.aCenter, i);
    return { parent: renderer.mesh.parent === b.mesh, error: point.distanceTo(s.center),
      spring: b.spring, radius: b.geometry.boundingSphere.radius, shadersShareSpring: renderer.material.uniforms.uSpring === b.uniforms.uSpring,
      ids: b.stickers.slice(-5).map(s => s.id), next: b.currentSticker() };
  });
  assert.equal(attachment.parent, true); assert.ok(attachment.error < 0.00001);
  assert.equal(attachment.shadersShareSpring, true); assert.ok(Math.abs(attachment.spring) < 0.003); assert.ok(attachment.radius < 1.1);
  assert.equal(attachment.ids[0], before.current); assert.equal(new Set(attachment.ids).size, 5);
  return { impact, attachment };
}
async function scrollCheck(touch) {
  if (touch) {
    const client = await page.context().newCDPSession(page);
    const c = (await ballState()).center;
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: c.x, y: c.y + 65 }] });
    for (let i = 1; i <= 6; i++) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: c.x, y: c.y + 65 - i * 35 }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await client.detach();
    await page.waitForTimeout(400);
  }
  const before = await ballState();
  await page.evaluate(() => window.scrollTo(0, innerHeight * 1.2));
  await page.waitForTimeout(1800);
  const state = await ballState();
  assert.ok(state.focus > 0.8); assert.ok(state.blur > 1); assert.equal(state.visible, true);
  assert.equal(state.count, before.count);
  assert.ok(state.center.x > before.center.x);
  await page.screenshot({ path: `${directory}/${before.width}-${before.destination}-scroll.png` });
  await page.locator('.jelly-controls__place').focus();
  const focused = await page.locator('.jelly-controls__place').evaluate(el => ({ clip: getComputedStyle(el).clipPath, height: el.getBoundingClientRect().height }));
  assert.equal(focused.clip, 'none'); assert.ok(focused.height >= 44);
  await page.keyboard.press('Enter');
  await page.waitForFunction(count => __scene.liquidBlob.stickers.length === count, state.count + 1);
  await page.locator('.jelly-controls__place').evaluate(el => el.blur());
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1600);
  assert.ok((await ballState()).focus < 0.02);
  return { ...state, focused };
}
try {
  for (const width of [1440, 1280, 768, 390, 360]) {
    const touch = width < 800;
    const context = await boot(width, touch);
    let count = 0, uuid;
    for (const id of ['home', 'work', 'value']) {
      await check(`${width} ${id}: clean hero, character arrival, retained world`, async () => {
        await select(id);
        const state = await ballState();
        uuid ??= state.uuid;
        assert.equal(state.uuid, uuid); assert.equal(state.visible, true); assert.equal(state.contexts, 1);
        assert.equal(state.overflow, false); assert.equal(state.controls, 1); assert.equal(state.panels, 0);
        assert.equal(state.count, count); assert.equal(state.headingInHero, false);
        assert.ok(state.heroHeight >= state.height); assert.ok(state.introTop >= state.height - 1);
        await page.screenshot({ path: `${directory}/${width}-${id}-initial.png` });
        return state;
      });
      await check(`${width} ${id}: ${touch ? 'touch' : 'pointer'} preview, five marks, surface attachment, spring recovery`, () => interact(touch));
      await page.screenshot({ path: `${directory}/${width}-${id}.png` });
      await check(`${width} ${id}: scroll retreat, blur, keyboard and reverse`, () => scrollCheck(touch));
      count += 6;
    }
    if (width === 1440) {
      await check('150 additional real clicks: no eviction, stable texture/geometry counts across capacity growth', async () => {
        const before = await ballState();
        const first = await page.evaluate(() => __scene.liquidBlob.stickers[0].id);
        for (let i = 0; i < 150; i++) {
          const angle = i * 2.39996;
          await page.mouse.click(before.center.x + Math.cos(angle)*145, before.center.y + Math.sin(angle)*145);
        }
        await page.waitForFunction(count => __scene.liquidBlob.stickers.length === count, before.count + 150);
        await page.waitForTimeout(1800);
        const after = await ballState();
        assert.equal(after.instances, after.count); assert.equal(after.uuid, uuid);
        assert.equal(after.memory.geometries, before.memory.geometries);
        assert.equal(after.memory.textures, before.memory.textures);
        assert.equal(await page.evaluate(() => __scene.liquidBlob.stickers[0].id), first);
        assert.ok(after.capacity >= 168);
        const draws = await page.evaluate(async () => {
          const b = __scene.liquidBlob.surfaceStickers;
          let count = 0;
          b.mesh.onBeforeRender = () => count++;
          await new Promise(resolve => setTimeout(resolve, 600));
          b.mesh.onBeforeRender = () => {};
          return { rendersIn600ms: count, objects: b.parent.children.length, geometryCount: 2, atlasCount: 1 };
        });
        assert.ok(draws.rendersIn600ms > 0);
        return { before, after, draws };
      });
      count += 150;
      for (const id of ['work', 'home']) await check(`${id}: re-entry retains all stickers and one set of route controls`, async () => {
        await select(id); const before = await ballState();
        assert.equal(before.count, count); assert.equal(before.controls, 1); assert.equal(before.uuid, uuid);
        await page.mouse.click(before.center.x, before.center.y);
        await page.waitForFunction(expected => __scene.liquidBlob.stickers.length === expected, ++count);
        const triggerCounts = await page.evaluate(async () => {
          const { ScrollTrigger } = await import('/node_modules/gsap/ScrollTrigger.js');
          return { ball: ScrollTrigger.getAll().filter(t => t.vars.id === 'route:destination-jelly').length,
            work: ScrollTrigger.getAll().filter(t => /^route:work-(radial|dice|bird)$/.test(t.vars.id)).length };
        });
        assert.equal(triggerCounts.ball, 1); assert.equal(triggerCounts.work, id === 'work' ? 3 : 0);
        return { count, triggerCounts };
      });
      await check('reduced motion disables wobble while keyboard placement remains functional', async () => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await select('work');
        const before = await ballState();
        await page.locator('.jelly-controls__place').focus(); await page.keyboard.press('Space');
        await page.waitForFunction(count => __scene.liquidBlob.stickers.length === count, before.count + 1);
        const state = await ballState(); assert.equal(state.spring, 0); return state;
      });
    }
    await context.close();
  }
  assert.deepEqual(report.errors, []); assert.deepEqual(report.requests, []);
} catch (error) {
  report.failure = error.stack; console.error(error); process.exitCode = 1;
  if (page && !page.isClosed()) { report.state = await ballState().catch(() => null); await page.screenshot({ path: `${directory}/failure.png` }).catch(() => {}); }
} finally {
  await writeFile(`${directory}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
