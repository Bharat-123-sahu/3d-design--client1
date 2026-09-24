import gsap from "gsap";
/**
 * Maps route scene states to page-specific 3D effects.
 */
export class SceneController {
  constructor(threeScene = null) {
    this.threeScene = threeScene;
    this.currentState = "home";
  }

  attach(threeScene) {
    this.threeScene = threeScene;
    return this;
  }

  refresh() {
    return this.setState(this.currentState);
  }

  setState(state) {
    this.currentState = state;

    if (!this.threeScene) {
      return;
    }

    if (state === "transition") {
      this.prepareTransition();
      return;
    }

    const handlers = {
      home: () => this._showOnly("campaignHalo"),
      about: () => this._showOnly("plasmaRings"),
      value: () => this._showOnly("flowRibbon"),
      work: () => this._showOnly("glassCards"),
      team: () => this._showOnly("constellationGraph"),
      company: () => this._showOnly("warpTunnel"),
      contact: () => this._showOnly("magnetAttractor"),
      hero: () => this._showOnly("morphBlob"),
      services: () => this._showOnly("flowRibbon"),
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

    window.setTimeout(() => {
      this.threeScene.postProcessing?.setChromaticOffset?.(0.003);
    }, 600);
  }

  _showOnly(activeKey) {
    if (this.activeEffect === activeKey) return;
    this.activeEffect = activeKey;
    const effects = this.threeScene.sceneEffects;

    if (!effects) {
      return;
    }

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
      if (key === activeKey) {
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
