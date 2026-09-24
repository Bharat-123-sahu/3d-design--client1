import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { trackDisposer, prefersReducedMotion } from "../utils/animationRegistry.js";
import { containDialog } from "../utils/dialog.js";

export function initWorkFilter() {
  const buttons = [...document.querySelectorAll(".js-filter-btn")];
  const cards = [...document.querySelectorAll(".work-grid .js-work-card")];
  if (!buttons.length) return;
  const abort = new AbortController();
  buttons.forEach(button => button.addEventListener("click", () => {
    buttons.forEach(b => { b.classList.toggle("is-active", b === button); b.setAttribute("aria-selected", String(b === button)); });
    cards.forEach(card => {
      const show = button.dataset.filter === "all" || card.dataset.category === button.dataset.filter;
      gsap.killTweensOf(card);
      gsap.set(card, {display:show ? "flex" : "none", autoAlpha:show ? 1 : 0, scale:1, y:0, filter:"none"});
    });
    ScrollTrigger.refresh();
  }, {signal:abort.signal}));
  trackDisposer(() => abort.abort());
}

export function initGalleryDrag() {
  const wrap = document.querySelector(".js-gallery-wrap");
  const cards = [...document.querySelectorAll(".js-gallery-card")];
  if (!cards.length) return;
  const abort = new AbortController();
  const options = {signal:abort.signal};
  let start = null, moved = false, closePreview;
  if (wrap) {
    wrap.addEventListener("pointerdown", event => {
      moved = false;
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      start = {x:event.clientX, scroll:wrap.scrollLeft};
    }, options);
    wrap.addEventListener("pointermove", event => {
      if (!start) return;
      const distance = event.clientX - start.x;
      if (Math.abs(distance) > 8) {
        moved = true;
        wrap.scrollLeft = start.scroll - distance;
        wrap.classList.add("is-dragging");
        event.preventDefault();
      }
    }, options);
    const release = () => { start = null; wrap.classList.remove("is-dragging"); };
    window.addEventListener("pointerup", release, options);
    wrap.addEventListener("pointerleave", release, options);
  }
  cards.forEach(card => {
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Preview ${card.dataset.title || card.querySelector('.gallery-card__title')?.textContent || 'design'}`);
    card.tabIndex = card.closest('.stack-carousel') && !card.classList.contains('is-active') ? -1 : 0;
    const open = event => {
      if (event.detail && (moved || card.closest('.stack-carousel')?.dataset.dragged === 'true')) return;
      closePreview?.();
      closePreview = openGalleryModal(card);
    };
    card.addEventListener("click", open, options);
    card.addEventListener("keydown", event => { if(event.key === "Enter" || event.key === " ") { event.preventDefault(); open(event); } }, options);
  });
  trackDisposer(() => { abort.abort(); closePreview?.(); });
}

function openGalleryModal(card) {
  const source = card.querySelector("img");
  const title = card.dataset.title || card.querySelector(".gallery-card__title")?.textContent || "Creative preview";
  const modal = document.createElement("div");
  modal.className = "gallery-modal";
  modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true"); modal.setAttribute("aria-label", title);
  modal.innerHTML = '<div class="gallery-modal__backdrop"></div><div class="gallery-modal__panel" data-lenis-prevent><button class="gallery-modal__close" type="button" aria-label="Close preview">&times;</button><div class="gallery-modal__media"></div><div class="gallery-modal__info"><h2 class="gallery-modal__title"></h2></div></div>';
  modal.querySelector("h2").textContent = title;
  if (source) { const image = new Image(); image.src = source.currentSrc || source.src; image.alt = title; image.className = "gallery-modal__img"; modal.querySelector('.gallery-modal__media').append(image); }
  document.body.append(modal);
  const release = containDialog(modal, card, [document.getElementById("app")]);
  const abort = new AbortController();
  const close = () => { abort.abort(); gsap.killTweensOf(modal); modal.remove(); release(); };
  modal.querySelector('button').addEventListener('click',close,{signal:abort.signal});
  modal.querySelector('.gallery-modal__backdrop').addEventListener('click',close,{signal:abort.signal});
  modal.addEventListener('keydown',event=>{if(event.key === 'Escape')close();},{signal:abort.signal});
  gsap.from(modal, {opacity:0, duration:prefersReducedMotion() ? 0 : .25});
  return close;
}

export function initServiceRowAnimations() {
  // Information is always available; decorative hover motion belongs to fine pointers.
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || prefersReducedMotion()) return;
  const abort = new AbortController();
  document.querySelectorAll('.js-service-row').forEach(row => {
    const arrow = row.querySelector('.service-row__arrow');
    if (!arrow) return;
    row.addEventListener('mouseenter',()=>gsap.to(arrow,{x:6,duration:.25,overwrite:'auto'}),{signal:abort.signal});
    row.addEventListener('mouseleave',()=>gsap.to(arrow,{x:0,duration:.25,overwrite:'auto'}),{signal:abort.signal});
  });
  trackDisposer(()=>abort.abort());
}
