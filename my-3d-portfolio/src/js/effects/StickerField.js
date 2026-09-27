import * as THREE from 'three';
import gsap from 'gsap';

export const STICKER_STATE = Object.freeze({ AVAILABLE: 'AVAILABLE', TARGETED: 'TARGETED', ATTACHING: 'ATTACHING', ATTACHED: 'ATTACHED' });

/** Native SVG presentation, projected through the orb's existing camera.
 * One record/element travels; on arrival its renderer becomes a surface instance.
 * Image documents isolate SVG IDs/styles and preserve their native animations.
 */
export class StickerField {
  constructor(blob) {
    this.blob = blob;
    this.surface = blob.surfaceStickers;
    this.records = [];
    this.target = null;
    this.pointer = null;
    this.time = 0;
    this.generation = 0;
    this.layer = document.createElement('div');
    this.layer.className = 'sticker-field';
    this.layer.setAttribute('aria-hidden', 'true');
    Object.assign(this.layer.style, { position: 'fixed', inset: '0', overflow: 'hidden', pointerEvents: 'none', zIndex: '0', visibility: 'hidden' });
    document.body.append(this.layer);
    this.ready = Promise.allSettled(this.surface.ids.map(async (id, slot) => {
      await this.surface.load(id);
      if (!this.destroyed) this.spawn(id, slot);
    }));
  }

  spawn(id, slot) {
    const asset = this.surface.assets.get(id);
    if (asset?.status !== 'ready') return;
    const element = document.createElement('div');
    Object.assign(element.style, { position: 'absolute', width: '100px', height: '100px', left: '0', top: '0', transformOrigin: '50% 50%', visibility: 'hidden' });
    const image = asset.image.cloneNode();
    image.alt = '';
    image.draggable = false;
    Object.assign(image.style, { width: '100%', height: '100%', objectFit: 'contain', padding: '4.6875%', boxSizing: 'border-box' });
    image.onerror = () => { element.style.visibility = 'hidden'; this.surface.report(id, 'background image', new Error('Native image failed after preload')); };
    element.append(image);
    this.layer.append(element);
    const record = { id, slot, element, state: STICKER_STATE.AVAILABLE, emphasis: 0, phase: slot * 2.399963,
      depth: slot % 3, accent: asset.accent, position: new THREE.Vector3(), screen: { x: 0, y: 0 }, size: 0, rotation: 0, generation: this.generation };
    element.dataset.stickerId = id;
    element.dataset.state = record.state;
    this.records.push(record);
    return record;
  }

  setState(record, state) {
    record.state = state;
    if (record.element) record.element.dataset.state = state;
  }

  clearTarget() {
    if (this.target?.state === STICKER_STATE.TARGETED) this.setState(this.target, STICKER_STATE.AVAILABLE);
    this.target = null;
  }

  select(x, y) {
    this.pointer = { x, y };
    if (!this.camera || !this.visible) { this.clearTarget(); return null; }
    const ball = this.project(this.blob.group.position);
    const radius = this.radius;
    if (Math.hypot(x - ball.x, y - ball.y) > radius + 100) { this.clearTarget(); return null; }
    let best = null, score = Infinity;
    for (const record of this.records) {
      if (![STICKER_STATE.AVAILABLE, STICKER_STATE.TARGETED].includes(record.state) || !record.size) continue;
      // Small hysteresis prevents flickering between neighboring candidates.
      const distance = Math.hypot(record.screen.x - x, record.screen.y - y) * (record === this.target ? 0.91 : 1);
      if (distance < score) { score = distance; best = record; }
    }
    if (best !== this.target) {
      this.clearTarget();
      this.target = best;
      if (best) this.setState(best, STICKER_STATE.TARGETED);
    }
    return best;
  }

  project(world) {
    const p = world.clone().project(this.camera), r = this.rect;
    return { x: r.left + (p.x + 1) * r.width / 2, y: r.top + (1 - p.y) * r.height / 2 };
  }

  update(delta, camera) {
    this.camera = camera;
    this.rect = document.querySelector('#three-canvas').getBoundingClientRect();
    this.visible = this.blob.group.visible && this.blob.reveal.value > 0.05 && document.documentElement.dataset.appState === 'content' && !document.documentElement.classList.contains('has-dialog');
    this.layer.style.visibility = this.visible ? 'visible' : 'hidden';
    if (!this.visible) return;
    this.time += this.blob.reduced ? 0 : delta;
    const { width, height, left, top } = this.rect;
    const ball = this.project(this.blob.group.position);
    const distance = this.blob.layout.z;
    this.radius = this.blob.group.scale.x / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance) * height / 2;
    const easing = this.blob.reduced ? 1 : 1 - Math.exp(-delta * 8);
    for (const record of this.records) {
      if (record.state === STICKER_STATE.ATTACHED || record.state === STICKER_STATE.ATTACHING) continue;
      const { depth, phase, slot } = record;
      const ring = Math.floor(slot / 3), count = Math.ceil(this.surface.ids.length / 3);
      const angle = (ring + depth / 3) / count * Math.PI * 2 - Math.PI / 2;
      const parallax = this.pointer && !this.blob.reduced ? ((this.pointer.x - left) / width - 0.5) * (3 - depth) * 7 : 0;
      const float = this.blob.reduced ? 0 : Math.sin(this.time * 0.38 + phase) * (4 + depth * 2);
      let x = left + width / 2 + Math.cos(angle) * width * (0.36 + depth * 0.041) + parallax;
      let y = top + height / 2 + Math.sin(angle) * height * (0.35 + depth * 0.044) + float;
      record.emphasis += ((record === this.target ? 1 : 0) - record.emphasis) * easing;
      const e = record.emphasis;
      record.size = Math.min(width * 0.14, 84 - depth * 16) * (1 + e * 0.12);
      // Keep native presentation outside the orb silhouette; no images over its rear surface.
      const dx = x - ball.x, dy = y - ball.y, length = Math.hypot(dx, dy);
      const clearance = this.radius + record.size * 0.52;
      if (length < clearance) { x = ball.x + dx / Math.max(length, 1) * clearance; y = ball.y + dy / Math.max(length, 1) * clearance; }
      x = THREE.MathUtils.clamp(x, left + record.size / 2 + 4, left + width - record.size / 2 - 4);
      y = THREE.MathUtils.clamp(y, top + record.size / 2 + 65, top + height - record.size / 2 - 20);
      record.screen = { x, y };
      // Real camera-space depth, used as the flight's start point.
      const z = distance + 1 + depth;
      const h = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * z;
      record.position.set(((x-left)/width*2-1) * h * camera.aspect, (1-(y-top)/height*2) * h, -z).applyMatrix4(camera.matrixWorld);
      record.rotation = Math.sin(this.time * 0.23 + phase) * (this.blob.reduced ? 0 : 7) + Math.cos(phase) * 9;
      const style = record.element.style;
      style.visibility = 'inherit';
      style.transform = `translate(${x-50}px,${y-50}px) rotate(${record.rotation}deg) scale(${record.size/100})`;
      style.opacity = String(((0.19 - depth * 0.055) * (1-e) + 0.72 * e) * this.blob.reveal.value * (1 - this.blob.focus * 0.7));
      style.filter = `blur(${(0.12+depth*0.5)*(1-e)}px) drop-shadow(0 3px 3px rgba(0,0,0,0.45)) drop-shadow(0 0 ${e*7}px rgba(${record.accent},${e*0.18})) brightness(${1+e*0.09})`;
    }
    if (!this.target && this.pointer) this.select(this.pointer.x, this.pointer.y);
  }

  fly(record, center, tangent) {
    if (!record || record !== this.target || record.state !== STICKER_STATE.TARGETED) return Promise.resolve(null);
    this.setState(record, STICKER_STATE.ATTACHING);
    this.target = null;
    const start = record.position.clone(), startSize = record.size, startRotation = record.rotation * Math.PI / 180;
    const progress = { value: 0 };
    record.start = start.clone();
    record.center = center;
    record.tangent = tangent;
    return new Promise(resolve => {
      record.resolve = resolve;
      record.tween = gsap.to(progress, { value: 1, duration: this.blob.reduced ? 0 : 0.88, ease: 'power2.inOut',
        onUpdate: () => {
          if (!this.camera || this.destroyed) return;
          const t = progress.value;
          this.blob.mesh.updateWorldMatrix(true, false);
          const local = this.blob.deform(center.x, center.y, center.z, new THREE.Vector3(), 0.007);
          const end = this.blob.mesh.localToWorld(local);
          const control = start.clone().lerp(end, 0.48).add(new THREE.Vector3(0, 0.6, 0.45).applyQuaternion(this.camera.quaternion));
          const position = start.clone().multiplyScalar((1-t)**2).addScaledVector(control, 2*(1-t)*t).addScaledVector(end, t*t);
          const p = this.project(position);
          const endScreen = this.project(end);
          const bitangent = new THREE.Vector3().crossVectors(center, tangent);
          const edge = direction => {
            const n = center.clone().addScaledVector(direction, 0.215).normalize();
            return this.project(this.blob.mesh.localToWorld(this.blob.deform(n.x, n.y, n.z, new THREE.Vector3(), 0.007)));
          };
          const right = edge(tangent), up = edge(bitangent);
          const spin = startRotation + Math.sin(t*Math.PI) * 0.25;
          const s = startSize / 100;
          const mix = THREE.MathUtils.lerp;
          const a = mix(Math.cos(spin)*s, (right.x-endScreen.x)/50, t);
          const b = mix(Math.sin(spin)*s, (right.y-endScreen.y)/50, t);
          const c = mix(-Math.sin(spin)*s, -(up.x-endScreen.x)/50, t);
          const d = mix(Math.cos(spin)*s, -(up.y-endScreen.y)/50, t);
          record.element.style.transform = `translate(${p.x-50}px,${p.y-50}px) matrix(${a},${b},${c},${d},0,0)`;
          record.element.style.opacity = String(0.72 + 0.28 * Math.min(1,t*3));
          record.element.style.filter = `drop-shadow(0 ${3*(1-t)}px ${4*(1-t)}px rgba(0,0,0,0.4))`;
          record.flightProgress = t;
        },
        onComplete: () => {
          if (this.destroyed) { resolve(null); return; }
          const index = this.surface.add(record.id, center, tangent, this.blob.reduced);
          record.index = index;
          this.setState(record, STICKER_STATE.ATTACHED);
          record.element.remove();
          record.element = null;
          record.tween = null;
          record.resolve = null;
          resolve(record);
          // Refill only after a whole field is used, retaining every attached instance.
          if (!this.records.some(r => r.state === STICKER_STATE.AVAILABLE || r.state === STICKER_STATE.TARGETED)) {
            this.generation++;
            this.surface.ids.forEach((id, slot) => this.spawn(id, slot));
          }
        },
      });
    });
  }

  hide() { this.visible = false; this.pointer = null; this.clearTarget(); this.layer.style.visibility = 'hidden'; }
  destroy() {
    this.destroyed = true;
    for (const record of this.records) { record.tween?.kill(); record.resolve?.(null); }
    this.records.length = 0;
    this.layer.remove();
  }
}
