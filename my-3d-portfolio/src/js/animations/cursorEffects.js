import gsap from "gsap";

let cursorState = null;

const canUseCursor = () =>
  window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initCursorEffects() {
  if (!canUseCursor()) {
    document.documentElement.classList.add("no-custom-cursor");
    return;
  }

  if (!cursorState) {
    const dot = document.createElement("div");
    dot.className = "cursor-dot";
    const ring = document.createElement("div");
    ring.className = "cursor-ring";
    const label = document.createElement("span");
    label.className = "cursor-label";
    ring.appendChild(label);
    document.body.append(dot, ring);

    cursorState = {
      dot,
      ring,
      label,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      particleTick: 0,
      boundTargets: new WeakSet(),
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("mousedown", () => {
      gsap.to([dot, ring], { scale: 0.86, duration: 0.1 });
    });
    window.addEventListener("mouseup", () => {
      gsap.to(dot, { scale: 1, duration: 0.45, ease: "elastic.out(1, 0.35)" });
      gsap.to(ring, { scale: 1, duration: 0.45, ease: "elastic.out(1, 0.35)" });
    });

    gsap.ticker.add(() => {
      gsap.to(dot, { x: cursorState.x, y: cursorState.y, duration: 0.12, ease: "power2.out" });
      gsap.to(ring, { x: cursorState.x, y: cursorState.y, duration: 0.3, ease: "power2.out" });
    });
  }

  bindInteractiveTargets();
}

function handleMove(event) {
  cursorState.x = event.clientX;
  cursorState.y = event.clientY;

  cursorState.particleTick += 1;
  if (cursorState.particleTick % 5 === 0) {
    createParticle(cursorState.x, cursorState.y);
  }

  document.querySelectorAll(".magnetic").forEach((element) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(cursorState.x - centerX, cursorState.y - centerY);

    if (distance < 110) {
      const moveX = Math.max(-15, Math.min(15, (cursorState.x - centerX) * 0.16));
      const moveY = Math.max(-15, Math.min(15, (cursorState.y - centerY) * 0.16));
      gsap.to(element, { x: moveX, y: moveY, duration: 0.32, ease: "power2.out" });
    } else {
      gsap.to(element, { x: 0, y: 0, duration: 0.55, ease: "elastic.out(1, 0.35)" });
    }
  });
}

function bindInteractiveTargets() {
  document
    .querySelectorAll("a, button, .work-card, .gallery-card, .service-row, [data-cursor]")
    .forEach((element) => {
      if (cursorState.boundTargets.has(element)) return;
      cursorState.boundTargets.add(element);

      element.addEventListener("mouseenter", () => setCursorFor(element));
      element.addEventListener("mouseleave", resetCursor);
    });
}

function setCursorFor(element) {
  const state = element.dataset.cursor;
  const label =
    state === "project" ? "VIEW" : state === "image" ? "" : state === "drag" ? "DRAG" : "";
  const scale = state === "project" ? 2.25 : state === "image" ? 2.6 : 1.65;

  cursorState.label.textContent = label;
  cursorState.ring.classList.toggle("has-label", Boolean(label));
  gsap.to(cursorState.ring, {
    scale,
    borderColor: "var(--cyan)",
    backgroundColor: state === "image" ? "rgba(41, 217, 255, 0.08)" : "transparent",
    duration: 0.28,
  });
  gsap.to(cursorState.dot, { scale: 0.45, duration: 0.28 });
}

function resetCursor() {
  cursorState.label.textContent = "";
  cursorState.ring.classList.remove("has-label");
  gsap.to(cursorState.ring, {
    scale: 1,
    borderColor: "var(--cursor-ring)",
    backgroundColor: "transparent",
    duration: 0.28,
  });
  gsap.to(cursorState.dot, { scale: 1, duration: 0.28 });
}

function createParticle(x, y) {
  const activeParticles = document.querySelectorAll(".cursor-particle");
  if (activeParticles.length >= 14) return;

  const particle = document.createElement("span");
  particle.className = "cursor-particle";
  particle.style.left = `${x}px`;
  particle.style.top = `${y}px`;
  document.body.appendChild(particle);

  gsap.to(particle, {
    x: Math.random() * 20 - 10,
    y: Math.random() * 20 - 10,
    opacity: 0,
    scale: 0,
    duration: 0.5,
    onComplete: () => particle.remove(),
  });
}

