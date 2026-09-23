import { siteContent as c } from "../data/siteContent.js";

export function CompanyPage() {
  const { brand, services } = c;
  return `
  <div class="page page--company parallax-container">

    <section class="hero" id="section-hero">
      <div class="container">
        <p class="hero__kicker" data-animate="fade-up">About the Studio</p>
        <h1 class="hero__title animate-title" data-animate="split-text">BUILT TO<br>GROW BRANDS.</h1>
        <p class="hero__tagline" data-animate="fade-up">
          An independent growth studio. One specialist, sharp focus, measurable results.
        </p>
      </div>
    </section>

    <section class="company-info-section">
      <div class="container">
        <div class="company-info-grid">
          <div class="info-block" data-animate="fade-up">
            <h3 class="info-block__label">Location</h3>
            <p class="info-block__value">${brand.location}<br>${brand.availableFor}</p>
          </div>
          <div class="info-block" data-animate="fade-up">
            <h3 class="info-block__label">Specialist In</h3>
            <p class="info-block__value">Performance marketing, content systems, and growth strategy for ambitious founders and local brands.</p>
          </div>
          <div class="info-block" data-animate="fade-up">
            <h3 class="info-block__label">Mission</h3>
            <p class="info-block__value">To help brands turn attention into leads, trust, and repeatable demand — with discipline, creativity and clear measurement.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="services-section">
      <div class="container">
        <p class="section-label" data-animate="fade-up">Capabilities</p>
        <h2 class="animate-title" data-animate="split-text">EVERYTHING<br>YOU NEED</h2>
        <div class="services-list">
          ${services
            .map(
              (s) => `
            <div class="service-row magnetic" data-animate="fade-up">
              <span class="service-row__index">${s.index}</span>
              <div class="service-row__body">
                <h3 class="service-row__title">${s.title}</h3>
              </div>
              <div class="service-row__tags">
                ${s.tags.map((t) => `<span class="service-row__tag">${t}</span>`).join("")}
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="container">
        <h2 class="cta-section__title animate-title" data-animate="split-text">
          LET'S BUILD<br>SOMETHING.
        </h2>
        <div class="cta-section__actions" data-animate="fade-up">
          <a href="/contact" class="btn btn--primary magnetic" data-route>Start a Project</a>
        </div>
      </div>
    </section>

  </div>
  `;
}
