import gsap from "gsap";
import { navigationNodes } from "../data/navigationData.js";
import * as THREE from "three";
/**
 * Maps route scene states to page-specific 3D effects.
 */
export class SceneController {
  constructor(threeScene = null) {
    this.threeScene = threeScene;
    this.currentState = "waiting";
  }

  attach(threeScene) {
    this.threeScene = threeScene;
    this.activeEffect = undefined;
    return this;
  }

  refresh() {
    return this.setState(this.currentState);
  }

  setDestination(state) {
    this.destination = navigationNodes[state] ? state : null;
    return this.setState(state);
  }

  setSectionState(state) {
    // Shared selectors such as .hero and .footer must not select another
    // destination while scrolling a routed page. Local scroll motion remains.
    if (!this.destination) this.setState(state);
  }

  setDestinationScroll(progress) {
    if (this.threeScene?.liquidBlob && navigationNodes[this.destination]?.ball) {
      this.threeScene.liquidBlob.scroll = Math.max(0, Math.min(1, progress));
    }
  }

  hitBall(x, y) {
    const scene = this.threeScene;
    return scene?.liquidBlob?.hitTest(x, y, scene.camera, scene.container.getBoundingClientRect());
  }

  ballCenter() {
    const scene = this.threeScene;
    if (!scene?.liquidBlob.group.visible) return null;
    const point = scene.liquidBlob.group.position.clone().project(scene.camera);
    const rect = scene.container.getBoundingClientRect();
    return { x: rect.left + (point.x + 1) * rect.width / 2, y: rect.top + (1 - point.y) * rect.height / 2 };
  }

  impactBall(hit, strength) { this.threeScene?.liquidBlob?.impact(hit, strength); }
  attachSticker(id, hit) { return this.threeScene?.liquidBlob?.addSticker(id, hit); }
  previewSticker(hit) { this.threeScene?.liquidBlob?.preview(hit); }
  currentSticker() { return this.threeScene?.liquidBlob?.currentSticker(); }
  targetSticker(x, y) { return this.threeScene?.liquidBlob?.stickerField.select(x, y); }

  setState(state) {
    this.currentState = state;

    if (!this.threeScene) {
      return;
    }

    this.transitionReset?.kill();
    this.threeScene.postProcessing?.setChromaticOffset?.(0.003);

    if (state === "transition") {
      this.threeScene.liquidBlob?.hide();
      this.threeScene.postProcessing?.setJellyFocus(0.5, 0.5, 0, 0);
      this.prepareTransition();
      return;
    }

    const destination = navigationNodes[state];
    if (destination) {
      const environment = destination.environment;
      if (destination.ball) {
        this._showOnly(null);
        this.threeScene.liquidBlob.configure(destination.ball, state);
        this.threeScene.postProcessing.setBloomStrength(0.25);
        const color = new THREE.Color(destination.ball.atmosphere);
        gsap.to(this.threeScene.liquidBackground.material.uniforms.uColorB.value, { r: color.r, g: color.g, b: color.b, duration: 0.7, overwrite: true });
        this.threeScene.worldScene?.setActiveNode(environment?.marker ?? destination.id);
        return;
      }
      this.threeScene.liquidBlob?.hide();
      this._showOnly(environment?.effect ?? null);
      if (environment?.bloom != null) this.threeScene.postProcessing?.setBloomStrength?.(environment.bloom);
      this.threeScene.worldScene?.setActiveNode(environment?.marker ?? destination.id);
      return;
    }
    if (state === "waiting") {
      this.threeScene.liquidBlob?.hide();
      this._showOnly(null);
      return;
    }
    // Existing non-character routes and in-page section states remain supported.
    this.threeScene.liquidBlob?.hide();
    const handlers = {
      team: () => this._showOnly("constellationGraph"),
      company: () => this._showOnly("warpTunnel"),
      hero: () => this._showOnly("morphBlob"),
      services: () => this.setState("value"),
      process: () => this._showOnly("glassCards"),
    };

    const handler = handlers[state];

    if (handler) {
      handler();
      return;
    }

    console.warn(`Unknown scene state: ${state}`);
  }

  prepareTransition() {
    this.threeScene.particles?.scatter?.();
    this.threeScene.postProcessing?.setChromaticOffset?.(0.008);

    this.transitionReset = gsap.delayedCall(0.6, () => {
      this.threeScene.postProcessing?.setChromaticOffset?.(0.003);
    });
  }

  _showOnly(activeKey) {
    const effects = this.threeScene.sceneEffects;

    if (!effects) {
      return;
    }

    const resolvedKey = effects[activeKey] ? activeKey : null;
    if (this.activeEffect === resolvedKey) return;
    this.activeEffect = resolvedKey;

    for (const [key, effect] of Object.entries(effects)) {
      const object = effect.group || effect.container || effect.mesh;
      effect.visibilityDelay?.kill();
      if (object) {
        gsap.killTweensOf(object.scale);
        object.traverse(child => {
          if (child.material) {
            gsap.killTweensOf(child.material);
            if (child.material.uniforms?.uOpacity) gsap.killTweensOf(child.material.uniforms.uOpacity);
          }
        });
      }
      if (key === resolvedKey) {
        if (object) object.visible = true;
        effect.show?.();
      } else {
        effect.hide?.();
        effect.visibilityDelay = gsap.delayedCall(1.5, () => { if (object) object.visible = false; });
      }
    }

    const bloomMap = {
      morphBlob: 0.6,
      plasmaRings: 0.5,
      flowRibbon: 0.35,
      glassCards: 0.3,
      constellationGraph: 0.5,
      warpTunnel: 0.7,
      magnetAttractor: 0.5,
      campaignHalo: 0.5,
    };

    this.threeScene.postProcessing?.setBloomStrength?.(
      bloomMap[activeKey] ?? 0.5,
    );
  }
}
