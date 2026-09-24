import { onViewportChange } from "../utils/responsive.js";
import gsap from "gsap";

export function initNavbarStateManager() {
  function movePillToActiveLink() {
    const pill = document.getElementById("navbar-active-pill");
    const activeLink = document.querySelector(".navbar__link.is-active");
    if (!pill) return;

    if (!activeLink) {
      gsap.to(pill, { opacity: 0, duration: 0.2, ease: "power2.out" });
      return;
    }

    const navEl = activeLink.closest(".navbar__nav");
    if (!navEl) return;

    const navRect = navEl.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();

    gsap.to(pill, {
      x: linkRect.left - navRect.left,
      width: linkRect.width,
      opacity: 1,
      duration: 0.42,
      ease: "power3.out",
    });
  }

  window.addEventListener("characterNavigating", () => {
    document.body.classList.add("is-navigating");
  });

  window.addEventListener("characterArrived", () => {
    document.body.classList.remove("is-navigating");
    setTimeout(movePillToActiveLink, 30);
  });

  setTimeout(movePillToActiveLink, 300);
  onViewportChange(movePillToActiveLink);
}
