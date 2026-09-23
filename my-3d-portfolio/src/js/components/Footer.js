import { siteContent as c } from "../data/siteContent.js";

export function Footer() {
  const { brand, contact } = c;
  return `
    <footer class="footer" id="footer">
      <div class="container footer__top">
        <div class="footer__brand">
          <span class="footer__logo">${brand.name}</span>
          <p class="footer__tagline">Digital marketing, performance campaigns, and content systems for ambitious brands.</p>
        </div>

        <div class="footer__links">
          <div class="footer__col">
            <h4 class="footer__col-title">Navigate</h4>
            <a href="/"        data-route>Home</a>
            <a href="/about"   data-route>About</a>
            <a href="/value"   data-route>Services</a>
            <a href="/work"    data-route>Work</a>
            <a href="/team"    data-route>Playbook</a>
            <a href="/contact" data-route>Contact</a>
          </div>
          <div class="footer__col">
            <h4 class="footer__col-title">Social</h4>
            <a href="${contact.instagram}" target="_blank" rel="noopener">Instagram</a>
            <a href="${contact.linkedin}"  target="_blank" rel="noopener">LinkedIn</a>
            <a href="${contact.twitter}"   target="_blank" rel="noopener">X (Twitter)</a>
            <a href="${contact.youtube}"   target="_blank" rel="noopener">YouTube</a>
          </div>
          <div class="footer__col">
            <h4 class="footer__col-title">Contact</h4>
            <a href="mailto:${contact.email}">${contact.email}</a>
            <a href="https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, "")}" target="_blank" rel="noopener">WhatsApp</a>
            <span>${brand.location} / Remote</span>
          </div>
        </div>
      </div>

      <div class="container footer__bottom">
        <span>&copy; ${new Date().getFullYear()} ${brand.name}. All rights reserved.</span>
        <span class="footer__bottom-right">${brand.tagline}</span>
      </div>

      <div class="footer__glow" aria-hidden="true"></div>
    </footer>
  `;
}
