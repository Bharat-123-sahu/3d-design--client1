import { onViewportChange } from "../utils/responsive.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { trackDisposer } from "../utils/animationRegistry.js";
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

const mounted = new WeakSet();
export function initWorkScroll(lenis) {
  const root = document.querySelector(".page--work");
  if (!root || mounted.has(root)) return;
  mounted.add(root);
  const media = gsap.matchMedia();
  media.add("(prefers-reduced-motion: no-preference)", () => {
    // Rebuild only on viewport changes, preserving normalized section progress.
    let context;
    let width = window.innerWidth, height = window.innerHeight;
    const build = () => {
      context = gsap.context(() => {
        root.querySelectorAll("[data-cinematic]").forEach((section, order) => {
          section.classList.add("is-cinematic");
          const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
          const kind = section.dataset.cinematic;
          if (kind === "radial") radial(section, tl);
          if (kind === "dice") dice(section, tl);
          if (kind === "bird") bird(section, tl);
          const duration = tl.duration();
          tl.fromTo(section.querySelector(".work-cinema__progress i"), { scaleX: 0 }, { scaleX: 1, duration, ease: "none" }, 0);
          ScrollTrigger.create({
            id: `route:work-${kind}`, trigger: section, animation: tl,
            start: "top top", end: () => `+=${Math.round(duration * section.clientHeight * (0.38 + 0.24 * Math.min(1, Math.max(0, (window.innerWidth - 360) / 840))))}`,
            pin: true, pinSpacing: true, scrub: true, anticipatePin: 1,
            invalidateOnRefresh: true, refreshPriority: 3 - order,
          });
        });
      }, root);
    };
    build();
    const unsubscribe = onViewportChange(() => {
      if (width === window.innerWidth && (height === window.innerHeight || (matchMedia("(pointer: coarse)").matches && Math.abs(height - window.innerHeight) < 100))) return;
      width = window.innerWidth; height = window.innerHeight;
      const active = ScrollTrigger.getAll().find(t => t.vars.id?.startsWith("route:work-") && t.isActive);
      const saved = active && { id: active.vars.id, progress: active.progress };
      context.revert();
      build();
      return () => {
      if (saved) {
        const trigger = ScrollTrigger.getById(saved.id);
        const position = trigger.start + (trigger.end - trigger.start) * saved.progress;
        if (lenis) lenis.scrollTo(position, { immediate: true });
        else trigger.scroll(position);
        ScrollTrigger.update();
      }
      };
    }, 10);
    return () => {
      unsubscribe(); context.revert();
      root.querySelectorAll("[data-cinematic]").forEach(s => s.classList.remove("is-cinematic"));
    };
  });
  trackDisposer(() => { media.revert(); mounted.delete(root); });
}

function radial(section, tl) {
  const stage = section.querySelector(".radial-stage");
  const nodes = [...stage.querySelectorAll(".radial-node")];
  const w = stage.clientWidth, h = stage.clientHeight;
  const cardWidth = Math.min(290, w * 0.65, h * 0.85);
  gsap.set(nodes, { width: cardWidth });
  const cardHeight = Math.max(...nodes.map(node => node.offsetHeight));
  const centerScale = Math.min(1, (h - 16) / cardHeight);
  const small = Math.min(0.54, centerScale * 0.6, w / (cardWidth * 3.6));
  const rx = Math.min(w * 0.34, (w - cardWidth * small) / 2 - 12);
  const ry = Math.max(0, Math.min(h * 0.33, (h - cardHeight * small) / 2 - 8));
  const positions = nodes.map((_, i) => { const a = (-90 + i * 360 / nodes.length) * Math.PI / 180; return { x: Math.cos(a) * rx, y: Math.sin(a) * ry }; });
  nodes.forEach((node, i) => {
    gsap.set(node, { width: cardWidth, xPercent: -50, yPercent: -50, ...positions[i], scale: small, zIndex: 1 });
    const at = i * 1.65;
    tl.set(node, { zIndex: 3 }, at);
    tl.to(node, { x: 0, y: 0, scale: centerScale, duration: 0.7 }, at);
    tl.to(node.querySelector(".cinema-card"), { borderColor: "var(--project-color)", duration: 0.5 }, at + 0.7);
    if (i < nodes.length - 1) {
      tl.to(node, { ...positions[i], scale: small, duration: 0.45 }, at + 1.2);
      tl.set(node, { zIndex: 1 }, at + 1.65);
    }
  });
}
function dice(section, tl) {
  const cube = section.querySelector(".project-dice");
  const size = cube.clientWidth;
  gsap.set(cube, { "--dice-depth": `${size / 2}px`, rotationX: -12, rotationY: 18, force3D: true });
  const captions = [...section.querySelectorAll(".dice-caption")];
  gsap.set(captions, { autoAlpha: 0, y: 14 });
  gsap.set(captions[0], { autoAlpha: 1, y: 0 });
  const poses = [[0,0],[0,-90],[0,-180],[0,-270],[-90,-360],[90,-360]];
  poses.forEach(([x,y],i) => {
    const at = i * 1.5;
    tl.to(cube, { rotationX: x, rotationY: y, duration: 0.9 }, at);
    if(i) tl.to(captions[i-1], { autoAlpha: 0, y: -14, duration: 0.3 }, at);
    tl.to(captions[i], { autoAlpha: 1, y: 0, duration: 0.6 }, at + 0.9);
  });
}
function bird(section, tl) {
  const stage = section.querySelector(".bird-stage");
  const bird = section.querySelector(".story-bird");
  const wing = bird.querySelector(".bird-wing");
  const cards = [...section.querySelectorAll(".bird-cards .cinema-card")];
  const w = stage.clientWidth, h = stage.clientHeight;
  // Match branch tips in the tree's viewBox; bird's feet sit on the branch.
  const points = [[200,220],[810,160],[290,120],[700,80],[160,330],[850,300]].map(([x,y])=>({x:x*w/1000, y:y*h/500}));
  let previous = { x: w * 0.05, y: h * 0.12 };
  gsap.set(bird, { x: previous.x, y: previous.y, xPercent: -50, yPercent: -75 });
  gsap.set(cards, { autoAlpha: 0, y: 18 });
  cards.forEach((card,i) => {
    const at = i * 1.9, next = points[i];
    if(i) tl.to(cards[i-1], { autoAlpha: 0, y: -12, duration: 0.3 }, at);
    const path = [previous, { x: previous.x + (next.x - previous.x)*0.35, y: Math.max(20, Math.min(previous.y,next.y)-h*0.16) }, next];
    const leftward = next.x < previous.x;
    tl.set(bird.querySelector("svg"), { scaleX: leftward ? -1 : 1 }, at);
    tl.to(bird, { motionPath: { path, curviness: 1.4, autoRotate: leftward ? 180 : 0 }, duration: 1.05, ease: "sine.inOut" }, at);
    tl.fromTo(wing, { rotation: -18, transformOrigin: "90% 85%" }, { rotation: 22, duration: 0.175, repeat: 5, yoyo: true, ease: "sine.inOut" }, at);
    tl.to(bird, { rotation: 0, duration: 0.25 }, at + 1.05);
    tl.to(card, { autoAlpha: 1, y: 0, duration: 0.6 }, at + 1.3);
    previous = next;
  });
}
