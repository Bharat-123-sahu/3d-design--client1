import * as THREE from "three";
import { characterConfig } from "../data/experienceConfig.js";

// Pip: an original lavender field mouse, with a cream muzzle and coral neckerchief.
// One articulated model is shared by the world and companion cameras.
export class CharacterModel {
  constructor() {
    this.root = new THREE.Group();
    this.root.name = "PipOriginalMouse";
    this.parts = {};
    this.time = 0;
    this.state = "idle";
    this.restState = "idle";
    this.reactionUntil = 0;
    this.gaitPhase = 0;
    this.locomotionSpeed = 0;
    this.runBlend = 0;
    this.sphere = new THREE.SphereGeometry(1, 24, 16);
    this.materials = Object.fromEntries(
      Object.entries({
        fur: "#9293c4",
        cream: "#fff0d7",
        pink: "#df9fae",
        ink: "#24263c",
        white: "#ffffff",
        scarf: "#ec735b",
      }).map(([name, color]) => [
        name,
        new THREE.MeshStandardMaterial({ color, roughness: 0.62 }),
      ]),
    );
    this.materials = Object.fromEntries(
      Object.entries({
        fur: "#9293c4",
        cream: "#fff0d7",
        pink: "#df9fae",
        ink: "#24263c",
        white: "#ffffff",
        scarf: "#ec735b",
        cyberCyan: "#00e5ff",
        cyberGold: "#ffaa00",
        cyberCoral: "#ff2a7a",
        darkMetal: "#161928",
      }).map(([name, color]) => [
        name,
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.55,
          ...(name.startsWith("cyber")
            ? { emissive: color, emissiveIntensity: 1.4 }
            : {}),
        }),
      ]),
    );
    this.build();
    this.root.traverse((object) => object.layers.enable(1));
    this.root.traverse((object) => object.layers.enable(1));
  }

  ellipsoid(parent, material, position, scale) {
    const mesh = new THREE.Mesh(this.sphere, this.materials[material]);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    parent.add(mesh);
    return mesh;
  }

  setPresentationOpacity(opacity) {
    for (const material of Object.values(this.materials)) {
      const transparent = opacity < 1;
      if (material.transparent !== transparent) {
        material.transparent = transparent;
        material.needsUpdate = true;
      }
      material.opacity = opacity;
      material.depthWrite = !transparent;
    }
  }

  build() {
    const body = (this.parts.body = new THREE.Group());
    this.root.add(body);
    this.ellipsoid(body, "fur", [0, 0.62, 0], [0.255, 0.37, 0.205]);
    this.ellipsoid(body, "cream", [0, 0.61, 0.175], [0.18, 0.245, 0.07]);
    const head = (this.parts.head = new THREE.Group());
    head.position.set(0, 1.03, 0.02);
    body.add(head);
    this.ellipsoid(head, "fur", [0, 0, 0], [0.32, 0.285, 0.25]);
    for (const side of [-1, 1]) {
      const ear = this.ellipsoid(
        head,
        "fur",
        [side * 0.27, 0.22, -0.025],
        [0.195, 0.235, 0.095],
      );
      ear.rotation.z = side * -0.22;
      this.ellipsoid(
        head,
        "pink",
        [side * 0.276, 0.225, 0.055],
        [0.143, 0.177, 0.028],
      );
      this.ellipsoid(
        head,
        "cream",
        [side * 0.09, -0.105, 0.205],
        [0.135, 0.09, 0.095],
      );
      const eye = this.ellipsoid(
        head,
        "white",
        [side * 0.13, 0.04, 0.212],
        [0.089, 0.113, 0.049],
      );
      this.parts[side < 0 ? "eyeL" : "eyeR"] = eye;
      this.ellipsoid(
        eye,
        "ink",
        [0.15 * -side, -0.04, 0.87],
        [0.56, 0.67, 0.4],
      );
      this.ellipsoid(eye, "white", [-0.06, 0.22, 1.2], [0.18, 0.17, 0.13]);
      const brow = this.ellipsoid(
        head,
        "ink",
        [side * 0.13, 0.169, 0.218],
        [0.066, 0.015, 0.017],
      );
      brow.rotation.z = side * -0.14;
      const arm = new THREE.Group();
      arm.position.set(side * 0.235, 0.78, 0);
      body.add(arm);
      this.ellipsoid(arm, "fur", [side * 0.03, -0.14, 0], [0.07, 0.18, 0.073]);
      this.ellipsoid(
        arm,
        "cream",
        [side * 0.045, -0.285, 0.015],
        [0.079, 0.088, 0.075],
      );
      this.parts[side < 0 ? "armL" : "armR"] = arm;
      const leg = new THREE.Group();
      leg.position.set(side * 0.125, 0.34, 0);
      body.add(leg);
      this.ellipsoid(leg, "fur", [0, -0.105, 0], [0.083, 0.16, 0.085]);
      this.ellipsoid(leg, "cream", [0, -0.277, 0.065], [0.1, 0.06, 0.16]);
      this.parts[side < 0 ? "legL" : "legR"] = leg;
    }
    this.ellipsoid(head, "ink", [0, -0.058, 0.306], [0.047, 0.035, 0.032]);
    const smile = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.09, -0.16, 0.267),
      new THREE.Vector3(0, -0.18, 0.289),
      new THREE.Vector3(0.09, -0.15, 0.267),
    ]);
    head.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(smile, 14, 0.009, 5, false),
        this.materials.ink,
      ),
    );
    this.ellipsoid(body, "scarf", [0, 0.865, 0.07], [0.212, 0.048, 0.17]);
    const scarf = this.ellipsoid(
      body,
      "scarf",
      [0.11, 0.78, 0.21],
      [0.065, 0.12, 0.022],
    );
    scarf.rotation.z = -0.35;
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.36, -0.12),
      new THREE.Vector3(0.22, 0.22, -0.35),
      new THREE.Vector3(0.48, 0.14, -0.31),
      new THREE.Vector3(0.53, 0.24, -0.18),
    ]);
    const tail = (this.parts.tail = new THREE.Mesh(
      new THREE.TubeGeometry(tailCurve, 24, 0.023, 8, false),
      this.materials.pink,
    ));
    body.add(tail);

    // Experience gear: Futuristic Cyber-Visor
    const expGear = (this.parts.experienceGear = new THREE.Group());
    expGear.name = "ExperienceCyberVisor";
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.07, 0.08),
      this.materials.cyberCyan,
    );
    visor.position.set(0, 0.04, 0.22);
    const visorBridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.035, 0.04),
      this.materials.darkMetal,
    );
    visorBridge.position.set(0, 0.05, 0.23);
    for (const side of [-1, 1]) {
      const node = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.025, 12),
        this.materials.cyberGold,
      );
      node.rotation.z = Math.PI / 2;
      node.position.set(side * 0.19, 0.04, 0.16);
      expGear.add(node);
    }
    expGear.add(visor, visorBridge);
    head.add(expGear);
    expGear.visible = false;

    // Feedback gear: Cute Studio DJ Headphones & Boom Mic
    const fbGear = (this.parts.feedbackGear = new THREE.Group());
    fbGear.name = "FeedbackHeadphones";
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.31, 0.02, 8, 24, Math.PI),
      this.materials.darkMetal,
    );
    band.position.set(0, 0.16, 0);
    for (const side of [-1, 1]) {
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.075, 0.075, 0.045, 16),
        this.materials.cyberCoral,
      );
      cup.rotation.z = Math.PI / 2;
      cup.position.set(side * 0.31, 0.04, 0);
      const cupRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.07, 0.012, 8, 16),
        this.materials.cyberGold,
      );
      cupRim.rotation.y = Math.PI / 2;
      cupRim.position.set(side * 0.33, 0.04, 0);
      fbGear.add(cup, cupRim);
    }
    const micArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.007, 0.16, 8),
      this.materials.darkMetal,
    );
    micArm.rotation.x = Math.PI / 3;
    micArm.rotation.z = -Math.PI / 6;
    micArm.position.set(0.22, -0.06, 0.12);
    const micTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 10, 10),
      this.materials.cyberCyan,
    );
    micTip.position.set(0.16, -0.13, 0.21);
    fbGear.add(band, micArm, micTip);
    head.add(fbGear);
    fbGear.visible = false;

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.34, 32),
      new THREE.MeshBasicMaterial({
        color: "#121124",
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.004;
    shadow.scale.y = 0.72;
    this.root.add(shadow);
  }

  setState(state) {
    this.state = this.restState = state;
    this.reactionUntil = 0;
    if (!["walk", "run", "transition"].includes(state))
      this.locomotionSpeed = 0;
  }
  setLocomotion(speed, allowRun) {
    const state =
      allowRun && speed > characterConfig.travel.runThreshold ? "run" : "walk";
    if (this.state !== state) this.setState(state);
    this.locomotionSpeed = speed;
  }
  react(state) {
    this.state = state;
    this.reactionUntil = this.time + 2.5;
  }

  update(delta, reduced = false) {
    this.time += delta;
    if (this.reactionUntil && this.time > this.reactionUntil) {
      this.reactionUntil = 0;
      this.state = this.restState;
    }
    const t = reduced ? 0 : this.time;
    const p = this.parts;
    const walking =
      this.state === "walk" ||
      this.state === "run" ||
      this.state === "transition";
    this.runBlend = THREE.MathUtils.damp(
      this.runBlend,
      this.state === "run" ? 1 : 0,
      7,
      delta,
    );
    const speed = this.locomotionSpeed;
    if (walking && !reduced)
      this.gaitPhase += delta * Math.min(18, (speed * 4.6) / this.root.scale.x);
    const stride =
      walking && !reduced
        ? Math.sin(this.gaitPhase) *
          (0.36 + this.runBlend * 0.12) *
          Math.min(1, speed / 0.65)
        : 0;
    const sitting = this.restState === "sit";
    const wave = this.state === "wave";
    const celebrate = this.state === "celebrate";
    const thinking = ["thinking", "curious", "inspect"].includes(this.state);
    const point = ["point", "interact"].includes(this.state);
    // Lift the pelvis by the rotated foot's actual extent so neither foot
    // penetrates the floor as the stride blends in and out.
    const footBottom =
      0.34 -
      0.277 * Math.cos(stride) -
      0.065 * Math.abs(Math.sin(stride)) -
      Math.hypot(0.06 * Math.cos(stride), 0.16 * Math.sin(stride));
    const blend = 1 - Math.exp(-characterConfig.poseBlend * delta);
    const approach = (object, key, target) =>
      (object[key] = THREE.MathUtils.lerp(object[key], target, blend));
    approach(p.legL.rotation, "x", sitting ? -Math.PI / 2 : stride);
    approach(p.legR.rotation, "x", sitting ? -Math.PI / 2 : -stride);
    approach(p.armL.rotation, "x", -stride * 0.7);
    approach(
      p.armR.rotation,
      "x",
      point ? -1.3 : thinking ? -0.85 : stride * 0.7,
    );
    approach(p.armL.rotation, "z", celebrate ? -2.2 : sitting ? -0.83 : 0.12);
    approach(
      p.armR.rotation,
      "z",
      wave
        ? 2.3 + Math.sin(t * 10) * 0.25
        : celebrate
          ? 2.2
          : thinking
            ? 0.7
            : -0.12,
    );
    approach(
      p.body.position,
      "y",
      sitting
        ? characterConfig.studio.seatHeight / this.root.scale.x - 0.25
        : walking
          ? Math.max(0, -footBottom) + Math.abs(stride) * 0.02
          : celebrate
            ? Math.abs(Math.sin(t * 6)) * 0.09
            : 0,
    );
    if (!sitting) {
      const clearance = [p.legL.rotation.x, p.legR.rotation.x].map(
        (angle) =>
          -(
            0.34 -
            0.277 * Math.cos(angle) -
            0.065 * Math.abs(Math.sin(angle)) -
            Math.hypot(0.06 * Math.cos(angle), 0.16 * Math.sin(angle))
          ),
      );
      p.body.position.y = Math.max(p.body.position.y, ...clearance);
    }
    approach(
      p.head.rotation,
      "y",
      this.state === "look"
        ? Math.sin(t * 0.8) * 0.35
        : this.state === "turn"
          ? 0.35
          : 0,
    );
    approach(p.head.rotation, "z", thinking ? -0.16 : wave ? 0.09 : 0);
    approach(p.head.rotation, "x", thinking ? 0.1 : 0);
    p.body.scale.y = 1 + (walking || reduced ? 0 : Math.sin(t * 2) * 0.006);
    const blink = !reduced && t % 4.6 > 4.45 ? 0.12 : 1;
    p.eyeL.scale.y = p.eyeR.scale.y = 0.113 * blink;
    p.tail.rotation.y = reduced ? 0 : Math.sin(t * 1.9) * 0.08;

    const isExp = this.state === "point";
    const isFeedback = ["curious", "celebrate", "wave", "thinking"].includes(
      this.state,
    );
    if (this.parts.experienceGear) this.parts.experienceGear.visible = isExp;
    if (this.parts.feedbackGear) this.parts.feedbackGear.visible = isFeedback;
  }

  dispose() {
    const geometries = new Set();
    const materials = new Set();
    this.root.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) materials.add(object.material);
    });
    geometries.forEach((item) => item.dispose());
    materials.forEach((item) => item.dispose());
    this.root.removeFromParent();
  }
}
