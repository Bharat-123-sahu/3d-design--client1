/**
 * Animated counter — counts up to a value on scroll entry
 * Supports formats like: "3.8×", "45%", "[X]+", "₹[X]L+"
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createRouteTrigger, prefersReducedMotion } from "../utils/animationRegistry.js";

gsap.registerPlugin(ScrollTrigger);

export function initCounterAnimations() {
  if (prefersReducedMotion()) return;
  const counters = document.querySelectorAll(".js-counter");
  if (!counters.length) return;

  counters.forEach((el) => {
    const raw = el.textContent.trim();

    // Skip placeholder values like [X]
    if (raw.includes("[")) return;

    // Extract numeric portion and surrounding text
    const match = raw.match(/^([^0-9\-.]*)([0-9.]+)(.*)$/);
    if (!match) return;

    const [, prefix, numStr, suffix] = match;
    const target = parseFloat(numStr);
    const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;

    const obj = { val: 0 };

    createRouteTrigger({
      id: "route:counter",
      trigger: el,
      start: "top 85%",
      onEnter: () => {
        obj.val = 0;
        gsap.to(obj, {
          val: target,
          duration: 1.6,
          ease: "power2.out",
          onUpdate() {
            el.textContent = prefix + obj.val.toFixed(decimals) + suffix;
          },
        });
      },
      onEnterBack: () => {
        obj.val = 0;
        gsap.to(obj, {
          val: target,
          duration: 1.2,
          ease: "power2.out",
          onUpdate() {
            el.textContent = prefix + obj.val.toFixed(decimals) + suffix;
          },
        });
      },
    });
  });
}

/**
 * Scroll-triggered section label + title stagger reveal
 */
export function initSectionReveal() {
  if (prefersReducedMotion()) return;
  gsap.utils.toArray(".section-label").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 20, letterSpacing: "0.3em" },
      {
        opacity: 1,
        y: 0,
        letterSpacing: "0.14em",
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      },
    );
  });
}

/**
 * Process steps — scroll-driven active state
 */
export function initProcessStepsAnimation() {
  if (prefersReducedMotion()) return;
  const wrapper = document.querySelector(".js-process-steps");
  const steps = document.querySelectorAll(".js-process-step");
  if (!steps.length) return;

  if (wrapper && !prefersReducedMotion()) {
    gsap.set(wrapper, { "--process-progress": 0 });
    createRouteTrigger({
      id: "route:process-line",
      trigger: wrapper,
      start: "top 72%",
      end: "bottom 34%",
      scrub: 0.7,
      onUpdate: (self) => {
        wrapper.style.setProperty("--process-progress", self.progress.toFixed(3));
      },
    });
  }

  steps.forEach((step, i) => {
    createRouteTrigger({
      id: "route:process-active",
      trigger: step,
      start: "top 65%",
      end: "bottom 35%",
      onEnter: () => step.classList.add("is-active"),
      onLeave: () => step.classList.remove("is-active"),
      onEnterBack: () => step.classList.add("is-active"),
      onLeaveBack: () => step.classList.remove("is-active"),
    });

    gsap.fromTo(
      step,
      { opacity: 0, x: -30 },
      {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: i * 0.06,
        scrollTrigger: { trigger: step, start: "top 90%", once: true },
      },
    );
  });
}

/**
 * Case study journey block animate-in
 */
export function initCaseStudyAnimations() {
  if (prefersReducedMotion()) return;
  const steps = document.querySelectorAll(".case-journey__step");
  if (!steps.length) return;

  document.querySelectorAll(".case-visual").forEach((visual) => {
    const line = visual.querySelector(".case-graph__line");
    const bars = visual.querySelectorAll(".case-graph__bar");
    if (!line || prefersReducedMotion()) return;

    const length = line.getTotalLength();
    gsap.set(line, { strokeDasharray: length, strokeDashoffset: length });
    gsap.set(bars, { scaleY: 0, transformOrigin: "bottom" });

    createRouteTrigger({
      id: "route:case-graph",
      trigger: visual,
      start: "top 82%",
      end: "bottom 16%",
      onEnter: () => {
        gsap.to(line, { strokeDashoffset: 0, duration: 1.2, ease: "power2.out" });
        gsap.to(bars, { scaleY: 1, duration: 0.8, stagger: 0.08, ease: "power3.out" });
      },
      onLeaveBack: () => {
        gsap.to(line, { strokeDashoffset: length, duration: 0.7, ease: "power2.inOut" });
        gsap.to(bars, { scaleY: 0, duration: 0.55, stagger: 0.04, ease: "power2.inOut" });
      },
    });
  });

  steps.forEach((step, i) => {
    gsap.fromTo(
      step,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: step, start: "top 88%", once: true },
        delay: i * 0.1,
      },
    );
  });
}

/**
 * Testimonial cards horizontal scroll reveal
 */
export function initTestimonialAnimations() {
  if (prefersReducedMotion()) return;
  const cards = document.querySelectorAll(".testimonial-card");
  if (!cards.length) return;

  cards.forEach((card, i) => {
    gsap.fromTo(
      card,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        delay: i * 0.12,
        scrollTrigger: { trigger: card, start: "top 88%", once: true },
      },
    );
  });
}

/**
 * Stat cards count-up + scale in
 */
export function initStatCardAnimations() {
  if (prefersReducedMotion()) return;
  const cards = document.querySelectorAll(".stat-card");
  if (!cards.length) return;

  cards.forEach((card, i) => {
    gsap.fromTo(
      card,
      { opacity: 0, scale: 0.88 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.7,
        ease: "back.out(1.5)",
        delay: i * 0.08,
        scrollTrigger: { trigger: card, start: "top 88%", once: true },
      },
    );
  });
}
