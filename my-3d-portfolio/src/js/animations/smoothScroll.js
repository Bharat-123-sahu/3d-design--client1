import { getViewportProfile, onViewportChange } from "../utils/responsive.js";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initSmoothScroll() {
  const lenis = new Lenis({
    smoothWheel: !getViewportProfile().reduced,
    syncTouch: false,
    lerp: 0.08,
  });

  ScrollTrigger.config({ autoRefreshEvents: "visibilitychange,DOMContentLoaded,load", ignoreMobileResize: true });
  lenis.on("scroll", ScrollTrigger.update);
  onViewportChange(profile => {
    lenis.options.smoothWheel = !profile.reduced;
    ScrollTrigger.refresh();
    lenis.resize();
  }, 100);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  return lenis;
}
