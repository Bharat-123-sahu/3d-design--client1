import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initScrollProgress() {
  const bar = document.querySelector(".scroll-progress");
  if (!bar || bar.dataset.progressManaged === "true") return;
  bar.dataset.progressManaged = "true";

  gsap.to(bar, {
    scaleX: 1,
    ease: "none",
    scrollTrigger: {
      id: "global:scroll-progress",
      trigger: document.documentElement,
      start: 0,
      end: () => document.documentElement.scrollHeight - window.innerHeight,
      scrub: 0.2,
    },
  });
}
