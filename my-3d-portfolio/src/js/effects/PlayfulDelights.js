import gsap from "gsap";
import { soundFX } from "./SoundFX.js";

/**
 * Playful Delights & Fun Micro-Interactions System.
 * Brings joyful charm, delightful Pip easter eggs, click star bursts, and sound effects.
 */
export class PlayfulDelights {
  constructor({ sceneController = null, characterNav = null } = {}) {
    this.sceneController = sceneController;
    this.characterNav = characterNav;
    this.quotes = [
      "✨ Pip's ready for adventure!",
      "⚡ Zoom zoom! Full speed ahead!",
      "🎨 Tap the glowing Jelly Ball to stick art!",
      "⭐ Tap any 3D world model to travel!",
      "🐾 You found my secret jump! High five! ⭐",
      "🚀 Exploring the digital universe together!",
      "✨ Having fun yet? Pip is!",
    ];
    this.quoteIndex = 0;
    this.initClickSparks();
    this.initSoundToggle();
    this.initPipClickInteraction();
  }

  /**
   * Click sparks anywhere on interactive elements or background.
   */
  initClickSparks() {
    if (typeof document === "undefined") return;

    document.addEventListener(
      "pointerdown",
      (e) => {
        // Don't spawn if right-click or touch-scroll
        if (e.button !== 0) return;
        this.spawnPageSpark(e.clientX, e.clientY);
      },
      { passive: true },
    );
  }

  spawnPageSpark(x, y) {
    const sparkCount = 6;
    const colors = [
      "#00f0ff",
      "#ff77a9",
      "#ffd166",
      "#06d6a0",
      "#118ab2",
      "#ffffff",
    ];

    for (let i = 0; i < sparkCount; i++) {
      const el = document.createElement("div");
      el.className = "playful-click-spark";
      const size = 6 + Math.random() * 8;
      const color = colors[Math.floor(Math.random() * colors.length)];
      Object.assign(el.style, {
        position: "fixed",
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        backgroundColor: color,
        boxShadow: `0 0 10px ${color}`,
        pointerEvents: "none",
        zIndex: "9999",
        transform: "translate(-50%, -50%) scale(1)",
        opacity: "1",
      });
      document.body.appendChild(el);

      const angle = Math.random() * Math.PI * 2;
      const dist = 25 + Math.random() * 45;
      const destX = Math.cos(angle) * dist;
      const destY = Math.sin(angle) * dist;

      gsap.to(el, {
        x: destX,
        y: destY,
        scale: 0,
        opacity: 0,
        duration: 0.5 + Math.random() * 0.25,
        ease: "power2.out",
        onComplete: () => el.remove(),
      });
    }
  }

  /**
   * Interactive Pip easter egg: clicking Pip causes Pip to hop, celebrate, and show cute dialogue!
   */
  initPipClickInteraction() {
    if (typeof window === "undefined") return;

    window.addEventListener("pipClicked", () => {
      this.triggerPipReaction();
    });

    // Also listen on companion button if present
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(
        "[data-companion-avatar], .companion-pip-btn, .character-avatar",
      );
      if (btn) {
        this.triggerPipReaction();
      }
    });
  }

  triggerPipReaction() {
    soundFX.pipChirp();

    // Trigger Pip model celebration
    const navManager = this.characterNav?.navManager;
    if (navManager?.model) {
      navManager.model.react("celebrate");
      // Bouncy jump
      if (navManager.model.root) {
        const baseY = navManager.model.root.position.y;
        gsap.to(navManager.model.root.position, {
          y: baseY + 0.38,
          duration: 0.22,
          yoyo: true,
          repeat: 1,
          ease: "power2.out",
          onComplete: () => {
            navManager.model.root.position.y = baseY;
          },
        });
      }
    }

    // Show floating speech bubble over character
    this.showPipSpeechBubble();
  }

  showPipSpeechBubble() {
    const existing = document.querySelector(".pip-speech-bubble");
    if (existing) existing.remove();

    const quote = this.quotes[this.quoteIndex % this.quotes.length];
    this.quoteIndex++;

    const bubble = document.createElement("div");
    bubble.className = "pip-speech-bubble";
    bubble.innerHTML = `<span>${quote}</span>`;
    Object.assign(bubble.style, {
      position: "fixed",
      bottom: "110px",
      right: "24px",
      zIndex: "300",
      background: "rgba(10, 14, 28, 0.92)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(0, 240, 255, 0.6)",
      boxShadow:
        "0 8px 32px rgba(0, 240, 255, 0.25), 0 0 0 1px rgba(255,255,255,0.1) inset",
      color: "#f0faff",
      padding: "10px 18px",
      borderRadius: "18px",
      fontSize: "0.88rem",
      fontWeight: "600",
      letterSpacing: "0.02em",
      pointerEvents: "none",
      transform: "translateY(16px) scale(0.85)",
      opacity: "0",
      transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
    });

    document.body.appendChild(bubble);

    requestAnimationFrame(() => {
      bubble.style.transform = "translateY(0) scale(1)";
      bubble.style.opacity = "1";
    });

    setTimeout(() => {
      bubble.style.transform = "translateY(-10px) scale(0.9)";
      bubble.style.opacity = "0";
      setTimeout(() => bubble.remove(), 400);
    }, 2800);
  }

  /**
   * Sound toggle badge in corner so users can easily toggle sound effects anytime.
   */
  initSoundToggle() {
    if (typeof document === "undefined") return;

    let soundBtn = document.querySelector(".sound-toggle-btn");
    if (!soundBtn) {
      soundBtn = document.createElement("button");
      soundBtn.className = "sound-toggle-btn";
      soundBtn.type = "button";
      soundBtn.setAttribute("aria-label", "Toggle Sound Effects");
      soundBtn.innerHTML = `
        <span class="sound-icon">${soundFX.isMuted() ? "🔇" : "🔊"}</span>
        <span class="sound-label">${soundFX.isMuted() ? "SOUND OFF" : "SOUND ON"}</span>
      `;
      Object.assign(soundBtn.style, {
        position: "fixed",
        bottom: "20px",
        left: "20px",
        zIndex: "100",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 14px",
        background: "rgba(10, 14, 28, 0.78)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(0, 240, 255, 0.4)",
        borderRadius: "20px",
        color: "#d0f4ff",
        fontSize: "0.72rem",
        fontWeight: "700",
        letterSpacing: "0.1em",
        cursor: "pointer",
        transition: "all 0.25s ease",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.5)",
      });

      soundBtn.addEventListener("click", () => {
        const isMuted = soundFX.toggleMute();
        soundBtn.querySelector(".sound-icon").textContent = isMuted
          ? "🔇"
          : "🔊";
        soundBtn.querySelector(".sound-label").textContent = isMuted
          ? "SOUND OFF"
          : "SOUND ON";
        soundBtn.style.borderColor = isMuted
          ? "rgba(255, 100, 100, 0.4)"
          : "rgba(0, 240, 255, 0.6)";
      });

      soundBtn.addEventListener("mouseenter", () => {
        soundBtn.style.transform = "scale(1.05)";
        soundBtn.style.boxShadow = "0 0 20px rgba(0, 240, 255, 0.4)";
      });
      soundBtn.addEventListener("mouseleave", () => {
        soundBtn.style.transform = "scale(1.0)";
        soundBtn.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.5)";
      });

      document.body.appendChild(soundBtn);
    }
  }
}
