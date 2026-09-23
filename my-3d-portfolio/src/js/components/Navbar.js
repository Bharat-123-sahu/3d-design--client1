import { siteContent as c } from "../data/siteContent.js";

export function Navbar() {
  const { brand, contact } = c;
  const navItems = c.navigation || [
    { label: "HOME", href: "/" },
    { label: "WORK", href: "/work" },
    { label: "SERVICES", href: "/value" },
    { label: "ABOUT", href: "/about" },
    { label: "CONTACT", href: "/contact" },
  ];

  return `
    <header class="navbar" id="navbar">
      <div class="container navbar__inner">

        <a href="/" class="navbar__logo magnetic" data-route>
          <span class="navbar__logo-text">${brand.name}</span>
          <span class="navbar__logo-dot"></span>
        </a>

        <nav class="navbar__nav" aria-label="Primary navigation" id="navbar-nav">
          <!-- Red active pill — slides between nav items via GSAP -->
          <span class="navbar__active-pill" id="navbar-active-pill" aria-hidden="true"></span>

          ${navItems
            .map(
              (item) =>
                `<a
              href="${item.href}"
              class="navbar__link magnetic"
              data-route
              data-nav-scene="${item.href === "/" ? "home" : item.href.replace("/", "")}"
            >${item.label}</a>`,
            )
            .join("")}
        </nav>

        <div class="navbar__right">
          <button class="navbar__theme-toggle magnetic" type="button" data-theme-toggle aria-label="Switch theme" aria-pressed="false">
            <span class="navbar__theme-icon navbar__theme-icon--sun" aria-hidden="true"></span>
            <span class="navbar__theme-icon navbar__theme-icon--moon" aria-hidden="true"></span>
          </button>

          <button class="navbar__hamburger magnetic" id="hamburger-btn" aria-label="Toggle menu" aria-expanded="false">
            <span class="navbar__hamburger-line"></span>
            <span class="navbar__hamburger-line"></span>
            <span class="navbar__hamburger-line"></span>
          </button>
        </div>

      </div>

      <!-- Travel status indicator -->
      <div class="navbar__travel-status" id="navbar-travel-status" aria-hidden="true">
        <span class="navbar__travel-dot" aria-hidden="true"></span>
        <span class="navbar__travel-text" id="navbar-travel-text">TRAVELING...</span>
      </div>

      <div class="navbar__mobile-menu" id="mobile-menu" role="dialog" aria-label="Mobile navigation" aria-hidden="true">
        <button class="navbar__mobile-close" id="mobile-close" aria-label="Close menu">✕</button>
        <nav class="navbar__mobile-nav" aria-label="Mobile navigation">
          ${navItems
            .map(
              (item) =>
                `<a href="${item.href}" class="navbar__mobile-link" data-route>${item.label}</a>`,
            )
            .join("")}
        </nav>
        <div class="navbar__mobile-footer">
          <a href="${contact.instagram}" target="_blank" rel="noopener">Instagram</a>
          <a href="${contact.linkedin}"  target="_blank" rel="noopener">LinkedIn</a>
          <a href="${contact.twitter}"   target="_blank" rel="noopener">X</a>
        </div>
      </div>
    </header>
  `;
}
