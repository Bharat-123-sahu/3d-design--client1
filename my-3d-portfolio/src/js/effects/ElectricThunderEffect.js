import { getViewportProfile } from "../utils/responsive.js";
import * as THREE from "three";
import gsap from "gsap";

const INTRO_STATES = {
  IDLE: "IDLE",
  CHARGING: "CHARGING",
  LIGHTNING_REVEAL: "LIGHTNING_REVEAL",
  READY: "READY",
  STARTING: "STARTING",
  COMPLETE: "COMPLETE",
};

const ribbonVertex = /* glsl */ `
  attribute float aAlong;
  attribute float aFlicker;
  varying float vAlong;
  varying float vFlicker;

  void main() {
    vAlong = aAlong;
    vFlicker = aFlicker;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ribbonFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uProgress;
  uniform float uTime;
  uniform float uPulse;
  uniform float uSoftness;
  varying float vAlong;
  varying float vFlicker;

  float hash(float n) {
    return fract(sin(n) * 43758.5453123);
  }

  void main() {
    float head = 1.0 - smoothstep(uProgress - uSoftness, uProgress, vAlong);
    float tail = smoothstep(uProgress - 0.45, uProgress - 0.08, vAlong);
    float flicker = 0.64 + 0.36 * sin(uTime * (32.0 + vFlicker * 13.0) + vFlicker * 11.0);
    flicker += hash(floor(uTime * 28.0) + vFlicker * 61.0) * 0.18;
    float energy = clamp(head * tail * flicker * uPulse, 0.0, 1.0);
    gl_FragColor = vec4(uColor, energy * uOpacity);
  }
`;

const sparkVertex = /* glsl */ `
  uniform float uTime;
  uniform float uBurst;
  uniform float uPixelRatio;
  attribute vec3 aVelocity;
  attribute float aSeed;
  attribute float aSize;
  varying float vAlpha;

  void main() {
    vec3 animated = position + aVelocity * uBurst;
    animated.y += sin(uTime * 1.8 + aSeed * 8.0) * 0.05;
    vAlpha = (0.28 + 0.72 * abs(sin(uTime * (2.0 + aSeed * 3.0) + aSeed * 12.0))) * (1.0 - uBurst * 0.58);
    vec4 mvPosition = modelViewMatrix * vec4(animated, 1.0);
    gl_PointSize = aSize * uPixelRatio * (150.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const sparkFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float glow = 1.0 - smoothstep(0.08, 0.5, d);
    gl_FragColor = vec4(uColor, glow * vAlpha * uOpacity);
  }
`;

const glowVertex = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv - 0.5;
    float d = length(p);
    float ring = smoothstep(0.22, 0.06, abs(d - 0.2));
    float core = 1.0 - smoothstep(0.0, 0.38, d);
    float pulse = 0.78 + 0.22 * sin(uTime * 10.0);
    float alpha = (core + ring * 0.45) * pulse * uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

function createRibbonGeometry(maxPoints, width) {
  const vertexCount = maxPoints * 2;
  const positions = new Float32Array(vertexCount * 3);
  const along = new Float32Array(vertexCount);
  const flicker = new Float32Array(vertexCount);
  const indices = [];

  for (let i = 0; i < maxPoints; i += 1) {
    const t = i / (maxPoints - 1);
    along[i * 2] = t;
    along[i * 2 + 1] = t;
    flicker[i * 2] = Math.random();
    flicker[i * 2 + 1] = Math.random();

    if (i < maxPoints - 1) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aAlong", new THREE.BufferAttribute(along, 1));
  geometry.setAttribute("aFlicker", new THREE.BufferAttribute(flicker, 1));
  geometry.setIndex(indices);
  geometry.userData.width = width;
  return geometry;
}

function createRibbonMaterial(color, opacity, softness = 0.1) {
  return new THREE.ShaderMaterial({
    vertexShader: ribbonVertex,
    fragmentShader: ribbonFragment,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uPulse: { value: 0 },
      uSoftness: { value: softness },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

function updateRibbonGeometry(geometry, points, jitter = 0) {
  const positions = geometry.attributes.position.array;
  const width = geometry.userData.width;

  for (let i = 0; i < points.length; i += 1) {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const length = Math.max(Math.hypot(dx, dy), 0.0001);
    const nx = -dy / length;
    const ny = dx / length;
    const flicker = jitter * (Math.random() - 0.5);
    const x = points[i].x + flicker;
    const y = points[i].y + jitter * (Math.random() - 0.5);
    const z = points[i].z;
    const base = i * 6;

    positions[base] = x + nx * width;
    positions[base + 1] = y + ny * width;
    positions[base + 2] = z;
    positions[base + 3] = x - nx * width;
    positions[base + 4] = y - ny * width;
    positions[base + 5] = z;
  }

  geometry.attributes.position.needsUpdate = true;
}

function makeLightningPath(count, width, height, fromRight = false) {
  const points = [];
  const startX = fromRight ? width * 0.53 : -width * 0.53;
  const endX = fromRight ? -width * 0.08 : width * 0.08;

  for (let i = 0; i < count; i += 1) {
    const t = i / (count - 1);
    const x = THREE.MathUtils.lerp(startX, endX, t);
    const taper = Math.sin(t * Math.PI);
    const y =
      Math.sin(t * Math.PI * 4.6) * height * 0.05 +
      (Math.random() - 0.5) * height * 0.17 * taper;
    const z = 0.45 + Math.sin(t * Math.PI) * 0.2;
    points.push(new THREE.Vector3(x, y, z));
  }

  return points;
}

export class ElectricThunderEffect {
  constructor(scene, camera, options = {}) {
    this.scene = scene;
    this.camera = camera;
    this.options = options;
    this.state = INTRO_STATES.IDLE;
    this.reduceMotion = Boolean(options.reduceMotion);
    this.isMobile = window.matchMedia("(max-width: 700px)").matches;
    this.time = 0;
    this.progress = { value: 0 };
    this.charge = { value: 0 };
    this.burst = { value: 0 };
    this.theme = "dark";
    this.viewport = { width: 8, height: 5 };
    this.group = new THREE.Group();
    this.group.visible = true;
    this.scene.add(this.group);

    this.maxPoints = this.reduceMotion ? 34 : this.isMobile ? 44 : 62;
    this.branchCount = this.reduceMotion ? 3 : this.isMobile ? 5 : 9;

    this.layers = [
      this.createRibbonLayer("#fff2ee", 0.98, 0.018, 0.045),
      this.createRibbonLayer("#ff1f2f", 0.68, 0.062, 0.085),
      this.createRibbonLayer("#9b0616", 0.34, 0.18, 0.16),
    ];

    this.branches = [];
    for (let i = 0; i < this.branchCount; i += 1) {
      const layer = this.createRibbonLayer(i % 2 ? "#ff4252" : "#ff0f2d", 0.42, 0.028, 0.12);
      this.branches.push({
        ...layer,
        offset: 0.16 + Math.random() * 0.55,
        span: 0.12 + Math.random() * 0.16,
        side: Math.random() > 0.5 ? 1 : -1,
      });
    }

    this.sparkField = this.createSparks();
    this.impactGlow = this.createImpactGlow();
    this.light = new THREE.PointLight("#ff1229", 0, 12, 1.7);
    this.light.position.set(0, 0.1, 2.2);
    this.scene.add(this.light);

    this.rebuildPaths();
    this.setState(INTRO_STATES.IDLE);
  }

  createRibbonLayer(color, opacity, width, softness) {
    const geometry = createRibbonGeometry(this.maxPoints, width);
    const material = createRibbonMaterial(color, opacity, softness);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    this.group.add(mesh);
    return { geometry, material, mesh };
  }

  createSparks() {
    const count = this.reduceMotion ? 70 : this.isMobile ? 130 : 260;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      const stride = i * 3;
      positions[stride] = (Math.random() - 0.5) * 7.5;
      positions[stride + 1] = (Math.random() - 0.5) * 4.2;
      positions[stride + 2] = -0.1 + Math.random() * 1.8;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.35 + Math.random() * 2.3;
      velocities[stride] = Math.cos(angle) * speed;
      velocities[stride + 1] = Math.sin(angle) * speed;
      velocities[stride + 2] = (Math.random() - 0.5) * 0.8;
      seeds[i] = Math.random();
      sizes[i] = this.reduceMotion ? 0.9 + Math.random() * 1.4 : 1.2 + Math.random() * 2.2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aVelocity", new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader: sparkVertex,
      fragmentShader: sparkFragment,
      uniforms: {
        uTime: { value: 0 },
        uBurst: { value: 0 },
        uPixelRatio: { value: getViewportProfile().dpr },
        uColor: { value: new THREE.Color("#ff1830") },
        uOpacity: { value: 0.06 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    this.group.add(points);
    return points;
  }

  createImpactGlow() {
    const geometry = new THREE.PlaneGeometry(4.6, 4.6, 1, 1);
    const material = new THREE.ShaderMaterial({
      vertexShader: glowVertex,
      fragmentShader: glowFragment,
      uniforms: {
        uColor: { value: new THREE.Color("#ff132f") },
        uOpacity: { value: 0 },
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0.05, 0.2);
    mesh.frustumCulled = false;
    this.group.add(mesh);
    return mesh;
  }

  rebuildPaths() {
    const distance = Math.abs(this.camera.position.z || 5);
    const height = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov * 0.5)) * distance;
    const width = height * this.camera.aspect;
    this.viewport.width = width;
    this.viewport.height = height;
    this.mainPath = makeLightningPath(this.maxPoints, width, height, this.state === INTRO_STATES.STARTING);
    this.branchPaths = this.branches.map((branch) => this.createBranchPath(branch));
    this.updateGeometry();
  }

  createBranchPath(branch) {
    const startIndex = Math.floor(branch.offset * (this.mainPath.length - 1));
    const start = this.mainPath[startIndex] || new THREE.Vector3();
    const count = this.maxPoints;
    const points = [];
    const length = this.viewport.height * (0.24 + Math.random() * 0.28);
    const direction = branch.side;

    for (let i = 0; i < count; i += 1) {
      const t = i / (count - 1);
      const x = start.x + (Math.random() - 0.2) * this.viewport.width * 0.16 * t;
      const y =
        start.y +
        direction * length * t +
        Math.sin(t * Math.PI * 3.2 + branch.offset * 5.0) * 0.16 * this.viewport.height * t;
      points.push(new THREE.Vector3(x, y, start.z - 0.03));
    }

    return points;
  }

  updateGeometry() {
    const jitter = this.reduceMotion ? 0.006 : 0.025 + this.charge.value * 0.045;
    this.layers.forEach((layer) => updateRibbonGeometry(layer.geometry, this.mainPath, jitter));
    this.branches.forEach((branch, index) => {
      updateRibbonGeometry(branch.geometry, this.branchPaths[index], jitter * 0.65);
    });
  }

  setTheme(theme = "dark") {
    this.theme = theme;
    const lightTheme = theme === "light";
    this.layers[1].material.uniforms.uOpacity.value = lightTheme ? 0.52 : 0.68;
    this.layers[2].material.uniforms.uOpacity.value = lightTheme ? 0.18 : 0.34;
    this.sparkField.material.uniforms.uOpacity.value = lightTheme ? 0.035 : 0.06;
  }

  setState(state) {
    this.state = state;
  }

  setIdleEnergy(value) {
    this.sparkField.material.uniforms.uOpacity.value = value;
    this.charge.value = value;
    this.light.intensity = value * (this.theme === "light" ? 4 : 7);
  }

  startReveal() {
    if (this.state !== INTRO_STATES.IDLE && this.state !== INTRO_STATES.CHARGING) return null;
    this.setState(INTRO_STATES.LIGHTNING_REVEAL);
    this.rebuildPaths();
    this.progress.value = 0;
    this.burst.value = 0;

    const timeline = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => this.setState(INTRO_STATES.READY),
    });

    timeline.to(this.charge, { value: 1, duration: this.reduceMotion ? 0.25 : 0.55 }, 0);
    timeline.to(this.progress, { value: 1, duration: this.reduceMotion ? 0.45 : 0.9, ease: "power3.inOut" }, 0.08);
    timeline.to(this.burst, { value: 1, duration: this.reduceMotion ? 0.35 : 0.65, ease: "expo.out" }, this.reduceMotion ? 0.32 : 0.58);
    timeline.to(this.burst, { value: 0.12, duration: 0.8, ease: "power2.out" }, ">");
    timeline.to(this.charge, { value: 0.22, duration: 0.9, ease: "power2.out" }, "<");
    return timeline;
  }

  startExit() {
    if (this.state === INTRO_STATES.STARTING || this.state === INTRO_STATES.COMPLETE) return null;
    this.setState(INTRO_STATES.STARTING);
    this.rebuildPaths();
    this.progress.value = 0;
    this.burst.value = 0;

    const timeline = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: () => {
        this.setState(INTRO_STATES.COMPLETE);
        this.group.visible = false;
      },
    });

    timeline.to(this.charge, { value: 1.25, duration: this.reduceMotion ? 0.2 : 0.45 }, 0);
    timeline.to(this.progress, { value: 1.08, duration: this.reduceMotion ? 0.35 : 0.72, ease: "power4.in" }, 0.05);
    timeline.to(this.burst, { value: 1.35, duration: this.reduceMotion ? 0.3 : 0.55, ease: "expo.out" }, 0.32);
    timeline.to(this.charge, { value: 0, duration: 0.4 }, ">");
    return timeline;
  }

  update(delta, elapsed) {
    this.time += delta;
    const rebuildRate = this.reduceMotion ? 0.16 : 0.055;

    if (!this._nextRebuild || elapsed > this._nextRebuild) {
      this._nextRebuild = elapsed + rebuildRate;
      if (this.state !== INTRO_STATES.COMPLETE) {
        this.rebuildPaths();
      }
    }

    const pulse =
      this.charge.value *
      (0.75 + 0.25 * Math.sin(elapsed * (this.reduceMotion ? 8 : 26))) *
      (this.state === INTRO_STATES.READY ? 0.34 : 1);

    this.layers.forEach((layer, index) => {
      layer.material.uniforms.uTime.value = elapsed;
      layer.material.uniforms.uProgress.value = this.progress.value;
      layer.material.uniforms.uPulse.value = Math.max(0.08, pulse * (1 - index * 0.16));
    });

    this.branches.forEach((branch) => {
      const localProgress = THREE.MathUtils.clamp(
        (this.progress.value - branch.offset) / branch.span,
        0,
        1,
      );
      branch.material.uniforms.uTime.value = elapsed;
      branch.material.uniforms.uProgress.value = localProgress;
      branch.material.uniforms.uPulse.value = pulse * 0.9;
    });

    this.sparkField.material.uniforms.uTime.value = elapsed;
    this.sparkField.material.uniforms.uBurst.value = this.burst.value;
    this.impactGlow.material.uniforms.uTime.value = elapsed;
    this.impactGlow.material.uniforms.uOpacity.value =
      this.burst.value * (this.theme === "light" ? 0.28 : 0.48) + this.charge.value * 0.04;
    this.impactGlow.scale.setScalar(0.9 + this.burst.value * 1.1);
    this.light.intensity =
      this.charge.value * (this.theme === "light" ? 5.5 : 9) +
      this.burst.value * (this.theme === "light" ? 10 : 16);
  }

  handleResize() {
    this.rebuildPaths();
    this.sparkField.material.uniforms.uPixelRatio.value = getViewportProfile().dpr;
  }

  destroy() {
    gsap.killTweensOf([this.progress, this.charge, this.burst]);
    this.scene.remove(this.group);
    this.scene.remove(this.light);
    this.layers.forEach((layer) => {
      layer.geometry.dispose();
      layer.material.dispose();
    });
    this.branches.forEach((branch) => {
      branch.geometry.dispose();
      branch.material.dispose();
    });
    this.sparkField.geometry.dispose();
    this.sparkField.material.dispose();
    this.impactGlow.geometry.dispose();
    this.impactGlow.material.dispose();
  }
}

export { INTRO_STATES };
