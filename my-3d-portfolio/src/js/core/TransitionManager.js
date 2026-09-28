import gsap from "gsap";

export class TransitionManager {
  constructor(options = {}) {
    this.options = {
      duration: 0.8,
      ease: "power3.inOut",
      lenis: null,
      sceneController: null,
      ...options,
    };

    this.isTransitioning = false;
  }

  async goTo(target) {
    if (this.isTransitioning || !target) return;

    this.isTransitioning = true;

    try {
      const state = this.resolveState(target);

      if (!state) {
        return;
      }

      await this.options.sceneController?.setState("transition");
      await this.exit();
      this.scrollToTarget(target);
      await this.options.sceneController?.setState(state);
      await this.enter();
      this.animateSection(state);
    } finally {
      this.isTransitioning = false;
    }
  }

  resolveState(target) {
    const state = target.replace("#", "");
    const allowedStates = new Set([
      "hero",
      "about",
      "services",
      "process",
      "contact",
    ]);

    return allowedStates.has(state) ? state : null;
  }

  animateSection(state) {
    if (state === "about") {
      const aboutContent = document.querySelector(".js-about-content");

      if (aboutContent) {
        gsap.fromTo(
          aboutContent,
          {
            opacity: 0,
            y: 60,
          },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            delay: 0.15,
            ease: "power4.out",
          },
        );
      }
    }
  }

  exit() {
    return new Promise((resolve) => {
      gsap.to(".page-transition", {
        scaleY: 1,
        transformOrigin: "bottom",
        duration: this.options.duration,
        ease: this.options.ease,
        onComplete: resolve,
      });
    });
  }

  enter() {
    return new Promise((resolve) => {
      gsap.to(".page-transition", {
        scaleY: 0,
        transformOrigin: "top",
        duration: this.options.duration,
        ease: this.options.ease,
        onComplete: resolve,
      });
    });
  }

  scrollToTarget(target) {
    const section = document.querySelector(target);

    if (!section) return;

    if (this.options.lenis) {
      this.options.lenis.scrollTo(section, {
        immediate: true,
      });

      return;
    }

    section.scrollIntoView({
      behavior: "instant",
    });
  }
}
