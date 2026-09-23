import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const routeAnimations = new Set();
const disposers = new Set();
const splitInstances = new Set();

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function trackAnimation(instance) {
  if (instance) {
    routeAnimations.add(instance);
  }
  return instance;
}

export function trackDisposer(disposer) {
  if (typeof disposer === "function") {
    disposers.add(disposer);
  }
  return disposer;
}

export function trackSplit(instance) {
  if (instance) {
    splitInstances.add(instance);
  }
  return instance;
}

export function cleanupRouteAnimations() {
  routeAnimations.forEach((instance) => {
    instance?.kill?.();
  });
  routeAnimations.clear();

  splitInstances.forEach((split) => {
    split?.revert?.();
  });
  splitInstances.clear();

  disposers.forEach((dispose) => {
    dispose();
  });
  disposers.clear();

  ScrollTrigger.getAll().forEach((trigger) => {
    if (!trigger.vars?.id?.startsWith("global:")) {
      trigger.kill();
    }
  });
}

export function createRouteTrigger(vars) {
  return trackAnimation(
    ScrollTrigger.create({
      ...vars,
      id: vars.id || `route:${vars.trigger?.className || "trigger"}`,
    }),
  );
}
