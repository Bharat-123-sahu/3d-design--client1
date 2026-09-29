import gsap from "gsap";
import { INTRO_STATES } from "../effects/ElectricThunderEffect.js";

export class ThunderIntro {
  constructor({
    threeScene = null,
    sceneController = null,
    lenis = null,
  } = {}) {
    this.threeScene = threeScene;
    this.sceneController = sceneController;
    this.lenis = lenis;
    this.state = INTRO_STATES.IDLE;
    this.reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    this.isComplete = false;
    this.timeline = null;
    this.magneticMove = null;

    this.overlay = this.createOverlay();
    this.canvas = this.overlay.querySelector(".thunder-intro__canvas");
    this.ctx = this.canvas?.getContext("2d");
    this.bolts = [];
    this.lastBoltSpawn = 0;
    this.ambientFlash = 0;
    this.initLightningCanvas();

    this.button = this.overlay.querySelector("[data-intro-start]");
    this.titleLines = [
      ...this.overlay.querySelectorAll(".thunder-intro__line"),
    ];
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
      <canvas class="thunder-intro__canvas" aria-hidden="true"></canvas>
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
      gsap.set(light, {
        intensity: Math.min(light.intensity, key === "ambient" ? 0.05 : 0.18),
      });
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
          "--intro-blackout": 0.88,
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
    gsap.to(
      this.threeScene?.postProcessing?.chromaticPass?.uniforms?.uOffset || {},
      {
        value: this.reduceMotion ? 0.002 : 0.006,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
      },
    );
    return strikeTimeline;
  }

  revealWorld() {
    if (!this.threeScene) return;
    // Keep 3D world hidden and scene lights atmospheric until user clicks START
  }

  handlePointerMove(event) {
    if (
      this.state !== INTRO_STATES.READY ||
      this.reduceMotion ||
      event.pointerType === "touch"
    )
      return;

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
    const worldExit = this.threeScene?.introEffect?.startExit?.();
    this.setState(INTRO_STATES.STARTING);

    // Massive electrical burst on click!
    const w = window.innerWidth;
    const h = window.innerHeight;
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      this.spawnLightningBolt(w, h, { burst: true, angle });
    }
    this.ambientFlash = 1.0;

    Object.entries(this.originalLightIntensities || {}).forEach(
      ([key, intensity]) => {
        const light = this.threeScene?.lights?.[key];
        if (light) {
          gsap.to(light, {
            intensity,
            duration: this.reduceMotion ? 0.35 : 1.15,
            ease: "power2.out",
          });
        }
      },
    );

    this.threeScene?.particles?.show?.();
    gsap.to(this.threeScene?.renderer || {}, {
      toneMappingExposure: 1,
      duration: this.reduceMotion ? 0.35 : 1.1,
      ease: "power2.out",
    });

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
      .add(worldExit || gsap.timeline(), "<")
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
    gsap.to(
      this.threeScene?.postProcessing?.chromaticPass?.uniforms?.uOffset || {},
      {
        value: 0.003,
        duration: 0.65,
        ease: "power2.out",
      },
    );
  }

  initLightningCanvas() {
    if (!this.canvas || !this.ctx) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.canvas.width = w * dpr;
      this.canvas.height = h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    this.canvasResizeHandler = resize;

    const animate = (time) => {
      if (this.isComplete) return;
      this.animFrameId = requestAnimationFrame(animate);

      const w = window.innerWidth;
      const h = window.innerHeight;
      this.ctx.clearRect(0, 0, w, h);

      // Flash background slightly on lightning strike
      if (this.ambientFlash > 0.01) {
        this.ctx.fillStyle = `rgba(255, 15, 35, ${this.ambientFlash * 0.12})`;
        this.ctx.fillRect(0, 0, w, h);
        this.ambientFlash *= 0.88;
      }

      // In READY state or LIGHTNING_REVEAL, continuously generate electric bolts
      const spawnInterval = this.state === INTRO_STATES.READY ? 75 : 140;
      if (
        (this.state === INTRO_STATES.READY ||
          this.state === INTRO_STATES.LIGHTNING_REVEAL) &&
        time - this.lastBoltSpawn > spawnInterval
      ) {
        this.lastBoltSpawn = time;
        const count =
          this.state === INTRO_STATES.READY
            ? Math.random() < 0.45
              ? 2
              : 1
            : 1;
        for (let i = 0; i < count; i++) {
          this.spawnLightningBolt(w, h);
        }
        if (Math.random() < 0.28) this.ambientFlash = 0.85;
      }

      // Update and draw existing bolts
      this.bolts = this.bolts.filter((bolt) => {
        bolt.life -= 0.055;
        if (bolt.life <= 0) return false;

        this.drawLightningBolt(bolt);
        return true;
      });
    };

    this.animFrameId = requestAnimationFrame(animate);
  }

  spawnLightningBolt(w, h, { burst = false, angle = 0 } = {}) {
    let sx, sy, ex, ey;
    const btnRect = this.button?.getBoundingClientRect();
    const targetX = btnRect ? btnRect.left + btnRect.width / 2 : w / 2;
    const targetY = btnRect ? btnRect.top + btnRect.height / 2 : h / 2;

    if (burst) {
      sx = targetX;
      sy = targetY;
      const dist = Math.max(w, h) * (0.4 + Math.random() * 0.5);
      ex = sx + Math.cos(angle) * dist;
      ey = sy + Math.sin(angle) * dist;
    } else {
      const side = Math.floor(Math.random() * 4);
      if (side === 0) {
        // Top
        sx = Math.random() * w;
        sy = -10;
      } else if (side === 1) {
        // Left
        sx = -10;
        sy = Math.random() * h;
      } else if (side === 2) {
        // Right
        sx = w + 10;
        sy = Math.random() * h;
      } else {
        // Top-corner / diagonal
        sx = Math.random() < 0.5 ? -10 : w + 10;
        sy = Math.random() * h * 0.5;
      }
      // Target towards center or around START button
      ex = targetX + (Math.random() - 0.5) * 220;
      ey = targetY + (Math.random() - 0.5) * 160;
    }

    const segments = [];
    const buildBranch = (x1, y1, x2, y2, depth) => {
      if (depth <= 0) {
        segments.push({ x1, y1, x2, y2 });
        return;
      }
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const displacement = (Math.random() - 0.5) * len * 0.42;
      const px = midX + nx * displacement;
      const py = midY + ny * displacement;

      buildBranch(x1, y1, px, py, depth - 1);
      buildBranch(px, py, x2, y2, depth - 1);

      if (Math.random() < 0.32 && depth >= 2) {
        const theta = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.1;
        const bLen = len * 0.45;
        const bx = px + Math.cos(theta) * bLen;
        const by = py + Math.sin(theta) * bLen;
        buildBranch(px, py, bx, by, depth - 2);
      }
    };

    buildBranch(sx, sy, ex, ey, 5);
    this.bolts.push({ segments, life: 1.0, maxLife: 1.0 });
  }

  drawLightningBolt(bolt) {
    if (!this.ctx) return;
    const alpha = Math.min(1.0, bolt.life * 1.5);
    const ctx = this.ctx;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Pass 1: Neon Crimson Wide Aura Glow
    ctx.shadowBlur = 26;
    ctx.shadowColor = "#ff0022";
    ctx.strokeStyle = `rgba(255, 10, 45, ${alpha * 0.55})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (const s of bolt.segments) {
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
    }
    ctx.stroke();

    // Pass 2: Bright Red Plasma Core
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ff2244";
    ctx.strokeStyle = `rgba(255, 60, 85, ${alpha * 0.85})`;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Pass 3: Hot White Core Center
    ctx.shadowBlur = 4;
    ctx.shadowColor = "#ffffff";
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
    ctx.lineWidth = 1.0;
    ctx.stroke();

    ctx.restore();
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
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.canvasResizeHandler)
      window.removeEventListener("resize", this.canvasResizeHandler);
    this.button?.removeEventListener("click", this.handleStart);
    this.button?.removeEventListener("pointermove", this.handlePointerMove);
    this.button?.removeEventListener("pointerleave", this.handlePointerLeave);
    this.overlay?.remove();
  }
}
