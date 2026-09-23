/**
 * NavbarStateManager
 *
 * Listens to character navigation events and updates:
 * 1. The red active pill position
 * 2. The travel status indicator ("TRAVELING TO ABOUT...")
 * 3. Body class for navigation lock visual feedback
 */
import gsap from "gsap";

export function initNavbarStateManager() {
  const navbarTravelStatus = document.getElementById("navbar-travel-status");
  const navbarTravelText = document.getElementById("navbar-travel-text");

  /* ── Route-to-label map ─────────────────────────────────────────── */
  const sceneLabelMap = {
    home: "HOME",
    about: "ABOUT",
    work: "WORK",
    value: "SERVICES",
    team: "TEAM",
    company: "COMPANY",
    contact: "CONTACT",
  };

  /* ── Travel status ──────────────────────────────────────────────── */
  function showTravelStatus(toScene) {
    if (!navbarTravelStatus) return;
    if (navbarTravelText) {
      navbarTravelText.textContent = `TRAVELING TO ${sceneLabelMap[toScene] || toScene.toUpperCase()}...`;
    }
    navbarTravelStatus.classList.add("is-active");
    document.body.classList.add("is-navigating");
  }

  function hideTravelStatus() {
    if (!navbarTravelStatus) return;
    navbarTravelStatus.classList.remove("is-active");
    document.body.classList.remove("is-navigating");
  }

  window.addEventListener("characterNavigating", (e) => {
    showTravelStatus(e.detail?.to || "");
  });

  window.addEventListener("characterArrived", () => {
    hideTravelStatus();
  });

  /* ── Active pill ────────────────────────────────────────────────── */
  function movePillToActiveLink() {
    const pill = document.getElementById("navbar-active-pill");
    const activeLink = document.querySelector(".navbar__link.is-active");
    if (!pill || !activeLink) return;

    const navEl = activeLink.closest(".navbar__nav");
    if (!navEl) return;

    const navRect = navEl.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const x = linkRect.left - navRect.left;
    const w = linkRect.width;

    gsap.to(pill, {
      x,
      width: w,
      opacity: 1,
      duration: 0.42,
      ease: "power3.out",
    });
  }

  // Move pill whenever a route becomes active
  // Listen to the Router's internal _updateActiveLink indirectly via
  // characterArrived (which triggers _updateActiveLink in Router)
  window.addEventListener("characterArrived", () => {
    // Small delay to let DOM update active class
    setTimeout(movePillToActiveLink, 30);
  });

  // Also move on initial page load
  setTimeout(movePillToActiveLink, 300);

  // Move pill on window resize
  window.addEventListener("resize", movePillToActiveLink);
}
