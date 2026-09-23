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
    const effects = this.threeScene.sceneEffects;

    if (!effects) {
      return;
    }

    for (const [key, effect] of Object.entries(effects)) {
      if (key === activeKey) {
        effect.show?.();
      } else {
        effect.hide?.();
      }
    }

    const bloomMap = {
      morphBlob: 1.0,
      plasmaRings: 0.9,
      flowRibbon: 0.7,
      glassCards: 0.5,
      constellationGraph: 0.85,
      warpTunnel: 1.2,
      magnetAttractor: 0.8,
      campaignHalo: 1.15,
    };

    this.threeScene.postProcessing?.setBloomStrength?.(
      bloomMap[activeKey] ?? 0.8,
    );
  }
}
