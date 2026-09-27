import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modelsDir = path.resolve(__dirname, "../public/models");

if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

// Polyfill FileReader for Node.js GLTFExporter
if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      if (blob.arrayBuffer) {
        blob.arrayBuffer().then((buf) => {
          this.result = buf;
          if (this.onload) this.onload({ target: this });
          if (this.onloadend) this.onloadend({ target: this });
        });
      } else if (Buffer.isBuffer(blob)) {
        this.result = blob.buffer.slice(
          blob.byteOffset,
          blob.byteOffset + blob.byteLength,
        );
        if (this.onload) this.onload({ target: this });
        if (this.onloadend) this.onloadend({ target: this });
      }
    }
  };
}

function exportToGLB(sceneOrGroup, outputPath) {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      sceneOrGroup,
      (glb) => {
        try {
          const buffer = Buffer.from(glb);
          fs.writeFileSync(outputPath, buffer);
          console.log(
            `[Exported] ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`,
          );
          resolve();
        } catch (err) {
          reject(err);
        }
      },
      (error) => reject(error),
      { binary: true },
    );
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SERVICES ENVIRONMENT
// A futuristic creative-tech workspace / digital studio
// Desk, curved ultra-wide monitor, vertical screen, keyboard, mouse/tablet,
// server tower, cables, cyber plant, grounded base platform, floating UI tiles.
// Ground level of character: y = 0
// ─────────────────────────────────────────────────────────────────────────────
function createServicesEnvironment() {
  const root = new THREE.Group();
  root.name = "ServicesEnvironment";

  // Reusable materials
  const matBase = new THREE.MeshStandardMaterial({
    color: "#0c0e17",
    roughness: 0.85,
    metalness: 0.2,
  });
  const matTrimCyan = new THREE.MeshStandardMaterial({
    color: "#00e5ff",
    emissive: "#00e5ff",
    emissiveIntensity: 1.8,
    roughness: 0.2,
    metalness: 0.8,
  });
  const matDesk = new THREE.MeshStandardMaterial({
    color: "#161926",
    roughness: 0.5,
    metalness: 0.5,
  });
  const matDeskLegs = new THREE.MeshStandardMaterial({
    color: "#0d0f18",
    roughness: 0.4,
    metalness: 0.8,
  });
  const matBezel = new THREE.MeshStandardMaterial({
    color: "#10121c",
    roughness: 0.3,
    metalness: 0.85,
  });
  const matScreen = new THREE.MeshStandardMaterial({
    color: "#02121e",
    emissive: "#007799",
    emissiveIntensity: 0.9,
    roughness: 0.1,
    metalness: 0.9,
  });
  const matScreenCode = new THREE.MeshStandardMaterial({
    color: "#001a18",
    emissive: "#00e5a3",
    emissiveIntensity: 1.1,
    roughness: 0.15,
    metalness: 0.8,
  });
  const matAccent = new THREE.MeshStandardMaterial({
    color: "#00ffaa",
    emissive: "#00ffaa",
    emissiveIntensity: 1.4,
    roughness: 0.3,
    metalness: 0.6,
  });
  const matPlantPot = new THREE.MeshStandardMaterial({
    color: "#222638",
    roughness: 0.6,
    metalness: 0.4,
  });
  const matPlant = new THREE.MeshStandardMaterial({
    color: "#00d68f",
    roughness: 0.7,
    metalness: 0.1,
  });

  // 1. Ground Studio Platform (Cylinder grounded at y = 0, top at y = 0.04)
  const platformGeo = new THREE.CylinderGeometry(1.4, 1.45, 0.04, 48);
  const platform = new THREE.Mesh(platformGeo, matBase);
  platform.position.y = 0.02;
  platform.receiveShadow = true;
  root.add(platform);

  // Outer neon floor ring
  const ringGeo = new THREE.TorusGeometry(1.36, 0.015, 12, 48);
  const ring = new THREE.Mesh(ringGeo, matTrimCyan);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.042;
  root.add(ring);

  // 2. Workstation Desk
  // Desk top: width 1.5, depth 0.7, thickness 0.05 at height y = 0.70
  const deskGroup = new THREE.Group();
  deskGroup.name = "WorkstationDesk";
  const deskTop = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.045, 0.7),
    matDesk,
  );
  deskTop.position.set(0, 0.68, 0);
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  deskGroup.add(deskTop);

  // Desk glow edge (front facing character at z = +0.35)
  const deskGlow = new THREE.Mesh(
    new THREE.BoxGeometry(1.46, 0.012, 0.012),
    matTrimCyan,
  );
  deskGlow.position.set(0, 0.68, 0.352);
  deskGroup.add(deskGlow);

  // 4 Sleek angled legs
  const legGeo = new THREE.BoxGeometry(0.045, 0.66, 0.045);
  const legPositions = [
    [-0.68, 0.33, 0.28],
    [0.68, 0.33, 0.28],
    [-0.68, 0.33, -0.28],
    [0.68, 0.33, -0.28],
  ];
  legPositions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeo, matDeskLegs);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    deskGroup.add(leg);
  });

  // Cross brace
  const brace = new THREE.Mesh(
    new THREE.BoxGeometry(1.36, 0.03, 0.03),
    matDeskLegs,
  );
  brace.position.set(0, 0.25, -0.28);
  deskGroup.add(brace);
  root.add(deskGroup);

  // 3. Dual / Ultra-wide Screen Display
  const monitorGroup = new THREE.Group();
  monitorGroup.name = "DisplaySetup";

  // Central Main Curved Display
  const mainBezel = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.52, 0.04),
    matBezel,
  );
  mainBezel.position.set(-0.1, 1.08, -0.1);
  mainBezel.rotation.y = 0.04;
  const mainScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.46, 0.01),
    matScreen,
  );
  mainScreen.name = "MainDisplayScreen";
  mainScreen.position.set(0, 0, 0.022);
  mainBezel.add(mainScreen);

  // Articulated Monitor Arm & Stand
  const arm1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.035, 0.32, 12),
    matDeskLegs,
  );
  arm1.position.set(-0.1, 0.85, -0.18);
  const armBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.02, 16),
    matDeskLegs,
  );
  armBase.position.set(-0.1, 0.71, -0.18);
  monitorGroup.add(arm1, armBase, mainBezel);

  // Secondary Vertical Code Monitor (angled towards user)
  const vertBezel = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.54, 0.035),
    matBezel,
  );
  vertBezel.position.set(0.52, 1.08, -0.05);
  vertBezel.rotation.y = -0.32;
  const vertScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.48, 0.01),
    matScreenCode,
  );
  vertScreen.name = "SecondaryDisplayScreen";
  vertScreen.position.set(0, 0, 0.02);
  vertBezel.add(vertScreen);

  const vertArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.32, 12),
    matDeskLegs,
  );
  vertArm.position.set(0.52, 0.85, -0.12);
  monitorGroup.add(vertArm, vertBezel);
  root.add(monitorGroup);

  // 4. Peripherals on Desk (facing character in front)
  const peripherals = new THREE.Group();
  peripherals.name = "Peripherals";

  // Low-profile keyboard
  const kb = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.015, 0.15), matBezel);
  kb.position.set(-0.12, 0.71, 0.16);
  const kbKeys = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.012, 0.12),
    matTrimCyan,
  );
  kbKeys.position.set(0, 0.01, 0);
  kb.add(kbKeys);

  // Precision mouse / pad
  const mousePad = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.005, 0.22),
    matBase,
  );
  mousePad.position.set(0.26, 0.705, 0.16);
  const mouse = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.022, 0.1),
    matBezel,
  );
  mouse.position.set(0.26, 0.72, 0.16);
  mousePad.add(mouse);

  // Graphics tablet / stylus on left
  const tablet = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.008, 0.18),
    matBezel,
  );
  tablet.position.set(-0.48, 0.708, 0.16);
  tablet.rotation.y = 0.12;
  const stylus = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.14, 8),
    matAccent,
  );
  stylus.rotation.z = Math.PI / 2;
  stylus.position.set(0, 0.01, 0.06);
  tablet.add(stylus);

  peripherals.add(kb, mousePad, tablet);
  root.add(peripherals);

  // 5. Futuristic Compact Workstation Tower (standing on floor beside desk)
  const tower = new THREE.Group();
  tower.name = "WorkstationTower";
  const towerCase = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.52, 0.44),
    matDesk,
  );
  towerCase.position.set(0.85, 0.28, 0.05);
  towerCase.castShadow = true;
  // Glowing front panel strip
  const towerStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.44, 0.015),
    matTrimCyan,
  );
  towerStrip.position.set(0, 0, 0.222);
  towerCase.add(towerStrip);
  tower.add(towerCase);
  root.add(tower);

  // 6. Cyber Bonsai / Geometric Plant
  const plantGroup = new THREE.Group();
  plantGroup.name = "CyberPlant";
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.05, 0.11, 8),
    matPlantPot,
  );
  pot.position.set(-0.58, 0.76, -0.16);
  const plantGeo = new THREE.DodecahedronGeometry(0.08, 1);
  const foliage = new THREE.Mesh(plantGeo, matPlant);
  foliage.position.set(0, 0.1, 0);
  foliage.scale.set(1, 1.2, 1);
  pot.add(foliage);
  plantGroup.add(pot);
  root.add(plantGroup);

  // 7. Floating UI / Holographic Interface Tiles
  const holoGroup = new THREE.Group();
  holoGroup.name = "HologramTiles";
  const tileGeo = new THREE.PlaneGeometry(0.18, 0.14);
  const matTile1 = new THREE.MeshStandardMaterial({
    color: "#00e5ff",
    emissive: "#00e5ff",
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
  });
  const matTile2 = new THREE.MeshStandardMaterial({
    color: "#00ffaa",
    emissive: "#00ffaa",
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
  });

  const tile1 = new THREE.Mesh(tileGeo, matTile1);
  tile1.name = "HoloTile01";
  tile1.position.set(-0.45, 1.45, 0.05);
  tile1.rotation.y = 0.2;

  const tile2 = new THREE.Mesh(tileGeo, matTile2);
  tile2.name = "HoloTile02";
  tile2.position.set(0.42, 1.48, 0.1);
  tile2.rotation.y = -0.25;

  holoGroup.add(tile1, tile2);
  root.add(holoGroup);

  return root;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. EXPERIENCE ENVIRONMENT
// A journey through time, work, and growth
// Stepped platforms, milestone monoliths, timeline progress rings,
// holographic achievement frames, crystal progress markers.
// Ground level of character: y = 0
// ─────────────────────────────────────────────────────────────────────────────
function createExperienceEnvironment() {
  const root = new THREE.Group();
  root.name = "ExperienceEnvironment";

  // Materials
  const matBase = new THREE.MeshStandardMaterial({
    color: "#0e101a",
    roughness: 0.85,
    metalness: 0.2,
  });
  const matPillar = new THREE.MeshStandardMaterial({
    color: "#181b2a",
    roughness: 0.45,
    metalness: 0.7,
  });
  const matViolet = new THREE.MeshStandardMaterial({
    color: "#8a2be2",
    emissive: "#8a2be2",
    emissiveIntensity: 1.6,
    roughness: 0.25,
    metalness: 0.7,
  });
  const matBlue = new THREE.MeshStandardMaterial({
    color: "#427bf4",
    emissive: "#427bf4",
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.8,
  });
  const matGold = new THREE.MeshStandardMaterial({
    color: "#ffaa00",
    emissive: "#ffaa00",
    emissiveIntensity: 1.8,
    roughness: 0.3,
    metalness: 0.8,
  });
  const matGlass = new THREE.MeshStandardMaterial({
    color: "#202540",
    emissive: "#6040bb",
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.65,
    roughness: 0.1,
    metalness: 0.9,
  });

  // 1. Tiered Stepped Platform (Grounded at y = 0)
  // Step 1 (outer base)
  const step1 = new THREE.Mesh(
    new THREE.CylinderGeometry(1.45, 1.5, 0.04, 48),
    matBase,
  );
  step1.position.y = 0.02;
  step1.receiveShadow = true;
  root.add(step1);

  // Step 2 (elevated platform)
  const step2 = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.2, 0.04, 48),
    matPillar,
  );
  step2.position.y = 0.06;
  step2.receiveShadow = true;
  root.add(step2);

  // Step 3 (central dais where monoliths rise)
  const step3 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.9, 0.04, 48),
    matBase,
  );
  step3.position.y = 0.1;
  step3.receiveShadow = true;
  root.add(step3);

  // Glowing perimeter ring on step 2
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.12, 0.014, 12, 48),
    matBlue,
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.082;
  root.add(ring);

  // 2. Three Ascending Milestone Monoliths (in an arc behind character)
  // Monolith 1 (Foundation): height 0.65, pos (-0.6, y, -0.2)
  // Monolith 2 (Growth): height 0.95, pos (0, y, -0.45)
  // Monolith 3 (Mastery): height 1.30, pos (0.6, y, -0.2)
  const monolithGroup = new THREE.Group();
  monolithGroup.name = "MilestoneMonoliths";

  const heights = [0.65, 1.05, 0.85];
  const monolithPositions = [
    [-0.55, -0.25],
    [0.0, -0.45],
    [0.55, -0.25],
  ];
  const monolithColors = [matBlue, matGold, matViolet];

  monolithPositions.forEach(([x, z], i) => {
    const h = heights[i];
    const pillarGeo = new THREE.BoxGeometry(0.28, h, 0.22);
    const pillar = new THREE.Mesh(pillarGeo, matPillar);
    pillar.position.set(x, 0.12 + h / 2, z);
    pillar.castShadow = true;

    // Glowing vertical spine
    const spineGeo = new THREE.BoxGeometry(0.02, h * 0.85, 0.02);
    const spine = new THREE.Mesh(spineGeo, monolithColors[i]);
    spine.position.set(0, 0, 0.112);
    pillar.add(spine);

    // Milestone floating badge on top
    const badgeGeo = new THREE.BoxGeometry(0.18, 0.12, 0.03);
    const badge = new THREE.Mesh(badgeGeo, matGlass);
    badge.position.set(0, h / 2 + 0.12, 0);

    const badgeCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 12, 12),
      monolithColors[i],
    );
    badge.add(badgeCore);
    pillar.add(badge);

    monolithGroup.add(pillar);
  });
  root.add(monolithGroup);

  // 3. Central Holographic Timeline Gyro / Ring
  const timelineGroup = new THREE.Group();
  timelineGroup.name = "TimelineRings";
  timelineGroup.position.set(0, 1.45, -0.4);

  const ringGeo1 = new THREE.TorusGeometry(0.35, 0.016, 12, 36);
  const gyroRing1 = new THREE.Mesh(ringGeo1, matViolet);
  gyroRing1.name = "GyroRing01";
  gyroRing1.rotation.x = Math.PI / 4;

  const ringGeo2 = new THREE.TorusGeometry(0.28, 0.014, 12, 36);
  const gyroRing2 = new THREE.Mesh(ringGeo2, matBlue);
  gyroRing2.name = "GyroRing02";
  gyroRing2.rotation.y = Math.PI / 3;

  const coreSphere = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.1, 1),
    matGold,
  );
  coreSphere.name = "ProgressCore";
  timelineGroup.add(gyroRing1, gyroRing2, coreSphere);
  root.add(timelineGroup);

  // 4. Milestone Pedestal (at front-center for character to interact with)
  const podiumGroup = new THREE.Group();
  podiumGroup.name = "InteractivePodium";
  const podium = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.18, 0.45, 16),
    matPillar,
  );
  podium.position.set(0, 0.32, 0.15);
  podium.castShadow = true;

  const dial = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.03, 16),
    matGlass,
  );
  dial.position.set(0, 0.24, 0);
  const dialGlow = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.01, 8, 24),
    matGold,
  );
  dialGlow.rotation.x = Math.PI / 2;
  dial.add(dialGlow);
  podium.add(dial);
  podiumGroup.add(podium);
  root.add(podiumGroup);

  // 5. Floating Progress Crystals
  const crystalGroup = new THREE.Group();
  crystalGroup.name = "FloatingCrystals";
  const crystalGeo = new THREE.OctahedronGeometry(0.065, 0);
  const c1 = new THREE.Mesh(crystalGeo, matBlue);
  c1.position.set(-0.75, 1.1, 0.1);
  c1.name = "Crystal01";

  const c2 = new THREE.Mesh(crystalGeo, matViolet);
  c2.position.set(0.75, 1.25, 0.05);
  c2.name = "Crystal02";

  crystalGroup.add(c1, c2);
  root.add(crystalGroup);

  return root;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. FEEDBACK ENVIRONMENT
// A playful communication & reaction station
// Modern curved kiosk/terminal, comfortable character seating stool,
// floating reaction badges (hearts, stars, messages), mood light, grounding disc.
// Ground level of character: y = 0
// ─────────────────────────────────────────────────────────────────────────────
function createFeedbackEnvironment() {
  const root = new THREE.Group();
  root.name = "FeedbackEnvironment";

  // Materials
  const matBase = new THREE.MeshStandardMaterial({
    color: "#0f1118",
    roughness: 0.85,
    metalness: 0.2,
  });
  const matStation = new THREE.MeshStandardMaterial({
    color: "#191c28",
    roughness: 0.4,
    metalness: 0.6,
  });
  const matScreen = new THREE.MeshStandardMaterial({
    color: "#180a22",
    emissive: "#881166",
    emissiveIntensity: 0.9,
    roughness: 0.15,
    metalness: 0.85,
  });
  const matCoral = new THREE.MeshStandardMaterial({
    color: "#ff2a7a",
    emissive: "#ff2a7a",
    emissiveIntensity: 1.6,
    roughness: 0.25,
    metalness: 0.7,
  });
  const matWarmGold = new THREE.MeshStandardMaterial({
    color: "#ffaa33",
    emissive: "#ffaa33",
    emissiveIntensity: 1.5,
    roughness: 0.3,
    metalness: 0.7,
  });
  const matLime = new THREE.MeshStandardMaterial({
    color: "#aaff00",
    emissive: "#aaff00",
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.8,
  });
  const matWhiteGlow = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    emissive: "#ffffff",
    emissiveIntensity: 2.0,
    roughness: 0.1,
    metalness: 0.9,
  });
  const matSeat = new THREE.MeshStandardMaterial({
    color: "#2e2136",
    roughness: 0.6,
    metalness: 0.3,
  });

  // 1. Ground Studio Pad (Cylinder at y = 0.02)
  const padGeo = new THREE.CylinderGeometry(1.4, 1.45, 0.04, 48);
  const pad = new THREE.Mesh(padGeo, matBase);
  pad.position.y = 0.02;
  pad.receiveShadow = true;
  root.add(pad);

  // Outer warm glowing ring
  const padRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.35, 0.015, 12, 48),
    matWarmGold,
  );
  padRing.rotation.x = Math.PI / 2;
  padRing.position.y = 0.042;
  root.add(padRing);

  // 2. Modern Communication Kiosk / Station
  const stationGroup = new THREE.Group();
  stationGroup.name = "FeedbackKiosk";

  // Kiosk console body (curved / rounded angled podium)
  const bodyGeo = new THREE.CylinderGeometry(0.38, 0.45, 0.72, 24);
  const body = new THREE.Mesh(bodyGeo, matStation);
  body.position.set(-0.25, 0.38, -0.15);
  body.castShadow = true;

  // Angled top console surface
  const consoleTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.06, 24),
    matStation,
  );
  consoleTop.position.set(0, 0.37, 0);
  consoleTop.rotation.x = 0.22; // angled towards character

  // Interactive touchscreen glass
  const screenMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.3, 0.015),
    matScreen,
  );
  screenMesh.name = "KioskTouchScreen";
  screenMesh.position.set(0, 0.035, 0.02);
  consoleTop.add(screenMesh);

  // Glowing touch UI bar
  const uiBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.02, 0.01),
    matCoral,
  );
  uiBar.position.set(0, -0.09, 0.03);
  consoleTop.add(uiBar);

  body.add(consoleTop);
  stationGroup.add(body);
  root.add(stationGroup);

  // 3. Comfortable Modern Character Stool
  // Seat height 0.42 (matches Pip's sit anchor perfectly)
  const stoolGroup = new THREE.Group();
  stoolGroup.name = "CharacterStool";
  const stoolSeat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.06, 20),
    matSeat,
  );
  stoolSeat.position.set(0.45, 0.39, 0.05);
  stoolSeat.castShadow = true;

  const stoolCushion = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.04, 20),
    matCoral,
  );
  stoolCushion.position.set(0, 0.04, 0);
  stoolSeat.add(stoolCushion);

  const stoolStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.35, 12),
    matStation,
  );
  stoolStem.position.set(0.45, 0.2, 0.05);

  const stoolBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.24, 0.03, 16),
    matStation,
  );
  stoolBase.position.set(0.45, 0.04, 0.05);

  stoolGroup.add(stoolSeat, stoolStem, stoolBase);
  root.add(stoolGroup);

  // 4. Floating Playful Reaction Badges (hovering above kiosk & stool)
  const reactionGroup = new THREE.Group();
  reactionGroup.name = "FloatingReactions";

  // Heart Reaction
  const heartGroup = new THREE.Group();
  heartGroup.name = "HeartReaction";
  heartGroup.position.set(-0.48, 1.25, -0.05);
  const heartPill = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 16, 16),
    matCoral,
  );
  heartPill.scale.set(1.2, 1, 0.6);
  const heartGlow = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.012, 8, 24),
    matCoral,
  );
  heartGroup.add(heartPill, heartGlow);

  // Star Reaction (above kiosk center)
  const starGroup = new THREE.Group();
  starGroup.name = "StarReaction";
  starGroup.position.set(-0.15, 1.48, -0.15);
  const starMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.09, 0),
    matWarmGold,
  );
  starMesh.scale.set(1, 1.4, 0.6);
  const starGlow = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.012, 8, 24),
    matWarmGold,
  );
  starGlow.rotation.x = Math.PI / 4;
  starGroup.add(starMesh, starGlow);

  // Message / Bubble Reaction
  const bubbleGroup = new THREE.Group();
  bubbleGroup.name = "BubbleReaction";
  bubbleGroup.position.set(0.35, 1.32, -0.08);
  const bubbleMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 16),
    matLime,
  );
  bubbleMesh.scale.set(1.2, 0.9, 0.7);
  // Three glowing speech dots inside
  for (let d = -1; d <= 1; d++) {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 8, 8),
      matWhiteGlow,
    );
    dot.position.set(d * 0.038, 0, 0.06);
    bubbleMesh.add(dot);
  }
  bubbleGroup.add(bubbleMesh);

  // Sparkles
  const spark1 = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.035, 0),
    matWhiteGlow,
  );
  spark1.name = "Spark01";
  spark1.position.set(-0.35, 1.05, 0.15);

  const spark2 = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.03, 0),
    matWarmGold,
  );
  spark2.name = "Spark02";
  spark2.position.set(0.15, 1.55, 0.1);

  reactionGroup.add(heartGroup, starGroup, bubbleGroup, spark1, spark2);
  root.add(reactionGroup);

  return root;
}

// ─────────────────────────────────────────────────────────────────────────────
// Execute Builds
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Generating 3 Complete Destination 3D Environments...");

  const servicesEnv = createServicesEnvironment();
  await exportToGLB(
    servicesEnv,
    path.join(modelsDir, "services-environment.glb"),
  );

  const experienceEnv = createExperienceEnvironment();
  await exportToGLB(
    experienceEnv,
    path.join(modelsDir, "experience-environment.glb"),
  );

  const feedbackEnv = createFeedbackEnvironment();
  await exportToGLB(
    feedbackEnv,
    path.join(modelsDir, "feedback-environment.glb"),
  );

  console.log("All 3 destination environments generated successfully!");
}

main().catch((err) => {
  console.error("Failed to generate environments:", err);
  process.exit(1);
});
