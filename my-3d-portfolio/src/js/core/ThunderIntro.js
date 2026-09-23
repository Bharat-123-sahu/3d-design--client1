import gsap from "gsap";
import { INTRO_STATES } from "../effects/ElectricThunderEffect.js";

export class ThunderIntro {
  constructor({ threeScene = null, sceneController = null, lenis = null } = {}) {
    this.threeScene = threeScene;
    this.sceneController = sceneController;
    this.lenis = lenis;
    this.state = INTRO_STATES.IDLE;
    this.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.isComplete = false;
    this.timeline = null;
    this.magneticMove = null;

    this.overlay = this.createOverlay();
    this.button = this.overlay.querySelector("[data-intro-start]");
    this.titleLines = [...this.overlay.querySelectorAll(".thunder-intro__line")];
    this.atmosphere = this.overlay.querySelector(".thunder-intro__atmosphere");

    this.handleStart = this.handleStart.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerLeave = this.handlePointerLeave.bind(this);
    this.button.addEventListener("click", this.handleStart);
    this.button.addEventListener("pointermove", this.handlePointerMove);
    this.button.addEventListener("pointerleave", this.handlePointerLeave);

    this.prepareScene();
    this.playIntro();
  }

  createOverlay() {
    const overlay = document.createElement("section");
    overlay.className = "thunder-intro";
    overlay.setAttribute("aria-label", "Cinematic intro");
    overlay.dataset.introState = this.state;
    overlay.innerHTML = `
      <div class="thunder-intro__atmosphere" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
      <div class="thunder-intro__copy">
        <h1 class="thunder-intro__title" aria-label="Enter the digital world">
          <span class="thunder-intro__line">ENTER</span>
          <span class="thunder-intro__line">THE</span>
          <span class="thunder-intro__line">DIGITAL</span>
          <span class="thunder-intro__line">WORLD</span>
        </h1>
        <button class="thunder-intro__start magnetic" type="button" data-intro-start data-cursor="start">
          <span>START</span>
        </button>
      </div>
      <div class="thunder-intro__veil" aria-hidden="true"></div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  setState(state) {
    this.state = state;
    this.overlay.dataset.introState = state;
    this.threeScene?.introEffect?.setState?.(state);
  }

  prepareScene() {
    this.setState(INTRO_STATES.IDLE);
    document.documentElement.classList.add("is-intro-active");
    this.lenis?.stop?.();

    if (!this.threeScene) return;

    this.originalLightIntensities = {};
    Object.entries(this.threeScene.lights || {}).forEach(([key, light]) => {
      this.originalLightIntensities[key] = light.intensity;
      gsap.set(light, { intensity: Math.min(light.intensity, key === "ambient" ? 0.05 : 0.18) });
    });

    this.threeScene.particles?.hide?.();
    gsap.set(this.threeScene.renderer, { toneMappingExposure: 0.72 });
    this.threeScene.postProcessing?.setBloomStrength?.(
      this.threeScene.theme === "light" ? 0.28 : 0.62,
    );
    this.threeScene.postProcessing?.setChromaticOffset?.(0.0015);
    this.threeScene.introEffect?.setTheme?.(this.threeScene.theme);
    this.threeScene.introEffect?.setIdleEnergy?.(0.05);
  }

  playIntro() {
    const effect = this.threeScene?.introEffect;
    this.timeline?.kill();
    this.timeline = gsap.timeline();

    gsap.set(this.titleLines, { autoAlpha: 0, y: 40, filter: "blur(10px)" });
    gsap.set(this.button, { autoAlpha: 0, y: 20, scale: 0.92 });

    this.timeline
      .to(this.atmosphere, {
        opacity: 1,
        duration: this.reduceMotion ? 0.2 : 0.75,
        ease: "power1.out",
      })
      .call(() => {
        this.setState(INTRO_STATES.CHARGING);
        effect?.setIdleEnergy?.(this.reduceMotion ? 0.08 : 0.14);
      })
      .to(
        this.overlay,
        {
          "--intro-spark-opacity": this.reduceMotion ? 0.18 : 0.44,
          duration: this.reduceMotion ? 0.2 : 0.6,
          ease: "power2.out",
        },
        ">",
      )
      .call(() => {
        this.setState(INTRO_STATES.LIGHTNING_REVEAL);
        this.playStrike();
      })
      .to(
        this.overlay,
        {
          "--intro-blackout": 0.18,
          "--intro-reveal": 1,
          duration: this.reduceMotion ? 0.45 : 1.1,
          ease: "power3.out",
        },
        "+=0.35",
      )
      .call(() => this.revealWorld(), null, "<")
      .to(
        this.titleLines,
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: this.reduceMotion ? 0.35 : 0.85,
          stagger: this.reduceMotion ? 0.03 : 0.08,
          ease: "power3.out",
        },
        ">-0.2",
      )
      .to(
        this.button,
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: this.reduceMotion ? 0.35 : 0.72,
          ease: "back.out(1.8)",
          onComplete: () => this.setState(INTRO_STATES.READY),
        },
        ">-0.15",
      );
  }

  playStrike() {
    const strikeTimeline = this.threeScene?.introEffect?.startReveal?.();
    const bloomTarget = this.threeScene?.theme === "light" ? 0.75 : 1.55;
    gsap.to(this.threeScene?.postProcessing?.bloomPass || {}, {
      strength: bloomTarget,
      duration: this.reduceMotion ? 0.25 : 0.55,
      ease: "power2.out",
    });
    gsap.to(this.threeScene?.postProcessing?.chromaticPass?.uniforms?.uOffset || {}, {
      value: this.reduceMotion ? 0.002 : 0.006,
      duration: 0.2,
      yoyo: true,
      repeat: 1,
    });
    return strikeTimeline;
  }

  revealWorld() {
    if (!this.threeScene) return;

    Object.entries(this.originalLightIntensities || {}).forEach(([key, intensity]) => {
      const light = this.threeScene.lights?.[key];
      if (light) {
        gsap.to(light, {
          intensity,
          duration: this.reduceMotion ? 0.35 : 1.15,
          ease: "power2.out",
        });
      }
    });

    this.threeScene.particles?.show?.();
    gsap.to(this.threeScene.renderer, {
      toneMappingExposure: 1,
      duration: this.reduceMotion ? 0.35 : 1.1,
      ease: "power2.out",
    });
    this.sceneController?.refresh?.();
  }

  handlePointerMove(event) {
    if (this.state !== INTRO_STATES.READY) return;

    const rect = this.button.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    gsap.to(this.button, {
      x: x * 0.14,
      y: y * 0.18,
      duration: 0.28,
      ease: "power2.out",
    });
  }

  handlePointerLeave() {
    gsap.to(this.button, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.35)",
    });
  }

  handleStart() {
    if (this.state !== INTRO_STATES.READY || this.isComplete) return;
    this.setState(INTRO_STATES.STARTING);

    const exitTimeline = gsap.timeline({
      onComplete: () => this.complete(),
    });

    exitTimeline
      .to(this.button, {
        scale: 0.92,
        duration: 0.12,
        ease: "power2.in",
      })
      .to(this.button, {
        autoAlpha: 0,
        y: -14,
        scale: 0.96,
        duration: 0.32,
        ease: "power2.out",
      })
      .to(
        this.titleLines,
        {
          autoAlpha: 0,
          y: -28,
          filter: "blur(12px)",
          duration: this.reduceMotion ? 0.24 : 0.42,
          stagger: 0.025,
          ease: "power2.in",
        },
        "<",
      )
      .add(this.threeScene?.introEffect?.startExit?.(), "<")
      .to(
        this.overlay,
        {
          "--intro-blackout": 0.92,
          "--intro-reveal": 1,
          duration: this.reduceMotion ? 0.25 : 0.5,
          ease: "power3.in",
        },
        "<+0.18",
      )
      .to(this.overlay, {
        autoAlpha: 0,
        duration: this.reduceMotion ? 0.18 : 0.45,
        ease: "power2.out",
      });

    gsap.to(this.threeScene?.postProcessing?.bloomPass || {}, {
      strength: this.threeScene?.theme === "light" ? 0.42 : 1.05,
      duration: 0.9,
      ease: "power2.out",
    });
    gsap.to(this.threeScene?.postProcessing?.chromaticPass?.uniforms?.uOffset || {}, {
      value: 0.003,
      duration: 0.65,
      ease: "power2.out",
    });
  }

  complete() {
    if (this.isComplete) return;

    this.isComplete = true;
    this.setState(INTRO_STATES.COMPLETE);
    document.documentElement.classList.remove("is-intro-active");
    this.lenis?.start?.();
    this.overlay.remove();
    window.dispatchEvent(new CustomEvent("introComplete"));
  }

  destroy() {
    this.timeline?.kill();
    this.button?.removeEventListener("click", this.handleStart);
    this.button?.removeEventListener("pointermove", this.handlePointerMove);
    this.button?.removeEventListener("pointerleave", this.handlePointerLeave);
    this.overlay?.remove();
  }
}
