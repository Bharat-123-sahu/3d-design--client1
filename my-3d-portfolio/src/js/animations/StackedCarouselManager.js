import { onViewportChange } from "../utils/responsive.js";
import gsap from "gsap";
import { trackDisposer, prefersReducedMotion } from "../utils/animationRegistry.js";

export class StackedCarouselManager {
  constructor(root) {
    this.root = root;
    this.cards = Array.from(root.querySelectorAll(".stack-carousel__card"));
    this.prevBtn = root.querySelector("[data-carousel-prev]");
    this.nextBtn = root.querySelector("[data-carousel-next]");
    this.metaEls = {
      title: root.querySelector("[data-carousel-title]"),
      category: root.querySelector("[data-carousel-category]"),
      desc: root.querySelector("[data-carousel-description]"),
      index: root.querySelector("[data-carousel-index]"),
    };
    this.active = 0;
    this.filter = "all";
    this.isAnimating = false;
    this.pointerStart = null;
    this.wheelLock = false;
    this.reduceMotion = prefersReducedMotion();

    if (this.cards.length < 2) return;

    this.bind();
    this.render(true);
  }

  bind() {
    this.nextHandler = () => this.go(1);
    this.prevHandler = () => this.go(-1);
    this.keyHandler = (event) => {
      if (!this.root.contains(document.activeElement)) return;
      if (event.key === "ArrowRight") this.go(1);
      if (event.key === "ArrowLeft") this.go(-1);
    };
    this.filterHandler = (event) => {
      if (this.root.dataset.carousel !== "work") return;
      this.filter = event.detail?.filter || "all";
      const firstAvailable = this.cards.findIndex((card) => this.isAvailable(card));
      if (firstAvailable >= 0) {
        this.active = firstAvailable;
        this.render();
      }
    };
    this.pointerDownHandler = (event) => {
      if (event.target.closest("button")) return;
      this.pointerStart = event.clientX;
      this.pointerY = event.clientY;
      this.root.dataset.dragged = "false";
      this.root.classList.add("is-dragging");
    };
    this.pointerUpHandler = (event) => {
      const x = event.clientX ?? event.changedTouches?.[0]?.clientX ?? null;
      if (this.pointerStart !== null && x !== null) {
        const delta = x - this.pointerStart;
        if (Math.abs(delta) > 44 && Math.abs(delta) > Math.abs(event.clientY - this.pointerY)) {
          this.root.dataset.dragged = "true";
          this.go(delta < 0 ? 1 : -1);
        }
      }
      this.pointerStart = null;
      this.root.classList.remove("is-dragging");
    };
    this.resizeHandler = () => this.render(true);

    this.nextBtn?.addEventListener("click", this.nextHandler);
    this.prevBtn?.addEventListener("click", this.prevHandler);
    window.addEventListener("keydown", this.keyHandler);
    window.addEventListener("portfolio:filter", this.filterHandler);
    this.root.addEventListener("pointerdown", this.pointerDownHandler);
    this.root.addEventListener("pointercancel", this.pointerUpHandler);
    window.addEventListener("pointerup", this.pointerUpHandler);
    this.unsubscribeViewport = onViewportChange(this.resizeHandler);

    trackDisposer(() => this.destroy());
  }

  getRelativeIndex(index) {
    const available = this.availableCards();
    const total = available.length;
    const activePosition = available.indexOf(this.cards[this.active]);
    const indexPosition = available.indexOf(this.cards[index]);
    if (indexPosition === -1 || activePosition === -1) return 99;
    let diff = indexPosition - activePosition;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  }

  isAvailable(card) {
    return this.filter === "all" || card.dataset.category === this.filter;
  }

  availableCards() {
    return this.cards.filter((card) => this.isAvailable(card));
  }

  layoutFor(diff) {
    const narrow = window.matchMedia("(max-width: 720px)").matches;
    const offset = narrow ? 72 : 76;

    if (diff === 0) {
      return { xPercent: 0, scale: 1, autoAlpha: 1, zIndex: 10, rotateY: 0 };
    }
    if (diff === -1) {
      return {
        xPercent: -offset,
        scale: 0.9,
        autoAlpha: 0.66,
        zIndex: 5,
        rotateY: -5,
      };
    }
    if (diff === 1) {
      return {
        xPercent: offset,
        scale: 0.9,
        autoAlpha: 0.66,
        zIndex: 5,
        rotateY: 5,
      };
    }
    return {
      xPercent: diff < 0 ? -104 : 104,
      scale: 0.82,
      autoAlpha: 0,
      zIndex: 1,
      rotateY: diff < 0 ? -9 : 9,
    };
  }

  go(direction) {
    if (this.isAnimating) return;
    const available = this.availableCards();
    if (!available.length) return;
    const activePosition = Math.max(0, available.indexOf(this.cards[this.active]));
    this.active = this.cards.indexOf(
      available[(activePosition + direction + available.length) % available.length],
    );
    this.render();
  }

  render(immediate = false) {
    this.isAnimating = true;
    this.reduceMotion = prefersReducedMotion();
    const duration = immediate || this.reduceMotion ? 0 : 0.82;
    const ease = "power3.inOut";

    this.cards.forEach((card, index) => {
      const diff = this.getRelativeIndex(index);
      const available = this.isAvailable(card);
      const vars = {
        ...(available ? this.layoutFor(diff) : this.layoutFor(99)),
        duration,
        ease,
        pointerEvents: available && diff === 0 ? "auto" : "none",
        overwrite: "auto",
        onComplete: index === this.cards.length - 1 ? () => {
          this.isAnimating = false;
        } : undefined,
      };

      card.tabIndex = diff === 0 ? 0 : -1;
      card.setAttribute("aria-hidden", String(diff !== 0));
      card.classList.toggle("is-active", diff === 0);
      card.classList.toggle("is-previous", diff === -1);
      gsap.to(card, vars);
    });

    this.updateMeta(duration);

    if (immediate || this.reduceMotion) {
      this.isAnimating = false;
    }
  }

  updateMeta(duration) {
    const card = this.cards[this.active];
    if (!card) return;
    const available = this.availableCards();
    const activePosition = Math.max(0, available.indexOf(card));

    const data = {
      title: card.dataset.title,
      category: card.dataset.categoryLabel,
      desc: card.dataset.description,
      index: `${String(activePosition + 1).padStart(2, "0")} / ${String(available.length).padStart(2, "0")}`,
    };

    Object.entries(this.metaEls).forEach(([key, element]) => {
      if (!element || !data[key]) return;
      gsap.to(element, {
        y: -10,
        autoAlpha: 0,
        duration: duration ? 0.2 : 0,
        onComplete: () => {
          element.textContent = data[key];
          gsap.fromTo(
            element,
            { y: 10, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: duration ? 0.35 : 0,
              ease: "power2.out",
            },
          );
        },
      });
    });
  }

  destroy() {
    this.nextBtn?.removeEventListener("click", this.nextHandler);
    this.prevBtn?.removeEventListener("click", this.prevHandler);
    window.removeEventListener("keydown", this.keyHandler);
    window.removeEventListener("portfolio:filter", this.filterHandler);
    this.root.removeEventListener("pointerdown", this.pointerDownHandler);
    this.root.removeEventListener("pointercancel", this.pointerUpHandler);
    window.removeEventListener("pointerup", this.pointerUpHandler);
    this.unsubscribeViewport?.();
    gsap.killTweensOf([...this.cards, ...Object.values(this.metaEls)]);
    delete this.root.dataset.carouselManaged;
  }
}

export function initStackedCarousels() {
  document.querySelectorAll(".stack-carousel").forEach((root) => {
    if (root.dataset.carouselManaged === "true") return;
    root.dataset.carouselManaged = "true";
    new StackedCarouselManager(root);
  });
}
