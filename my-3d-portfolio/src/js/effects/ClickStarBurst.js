import * as THREE from "three";
import { soundFX } from "./SoundFX.js";

/**
 * ClickStarBurst
 * Premium procedural 3D star/spark burst effect on ball click/tap.
 *
 * Generates cinematic procedural star shapes (✦, ✧, ★, +, ◆, ●) using
 * an instanced billboard shader with an offscreen-rendered atlas texture.
 * Completely GPU-instanced (single draw call), zero GC per frame, with
 * an object pool supporting rapid overlapping clicks.
 */

const MAX_PARTICLES = 160;

// Atlas layout: 3 columns x 2 rows (each tile 256x256 inside a 768x512 canvas)
const ATLAS_COLS = 3;
const ATLAS_ROWS = 2;
const TILE_SIZE = 256;

function createStarAtlas() {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_COLS * TILE_SIZE;
  canvas.height = ATLAS_ROWS * TILE_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: false });

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const drawTile = (col, row, drawFn) => {
    const cx = col * TILE_SIZE + TILE_SIZE / 2;
    const cy = row * TILE_SIZE + TILE_SIZE / 2;
    ctx.save();
    drawFn(ctx, cx, cy, TILE_SIZE / 2);
    ctx.restore();
  };

  // Tile 0 (0,0): ✦ Solid 4-Point Flare Star
  drawTile(0, 0, (c, cx, cy, radius) => {
    const R = radius * 0.88;
    const r = R * 0.12;
    c.beginPath();
    c.moveTo(cx, cy - R);
    c.quadraticCurveTo(cx + r, cy - r, cx + R, cy);
    c.quadraticCurveTo(cx + r, cy + r, cx, cy + R);
    c.quadraticCurveTo(cx - r, cy + r, cx - R, cy);
    c.quadraticCurveTo(cx - r, cy - r, cx, cy - R);
    c.closePath();

    const grad = c.createRadialGradient(cx, cy, 0, cx, cy, R);
    grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
    grad.addColorStop(0.3, "rgba(255, 255, 255, 0.95)");
    grad.addColorStop(0.7, "rgba(255, 255, 255, 0.55)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0.0)");
    c.fillStyle = grad;
    c.fill();

    // Subtle soft glow halo
    const halo = c.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.45);
    halo.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    halo.addColorStop(1, "rgba(255, 255, 255, 0.0)");
    c.fillStyle = halo;
    c.beginPath();
    c.arc(cx, cy, radius * 0.45, 0, Math.PI * 2);
    c.fill();
  });

  // Tile 1 (1,0): ✧ Hollow / Refined 4-Point Star
  drawTile(1, 0, (c, cx, cy, radius) => {
    const R = radius * 0.84;
    const r = R * 0.14;
    c.beginPath();
    c.moveTo(cx, cy - R);
    c.quadraticCurveTo(cx + r, cy - r, cx + R, cy);
    c.quadraticCurveTo(cx + r, cy + r, cx, cy + R);
    c.quadraticCurveTo(cx - r, cy + r, cx - R, cy);
    c.quadraticCurveTo(cx - r, cy - r, cx, cy - R);
    c.closePath();

    c.lineWidth = 9;
    c.strokeStyle = "rgba(255, 255, 255, 0.92)";
    c.stroke();

    // Center jewel glint
    const core = c.createRadialGradient(cx, cy, 0, cx, cy, r * 1.4);
    core.addColorStop(0, "rgba(255, 255, 255, 1.0)");
    core.addColorStop(1, "rgba(255, 255, 255, 0.0)");
    c.fillStyle = core;
    c.beginPath();
    c.arc(cx, cy, r * 1.4, 0, Math.PI * 2);
    c.fill();
  });

  // Tile 2 (2,0): ★ 5-Point Cinematic Star
  drawTile(2, 0, (c, cx, cy, radius) => {
    const R = radius * 0.82;
    const r = R * 0.42;
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 === 0 ? R : r;
      const x = cx + Math.cos(angle) * rad;
      const y = cy + Math.sin(angle) * rad;
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.closePath();

    const grad = c.createRadialGradient(cx, cy, 0, cx, cy, R);
    grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
    grad.addColorStop(0.4, "rgba(255, 255, 255, 0.9)");
    grad.addColorStop(0.85, "rgba(255, 255, 255, 0.5)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0.0)");
    c.fillStyle = grad;
    c.fill();
  });

  // Tile 3 (0,1): ✚ Cross Spark / Optical Glint
  drawTile(0, 1, (c, cx, cy, radius) => {
    const len = radius * 0.88;
    const thick = 14;

    // Horizontal beam
    const hGrad = c.createLinearGradient(cx - len, cy, cx + len, cy);
    hGrad.addColorStop(0, "rgba(255, 255, 255, 0.0)");
    hGrad.addColorStop(0.5, "rgba(255, 255, 255, 1.0)");
    hGrad.addColorStop(1, "rgba(255, 255, 255, 0.0)");
    c.fillStyle = hGrad;
    c.beginPath();
    c.moveTo(cx - len, cy);
    c.quadraticCurveTo(cx, cy - thick / 2, cx + len, cy);
    c.quadraticCurveTo(cx, cy + thick / 2, cx - len, cy);
    c.closePath();
    c.fill();

    // Vertical beam
    const vGrad = c.createLinearGradient(cx, cy - len, cx, cy + len);
    vGrad.addColorStop(0, "rgba(255, 255, 255, 0.0)");
    vGrad.addColorStop(0.5, "rgba(255, 255, 255, 1.0)");
    vGrad.addColorStop(1, "rgba(255, 255, 255, 0.0)");
    c.fillStyle = vGrad;
    c.beginPath();
    c.moveTo(cx, cy - len);
    c.quadraticCurveTo(cx - thick / 2, cy, cx, cy + len);
    c.quadraticCurveTo(cx + thick / 2, cy, cx, cy - len);
    c.closePath();
    c.fill();

    // Center optical core
    const core = c.createRadialGradient(cx, cy, 0, cx, cy, thick * 1.5);
    core.addColorStop(0, "rgba(255, 255, 255, 1.0)");
    core.addColorStop(1, "rgba(255, 255, 255, 0.0)");
    c.fillStyle = core;
    c.beginPath();
    c.arc(cx, cy, thick * 1.5, 0, Math.PI * 2);
    c.fill();
  });

  // Tile 4 (1,1): ◆ Elongated Diamond Spark
  drawTile(1, 1, (c, cx, cy, radius) => {
    const H = radius * 0.92;
    const W = radius * 0.28;
    c.beginPath();
    c.moveTo(cx, cy - H);
    c.lineTo(cx + W, cy);
    c.lineTo(cx, cy + H);
    c.lineTo(cx - W, cy);
    c.closePath();

    const grad = c.createRadialGradient(cx, cy, 0, cx, cy, H);
    grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
    grad.addColorStop(0.35, "rgba(255, 255, 255, 0.95)");
    grad.addColorStop(0.8, "rgba(255, 255, 255, 0.5)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0.0)");
    c.fillStyle = grad;
    c.fill();
  });

  // Tile 5 (2,1): ● Micro Glowing Spark Core
  drawTile(2, 1, (c, cx, cy, radius) => {
    const R = radius * 0.85;
    const grad = c.createRadialGradient(cx, cy, 0, cx, cy, R);
    grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
    grad.addColorStop(0.18, "rgba(255, 255, 255, 0.9)");
    grad.addColorStop(0.5, "rgba(255, 255, 255, 0.35)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0.0)");
    c.fillStyle = grad;
    c.beginPath();
    c.arc(cx, cy, R, 0, Math.PI * 2);
    c.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Compute UV offsets for each shape index 0..5
const SHAPE_UV_OFFSETS = [
  // col 0, row 0
  new THREE.Vector4(
    0 / ATLAS_COLS,
    1 / ATLAS_ROWS,
    1 / ATLAS_COLS,
    1 / ATLAS_ROWS,
  ),
  // col 1, row 0
  new THREE.Vector4(
    1 / ATLAS_COLS,
    1 / ATLAS_ROWS,
    1 / ATLAS_COLS,
    1 / ATLAS_ROWS,
  ),
  // col 2, row 0
  new THREE.Vector4(
    2 / ATLAS_COLS,
    1 / ATLAS_ROWS,
    1 / ATLAS_COLS,
    1 / ATLAS_ROWS,
  ),
  // col 0, row 1
  new THREE.Vector4(
    0 / ATLAS_COLS,
    0 / ATLAS_ROWS,
    1 / ATLAS_COLS,
    1 / ATLAS_ROWS,
  ),
  // col 1, row 1
  new THREE.Vector4(
    1 / ATLAS_COLS,
    0 / ATLAS_ROWS,
    1 / ATLAS_COLS,
    1 / ATLAS_ROWS,
  ),
  // col 2, row 1
  new THREE.Vector4(
    2 / ATLAS_COLS,
    0 / ATLAS_ROWS,
    1 / ATLAS_COLS,
    1 / ATLAS_ROWS,
  ),
];

class StarParticle {
  constructor() {
    this.active = false;
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.color = new THREE.Color();
    this.baseScale = new THREE.Vector2(0.2, 0.2);
    this.rotation = 0;
    this.rotSpeed = 0;
    this.age = 0;
    this.lifespan = 0.6;
    this.shapeIndex = 0;
    this.drag = 3.2;
  }
}

export class ClickStarBurst {
  constructor(scene) {
    this.scene = scene;
    this.texture = createStarAtlas();

    // Setup InstancedBufferGeometry with a unit quad
    const baseGeo = new THREE.PlaneGeometry(1, 1);
    this.geometry = new THREE.InstancedBufferGeometry();
    this.geometry.index = baseGeo.index;
    this.geometry.attributes.position = baseGeo.attributes.position;
    this.geometry.attributes.uv = baseGeo.attributes.uv;

    // Instanced attributes
    this.positions = new Float32Array(MAX_PARTICLES * 3);
    this.scales = new Float32Array(MAX_PARTICLES * 2);
    this.rotations = new Float32Array(MAX_PARTICLES);
    this.colors = new Float32Array(MAX_PARTICLES * 3);
    this.alphas = new Float32Array(MAX_PARTICLES);
    this.atlasOffsets = new Float32Array(MAX_PARTICLES * 4);

    this.posAttr = new THREE.InstancedBufferAttribute(this.positions, 3);
    this.scaleAttr = new THREE.InstancedBufferAttribute(this.scales, 2);
    this.rotAttr = new THREE.InstancedBufferAttribute(this.rotations, 1);
    this.colorAttr = new THREE.InstancedBufferAttribute(this.colors, 3);
    this.alphaAttr = new THREE.InstancedBufferAttribute(this.alphas, 1);
    this.atlasAttr = new THREE.InstancedBufferAttribute(this.atlasOffsets, 4);

    this.geometry.setAttribute("instancePosition", this.posAttr);
    this.geometry.setAttribute("instanceScale", this.scaleAttr);
    this.geometry.setAttribute("instanceRotation", this.rotAttr);
    this.geometry.setAttribute("instanceColor", this.colorAttr);
    this.geometry.setAttribute("instanceAlpha", this.alphaAttr);
    this.geometry.setAttribute("instanceAtlasOffset", this.atlasAttr);

    this.geometry.instanceCount = 0;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uAtlas: { value: this.texture },
      },
      vertexShader: /* glsl */ `
        attribute vec3 instancePosition;
        attribute vec2 instanceScale;
        attribute float instanceRotation;
        attribute vec3 instanceColor;
        attribute float instanceAlpha;
        attribute vec4 instanceAtlasOffset;

        varying vec2 vUv;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = instanceColor;
          vAlpha = instanceAlpha;
          vUv = instanceAtlasOffset.xy + uv * instanceAtlasOffset.zw;

          // Camera-facing billboard vectors
          vec3 cameraRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
          vec3 cameraUp    = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);

          // Screen-space 2D rotation
          float c = cos(instanceRotation);
          float s = sin(instanceRotation);
          vec3 right = (cameraRight * c + cameraUp * s) * instanceScale.x;
          vec3 up    = (-cameraRight * s + cameraUp * c) * instanceScale.y;

          vec3 worldPos = instancePosition + right * position.x + up * position.y;
          gl_Position = projectionMatrix * viewMatrix * vec4(worldPos, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uAtlas;
        varying vec2 vUv;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec4 tex = texture2D(uAtlas, vUv);
          float alpha = tex.a * vAlpha;
          if (alpha < 0.015) discard;
          gl_FragColor = vec4(vColor * tex.rgb, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 999; // Ensure stars render on top of glossy ball
    this.scene.add(this.mesh);

    // Particle pool
    this.pool = Array.from({ length: MAX_PARTICLES }, () => new StarParticle());
    this.scratch = new THREE.Vector3();
    this.scratchU = new THREE.Vector3();
    this.scratchV = new THREE.Vector3();
  }

  /**
   * Triggers a star burst from the ball surface.
   * @param {Object} options
   * @param {THREE.Vector3} options.position - 3D world position on ball
   * @param {THREE.Vector3} options.normal - 3D surface outward normal
   * @param {Array<string>} [options.colors] - Theme color palette
   * @param {number} [options.intensity=1] - Effect intensity
   * @param {boolean} [options.lowPower=false] - Low power / mobile flag
   */
  trigger({
    position,
    normal = new THREE.Vector3(0, 0, 1),
    colors = null,
    intensity = 1.0,
    lowPower = false,
  }) {
    if (!position) return;

    // Palette with theme tints + bright white sparkle accents
    const palette =
      colors && colors.length > 0
        ? colors.map((c) => new THREE.Color(c))
        : [
            new THREE.Color("#853dff"),
            new THREE.Color("#245dff"),
            new THREE.Color("#f197ff"),
            new THREE.Color("#ffffff"),
          ];
    const white = new THREE.Color("#ffffff");

    // Adaptive particle count: 20-30 on desktop, 10-16 on mobile
    const count = lowPower
      ? Math.floor(10 + Math.random() * 6)
      : Math.floor(20 + Math.random() * 11);

    // Build orthonormal tangent basis (U, V) around surface normal
    const N = normal.clone().normalize();
    const upRef =
      Math.abs(N.y) < 0.9
        ? this.scratch.set(0, 1, 0)
        : this.scratch.set(1, 0, 0);
    const U = this.scratchU.crossVectors(N, upRef).normalize();
    const V = this.scratchV.crossVectors(N, U).normalize();
    soundFX.sparkleChime();

    // 1. Central optical flash spark right at the epicenter
    this._spawnParticle({
      origin: position,
      N,
      U,
      V,
      palette,
      white,
      isCore: true,
      intensity,
      lowPower,
    });

    // 2. Surrounding spark/star burst
    for (let i = 0; i < count; i++) {
      this._spawnParticle({
        origin: position,
        N,
        U,
        V,
        palette,
        white,
        isCore: false,
        intensity,
        lowPower,
      });
    }
  }

  _spawnParticle({
    origin,
    N,
    U,
    V,
    palette,
    white,
    isCore,
    intensity,
    lowPower,
  }) {
    // Find first available particle in pool
    let p = this.pool.find((item) => !item.active);
    if (!p) {
      // If pool full, recycle oldest active particle
      let oldest = this.pool[0];
      for (let i = 1; i < this.pool.length; i++) {
        if (this.pool[i].age > oldest.age) oldest = this.pool[i];
      }
      p = oldest;
    }

    p.active = true;
    p.age = 0;

    if (isCore) {
      // Instant bright optical core pop at the impact center
      p.position.copy(origin).addScaledVector(N, 0.04);
      p.velocity.copy(N).multiplyScalar(0.4 * intensity);
      p.lifespan = 0.35;
      p.shapeIndex = 0; // ✦ Solid 4-point flare
      p.baseScale.set(0.42 * intensity, 0.42 * intensity);
      p.color.copy(white);
      p.rotation = Math.random() * Math.PI;
      p.rotSpeed = 1.2;
      p.drag = 5.0;
      return;
    }

    // Spread cone around surface normal (theta: 10° to 52°)
    const theta = 0.15 + Math.random() * 0.75;
    const phi = Math.random() * Math.PI * 2;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);

    // Direction vector predominantly outward from the ball surface
    const dir = new THREE.Vector3()
      .addScaledVector(U, Math.cos(phi) * sinT)
      .addScaledVector(V, Math.sin(phi) * sinT)
      .addScaledVector(N, cosT)
      .normalize();

    // Speed variation (1.5 to 3.8 world units/s)
    const speed = (1.5 + Math.random() * 2.3) * (0.8 + 0.4 * intensity);
    p.velocity.copy(dir).multiplyScalar(speed);

    // Lift slightly off sphere surface to prevent Z-clipping with ball mesh
    const radialOffset = 0.025 + Math.random() * 0.035;
    p.position
      .copy(origin)
      .addScaledVector(N, radialOffset)
      .addScaledVector(U, (Math.random() - 0.5) * 0.04)
      .addScaledVector(V, (Math.random() - 0.5) * 0.04);

    // Lifespan: 0.45 to 0.75 seconds
    p.lifespan = 0.45 + Math.random() * 0.3;
    p.drag = 3.2 + Math.random() * 1.0;

    // Pick shape:
    // 0: ✦ Solid flare (35%)
    // 1: ✧ Thin star (20%)
    // 2: ★ 5-Point star (15%)
    // 3: ✚ Cross spark (15%)
    // 4: ◆ Diamond spark (10%)
    // 5: ● Micro glow (5%)
    const shapeRoll = Math.random();
    if (shapeRoll < 0.35) p.shapeIndex = 0;
    else if (shapeRoll < 0.55) p.shapeIndex = 1;
    else if (shapeRoll < 0.7) p.shapeIndex = 2;
    else if (shapeRoll < 0.85) p.shapeIndex = 3;
    else if (shapeRoll < 0.95) p.shapeIndex = 4;
    else p.shapeIndex = 5;

    // Scale variation (0.12 to 0.32 world units)
    const size =
      (0.12 + Math.random() * 0.2) *
      (lowPower ? 0.85 : 1.0) *
      (0.8 + 0.3 * intensity);
    if (p.shapeIndex === 4) {
      // Diamond spark is elongated
      p.baseScale.set(size * 0.65, size * 1.3);
    } else {
      p.baseScale.set(size, size);
    }

    // Rotation and spin speed
    p.rotation = Math.random() * Math.PI * 2;
    p.rotSpeed = (Math.random() - 0.5) * 5.5;

    // Color distribution: 65% theme colors, 35% radiant white/diamond glint
    if (Math.random() < 0.35) {
      p.color.copy(white);
    } else {
      const col = palette[Math.floor(Math.random() * palette.length)];
      p.color.copy(col);
      // Slight brightness boost for cinematic high-contrast glint
      p.color.r = Math.min(1, p.color.r * 1.25 + 0.1);
      p.color.g = Math.min(1, p.color.g * 1.25 + 0.1);
      p.color.b = Math.min(1, p.color.b * 1.25 + 0.1);
    }
  }

  update(delta) {
    const dt = Math.min(delta, 0.05);
    let activeCount = 0;

    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      p.age += dt;
      if (p.age >= p.lifespan) {
        p.active = false;
        continue;
      }

      // Physics integration
      p.position.addScaledVector(p.velocity, dt);
      p.velocity.multiplyScalar(Math.exp(-p.drag * dt));
      p.rotation += p.rotSpeed * dt;

      // Easing curves
      const progress = p.age / p.lifespan;
      let scaleMult = 1.0;
      let alpha = 1.0;

      if (progress < 0.12) {
        // Fast spring punch pop-in: 0 -> 1.2
        const t = progress / 0.12;
        scaleMult = Math.sin(t * Math.PI * 0.5) * 1.2;
        alpha = t;
      } else if (progress < 0.55) {
        // Lingering drift
        const t = (progress - 0.12) / 0.43;
        scaleMult = 1.2 - t * 0.32;
        alpha = 1.0 - t * 0.18;
      } else {
        // Fade out and shrink: 0.88 -> 0
        const t = (progress - 0.55) / 0.45;
        scaleMult = 0.88 * Math.max(0, 1.0 - t);
        alpha = 0.82 * Math.max(0, 1.0 - t * t);
      }

      // Write instance attributes
      const idx3 = activeCount * 3;
      const idx2 = activeCount * 2;
      const idx4 = activeCount * 4;

      this.positions[idx3] = p.position.x;
      this.positions[idx3 + 1] = p.position.y;
      this.positions[idx3 + 2] = p.position.z;

      this.scales[idx2] = p.baseScale.x * scaleMult;
      this.scales[idx2 + 1] = p.baseScale.y * scaleMult;

      this.rotations[activeCount] = p.rotation;

      this.colors[idx3] = p.color.r;
      this.colors[idx3 + 1] = p.color.g;
      this.colors[idx3 + 2] = p.color.b;

      this.alphas[activeCount] = alpha;

      const offset = SHAPE_UV_OFFSETS[p.shapeIndex] || SHAPE_UV_OFFSETS[0];
      this.atlasOffsets[idx4] = offset.x;
      this.atlasOffsets[idx4 + 1] = offset.y;
      this.atlasOffsets[idx4 + 2] = offset.z;
      this.atlasOffsets[idx4 + 3] = offset.w;

      activeCount++;
    }

    this.geometry.instanceCount = activeCount;

    if (activeCount > 0) {
      this.posAttr.needsUpdate = true;
      this.scaleAttr.needsUpdate = true;
      this.rotAttr.needsUpdate = true;
      this.colorAttr.needsUpdate = true;
      this.alphaAttr.needsUpdate = true;
      this.atlasAttr.needsUpdate = true;
      this.mesh.visible = true;
    } else {
      this.mesh.visible = false;
    }
  }

  destroy() {
    this.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
    this.scene.remove(this.mesh);
  }
}
