import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createRouteTrigger, prefersReducedMotion, trackSplit } from "../utils/animationRegistry.js";

gsap.registerPlugin(SplitText, ScrollTrigger);

function animateIn(split, fast = false) {
  return gsap.fromTo(
    split.lines.length ? split.lines : split.words,
    { yPercent: 115, autoAlpha: 0, filter: "blur(8px)" },
    {
      yPercent: 0,
      autoAlpha: 1,
      filter: "blur(0px)",
      duration: fast ? 0.8 : 1.15,
      stagger: fast ? 0.06 : 0.1,
      ease: "power4.out",
      overwrite: "auto",
    },
  );
}

function animateOut(split, direction = 1) {
  return gsap.to(split.lines.length ? split.lines : split.words, {
    yPercent: direction > 0 ? -70 : 90,
    autoAlpha: 0,
    filter: "blur(8px)",
    duration: 0.65,
    stagger: 0.035,
    ease: "power2.inOut",
    overwrite: "auto",
  });
}

export function revealTextNow(selector = ".hero__title") {
  if (prefersReducedMotion()) return;

  document.querySelectorAll(selector).forEach((title) => {
    if (title.dataset.pageLoadSplit === "true") return;
    title.dataset.pageLoadSplit = "true";
    const split = trackSplit(
      new SplitText(title, {
        type: "lines,words",
        linesClass: "split-line",
        wordsClass: "split-word",
      }),
    );
    animateIn(split, true);
  });
}

export function initTextAnimations() {
  const reduceMotion = prefersReducedMotion();
  const titles = document.querySelectorAll(".animate-title");

  titles.forEach((title) => {
    if (title.dataset.textRevealManaged === "true") return;
    title.dataset.textRevealManaged = "true";

    if (reduceMotion) {
      gsap.set(title, { autoAlpha: 1, y: 0, clearProps: "filter,transform" });
      return;
    }

    const split = trackSplit(
      new SplitText(title, {
        type: "lines,words",
        linesClass: "split-line",
        wordsClass: "split-word",
      }),
    );

    gsap.set(split.lines.length ? split.lines : split.words, {
      yPercent: 115,
      autoAlpha: 0,
      filter: "blur(8px)",
    });
    gsap.set(title, { autoAlpha: 1, y: 0 });

    createRouteTrigger({
      id: "route:text-reveal",
      trigger: title,
      start: "top 88%",
      end: "bottom 12%",
      onEnter: () => animateIn(split),
      onLeave: () => animateOut(split, 1),
      onEnterBack: () => animateIn(split),
      onLeaveBack: () => animateOut(split, -1),
    });
  });
}
