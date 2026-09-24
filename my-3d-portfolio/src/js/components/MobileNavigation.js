import { containDialog } from "../utils/dialog.js";
import { onViewportChange } from "../utils/responsive.js";
export function initMobileNavigation() {
  const button = document.getElementById("hamburger-btn");
  const menu = document.getElementById("mobile-menu");
  let release;
  const close = () => {
    if (!release) return;
    menu.classList.remove("is-open");
    menu.inert = true;
    menu.setAttribute("aria-hidden", "true");
    button.setAttribute("aria-expanded", "false");
    button.classList.remove("is-open");
    release(); release = null;
  };
  const open = () => {
    menu.inert = false;
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    button.setAttribute("aria-expanded", "true");
    button.classList.add("is-open");
    release = containDialog(menu, button, [document.querySelector("main"), document.querySelector(".footer"), document.querySelector(".navbar__inner"), document.querySelector("#three-canvas")]);
  };
  button.addEventListener("click", () => release ? close() : open());
  document.getElementById("mobile-close").addEventListener("click", close);
  menu.addEventListener("keydown", event => { if (event.key === "Escape") close(); });
  menu.addEventListener("click", event => { if (event.target.closest("[data-route]")) close(); });
  window.addEventListener("popstate", close);
  onViewportChange(() => { if (getComputedStyle(button).display === "none") close(); });
}
