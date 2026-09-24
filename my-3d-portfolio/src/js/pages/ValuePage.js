import { siteContent as c } from "../data/siteContent.js";

export function ValuePage() {
  const { services } = c;
  return `
  <div class="page page--value parallax-container">

    <section class="hero" id="section-hero">
      <div class="container">
        <p class="hero__kicker" data-animate="fade-up">Services</p>
        <h1 class="hero__title animate-title" data-animate="split-text">WHAT<br>I DO</h1>
        <p class="hero__tagline" data-animate="fade-up">
          Ten disciplines. One goal: turning attention into measurable, repeatable growth.
        </p>
      </div>
    </section>

    <section class="services-section" id="section-services">
      <div class="container">
        <div class="services-list">
          ${services
            .map(
              (s) => `
            <div class="service-row magnetic js-service-row" data-animate="fade-up">
              <span class="service-row__index">${s.index}</span>
              
              <div class="service-row__body">
                <h3 class="service-row__title">${s.title}</h3>
                <p class="service-row__desc">${s.description}</p>
                <div class="service-row__tags" style="margin-top: 10px;">
                  ${s.tags.map((t) => `<span class="service-row__tag">${t}</span>`).join("")}
                </div>
              </div>
              
              <div class="service-row__image-wrap js-image-reveal">
                ${s.image ? `<img src="${s.image}" alt="${s.title}" style="width:100%; height:100%; object-fit:cover;" loading="lazy">` : ""}
              </div>

              <span class="service-row__arrow">→</span>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    </section>

    <section class="quote-section">
      <div class="container">
        <blockquote class="quote-block animate-title" data-animate="fade-up">
          "Good marketing does not shout louder.<br>
          It makes the right people feel seen,<br>
          then gives them a reason to act."
        </blockquote>
      </div>
    </section>

    <section class="cta-section">
      <div class="container">
        <h2 class="cta-section__title animate-title" data-animate="split-text">
          WANT TO<br>TALK STRATEGY?
        </h2>
        <div class="cta-section__actions" data-animate="fade-up">
          <a href="/contact" class="btn btn--primary magnetic" data-route>Start a Conversation</a>
        </div>
      </div>
    </section>

  </div>
  `;
}
