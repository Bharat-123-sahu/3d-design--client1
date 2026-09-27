import { getViewportProfile, onViewportChange } from "../utils/responsive.js";
import { characterConfig } from "../data/experienceConfig.js";
import * as THREE from "three";
import { WorldScene } from "./WorldScene.js";
import gsap from "gsap";

import { createCamera } from "./Camera.js";
import { createRenderer } from "./Renderer.js";
import { createPostProcessing } from "./PostProcessing.js";
import { InteractionManager } from "./InteractionManager.js";

import liquidVertex from "../shaders/liquid/liquidVertex.glsl";
import liquidFragment from "../shaders/liquid/liquidFragment.glsl";

import { MorphBlob } from "../effects/MorphBlob.js";
import { LiquidBlob } from "../effects/LiquidBlob.js";
import { PlasmaRings } from "../effects/PlasmaRings.js";
import { FlowRibbon } from "../effects/FlowRibbon.js";
import { GlassCards } from "../effects/GlassCards.js";
import { ConstellationGraph } from "../effects/ConstellationGraph.js";
import { WarpTunnel } from "../effects/WarpTunnel.js";
import { MagnetAttractor } from "../effects/MagnetAttractor.js";
import { CampaignHalo } from "../effects/CampaignHalo.js";
import { ElectricThunderEffect } from "../effects/ElectricThunderEffect.js";

class LiquidBackground {
  constructor(scene) {
    const segments = getViewportProfile().lowPower ? 40 : 96;
    const geometry = new THREE.PlaneGeometry(18, 14, segments, segments);

    this.material = new THREE.ShaderMaterial({
      vertexShader: liquidVertex,
      fragmentShader: liquidFragment,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uMouseVelocity: { value: new THREE.Vector2(0, 0) },
        uMouseStrength: { value: 1.5 },
        uVelocityStrength: { value: 0.5 },
        uDistortion: { value: 0.8 },
        uColorA: { value: new THREE.Color("#030303") },
        uColorB: { value: new THREE.Color("#080d18") },
      },
      transparent: true,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.z = -5;
    scene.add(this.mesh);
    this._prevMouse = { x: 0, y: 0 };
  }

  update(interaction, elapsed) {
    const dx = interaction.x - this._prevMouse.x;
    const dy = interaction.y - this._prevMouse.y;

    this.material.uniforms.uTime.value = elapsed;
    this.material.uniforms.uMouse.value.set(interaction.x, interaction.y);
    this.material.uniforms.uMouseVelocity.value.set(dx, dy);

    this._prevMouse.x = interaction.x;
    this._prevMouse.y = interaction.y;
  }

  destroy() {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }

  frameDestination(camera, active) {
    if (active) {
      // Cover destination camera angles while keeping the existing background.
      camera.updateMatrixWorld();
      const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 18;
      this.mesh.position.set(0, 0, -18).applyMatrix4(camera.matrixWorld);
      this.mesh.quaternion.copy(camera.quaternion);
      this.mesh.scale.set(height * camera.aspect / 18 * 1.25, height / 14 * 1.25, 1);
    } else if (this.destinationFramed) {
      this.mesh.position.set(0, 0, -5);
      this.mesh.quaternion.identity();
      const height = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.position.z + 5);
      this.mesh.scale.set(Math.max(1, height * camera.aspect / 18), Math.max(1, height / 14), 1);
    }
    this.destinationFramed = active;
  }
}

function createStarField(scene) {
  const count = 1800;
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    speeds[i] = Math.random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      attribute float aSpeed;
      varying float vAlpha;

      void main() {
        vAlpha = 0.3 + 0.7 * abs(sin(uTime * (0.5 + aSpeed * 2.0) + aSpeed * 6.28));
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = (0.015 + aSpeed * 0.02) * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;

      void main() {
        float d = length(gl_PointCoord - 0.5);
        float circle = 1.0 - smoothstep(0.0, 0.5, d);
        gl_FragColor = vec4(0.8, 0.9, 1.0, circle * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
  return stars;
}

export class ThreeScene {
  constructor(container, onReady = null) {
    this.container = container;
    this.onReady = onReady;
    this.isDestroyed = false;
    this.reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    this.profile = getViewportProfile();
    this.clock = new THREE.Clock();
    this.effectTime = 0;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2("#050505", 0.03);
    this.interaction = new InteractionManager();

    this.camera = createCamera(this.container);
    this.renderer = createRenderer(this.container);
    this.postProcessing = createPostProcessing(
      this.renderer,
      this.scene,
      this.camera,
      this.container.clientWidth,
      this.container.clientHeight,
    );

    this.liquidBackground = new LiquidBackground(this.scene);
    this.liquidBlob = new LiquidBlob(this.scene);
    this.particles = this.createParticleField();
    this.stars = createStarField(this.scene);
    this.createLights();
    this.theme = "dark";

    this.sceneEffects = {
      campaignHalo: new CampaignHalo(this.scene),
      morphBlob: new MorphBlob(this.scene),
      plasmaRings: new PlasmaRings(this.scene),
      flowRibbon: new FlowRibbon(this.scene),
      glassCards: new GlassCards(this.scene),
      constellationGraph: new ConstellationGraph(this.scene),
      warpTunnel: new WarpTunnel(this.scene),
      magnetAttractor: new MagnetAttractor(this.scene),
    };
    this.introEffect = new ElectricThunderEffect(this.scene, this.camera, {
      reduceMotion: this.reduceMotion,
    });

    // Persistent 3D navigation world (sits alongside existing effects)
    this.worldScene = new WorldScene(this.scene, this.camera, this.container);

    // Character navigation manager — set externally by main.js
    this.navManager = null;

    for (const effect of Object.values(this.sceneEffects)) {
      effect.hide?.();
    }

    this.unsubscribeViewport = onViewportChange(this.handleResize, -20);
    this.handleResize();
    this.onReady?.(this);
    this.animate();
  }

  createLights() {
    const key = new THREE.DirectionalLight("#ffffff", 2.5);
    key.position.set(4, 5, 5);

    const cyan = new THREE.PointLight("#29d9ff", 16, 12);
    cyan.position.set(-3, 1.5, 3);

    const rose = new THREE.PointLight("#f84f8f", 12, 10);
    rose.position.set(3, -1, 3);

    const ambient = new THREE.AmbientLight("#8899bb", 0.6);

    const purple = new THREE.PointLight("#8855ff", 10, 9);
    purple.position.set(0, 3, -2);

    const lime = new THREE.PointLight("#bbff5c", 8, 8);
    lime.position.set(-2, -2, 2);

    this.lights = { key, cyan, rose, ambient, purple, lime };
    this.scene.add(key, cyan, rose, ambient, purple, lime);
  }

  setTheme(theme = "dark", animate = true) {
    this.theme = theme;

    const dark = theme === "dark";
    const duration = animate ? 0.8 : 0;
    const targets = dark
      ? {
          fog: "#050505",
          bgA: "#030303",
          bgB: "#080d18",
          particle: "#dff7ff",
          starOpacity: 1,
          bloom: 1.05,
          ambient: 0.6,
          key: 2.5,
          cyan: 16,
          rose: 12,
          purple: 10,
          lime: 8,
        }
      : {
          fog: "#edf4ff",
          bgA: "#f7fbff",
          bgB: "#dfeaff",
          particle: "#2563eb",
          starOpacity: 0.38,
          bloom: 0.42,
          ambient: 1.15,
          key: 1.55,
          cyan: 5.5,
          rose: 3.5,
          purple: 4,
          lime: 2.5,
        };

    const fogColor = new THREE.Color(targets.fog);
    const bgA = new THREE.Color(targets.bgA);
    const bgB = new THREE.Color(targets.bgB);
    const particleColor = new THREE.Color(targets.particle);

    gsap.to(this.scene.fog.color, {
      r: fogColor.r,
      g: fogColor.g,
      b: fogColor.b,
      duration,
      ease: "power2.inOut",
    });

    gsap.to(this.liquidBackground.material.uniforms.uColorA.value, {
      r: bgA.r,
      g: bgA.g,
      b: bgA.b,
      duration,
      ease: "power2.inOut",
    });
    gsap.to(this.liquidBackground.material.uniforms.uColorB.value, {
      r: bgB.r,
      g: bgB.g,
      b: bgB.b,
      duration,
      ease: "power2.inOut",
    });
    gsap.to(this.particles.material.color, {
      r: particleColor.r,
      g: particleColor.g,
      b: particleColor.b,
      duration,
      ease: "power2.inOut",
    });
    gsap.to(this.stars.material, {
      opacity: targets.starOpacity,
      duration,
      ease: "power2.inOut",
    });

    Object.entries({
      ambient: targets.ambient,
      key: targets.key,
      cyan: targets.cyan,
      rose: targets.rose,
      purple: targets.purple,
      lime: targets.lime,
    }).forEach(([key, intensity]) => {
      if (this.lights?.[key]) {
        gsap.to(this.lights[key], {
          intensity,
          duration,
          ease: "power2.inOut",
        });
      }
    });

    this.postProcessing?.setBloomStrength?.(targets.bloom);
    this.introEffect?.setTheme?.(theme);
    this.worldScene?.setTheme?.(theme);
    this.navManager?.setTheme?.(theme);
  }

  createParticleField() {
    const count = 1400;
    const positions = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
      const stride = index * 3;
      positions[stride] = (Math.random() - 0.5) * 9;
      positions[stride + 1] = (Math.random() - 0.5) * 5.6;
      positions[stride + 2] = (Math.random() - 0.5) * 5 - 1.8;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: "#dff7ff",
      size: 0.018,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });

    const field = new THREE.Points(geometry, material);
    this.scene.add(field);

    field.scatter = () =>
      gsap.to(field.rotation, { z: field.rotation.z + 0.8, duration: 0.8 });
    field.show = () =>
      gsap.to(field.material, { opacity: 0.72, duration: 0.5 });
    field.hide = () =>
      gsap.to(field.material, { opacity: 0.28, duration: 0.5 });

    return field;
  }

  setCharacterPresentation(content) {
    this.container.style.pointerEvents = content ? "none" : "auto";
    if (this.characterContentMode === content) return;
    this.characterContentMode = content;
    this.characterPresentationTween?.kill();
    this.characterPresence ||= { opacity: 1 };
    const model = this.navManager?.model;
    if (!content) {
      this.characterPresence.opacity = 1;
      model?.setPresentationOpacity(1);
      model?.root.traverse(object => object.layers.enable(0));
      this.worldScene?.setContentMode(false);
      return;
    }
    this.characterPresentationTween = gsap.to(this.characterPresence, {
      opacity: 0,
      duration: this.profile.reduced ? 0.5 : characterConfig.arrivalFade,
      ease: "power2.inOut",
      onComplete: () => {
        model?.root.traverse(object => object.layers.disable(0));
        this.worldScene?.setContentMode(true);
      },
    });
  }

  attachCharacterView(container) {
    this.characterViewport = container;
    // Reuse the existing WebGL renderer and scene. This canvas is only a 2D
    // presentation surface for a small crop rendered before the main composer.
    this.characterCanvas = document.createElement("canvas");
    this.characterContext = this.characterCanvas.getContext("2d", { alpha: true });
    this.characterCamera = new THREE.PerspectiveCamera(38, 1, 0.1, 30);
    this.characterCamera.layers.set(1);
    this.characterLook = new THREE.Vector3();
    this.characterOffset = new THREE.Vector3(0.75, 0.4, 2.65);
    this.characterRenderState = { viewport: new THREE.Vector4(), scissor: new THREE.Vector4(), color: new THREE.Color() };
    this.lights.key.layers.enable(1);
    this.lights.ambient.layers.enable(1);
    container.append(this.characterCanvas);
    this.characterResizeObserver = new ResizeObserver(() => this.resizeCharacterView());
    this.characterResizeObserver.observe(container);
    this.resizeCharacterView();
    this.characterContextLost = event => { event.preventDefault(); this.characterContextPaused = true; container.closest("button").classList.add("has-context-loss"); };
    this.characterContextRestored = () => { this.characterContextPaused = false; container.closest("button").classList.remove("has-context-loss"); this.resizeCharacterView(); };
    this.renderer.domElement.addEventListener("webglcontextlost", this.characterContextLost);
    this.renderer.domElement.addEventListener("webglcontextrestored", this.characterContextRestored);
  }

  resizeCharacterView() {
    if (!this.characterCanvas) return;
    const width = Math.max(1, this.characterViewport.clientWidth);
    const height = Math.max(1, this.characterViewport.clientHeight);
    const dpr = Math.min(this.renderer.getPixelRatio(), characterConfig.view.dpr);
    this.characterPixelWidth = Math.floor(width * dpr);
    this.characterPixelHeight = Math.floor(height * dpr);
    this.characterCamera.aspect = width / height;
    this.characterCamera.updateProjectionMatrix();
  }

  renderCharacterView() {
    if (!this.characterContext || this.characterContextPaused) return;
    this.characterLook.copy(this.navManager.character.group.position);
    this.characterLook.y += 0.72 * this.navManager.model.root.scale.x;
    const targetFraming = this.navManager.model.restState === "sit" ? 1 : 0;
    if (this.companionStudioVisible !== Boolean(targetFraming)) {
      this.companionStudioVisible = Boolean(targetFraming);
      for (const key of ["about", "studioDesk", "studioBase"]) {
        this.worldScene.markers[key]?.traverse(object => targetFraming ? object.layers.enable(1) : object.layers.disable(1));
      }
    }
    this.characterFraming = this.profile.reduced ? targetFraming : (this.characterFraming || 0) + (targetFraming - (this.characterFraming || 0)) * 0.12;
    this.characterLook.x -= this.characterFraming * 0.3;
    this.characterLook.y += this.characterFraming * 0.05;
    this.characterCamera.position.copy(this.characterLook).addScaledVector(this.characterOffset, 1 + this.characterFraming * 0.28);
    this.characterCamera.lookAt(this.characterLook);

    const renderer = this.renderer;
    const saved = this.characterRenderState;
    renderer.getViewport(saved.viewport);
    renderer.getScissor(saved.scissor);
    renderer.getClearColor(saved.color);
    const alpha = renderer.getClearAlpha();
    const scissorTest = renderer.getScissorTest();
    const renderTarget = renderer.getRenderTarget();
    const fog = this.scene.fog;
    const width = this.characterViewport.clientWidth;
    const height = this.characterViewport.clientHeight;
    renderer.setRenderTarget(null);
    renderer.setViewport(0, 0, width, height);
    renderer.setScissor(0, 0, width, height);
    renderer.setScissorTest(true);
    renderer.setClearColor(0x000000, 0);
    this.scene.fog = null;
    renderer.clear();
    // The companion camera always presents the same model at full opacity.
    this.navManager.model.setPresentationOpacity(1);
    renderer.render(this.scene, this.characterCamera);
    const pixelRatio = renderer.getPixelRatio();
    const sourceWidth = Math.floor(width * pixelRatio);
    const sourceHeight = Math.floor(height * pixelRatio);
    // Resize and repaint atomically: assigning canvas dimensions clears its bitmap.
    // Keep the previous frame visible until the replacement frame is ready.
    if (this.characterCanvas.width !== this.characterPixelWidth) this.characterCanvas.width = this.characterPixelWidth;
    if (this.characterCanvas.height !== this.characterPixelHeight) this.characterCanvas.height = this.characterPixelHeight;
    this.characterContext.clearRect(0, 0, this.characterCanvas.width, this.characterCanvas.height);
    this.characterContext.drawImage(renderer.domElement, 0, renderer.domElement.height - sourceHeight, sourceWidth, sourceHeight, 0, 0, this.characterCanvas.width, this.characterCanvas.height);
    this.navManager.model.setPresentationOpacity(this.navManager.model.root.layers.isEnabled(0) ? (this.characterPresence?.opacity ?? 1) : 1);
    this.scene.fog = fog;
    renderer.setRenderTarget(renderTarget);
    renderer.setViewport(saved.viewport);
    renderer.setScissor(saved.scissor);
    renderer.setScissorTest(scissorTest);
    renderer.setClearColor(saved.color, alpha);
  }

  handleResize = () => {
    if (!this.container) {
      return;
    }

    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.profile = getViewportProfile();
    this.reduceMotion = this.profile.reduced;
    this.renderer.setPixelRatio(this.profile.dpr);
    this.renderer.setSize(width, height, false);
    this.postProcessing?.resize(width, height, this.profile);
    this.particles.geometry.setDrawRange(0, this.profile.lowPower ? 420 : 1400);
    this.stars.geometry.setDrawRange(0, this.profile.lowPower ? 540 : 1800);
    this.navManager?.handleResize?.(this.profile);
    this.resizeCharacterView();
    if (!this.navManager) this.camera.position.z = 6 * this.profile.cameraDistance;
    const planeHeight = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * (this.camera.position.z + 5);
    this.liquidBackground.mesh.scale.set(Math.max(1, planeHeight * this.camera.aspect / 18), Math.max(1, planeHeight / 14), 1);
    this.introEffect?.handleResize?.();
  };

  animate = () => {
    if (this.isDestroyed) {
      return;
    }

    this.frameId = requestAnimationFrame(this.animate);
    if (document.hidden) { this.clock.getDelta(); return; }
    const now = performance.now();
    const interval = 1000 / (this.profile.reduced ? 24 : this.profile.lowPower ? 30 : 60);
    if (this.lastFrame && now - this.lastFrame < interval - 1) return;
    this.lastFrame = now;

    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.effectTime += this.reduceMotion ? 0 : delta;
    const elapsed = this.effectTime;
    const interaction = this.interaction.update();

    this.liquidBackground.update(interaction, elapsed);
    this.particles.rotation.y += delta * (this.reduceMotion ? 0.012 : 0.035);
    this.particles.rotation.x =
      interaction.y * (this.reduceMotion ? 0.008 : 0.03);

    this.stars.material.uniforms.uTime.value = elapsed;
    this.stars.rotation.y += delta * (this.reduceMotion ? 0.004 : 0.015);
    this.stars.rotation.x = interaction.y * (this.reduceMotion ? 0.003 : 0.01);

    if (!this.navManager && !this.reduceMotion) {
    this.camera.position.x +=
      (interaction.x * (this.reduceMotion ? 0.04 : 0.15) -
        this.camera.position.x) *
      0.02;
    this.camera.position.y +=
      (interaction.y * (this.reduceMotion ? 0.03 : 0.1) -
        this.camera.position.y) *
      0.02;
    this.camera.lookAt(0, 0, 0);

    }

    for (const effect of Object.values(this.sceneEffects)) {
      const object = effect.group || effect.container || effect.mesh;
      if (object?.visible !== false && (!object?.scale || object.scale.lengthSq() > 0.00001)) {
        effect.update?.(this.reduceMotion ? 0 : delta, interaction.x, interaction.y);
      }
    }
    if (!this.worldScene?.isActive) this.introEffect?.update?.(delta, elapsed);

    // Navigation world + character
    this.worldScene?.update?.(delta, elapsed);
    this.navManager?.update?.(delta);
    this.liquidBlob.update(delta, this.camera, this.profile, this.postProcessing);
    this.liquidBackground.frameDestination(this.camera, this.liquidBlob.group.visible);

    this.postProcessing.update(elapsed);
    if (!this.characterContextPaused) {
      this.renderCharacterView();
      this.postProcessing.composer.render();
    }
  };

  destroy() {
    this.isDestroyed = true;
    this.characterPresentationTween?.kill();
    cancelAnimationFrame(this.frameId);
    this.unsubscribeViewport?.();
    this.characterResizeObserver?.disconnect();
    this.characterNavigation?.destroy();
    this.renderer.domElement.removeEventListener("webglcontextlost", this.characterContextLost);
    this.renderer.domElement.removeEventListener("webglcontextrestored", this.characterContextRestored);
    this.characterCanvas?.remove();
    this.postProcessing?.destroy?.();
    this.worldScene?.destroy?.();
    this.navManager?.destroy?.();

    this.liquidBackground?.destroy?.();
    this.liquidBlob?.destroy?.();
    this.particles?.geometry?.dispose?.();
    this.particles?.material?.dispose?.();
    this.stars?.geometry?.dispose?.();
    this.stars?.material?.dispose?.();

    for (const effect of Object.values(this.sceneEffects)) {
      effect.destroy?.();
    }
    this.introEffect?.destroy?.();

    this.renderer?.dispose?.();
    this.interaction?.destroy?.();
  }
}
