import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { videoRevealConfig } from "../data/experienceConfig.js";
import { trackDisposer } from "../utils/animationRegistry.js";

gsap.registerPlugin(ScrollTrigger);
export function initVideoReveal() {
  const section = document.querySelector(".video-reveal");
  if (!section) return;
  const media = gsap.matchMedia();
  media.add({ mobile: "(max-width: 600px)", desktop: "(min-width: 601px)", reduced: "(prefers-reduced-motion: reduce)" }, context => {
    if (context.conditions.reduced) return;
    const settings = context.conditions.mobile ? videoRevealConfig.mobile : videoRevealConfig.desktop;
    const rope = section.querySelector(".video-reveal__rope");
    gsap.timeline({ scrollTrigger: { id: "route:home-rope", trigger: section, start: "top 85%", end: "bottom 75%", scrub: true, invalidateOnRefresh: true } })
      .fromTo(section.querySelector(".video-reveal__card"), { y: settings.rise, rotation: settings.rotation, clipPath: "inset(10% 0 0 0 round 18px)" }, { y: 0, rotation: 0, clipPath: "inset(0% 0 0 0 round 18px)", duration: 1, ease: "power2.out" }, 0)
      .fromTo(rope, { scaleY: 1 + settings.rise / rope.clientHeight }, { scaleY: 1, duration: 1, ease: "power2.out" }, 0);
  });
  const video = section.querySelector("video");
  const controller = new AbortController();
  let observer;
  if (video) {
    observer = new IntersectionObserver(entries => { if (!entries[0].isIntersecting) video.pause(); });
    observer.observe(video);
    const showError = () => { section.querySelector('[role="status"]').textContent = "The film could not load. Please try again later."; };
    video.addEventListener("error", showError, { signal: controller.signal });
    video.querySelector("source")?.addEventListener("error", showError, { signal: controller.signal });
  }
  trackDisposer(() => { media.revert(); controller.abort(); observer?.disconnect(); video?.pause(); });
}
