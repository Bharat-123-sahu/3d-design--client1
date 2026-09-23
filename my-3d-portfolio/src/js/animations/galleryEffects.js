/**
 * Work section filter buttons + GSAP hide/show
 * Canva gallery horizontal drag scroll
 * Gallery card modal preview
 */
import gsap from "gsap";

/* ── Work Grid Filter ─────────────────────────────────── */
export function initWorkFilter() {
  const buttons = document.querySelectorAll(".js-filter-btn");
  const cards = document.querySelectorAll(".js-work-card");

  if (!buttons.length || !cards.length) return;

  buttons.forEach((btn) => {
    if (btn.dataset.filterManaged === "true") return;
    btn.dataset.filterManaged = "true";
    btn.addEventListener("click", () => {
      // Update active state
      buttons.forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");

      const filter = btn.dataset.filter;
      window.dispatchEvent(new CustomEvent("portfolio:filter", { detail: { filter } }));

      cards.forEach((card) => {
        if (card.closest(".stack-carousel")) return;
        const show = filter === "all" || card.dataset.category === filter;

        if (show) {
          gsap.to(card, {
            opacity: 1,
            scale: 1,
            duration: 0.4,
            ease: "power2.out",
            pointerEvents: "auto",
            display: "block",
          });
        } else {
          gsap.to(card, {
            opacity: 0,
            scale: 0.96,
            duration: 0.3,
            ease: "power2.in",
            pointerEvents: "none",
            onComplete: () => {
              card.style.display = "none";
            },
          });
        }
      });
    });
  });
}

/* ── Canva Gallery — Drag Scroll ──────────────────────── */
export function initGalleryDrag() {
  const wrap = document.querySelector(".js-gallery-wrap");
  const track = document.querySelector(".js-gallery-track");

  if (!wrap || !track) return;
  if (wrap.dataset.galleryDragManaged === "true") return;
  wrap.dataset.galleryDragManaged = "true";

  let isDragging = false;
  let startX = 0;
  let scrollLeft = 0;

  // Mouse drag
  wrap.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.pageX - wrap.offsetLeft;
    scrollLeft = wrap.scrollLeft;
    wrap.classList.add("is-dragging");
  });

  wrap.addEventListener("mouseleave", () => {
    isDragging = false;
    wrap.classList.remove("is-dragging");
  });

  wrap.addEventListener("mouseup", () => {
    isDragging = false;
    wrap.classList.remove("is-dragging");
  });

  wrap.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - wrap.offsetLeft;
    const walk = (x - startX) * 1.4;
    wrap.scrollLeft = scrollLeft - walk;
  });

  // Touch drag
  let touchStartX = 0;
  let touchScrollLeft = 0;

  wrap.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].pageX;
      touchScrollLeft = wrap.scrollLeft;
    },
    { passive: true },
  );

  wrap.addEventListener(
    "touchmove",
    (e) => {
      const x = e.touches[0].pageX;
      const walk = (touchStartX - x) * 1.2;
      wrap.scrollLeft = touchScrollLeft + walk;
    },
    { passive: true },
  );

  // Click opens modal
  document.querySelectorAll(".js-gallery-card").forEach((card) => {
    if (card.dataset.galleryCardManaged === "true") return;
    card.dataset.galleryCardManaged = "true";
    card.addEventListener("click", () => {
      if (wrap.classList.contains("is-dragging")) return;
      openGalleryModal(card);
    });

    // Hover scale
    card.addEventListener("mouseenter", () => {
      gsap.to(card, { scale: 1.04, duration: 0.4, ease: "power2.out" });
    });
    card.addEventListener("mouseleave", () => {
      gsap.to(card, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" });
    });
  });
}

/* ── Gallery Modal ────────────────────────────────────── */
function openGalleryModal(card) {
  const existing = document.querySelector(".gallery-modal");
  if (existing) existing.remove();

  const img = card.querySelector("img");
  const typeLabel =
    card.querySelector(".gallery-card__type-label")?.textContent || "";
  const title = card.querySelector(".gallery-card__title")?.textContent || "";
  const bg = card.style.getPropertyValue("--card-bg") || "#1a1a2e";

  const modal = document.createElement("div");
  modal.className = "gallery-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", `Preview: ${title}`);

  modal.innerHTML = `
    <div class="gallery-modal__backdrop js-modal-close"></div>
    <div class="gallery-modal__panel">
      <button class="gallery-modal__close js-modal-close" aria-label="Close preview">✕</button>
      <div class="gallery-modal__media" style="background:${bg}20;">
        ${
          img
            ? `<img src="${img.src}" alt="${title}" class="gallery-modal__img">`
            : `<div class="gallery-modal__placeholder" style="background:${bg};">
               <span>${typeLabel}</span>
             </div>`
        }
      </div>
      <div class="gallery-modal__info">
        <span class="gallery-modal__type">${typeLabel}</span>
        <h2 class="gallery-modal__title">${title}</h2>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Animate in
  gsap.fromTo(
    modal,
    { opacity: 0 },
    { opacity: 1, duration: 0.35, ease: "power2.out" },
  );
  gsap.fromTo(
    modal.querySelector(".gallery-modal__panel"),
    { y: 50, scale: 0.96 },
    { y: 0, scale: 1, duration: 0.5, ease: "expo.out" },
  );

  // Close
  const closeEls = modal.querySelectorAll(".js-modal-close");
  closeEls.forEach((el) => {
    el.addEventListener("click", closeGalleryModal);
  });

  document.addEventListener("keydown", handleModalKeydown);
}

function closeGalleryModal() {
  const modal = document.querySelector(".gallery-modal");
  if (!modal) return;
  gsap.to(modal, {
    opacity: 0,
    duration: 0.25,
    onComplete: () => modal.remove(),
  });
  document.removeEventListener("keydown", handleModalKeydown);
}

function handleModalKeydown(e) {
  if (e.key === "Escape") closeGalleryModal();
}

/* ── Service Row hover reveal ─────────────────────────── */
export function initServiceRowAnimations() {
  const rows = document.querySelectorAll(".js-service-row");
  if (!rows.length) return;

  rows.forEach((row) => {
    if (row.dataset.serviceRowManaged === "true") return;
    row.dataset.serviceRowManaged = "true";
    const arrow = row.querySelector(".service-row__arrow");
    const desc = row.querySelector(".service-row__desc");

    row.addEventListener("mouseenter", () => {
      gsap.to(arrow, { x: 8, duration: 0.3, ease: "power2.out" });
      gsap.to(row, { paddingLeft: "6px", duration: 0.3, ease: "power2.out" });
    });

    row.addEventListener("mouseleave", () => {
      gsap.to(arrow, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.4)" });
      gsap.to(row, { paddingLeft: "0px", duration: 0.3, ease: "power2.out" });
    });
  });
}
