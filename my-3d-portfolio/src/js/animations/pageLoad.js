import gsap from "gsap";
import { prefersReducedMotion, trackAnimation } from "../utils/animationRegistry.js";

function addIfPresent(timeline, selector, vars, position) {
  const targets = document.querySelectorAll(selector);
  if (targets.length) {
    timeline.fromTo(targets, vars.from, vars.to, position);
  }
}

export function initPageLoad({ sceneController } = {}) {
  if (prefersReducedMotion()) {
    gsap.set(
      ".navbar, .hero__kicker, .hero__eyebrow, .hero__tagline, .hero__description, .hero__subtitle, .hero__actions, .hero-orbit__card, .hero__metrics span",
      { autoAlpha: 1, y: 0, scale: 1, filter: "none" },
    );
    return null;
  }

  sceneController?.prepareTransition?.();

  const timeline = gsap.timeline({
    defaults: { ease: "power3.out" },
    onComplete: () => {
      document.documentElement.classList.add("is-loaded");
    },
  });

  trackAnimation(timeline);

  timeline.fromTo(
    "#three-canvas",
    { autoAlpha: 0 },
    { autoAlpha: 1, duration: 0.8 },
    0,
  );

  addIfPresent(
    timeline,
    ".navbar",
    {
      from: { y: -42, autoAlpha: 0 },
      to: { y: 0, autoAlpha: 1, duration: 1.05 },
    },
    0.18,
  );

  addIfPresent(
    timeline,
    ".hero__kicker, .hero__eyebrow",
    {
      from: { y: 34, autoAlpha: 0, filter: "blur(8px)" },
      to: { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.9 },
    },
    0.45,
  );

  addIfPresent(
    timeline,
    ".hero__tagline, .hero__description, .hero__subtitle",
    {
      from: { y: 42, autoAlpha: 0, filter: "blur(8px)" },
      to: { y: 0, autoAlpha: 1, filter: "blur(0px)", duration: 0.95 },
    },
    0.84,
  );

  addIfPresent(
    timeline,
    ".hero__actions .btn, .hero__actions .button",
    {
      from: { y: 28, autoAlpha: 0, scale: 0.92 },
      to: {
        y: 0,
        autoAlpha: 1,
        scale: 1,
        duration: 0.72,
        stagger: 0.12,
        ease: "back.out(1.45)",
      },
    },
    0.96,
  );

  addIfPresent(
    timeline,
    ".hero-orbit__card, .metric-ribbon__item",
    {
      from: { y: 64, autoAlpha: 0, scale: 0.86 },
      to: {
        y: 0,
        autoAlpha: 1,
        scale: 1,
        duration: 0.75,
        stagger: 0.08,
      },
    },
    1.05,
  );

  return timeline;
}
