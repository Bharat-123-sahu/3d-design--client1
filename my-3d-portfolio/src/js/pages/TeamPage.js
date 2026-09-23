import { siteContent as c } from "../data/siteContent.js";

export function TeamPage() {
  const { process: steps, results, testimonials } = c;
  return `
  <div class="page page--team parallax-container">

    <section class="hero" id="section-hero">
      <div class="container">
        <p class="hero__kicker" data-animate="fade-up">How It Works</p>
        <h1 class="hero__title animate-title" data-animate="split-text">THE<br>PLAYBOOK</h1>
        <p class="hero__tagline" data-animate="fade-up">
          A clear, repeatable system for turning brand attention into measurable business growth.
        </p>
      </div>
    </section>

    <!-- Process steps -->
    <section class="process-section">
      <div class="container">
        <div class="process-steps js-process-steps">
          ${steps
            .map(
              (step, i) => `
            <div class="process-step js-process-step" data-step="${i}" data-animate="fade-up">
              <span class="process-step__num">${step.step}</span>
              <div class="process-step__body">
                <h3 class="process-step__title">${step.title}</h3>
                <p class="process-step__desc">${step.description}</p>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    </section>

    <!-- Results -->
    <section class="results-section">
      <div class="container">
        <p class="section-label" data-animate="fade-up">${results.subheading}</p>
        <h2 class="animate-title" data-animate="split-text">${results.heading}</h2>
        <div class="stats-grid">
          ${results.stats
            .map(
              (s) => `
            <div class="stat-card" data-animate="fade-up">
              <div class="stat-card__value js-counter">${s.value}</div>
              <div class="stat-card__label">${s.label}</div>
            </div>
          `,
            )
            .join("")}
        </div>
        <p class="results-disclaimer">${results.disclaimer}</p>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="testimonials-section">
      <div class="container">
        <p class="section-label" data-animate="fade-up">Client Words</p>
        <h2 class="animate-title" data-animate="split-text">WHAT CLIENTS<br>SAY</h2>
        <div class="testimonials-track">
          ${testimonials
            .map(
              (t) => `
            <div class="testimonial-card" data-animate="fade-up">
              <p class="testimonial-card__quote">"${t.quote}"</p>
              <div class="testimonial-card__author">
                ${t.image ? `<img src="${t.image}" alt="${t.name}" class="testimonial-card__img">` : `<div class="testimonial-card__avatar"></div>`}
                <div>
                  <strong class="testimonial-card__name">${t.name}</strong>
                  <span class="testimonial-card__company">${t.company}</span>
                </div>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    </section>

  </div>
  `;
}
