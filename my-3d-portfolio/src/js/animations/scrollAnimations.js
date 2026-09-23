import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  createRouteTrigger,
  prefersReducedMotion,
  trackAnimation,
} from "../utils/animationRegistry.js";

gsap.registerPlugin(ScrollTrigger);

const revealSelector = [
  "[data-animate]",
  ".section-label",
  ".hero__tagline",
  ".hero__actions",
  ".metric-ribbon__item",
  ".service-row",
  ".work-card",
  ".gallery-card",
  ".case-block",
  ".case-journey__step",
  ".process-step",
  ".stat-card",
  ".testimonial-card",
  ".cta-section__sub",
].join(",");

function revealVars(element) {
  const kind = element.dataset.animate || "";
  const distance = kind.includes("small") ? 24 : 60;

  return {
    autoAlpha: 0,
    y: distance,
    scale: 0.98,
    filter: "blur(6px)",
  };
}

function visibleVars() {
  return {
    autoAlpha: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    duration: 1.15,
    ease: "power3.out",
    overwrite: "auto",
  };
}

function hiddenVars(element, direction = 1) {
  return {
    ...revealVars(element),
    y: direction > 0 ? -28 : 60,
    duration: 0.75,
    ease: "power2.inOut",
    overwrite: "auto",
  };
}

export function initScrollAnimations() {
  const reduceMotion = prefersReducedMotion();
  const elements = gsap.utils
    .toArray(revealSelector)
    .filter((element) => !element.closest(".stack-carousel"));

  elements.forEach((element) => {
    if (element.dataset.revealManaged === "true") return;
    element.dataset.revealManaged = "true";

    if (reduceMotion) {
      gsap.set(element, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: "none",
        clearProps: "transform",
      });
      return;
    }

    gsap.set(element, revealVars(element));

    createRouteTrigger({
      id: "route:bidirectional-reveal",
      trigger: element,
      start: "top 88%",
      end: "bottom 12%",
      onEnter: () => gsap.to(element, visibleVars()),
      onLeave: () => gsap.to(element, hiddenVars(element, 1)),
      onEnterBack: () => gsap.to(element, visibleVars()),
      onLeaveBack: () => gsap.to(element, hiddenVars(element, -1)),
    });
  });

  const heroTitle = document.querySelector(".hero__title");
  if (heroTitle && !reduceMotion) {
    trackAnimation(
      gsap.to(heroTitle, {
        y: -80,
        opacity: 0.18,
        ease: "none",
        scrollTrigger: {
          id: "route:hero-title-drift",
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      }),
    );
  }
}

