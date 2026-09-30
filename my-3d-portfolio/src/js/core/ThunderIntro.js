import gsap from "gsap";
import { INTRO_STATES } from "../effects/ElectricThunderEffect.js";
import { soundFX } from "../effects/SoundFX.js";

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
        <h1 class="thunder-intro__title roman-typography" aria-label="Enter the digital world">
          <span class="thunder-intro__line">
            <span class="thunder-intro__char">E</span><span class="thunder-intro__char">N</span><span class="thunder-intro__char">T</span><span class="thunder-intro__char">E</span><span class="thunder-intro__char">R</span>
          </span>
          <span class="thunder-intro__line">
            <span class="thunder-intro__char">T</span><span class="thunder-intro__char">H</span><span class="thunder-intro__char">E</span>
          </span>
          <span class="thunder-intro__line">
            <span class="thunder-intro__char">D</span><span class="thunder-intro__char">I</span><span class="thunder-intro__char">G</span><span class="thunder-intro__char">I</span><span class="thunder-intro__char">T</span><span class="thunder-intro__char">A</span><span class="thunder-intro__char">L</span>
          </span>
          <span class="thunder-intro__line">
            <span class="thunder-intro__char">W</span><span class="thunder-intro__char">O</span><span class="thunder-intro__char">R</span><span class="thunder-intro__char">L</span><span class="thunder-intro__char">D</span>
          </span>
        </h1>
        <button class="thunder-intro__start magnetic" type="button" data-intro-start data-cursor="start">
          <span>START</span>
        </button>
      </div>
      <div class="thunder-intro__veil" aria-hidden="true"></div>
    `;
    document.body.appendChild(overlay);
    this.chars = [...overlay.querySelectorAll(".thunder-intro__char")];
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

    gsap.set(this.chars, {
      autoAlpha: 0,
      y: 32,
      filter: "blur(10px)",
      scale: 0.92,
    });
    gsap.set(this.titleLines, { autoAlpha: 1 });
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
        this.chars,
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: this.reduceMotion ? 0.35 : 0.85,
          stagger: this.reduceMotion ? 0.02 : 0.045,
          ease: "power2.out",
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
    soundFX.thunderZap();
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

      // Flash background with Dragon Ball Super electric blue ki on lightning strike
      if (this.ambientFlash > 0.01) {
        this.ctx.fillStyle = `rgba(0, 190, 255, ${this.ambientFlash * 0.16})`;
        this.ctx.fillRect(0, 0, w, h);
        this.ambientFlash *= 0.88;
      }

      // In READY state or LIGHTNING_REVEAL, continuously generate electric bolts
      const spawnInterval = this.state === INTRO_STATES.READY ? 70 : 130;
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
        if (Math.random() < 0.32) this.ambientFlash = 0.88;
      }

      // Update and draw existing bolts
      this.bolts = this.bolts.filter((bolt) => {
        bolt.life -= 0.052;
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
      const dist = Math.max(w, h) * (0.42 + Math.random() * 0.55);
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
    const sparks = [];
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
      // Bold cartoon/anime zig-zag displacement (Dragon Ball Super sharp angles)
      const displacement = (Math.random() - 0.5) * len * 0.55;
      const px = midX + nx * displacement;
      const py = midY + ny * displacement;

      // Add anime ki spark at sharp corners
      if (depth >= 2 && Math.random() < 0.4) {
        sparks.push({
          x: px,
          y: py,
          size: 3 + Math.random() * 4,
          rot: Math.random() * Math.PI,
        });
      }

      buildBranch(x1, y1, px, py, depth - 1);
      buildBranch(px, py, x2, y2, depth - 1);

      if (Math.random() < 0.35 && depth >= 2) {
        const theta = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.35;
        const bLen = len * 0.52;
        const bx = px + Math.cos(theta) * bLen;
        const by = py + Math.sin(theta) * bLen;
        buildBranch(px, py, bx, by, depth - 2);
      }
    };

    buildBranch(sx, sy, ex, ey, 4);
    const thickness = burst ? 1.55 : 1.1 + Math.random() * 0.65;
    this.bolts.push({ segments, sparks, thickness, life: 1.0, maxLife: 1.0 });
  }

  drawLightningBolt(bolt) {
    if (!this.ctx) return;
    const alpha = Math.min(1.0, bolt.life * 1.5);
    const ctx = this.ctx;
    const thickness = bolt.thickness || 1.2;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "miter";
    ctx.miterLimit = 3;

    // Pass 1: Dragon Ball Super Deep Blue Ki Aura (thick stylized outer glow)
    ctx.shadowBlur = 32;
    ctx.shadowColor = "#0055ff";
    ctx.strokeStyle = `rgba(0, 95, 255, ${alpha * 0.75})`;
    ctx.lineWidth = Math.max(12, 19 * thickness);
    ctx.beginPath();
    for (const s of bolt.segments) {
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
    }
    ctx.stroke();

    // Pass 2: Electric Cyan Super Saiyan Blue Plasma Core
    ctx.shadowBlur = 16;
    ctx.shadowColor = "#00f0ff";
    ctx.strokeStyle = `rgba(0, 240, 255, ${alpha * 0.95})`;
    ctx.lineWidth = Math.max(6, 8.5 * thickness);
    ctx.stroke();

    // Pass 3: Searing Pure White Hot Core Center
    ctx.shadowBlur = 6;
    ctx.shadowColor = "#ffffff";
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 1.0})`;
    ctx.lineWidth = Math.max(2.6, 3.8 * thickness);
    ctx.stroke();

    // Pass 4: Anime Diamond Ki Sparks along bolt nodes
    if (bolt.sparks && bolt.sparks.length) {
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#00f0ff";
      for (const sp of bolt.sparks) {
        ctx.save();
        ctx.translate(sp.x, sp.y);
        ctx.rotate(sp.rot);
        ctx.beginPath();
        ctx.moveTo(0, -sp.size);
        ctx.lineTo(sp.size * 0.6, 0);
        ctx.lineTo(0, sp.size);
        ctx.lineTo(-sp.size * 0.6, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

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
