import * as THREE from "three";
import gsap from "gsap";

export const STICKER_STATE = Object.freeze({
  AVAILABLE: "AVAILABLE",
  TARGETED: "TARGETED",
  ATTACHING: "ATTACHING",
  ATTACHED: "ATTACHED",
});

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
    this.layer = document.createElement("div");
    this.layer.className = "sticker-field";
    this.layer.setAttribute("aria-hidden", "true");
    Object.assign(this.layer.style, {
      position: "fixed",
      inset: "0",
      overflow: "hidden",
      pointerEvents: "none",
      zIndex: "0",
      visibility: "hidden",
    });
    document.body.append(this.layer);
    this.ready = Promise.allSettled(
      this.surface.ids.map(async (id, slot) => {
        await this.surface.load(id);
        if (!this.destroyed) this.spawn(id, slot);
      }),
    );
  }

  spawn(id, slot) {
    const asset = this.surface.assets.get(id);
    if (asset?.status !== "ready") return;
    const element = document.createElement("div");
    Object.assign(element.style, {
      position: "absolute",
      width: "100px",
      height: "100px",
      left: "0",
      top: "0",
      transformOrigin: "50% 50%",
      visibility: "hidden",
    });
    const image = asset.image.cloneNode();
    image.alt = "";
    image.draggable = false;
    Object.assign(image.style, {
      width: "100%",
      height: "100%",
      objectFit: "contain",
      padding: "4.6875%",
      boxSizing: "border-box",
    });
    image.onerror = () => {
      element.style.visibility = "hidden";
      this.surface.report(
        id,
        "background image",
        new Error("Native image failed after preload"),
      );
    };
    element.append(image);
    this.layer.append(element);
    const record = {
      id,
      slot,
      element,
      state: STICKER_STATE.AVAILABLE,
      emphasis: 0,
      phase: slot * 2.399963,
      depth: slot % 3,
      accent: asset.accent,
      position: new THREE.Vector3(),
      screen: { x: 0, y: 0 },
      size: 0,
      rotation: 0,
      generation: this.generation,
    };
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
    if (this.target?.state === STICKER_STATE.TARGETED)
      this.setState(this.target, STICKER_STATE.AVAILABLE);
    this.target = null;
    this.lockedTarget = null;
  }

  pickRandomAvailable() {
    let available = this.records.filter(
      (r) => r.state === STICKER_STATE.AVAILABLE && r.size,
    );
    if (!available.length) {
      this.generation++;
      this.surface.ids.forEach((id, slot) => this.spawn(id, slot));
      available = this.records.filter(
        (r) => r.state === STICKER_STATE.AVAILABLE && r.size,
      );
    }
    if (!available.length) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  select(x, y) {
    this.pointer = { x, y };
    if (!this.camera || !this.visible) {
      this.clearTarget();
      return null;
    }
    const ball = this.project(this.blob.group.position);
    const radius = this.radius;
    if (Math.hypot(x - ball.x, y - ball.y) > radius + 100) {
      this.clearTarget();
      return null;
    }

    if (this.lockedTarget) {
      if (
        this.lockedTarget.state === STICKER_STATE.TARGETED &&
        (!this.lockOrigin ||
          Math.hypot(x - this.lockOrigin.x, y - this.lockOrigin.y) < 60)
      ) {
        return this.lockedTarget;
      }
      this.lockedTarget = null;
    }

    let best = null,
      score = Infinity;
    for (const record of this.records) {
      if (
        ![STICKER_STATE.AVAILABLE, STICKER_STATE.TARGETED].includes(
          record.state,
        ) ||
        !record.size
      )
        continue;
      // Small hysteresis prevents flickering between neighboring candidates.
      const distance =
        Math.hypot(record.screen.x - x, record.screen.y - y) *
        (record === this.target ? 0.91 : 1);
      if (distance < score) {
        score = distance;
        best = record;
      }
    }
    if (!best && !this.target) {
      best = this.pickRandomAvailable();
    }
    if (best !== this.target) {
      this.clearTarget();
      this.target = best;
      if (best) this.setState(best, STICKER_STATE.TARGETED);
    }
    return best;
  }

  project(world) {
    const p = world.clone().project(this.camera),
      r = this.rect;
    return {
      x: r.left + ((p.x + 1) * r.width) / 2,
      y: r.top + ((1 - p.y) * r.height) / 2,
    };
  }

  update(delta, camera) {
    this.camera = camera;
    this.rect = document.querySelector("#three-canvas").getBoundingClientRect();
    this.visible =
      this.blob.group.visible &&
      this.blob.reveal.value > 0.05 &&
      document.documentElement.dataset.appState === "content" &&
      !document.documentElement.classList.contains("has-dialog");
    this.layer.style.visibility = this.visible ? "visible" : "hidden";
    if (!this.visible) return;
    this.time += this.blob.reduced ? 0 : delta;
    const { width, height, left, top } = this.rect;
    const ball = this.project(this.blob.group.position);
    const distance = this.blob.layout.z;
    this.radius =
      ((this.blob.group.scale.x /
        (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance)) *
        height) /
      2;
    const easing = this.blob.reduced ? 1 : 1 - Math.exp(-delta * 8);
    for (const record of this.records) {
      if (
        record.state === STICKER_STATE.ATTACHED ||
        record.state === STICKER_STATE.ATTACHING
      )
        continue;
      const { depth, phase, slot } = record;
      const ring = Math.floor(slot / 3),
        count = Math.ceil(this.surface.ids.length / 3);
      const baseAngle =
        ((ring + depth / 3) / count) * Math.PI * 2 - Math.PI / 2;

      // Dynamic zigzag & organic continuous floating motion
      const speed = this.blob.reduced ? 0 : 1.4;
      const t = this.time * speed + phase;

      const zigzagX = this.blob.reduced
        ? 0
        : Math.sin(t * 1.6 + slot * 0.8) * 32 +
          Math.cos(t * 0.85 + slot * 1.5) * 20 +
          Math.sin(t * 3.1 + phase) * 12;

      const zigzagY = this.blob.reduced
        ? 0
        : Math.cos(t * 1.4 + phase * 1.3) * 36 +
          Math.sin(t * 0.75 + slot * 1.8) * 24 +
          Math.cos(t * 2.8 + slot) * 14;

      const angleSway = this.blob.reduced
        ? 0
        : Math.sin(t * 0.65 + phase * 0.9) * 0.15;
      const angle = baseAngle + angleSway;

      const orbitWobble = this.blob.reduced
        ? 0
        : Math.sin(t * 1.1 + slot) * (width * 0.04);

      const parallax =
        this.pointer && !this.blob.reduced
          ? ((this.pointer.x - left) / width - 0.5) * (3 - depth) * 12
          : 0;

      let x =
        left +
        width / 2 +
        Math.cos(angle) * (width * (0.36 + depth * 0.041) + orbitWobble) +
        parallax +
        zigzagX;
      let y =
        top +
        height / 2 +
        Math.sin(angle) * (height * (0.35 + depth * 0.044) + orbitWobble) +
        zigzagY;

      record.emphasis +=
        ((record === this.target ? 1 : 0) - record.emphasis) * easing;
      const e = record.emphasis;

      // Larger size for background stickers
      record.size = Math.min(width * 0.2, 128 - depth * 16) * (1 + e * 0.2);

      // Keep native presentation outside the orb silhouette; no images over its rear surface.
      const dx = x - ball.x,
        dy = y - ball.y,
        length = Math.hypot(dx, dy);
      const clearance = this.radius + record.size * 0.52;
      if (length < clearance) {
        x = ball.x + (dx / Math.max(length, 1)) * clearance;
        y = ball.y + (dy / Math.max(length, 1)) * clearance;
      }
      x = THREE.MathUtils.clamp(
        x,
        left + record.size / 2 + 4,
        left + width - record.size / 2 - 4,
      );
      y = THREE.MathUtils.clamp(
        y,
        top + record.size / 2 + 65,
        top + height - record.size / 2 - 20,
      );
      record.screen = { x, y };

      // Real camera-space depth, used as the flight's start point.
      const z = distance + 1 + depth;
      const h = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * z;
      record.position
        .set(
          (((x - left) / width) * 2 - 1) * h * camera.aspect,
          (1 - ((y - top) / height) * 2) * h,
          -z,
        )
        .applyMatrix4(camera.matrixWorld);

      // Lively rotation tilting & bobbing
      record.rotation = this.blob.reduced
        ? 0
        : Math.sin(t * 1.5 + phase) * 18 +
          Math.cos(t * 0.75 + slot) * 12 +
          Math.sin(t * 2.9) * 6;

      const scalePulse = this.blob.reduced
        ? 1
        : 1 + Math.sin(t * 1.3 + phase) * 0.08;

      const style = record.element.style;
      style.visibility = "inherit";
      style.transform = `translate(${x - 50}px,${y - 50}px) rotate(${record.rotation}deg) scale(${((record.size / 100) * scalePulse).toFixed(3)})`;
      style.opacity = String(
        ((0.42 - depth * 0.07) * (1 - e) + 0.95 * e) *
          this.blob.reveal.value *
          (1 - this.blob.focus * 0.7),
      );
      if (!this.blob.lowPower || record._lastEmphasis !== e) {
        record._lastEmphasis = e;
        const newFilter = this.blob.lowPower
          ? `drop-shadow(0 4px 6px rgba(0,0,0,0.5)) drop-shadow(0 0 ${e * 10}px rgba(${record.accent},${e * 0.25}))`
          : `blur(${(0.08 + depth * 0.25) * (1 - e)}px) drop-shadow(0 4px 6px rgba(0,0,0,0.5)) drop-shadow(0 0 ${e * 10}px rgba(${record.accent},${e * 0.25})) brightness(${1 + e * 0.15})`;
        if (record._currentFilter !== newFilter) {
          record._currentFilter = newFilter;
          style.filter = newFilter;
        }
      }
    }
    if (!this.target && this.pointer)
      this.select(this.pointer.x, this.pointer.y);
  }

  fly(record, center, tangent) {
    if (
      !record ||
      record !== this.target ||
      record.state !== STICKER_STATE.TARGETED
    )
      return Promise.resolve(null);

    // Direct paste onto the 3D surface immediately!
    const index = this.surface.add(
      record.id,
      center,
      tangent,
      this.blob.reduced,
    );
    record.index = index;
    record.center = center;
    record.tangent = tangent;
    this.setState(record, STICKER_STATE.ATTACHED);

    // Quick pop/fade of the background element
    if (record.element) {
      gsap.to(record.element, {
        scale: 0,
        opacity: 0,
        duration: 0.15,
        ease: "power2.in",
        onComplete: () => {
          record.element?.remove();
          record.element = null;
        },
      });
    }

    this.target = null;
    this.lockedTarget = null;

    // Refill only after a whole field is used, retaining every attached instance.
    if (
      !this.records.some(
        (r) =>
          r.state === STICKER_STATE.AVAILABLE ||
          r.state === STICKER_STATE.TARGETED,
      )
    ) {
      this.generation++;
      this.surface.ids.forEach((id, slot) => this.spawn(id, slot));
    }

    // Immediately pick the next random available sticker to point on cursor
    const nextRandom = this.pickRandomAvailable();
    if (nextRandom) {
      this.target = nextRandom;
      this.lockedTarget = nextRandom;
      this.lockOrigin = { x: this.pointer?.x || 0, y: this.pointer?.y || 0 };
      this.setState(nextRandom, STICKER_STATE.TARGETED);
    }

    return Promise.resolve(record);
  }

  hide() {
    this.visible = false;
    this.pointer = null;
    this.clearTarget();
    this.layer.style.visibility = "hidden";
  }
  destroy() {
    this.destroyed = true;
    for (const record of this.records) {
      record.tween?.kill();
      record.resolve?.(null);
    }
    this.records.length = 0;
    this.layer.remove();
  }
}
