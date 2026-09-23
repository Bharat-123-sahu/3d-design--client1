import * as THREE from "three";
import gsap from "gsap";
import { navigationNodes } from "../data/navigationData.js";

/* ── Helpers ──────────────────────────────────────────────────────── */

function makeEmissiveMat(color, emissiveIntensity = 1.5) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: new THREE.Color(color),
    emissiveIntensity,
    roughness: 0.4,
    metalness: 0.6,
  });
}

function makeGlassMat(color) {
  return new THREE.MeshStandardMaterial({
    color,
    transparent: true,
    opacity: 0.18,
    roughness: 0,
    metalness: 0.8,
    side: THREE.DoubleSide,
  });
}

/* ── Ground ───────────────────────────────────────────────────────── */

function createGround(scene) {
  // Large dark floor
  const geo = new THREE.PlaneGeometry(30, 30);
  const mat = new THREE.MeshStandardMaterial({
    color: "#040609",
    roughness: 0.9,
    metalness: 0.1,
  });
  const floor = new THREE.Mesh(geo, mat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.62;
  floor.receiveShadow = true;
  scene.add(floor);

  // Grid overlay
  const gridHelper = new THREE.GridHelper(30, 40, "#111622", "#0d111a");
  gridHelper.position.y = -1.6;
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.55;
  scene.add(gridHelper);

  return floor;
}

/* ── Glowing Red Path ─────────────────────────────────────────────── */

const PATH_RED = "#ff2200";
const PATH_GLOW_RED = "#ff3300";

function buildPathSegment(points, scene) {
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
  const tubeGeo = new THREE.TubeGeometry(curve, 80, 0.018, 8, false);
  const tubeMat = new THREE.MeshBasicMaterial({
    color: PATH_RED,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const tube = new THREE.Mesh(tubeGeo, tubeMat);

  // Glow duplicate (slightly thicker)
  const glowGeo = new THREE.TubeGeometry(curve, 80, 0.06, 8, false);
  const glowMat = new THREE.MeshBasicMaterial({
    color: PATH_GLOW_RED,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);

  const group = new THREE.Group();
  group.add(tube, glow);
  scene.add(group);

  return { group, curve, tubeMat, glowMat };
}

function createAllPaths(scene) {
  const { home, about, work, value, contact } = navigationNodes;

  const segments = [
    // Home ↔ About
    [
      home.position,
      new THREE.Vector3(-1.0, -1.6, 1.0),
      new THREE.Vector3(-2.0, -1.6, 0.4),
      about.position,
    ],
    // Home ↔ Work
    [
      home.position,
      new THREE.Vector3(1.0, -1.6, 1.0),
      new THREE.Vector3(2.0, -1.6, 0.4),
      work.position,
    ],
    // Home ↔ Value (straight back)
    [
      home.position,
      new THREE.Vector3(0, -1.6, -1.0),
      new THREE.Vector3(0, -1.6, -2.5),
      value.position,
    ],
    // Home ↔ Contact
    [home.position, new THREE.Vector3(0, -1.6, 2.5), contact.position],
    // About ↔ Work (cross-path via center)
    [
      about.position,
      new THREE.Vector3(-1.5, -1.6, -1.2),
      new THREE.Vector3(0, -1.6, -1.0),
      new THREE.Vector3(1.5, -1.6, -1.2),
      work.position,
    ],
  ];

  return segments.map((pts) => buildPathSegment(pts, scene));
}

/* ── Destination Markers ──────────────────────────────────────────── */

function createHouseMarker(scene, pos) {
  const group = new THREE.Group();
  const red = makeEmissiveMat("#cc2200", 0.9);
  const dark = new THREE.MeshStandardMaterial({
    color: "#0a0c14",
    roughness: 0.7,
  });

  // Base
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.6), dark);
  base.position.y = 0.25;

  // Roof
  const roofGeo = new THREE.ConeGeometry(0.62, 0.38, 4);
  const roof = new THREE.Mesh(roofGeo, red);
  roof.position.y = 0.65;
  roof.rotation.y = Math.PI / 4;

  // Door
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.22, 0.05), red);
  door.position.set(0, 0.11, 0.32);

  group.add(base, roof, door);
  group.position.copy(pos);
  group.position.y = -1.6;
  group.scale.setScalar(0.55);
  scene.add(group);
  return group;
}

function createChairMarker(scene, pos) {
  const group = new THREE.Group();
  const red = makeEmissiveMat("#cc2200", 0.9);
  const dark = new THREE.MeshStandardMaterial({
    color: "#0a0c14",
    roughness: 0.7,
  });

  // Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.55), red);
  seat.position.y = 0.4;

  // Back
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 0.08), dark);
  back.position.set(0, 0.7, -0.24);

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.4, 6);
  const positions = [
    [-0.25, 0.2, 0.22],
    [0.25, 0.2, 0.22],
    [-0.25, 0.2, -0.22],
    [0.25, 0.2, -0.22],
  ];
  positions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, dark);
    leg.position.set(x, y, z);
    group.add(leg);
  });

  group.add(seat, back);
  group.position.copy(pos);
  group.position.y = -1.6;
  group.scale.setScalar(0.6);
  scene.add(group);
  return group;
}

function createMonitorMarker(scene, pos) {
  const group = new THREE.Group();
  const red = makeEmissiveMat("#cc2200", 0.9);
  const screenMat = new THREE.MeshStandardMaterial({
    color: "#001122",
    emissive: "#0033aa",
    emissiveIntensity: 0.8,
    roughness: 0,
    metalness: 0.9,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: "#0a0c14",
    roughness: 0.7,
  });

  // Screen bezel
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.65, 0.06), red);
  bezel.position.y = 0.75;

  // Screen glass
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.53, 0.01),
    screenMat,
  );
  screen.position.set(0, 0.75, 0.04);

  // Stand
  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.08, 0.35, 8),
    dark,
  );
  stand.position.y = 0.3;

  // Base
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.25), dark);
  base.position.y = 0.12;

  group.add(bezel, screen, stand, base);
  group.position.copy(pos);
  group.position.y = -1.6;
  group.scale.setScalar(0.55);
  scene.add(group);
  return group;
}

function createBoardMarker(scene, pos) {
  const group = new THREE.Group();
  const red = makeEmissiveMat("#cc2200", 0.9);
  const glowing = new THREE.MeshStandardMaterial({
    color: "#001f3f",
    emissive: "#003366",
    emissiveIntensity: 0.9,
    roughness: 0,
    metalness: 0.7,
  });

  // Board panel
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.05), glowing);
  panel.position.y = 0.7;

  // Frame
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.65, 0.04), red);
  frame.position.set(0, 0.7, -0.01);

  // Stand poles
  const poleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.7, 6);
  [-0.38, 0.38].forEach((x) => {
    const pole = new THREE.Mesh(poleGeo, red);
    pole.position.set(x, 0.35, 0);
    group.add(pole);
  });

  group.add(panel, frame);
  group.position.copy(pos);
  group.position.y = -1.6;
  group.scale.setScalar(0.55);
  scene.add(group);
  return group;
}

function createDeskMarker(scene, pos) {
  const group = new THREE.Group();
  const red = makeEmissiveMat("#cc2200", 0.9);
  const dark = new THREE.MeshStandardMaterial({
    color: "#0a0c14",
    roughness: 0.7,
  });

  // Desk top
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.55), dark);
  top.position.y = 0.44;

  // Legs
  const legGeo = new THREE.BoxGeometry(0.05, 0.44, 0.05);
  [
    [0.45, 0.22, 0.22],
    [-0.45, 0.22, 0.22],
    [0.45, 0.22, -0.22],
    [-0.45, 0.22, -0.22],
  ].forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, dark);
    leg.position.set(x, y, z);
    group.add(leg);
  });

  // Mail/phone icon on desk (simple envelope shape)
  const env = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.01, 0.14), red);
  env.position.set(0.1, 0.48, 0);

  group.add(top, env);
  group.position.copy(pos);
  group.position.y = -1.6;
  group.scale.setScalar(0.6);
  scene.add(group);
  return group;
}

/* ── Destination Signs (floating text sprites) ────────────────────── */

function createSignSprite(label, pos, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  // Background pill
  ctx.clearRect(0, 0, 512, 128);
  ctx.fillStyle = "rgba(8,8,16,0.82)";
  ctx.beginPath();
  ctx.roundRect(8, 20, 496, 88, 18);
  ctx.fill();

  // Red border glow
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowColor = color;
  ctx.shadowBlur = 22;
  ctx.stroke();

  // Text
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 56px Inter, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 256, 64);

  // Red glow on text
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.35;
  ctx.fillText(label, 256, 64);
  ctx.globalAlpha = 1.0;

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(1.8, 0.45, 1);
  sprite.position.copy(pos);
  return sprite;
}

/* ── Path Particles ───────────────────────────────────────────────── */

function createPathParticles(scene, pathSegments) {
  const count = 24;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: PATH_RED,
    size: 0.055,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // Store path data for animation
  const particleData = [];
  for (let i = 0; i < count; i++) {
    particleData.push({
      t: Math.random(),
      speed: 0.08 + Math.random() * 0.12,
      segIndex: Math.floor(Math.random() * pathSegments.length),
    });
  }

  return { points, geo, particleData, pathSegments };
}

/* ── Ambient Red Point Lights at Nodes ────────────────────────────── */

function createNodeLights(scene) {
  const lights = {};
  for (const [id, node] of Object.entries(navigationNodes)) {
    const light = new THREE.PointLight("#ff2200", 0.0, 3.5);
    light.position.set(node.position.x, node.position.y + 1.2, node.position.z);
    scene.add(light);
    lights[id] = light;
  }
  return lights;
}

/* ── WorldScene Class ─────────────────────────────────────────────── */

export class WorldScene {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.isActive = false;
    this.markers = {};
    this.signs = {};
    this.pathSegments = [];
    this.pathParticles = null;
    this.nodeLights = {};
    this.activeNode = null;
    this.elapsed = 0;

    this._build();
  }

  _build() {
    // Ground
    this.ground = createGround(this.scene);

    // Paths
    this.pathSegments = createAllPaths(this.scene);

    // Destination markers
    const { home, about, work, value, contact } = navigationNodes;
    this.markers.home = createHouseMarker(this.scene, home.position);
    this.markers.about = createChairMarker(this.scene, about.position);
    this.markers.work = createMonitorMarker(this.scene, work.position);
    this.markers.value = createBoardMarker(this.scene, value.position);
    this.markers.contact = createDeskMarker(this.scene, contact.position);

    // Destination signs
    for (const [id, node] of Object.entries(navigationNodes)) {
      const sign = createSignSprite(node.label, node.signPosition, node.color);
      this.scene.add(sign);
      this.signs[id] = sign;
    }

    // Path particles
    this.pathParticles = createPathParticles(this.scene, this.pathSegments);

    // Node lights
    this.nodeLights = createNodeLights(this.scene);

    // Start hidden, activate after intro
    this._setVisibility(false);
  }

  _setVisibility(visible) {
    const opacity = visible ? 1 : 0;
    for (const seg of this.pathSegments) {
      seg.tubeMat.opacity = visible ? 0.85 : 0;
      seg.glowMat.opacity = visible ? 0.18 : 0;
    }
    this.pathParticles.points.material.opacity = visible ? 0.75 : 0;
    for (const sign of Object.values(this.signs)) {
      sign.material.opacity = visible ? 0.92 : 0;
    }
    this.ground.visible = visible;
  }

  /**
   * Call after introComplete to fade the world in.
   */
  activate() {
    if (this.isActive) return;
    this.isActive = true;
    this._setVisibility(false);
    // Fade in world elements
    setTimeout(() => {
      this.pathSegments.forEach((seg, i) => {
        gsap.to(seg.tubeMat, { opacity: 0.85, duration: 1.2, delay: i * 0.1 });
        gsap.to(seg.glowMat, { opacity: 0.18, duration: 1.2, delay: i * 0.1 });
      });
      gsap.to(this.pathParticles.points.material, {
        opacity: 0.75,
        duration: 1.5,
        delay: 0.3,
      });
      for (const sign of Object.values(this.signs)) {
        gsap.to(sign.material, { opacity: 0.92, duration: 1.0, delay: 0.5 });
      }
      this.ground.visible = true;
      gsap.fromTo(
        this.ground.material,
        { opacity: 0 },
        { opacity: 1, duration: 1.5 },
      );
    }, 200);
  }

  /**
   * Highlight the active node — brighten its light and sign.
   */
  setActiveNode(nodeId) {
    this.activeNode = nodeId;

    for (const [id, light] of Object.entries(this.nodeLights)) {
      const target = id === nodeId ? 2.8 : 0.0;
      gsap.to(light, { intensity: target, duration: 0.8, ease: "power2.out" });
    }

    // Brighten active sign
    for (const [id, sign] of Object.entries(this.signs)) {
      gsap.to(sign.material, {
        opacity: id === nodeId ? 1.0 : 0.55,
        duration: 0.6,
      });
    }

    // Brighten active path segments slightly
    this.pathSegments.forEach((seg) => {
      gsap.to(seg.glowMat, {
        opacity: 0.22,
        duration: 0.4,
      });
    });
  }

  /**
   * Highlight path that is currently being traveled.
   * pathPoints: array of THREE.Vector3 waypoints
   */
  highlightActivePath(from, to) {
    // All paths dim
    this.pathSegments.forEach((seg) => {
      gsap.to(seg.glowMat, { opacity: 0.08, duration: 0.3 });
      gsap.to(seg.tubeMat, { opacity: 0.4, duration: 0.3 });
    });
  }

  setTheme(theme) {
    const dark = theme === "dark";
    const floorColor = dark ? "#040609" : "#e8edf5";
    gsap.to(this.ground.material.color, {
      r: new THREE.Color(floorColor).r,
      g: new THREE.Color(floorColor).g,
      b: new THREE.Color(floorColor).b,
      duration: 0.8,
    });
  }

  update(delta, elapsed) {
    if (!this.isActive) return;
    this.elapsed = elapsed;

    // Animate path particles along curves
    const { particleData, geo, pathSegments } = this.pathParticles;
    const pos = geo.attributes.position;

    for (let i = 0; i < particleData.length; i++) {
      const p = particleData[i];
      p.t += delta * p.speed;
      if (p.t > 1) {
        p.t -= 1;
        p.segIndex = (p.segIndex + 1) % pathSegments.length;
      }

      const curve = pathSegments[p.segIndex]?.curve;
      if (curve) {
        const pt = curve.getPoint(p.t);
        pos.setXYZ(i, pt.x, pt.y + 0.04, pt.z);
      }
    }
    pos.needsUpdate = true;

    // Subtle sign bob
    for (const sign of Object.values(this.signs)) {
      sign.position.y += Math.sin(elapsed * 1.2 + sign.position.x) * 0.00025;
    }

    // Flicker path glow
    this.pathSegments.forEach((seg, i) => {
      const flicker = 0.15 + 0.08 * Math.sin(elapsed * 3.5 + i * 1.2);
      seg.glowMat.opacity = Math.max(
        0.06,
        seg.glowMat.opacity + (flicker - seg.glowMat.opacity) * 0.08,
      );
    });

    // Marker gentle hover animation
    for (const marker of Object.values(this.markers)) {
      marker.rotation.y += delta * 0.18;
    }
  }

  destroy() {
    // Cleanup is handled by ThreeScene.destroy
  }
}
