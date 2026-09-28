import { navigationNodes } from '../data/navigationData.js';
import { stickerLibrary } from '../data/stickerData.js';
import { trackDisposer } from '../utils/animationRegistry.js';

/** Route-owned input only. The preview and attached artwork are real 3D meshes. */
export function mountDestinationHero(root, destination, controller) {
  const config = navigationNodes[destination]?.ball;
  const hero = root.querySelector('.hero');
  if (!config || !hero || !controller?.threeScene) return;
  hero.classList.add('destination-hero');
  hero.dataset.destinationHero = destination;
  hero.style.removeProperty('padding-top');
  hero.style.removeProperty('padding-bottom');
  root.classList.add('has-jelly-hero');
  root.style.setProperty('--jelly-accent', config.glow);
  // Preserve the actual page copy and its reveal hooks, below the first viewport.
  const introduction = document.createElement('section');
  introduction.className = 'destination-introduction';
  const content = hero.querySelector(':scope > .container');
  if (content) introduction.append(content);
  hero.after(introduction);
  const cue = document.createElement('span');
  cue.className = 'destination-hero__cue';
  cue.setAttribute('aria-hidden', 'true');
  hero.append(cue);

  // A focus-only equivalent gives keyboard users direct placement, with no menu.
  const controls = document.createElement('aside');
  controls.className = 'jelly-controls';
  controls.setAttribute('aria-label', 'Interactive orb');
  controls.innerHTML = '<button class="jelly-controls__place" type="button">Place sticker on orb</button><p class="sr-only" aria-live="polite" data-status></p>';
  document.body.append(controls);
  const button = controls.querySelector('button');
  const status = controls.querySelector('[data-status]');
  const abort = new AbortController();
  const listen = (target, event, fn, options = {}) => target.addEventListener(event, fn, { ...options, signal: abort.signal });
  let down = null, previous = null, alive = true, hover = null;
  const active = () => document.documentElement.dataset.appState === 'content' && !document.documentElement.classList.contains('has-dialog');
  const describe = () => {
    const id = controller.currentSticker();
    button.setAttribute('aria-label', `Place ${stickerLibrary[id]?.label || 'next sticker'} on orb`);
  };
  describe();
  listen(window, 'routeChanged', describe);
  const attach = async hit => {
    const id = controller.currentSticker();
    try {
      const pending = controller.attachSticker(id, hit);
      describe();
      if (hover) controller.previewSticker(controller.hitBall(hover.x, hover.y));
      if (await pending && alive) status.textContent = `${stickerLibrary[id].label} attached. ${stickerLibrary[controller.currentSticker()].label} ready.`;
    } catch {
      if (alive) status.textContent = 'Artwork could not load. Try again.';
    }
  };
  listen(button, 'click', () => {
    if (!active()) return;
    const center = controller.ballCenter();
    const hit = center && controller.hitBall(center.x, center.y);
    if (hit) attach(hit);
  });
  const blocked = target => target.closest('a,button,input,textarea,select,label,h1,h2,h3,p,li,nav,.character-nav,.jelly-controls,[role="dialog"],.work-card,.gallery-card,.service-row,.work-cinematic');
  listen(document, 'pointerdown', event => {
    down = active() && event.button === 0 && event.isPrimary && !blocked(event.target) ? { x: event.clientX, y: event.clientY, scroll: scrollY, id: event.pointerId } : null;
  }, { passive: true });
  listen(document, 'pointercancel', () => { down = null; });
  listen(document, 'pointerup', event => {
    const start = down; down = null;
    if (!active() || !start || event.pointerId !== start.id || blocked(event.target) || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10 || Math.abs(scrollY - start.scroll) > 8) return;
    const hit = controller.hitBall(event.clientX, event.clientY);
    if (hit) attach(hit);
  }, { passive: true });
  const clearHover = () => { hover = previous = null; controller.previewSticker(null); };
  listen(document, 'pointermove', event => {
    if (!active() || event.pointerType !== 'mouse' || blocked(event.target)) { clearHover(); return; }
    const now = performance.now();
    if (previous && now - previous.time < 24) return;
    const speed = previous ? Math.hypot(event.clientX - previous.x, event.clientY - previous.y) / Math.max(16, now - previous.time) : 0;
    previous = { x: event.clientX, y: event.clientY, time: now };
    hover = { x: event.clientX, y: event.clientY };
    const hit = controller.hitBall(event.clientX, event.clientY);
    controller.previewSticker(hit);
    if (hit) controller.impactBall(hit, Math.min(0.2, 0.015 + speed * 0.05));
  }, { passive: true });
  listen(document.documentElement, 'pointerleave', clearHover);
  listen(window, 'blur', clearHover);
  listen(window, 'scroll', clearHover, { passive: true });
  trackDisposer(() => {
    alive = false;
    clearHover();
    abort.abort();
    controls.remove();
    root.classList.remove('has-jelly-hero');
    root.style.removeProperty('--jelly-accent');
  });
}
