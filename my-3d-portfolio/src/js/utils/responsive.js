const listeners = new Set();
let bound = false;
let timer;
const queries = ["(pointer: coarse)", "(prefers-reduced-motion: reduce)", "(hover: hover) and (pointer: fine)"];

export function getViewportProfile() {
  const width = document.documentElement.clientWidth || window.innerWidth;
  const height = window.innerHeight;
  const coarse = matchMedia(queries[0]).matches;
  const reduced = matchMedia(queries[1]).matches;
  const lowPower = coarse || (navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  // Cap both DPR and total framebuffer area; a retina ultrawide is expensive too.
  const pixelBudget = lowPower ? 1800000 : 5000000;
  const dpr = Math.min(devicePixelRatio || 1, lowPower ? 1.35 : 2, Math.sqrt(pixelBudget / Math.max(1, width * height)));
  return { width, height, aspect: width / Math.max(height, 1), coarse, reduced, lowPower, dpr,
    fine: matchMedia(queries[2]).matches, detail: lowPower ? 0.5 : 1,
    cameraDistance: Math.max(1, 1.25 / (width / Math.max(height, 1))),
  };
}

export function onViewportChange(callback, priority = 0) {
  const entry = { callback, priority };
  listeners.add(entry);
  if (!bound) {
    bound = true;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const profile = getViewportProfile();
        const afterRefresh = [];
        [...listeners].sort((a, b) => a.priority - b.priority).forEach(({ callback }) => {
          const after = callback(profile);
          if (typeof after === "function") afterRefresh.push(after);
        });
        afterRefresh.forEach(callback => callback());
      }, 140);
    };
    window.addEventListener("resize", schedule, { passive: true });
    window.visualViewport?.addEventListener("resize", schedule, { passive: true });
    queries.forEach(query => matchMedia(query).addEventListener("change", schedule));
    let resolution;
    const watchDpr = () => {
      resolution?.removeEventListener("change", watchDpr);
      resolution = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
      resolution.addEventListener("change", watchDpr);
      schedule();
    };
    watchDpr();
  }
  return () => listeners.delete(entry);
}
