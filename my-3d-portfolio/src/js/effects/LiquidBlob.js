import * as THREE from "three";
import gsap from "gsap";
import vertexShader from "../shaders/liquid/jellyVertex.glsl";
import fragmentShader from "../shaders/liquid/jellyFragment.glsl";
import { stickerLibrary } from "../data/stickerData.js";
import { SurfaceStickers } from "./SurfaceStickers.js";
import { StickerField } from "./StickerField.js";
import { ClickStarBurst } from "./ClickStarBurst.js";

/** Persistent gel sphere; the CPU surface and shared GPU displacement agree. */
export class LiquidBlob {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);
    this.geometry = new THREE.SphereGeometry(1, 80, 56);
    this.rest = this.geometry.attributes.position.array.slice();
    this.geometry.setAttribute(
      "aRest",
      new THREE.BufferAttribute(this.rest, 3),
    );
    this.impactNormal = new THREE.Vector3(0, 0, 1);
    this.uniforms = {
      uColorA: { value: new THREE.Color() },
      uColorB: { value: new THREE.Color() },
      uGlow: { value: new THREE.Color() },
      uBase: { value: new THREE.Color("#050612") },
      uTime: { value: 0 },
      uSpring: { value: 0 },
      uReduced: { value: 0 },
      uImpact: { value: this.impactNormal },
      uLight: { value: 1 },
      uFocus: { value: 0 },
    };
    this.mesh = new THREE.Mesh(
      this.geometry,
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: this.uniforms,
      }),
    );
    this.group.add(this.mesh);
    this.surfaceStickers = new SurfaceStickers(this.mesh, this.uniforms);
    this.stickerField = new StickerField(this);
    this.clickStarBurst = new ClickStarBurst(this.scene);
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.scratch = new THREE.Vector3();
    this.stickers = [];
    this.scroll = this.focus = this.spring = this.velocity = this.time = 0;
    this.reveal = { value: 0 };
    this.layout = { x: 0, y: 0, z: 4, scale: 0.7 };
  }

  configure(config, id) {
    this.destination = id;
    this.config = config;
    this.scroll = 0;
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!this.configured) this.mesh.rotation.set(...config.rotation);
    this.configured = true;
    for (const [key, color] of Object.entries({
      uColorA: config.colorA,
      uColorB: config.colorB,
      uGlow: config.glow,
      uBase: config.base,
    })) {
      const target = new THREE.Color(color);
      gsap.to(this.uniforms[key].value, {
        r: target.r,
        g: target.g,
        b: target.b,
        duration: this.reduced ? 0 : 0.9,
        overwrite: true,
      });
    }
    gsap.to(this.uniforms.uLight, {
      value: config.environmentIntensity,
      duration: 0.8,
      overwrite: true,
    });
    this.group.visible = true;
    gsap.to(this.reveal, {
      value: 1,
      duration: this.reduced ? 0 : 0.8,
      ease: "power3.out",
      overwrite: true,
    });
  }

  hide(immediate = false) {
    this.stickerField.hide();
    this.preview(null);
    gsap.to(this.reveal, {
      value: 0,
      duration: immediate || this.reduced ? 0 : 0.45,
      overwrite: true,
      onComplete: () => {
        this.group.visible = false;
      },
    });
  }

  // The same expression lives in jellySurface.glsl. Never changes topology.
  deform(x, y, z, target, offset = 0) {
    const dot =
      x * this.impactNormal.x +
      y * this.impactNormal.y +
      z * this.impactNormal.z;
    const dent = this.spring * (0.34 - Math.pow(Math.max(0, dot), 3.5) * 0.75);
    const breath = this.reduced
      ? 0
      : Math.sin(x * 3 + y * 2 + this.time * 1.2) * 0.004;
    const radius = 1 + dent + breath + offset;
    return target.set(
      x * radius * (1 + this.spring * 0.32),
      y * radius * (1 - this.spring * 0.38),
      z * radius * (1 + this.spring * 0.16),
    );
  }

  impact(hit, strength = 1) {
    if (!hit || this.reduced) return;
    this.impactNormal
      .copy(this.mesh.worldToLocal(hit.point.clone()))
      .normalize();
    this.velocity = THREE.MathUtils.clamp(
      this.velocity + strength * 1.45,
      -2.2,
      2.2,
    );
  }

  triggerImpact(hit, strength = 1) {
    if (!hit) return;
    this.impact(hit, strength);

    let normal = null;
    if (hit.face?.normal) {
      normal = hit.face.normal
        .clone()
        .transformDirection(this.mesh.matrixWorld)
        .normalize();
    } else {
      const ballWorldPos = new THREE.Vector3();
      this.mesh.getWorldPosition(ballWorldPos);
      normal = hit.point.clone().sub(ballWorldPos).normalize();
    }

    const colors =
      this.config?.clickBurstColors ||
      (this.config
        ? [this.config.colorA, this.config.colorB, this.config.glow, "#ffffff"]
        : null);

    const lowPower =
      this.reduced ||
      this.lowPower ||
      (typeof window !== "undefined" && window.innerWidth <= 700);

    this.clickStarBurst.trigger({
      position: hit.point,
      normal,
      colors,
      intensity: strength,
      lowPower,
    });
  }

  hitTest(clientX, clientY, camera, rect) {
    if (!this.group.visible || this.reveal.value < 0.2) return null;
    this.pointer.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      (-(clientY - rect.top) / rect.height) * 2 + 1,
    );
    camera.updateMatrixWorld();
    this.group.updateMatrixWorld(true);
    this.raycaster.setFromCamera(this.pointer, camera);
    return this.raycaster.intersectObject(this.mesh, false)[0] || null;
  }

  surfaceFrame(hit) {
    const center = this.mesh.worldToLocal(hit.point.clone()).normalize();
    const normal = hit.face.normal.clone().normalize();
    // Align the sticker's up direction with the current camera view at placement.
    const viewUp = new THREE.Vector3(0, 1, 0).applyQuaternion(
      this.mesh.quaternion.clone().invert(),
    );
    const tangent = viewUp.cross(normal).normalize();
    if (tangent.lengthSq() < 0.1) tangent.set(1, 0, 0);
    tangent.addScaledVector(center, -tangent.dot(center)).normalize();
    return { center, tangent };
  }

  currentSticker() {
    return this.stickerField.target?.id;
  }

  preview(hit) {
    this.surfaceStickers.showPreview(null, null);
    if (!hit) {
      this.stickerField.pointer = null;
      this.stickerField.clearTarget();
    }
  }

  async addSticker(id, hit) {
    if (!stickerLibrary[id] || !hit || !this.config) return false;
    const target = this.stickerField.target;
    if (target?.id !== id) return false;
    const { center, tangent } = this.surfaceFrame(hit);
    // Reserve the exact highlighted record synchronously, even during rapid input.
    const attached = await this.stickerField.fly(target, center, tangent);
    if (!attached || this.destroyed) return false;
    this.impact({ point: this.mesh.localToWorld(center.clone()) }, 0.85);
    this.stickers.push({
      id,
      center,
      tangent,
      index: attached.index,
      record: attached,
    });
    this.preview(hit);
    return true;
  }

  update(delta, camera, profile, postProcessing) {
    this.lowPower = profile.lowPower;
    this.clickStarBurst.update(delta);
    if (!this.group.visible || !this.config) return;
    this.reduced = profile.reduced;
    this.time += this.reduced ? 0 : delta;
    for (let remaining = Math.min(delta, 0.1); remaining > 0; ) {
      const dt = Math.min(remaining, 1 / 120);
      this.velocity += (-42 * this.spring - 5.2 * this.velocity) * dt;
      this.spring = THREE.MathUtils.clamp(
        this.spring + this.velocity * dt,
        -0.16,
        0.16,
      );
      remaining -= dt;
    }
    if (this.reduced) this.spring = this.velocity = 0;
    const ease = this.reduced ? 1 : 1 - Math.exp(-delta * 7);
    this.focus += (this.scroll - this.focus) * ease;
    const mobile = profile.width <= 700;
    const layout = mobile ? this.config.mobile : this.config;
    const p = this.focus;
    const targets = {
      x: THREE.MathUtils.lerp(layout.position.x, layout.background.x, p),
      y: THREE.MathUtils.lerp(layout.position.y, layout.background.y, p),
      z: layout.position.z + p * this.config.scroll.depth,
      scale:
        layout.scale * THREE.MathUtils.lerp(1, this.config.scroll.scale, p),
    };
    for (const key of Object.keys(targets))
      this.layout[key] += (targets[key] - this.layout[key]) * ease;
    const { x, y, z: distance } = this.layout;
    const halfHeight =
      Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
    const widthCap = halfHeight * camera.aspect * (mobile ? 0.81 : 0.72);
    const scale = Math.max(
      0.0001,
      Math.min(
        halfHeight * this.layout.scale,
        widthCap * THREE.MathUtils.lerp(1, this.config.scroll.scale, p),
      ) * Math.max(0.0001, this.reveal.value),
    );
    camera.updateMatrixWorld();
    this.group.position
      .set(x * halfHeight * camera.aspect, y * halfHeight, -distance)
      .applyMatrix4(camera.matrixWorld);
    this.group.quaternion.copy(camera.quaternion);
    this.group.scale.setScalar(scale);
    this.mesh.rotation.y += this.reduced
      ? 0
      : delta * this.config.rotationSpeed;
    const position = this.geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      this.deform(
        this.rest[i * 3],
        this.rest[i * 3 + 1],
        this.rest[i * 3 + 2],
        this.scratch,
      );
      position.setXYZ(i, this.scratch.x, this.scratch.y, this.scratch.z);
    }
    position.needsUpdate = true;
    this.geometry.computeBoundingSphere();
    this.uniforms.uTime.value = this.time;
    this.uniforms.uSpring.value = this.spring;
    this.uniforms.uReduced.value = this.reduced ? 1 : 0;
    this.uniforms.uFocus.value = p;
    this.surfaceStickers.update(delta);
    this.group.updateMatrixWorld(true);
    this.stickerField.update(delta, camera, profile);
    const focusRadius =
      halfHeight > 0.0001 ? (scale / halfHeight / 2) * 1.08 : 0;
    postProcessing.setJellyFocus(
      (x + 1) / 2,
      (y + 1) / 2,
      focusRadius,
      p * (mobile ? this.config.scroll.mobileBlur : this.config.scroll.blur),
    );
  }

  destroy() {
    this.destroyed = true;
    this.hide(true);
    gsap.killTweensOf(this.reveal);
    this.clickStarBurst.destroy();
    this.stickerField.destroy();
    this.surfaceStickers.destroy();
    for (const key of ["uColorA", "uColorB", "uGlow", "uBase"])
      gsap.killTweensOf(this.uniforms[key].value);
    gsap.killTweensOf(this.uniforms.uLight);
    this.geometry.dispose();
    this.mesh.material.dispose();
    this.scene.remove(this.group);
  }
}
