import gsap from "gsap";

export class ContentVisibilityManager {
  constructor(rootElement) {
    this.root = rootElement;
    this.activePage = null;
  }

  hideAll({ clear = true, animate = false } = {}) {
    this.activePage = null;
    if (!this.root) return Promise.resolve();

    const finish = () => {
      if (clear) this.root.innerHTML = "";
      gsap.set(this.root, {
        autoAlpha: 0,
        y: 0,
        filter: "none",
        pointerEvents: "none",
      });
    };

    if (!animate || !this.root.innerHTML.trim()) {
      finish();
      return Promise.resolve();
    }

    return gsap
      .to(this.root, {
        autoAlpha: 0,
        y: -20,
        filter: "blur(6px)",
        pointerEvents: "none",
        duration: 0.32,
        ease: "power3.in",
      })
      .then(finish);
  }

  prepareHidden(pageId) {
    this.activePage = pageId;
    if (!this.root) return;

    gsap.set(this.root, {
      autoAlpha: 0,
      y: 32,
      filter: "blur(6px)",
      pointerEvents: "none",
    });
  }

  show(pageId, { animate = true } = {}) {
    this.activePage = pageId;
    if (!this.root) return Promise.resolve();

    if (!animate) {
      gsap.set(this.root, {
        autoAlpha: 1,
        y: 0,
        filter: "none",
        pointerEvents: "auto",
      });
      return Promise.resolve();
    }

    return gsap.to(this.root, {
      autoAlpha: 1,
      y: 0,
      filter: "blur(0px)",
      pointerEvents: "auto",
      duration: 0.72,
      ease: "power3.out",
      delay: 0.06,
    });
  }
}
