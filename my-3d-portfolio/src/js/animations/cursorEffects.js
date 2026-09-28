import gsap from "gsap";
import { getViewportProfile, onViewportChange } from "../utils/responsive.js";
let initialized = false;
export function initCursorEffects() {
  if (initialized) return;
  initialized = true;
  const dot = document.createElement("div"), ring = document.createElement("div");
  dot.className = "cursor-dot"; ring.className = "cursor-ring";
  dot.setAttribute("aria-hidden", "true"); ring.setAttribute("aria-hidden", "true");
  const label = document.createElement("span"); label.className = "cursor-label"; ring.append(label);
  document.body.append(dot, ring);
  let enabled = false, magnet = null;
  const moveDotX = gsap.quickTo(dot, "x", {duration:.12}), moveDotY = gsap.quickTo(dot, "y", {duration:.12});
  const moveRingX = gsap.quickTo(ring, "x", {duration:.28}), moveRingY = gsap.quickTo(ring, "y", {duration:.28});
  const resetMagnet = () => { if (magnet) gsap.to(magnet, {x:0,y:0,duration:.25,overwrite:"auto"}); magnet = null; };
  const move = event => {
    if (!enabled || event.pointerType === "touch") return;
    moveDotX(event.clientX); moveDotY(event.clientY); moveRingX(event.clientX); moveRingY(event.clientY);
    const target = event.target.closest("a.magnetic,button.magnetic");
    if (target !== magnet) resetMagnet();
    if (target) {
      magnet = target;
      const box = target.getBoundingClientRect();
      gsap.to(target, {x:gsap.utils.clamp(-10,10,(event.clientX-box.left-box.width/2)*.12), y:gsap.utils.clamp(-8,8,(event.clientY-box.top-box.height/2)*.12), duration:.25, overwrite:"auto"});
    }
  };
  const over = event => {
    if (!enabled) return;
    const target = event.target.closest("a,button,[data-cursor]");
    label.textContent = target?.dataset.cursor === "project" ? "VIEW" : "";
    ring.classList.toggle("has-label", Boolean(label.textContent));
    gsap.to(ring, {scale:target ? 1.65 : 1, duration:.2, overwrite:"auto"});
    gsap.to(dot, {scale:target ? .5 : 1, duration:.2, overwrite:"auto"});
  };
  const configure = profile => {
    enabled = profile.fine && !profile.reduced;
    document.documentElement.classList.toggle("no-custom-cursor", !enabled);
    if (!enabled) { resetMagnet(); gsap.killTweensOf([dot,ring]); }
  };
  configure(getViewportProfile()); onViewportChange(configure);
  window.addEventListener("pointermove", move, {passive:true});
  document.addEventListener("pointerover", over, {passive:true});
}
