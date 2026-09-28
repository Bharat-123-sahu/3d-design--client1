import { siteContent as c } from "../data/siteContent.js";

const {
  hero,
  intro,
  services,
  projects,
  canvaGallery,
  process,
  results,
  testimonials,
  finalCta,
  contact,
  experience,
  education,
  certifications,
  awards,
} = c;

/* ── helpers ──────────────────────────────────────────── */
const projectCategories = [
  "ALL",
  "SOCIAL",
  "ADS",
  "ECOMMERCE",
  "CONTENT",
  "SEO",
  "BRANDING",
];

const categoryMap = {
  all: true,
  social: true,
  ads: true,
  seo: true,
  ecommerce: true,
  content: true,
  branding: true,
};

function projectCard(p) {
  return `
    <div class="work-card magnetic js-work-card" data-category="${p.category}" data-animate="fade-up" data-cursor="project">
      <div class="work-card__image js-image-reveal" style="background:${p.color}20;">
        ${p.image ? `<img src="${p.image}" alt="${p.title}" loading="lazy">` : `<div class="work-card__placeholder" style="--card-color:${p.color};"></div>`}
        <span class="work-card__cat-badge">${p.categoryLabel}</span>
      </div>
      <div class="work-card__body">
        <h3 class="work-card__title">${p.title}</h3>
        <p class="work-card__desc">${p.description}</p>
        <div class="work-card__tags">
          ${p.services.map((s) => `<span class="work-card__tag">${s}</span>`).join("")}
        </div>
        <span class="work-card__year">${p.year}</span>
      </div>
    </div>
  `;
}

function stackedProjectCard(p) {
  return `
    <article class="stack-carousel__card work-card magnetic js-work-card"
      data-category="${p.category}"
      data-category-label="${p.categoryLabel}"
      data-title="${p.title}"
      data-description="${p.description}"
      data-cursor="project">
      <div class="work-card__image js-image-reveal" style="background:${p.color}20;">
        ${p.image ? `<img src="${p.image}" alt="${p.title}" loading="lazy">` : `<div class="work-card__placeholder" style="--card-color:${p.color};"></div>`}
        <span class="work-card__cat-badge">${p.categoryLabel}</span>
      </div>
      <div class="work-card__body">
        <span class="work-card__year">${p.year}</span>
        <h3 class="work-card__title">${p.title}</h3>
        <p class="work-card__desc">${p.description}</p>
        <div class="work-card__tags">
          ${p.services.map((s) => `<span class="work-card__tag">${s}</span>`).join("")}
        </div>
        <span class="work-card__cta">View Project <span aria-hidden="true">-></span></span>
      </div>
    </article>
  `;
}

function serviceRow(s) {
  return `
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
  `;
}

function canvaCard(item) {
  return `
    <div class="gallery-card js-gallery-card magnetic" style="--card-bg:${item.color};" data-id="${item.id}" data-cursor="image">
      <div class="gallery-card__inner js-image-reveal">
        ${
          item.image
            ? `<img src="${item.image}" alt="${item.title}" loading="lazy" class="gallery-card__img">`
            : `<div class="gallery-card__placeholder"><span class="gallery-card__type">${item.type}</span></div>`
        }
      </div>
      <div class="gallery-card__meta">
        <span class="gallery-card__type-label">${item.type}</span>
        <span class="gallery-card__title">${item.title}</span>
      </div>
    </div>
  `;
}

function stackedCanvaCard(item) {
  return `
    <article class="stack-carousel__card gallery-card js-gallery-card magnetic"
      style="--card-bg:${item.color};"
      data-id="${item.id}"
      data-title="${item.title}"
      data-category-label="${item.type}"
      data-description="${item.type} designed as a flexible placeholder until final creative assets are supplied."
      data-cursor="image">
      <div class="gallery-card__inner js-image-reveal">
        ${
          item.image
            ? `<img src="${item.image}" alt="${item.title}" loading="lazy" class="gallery-card__img">`
            : `<div class="gallery-card__placeholder"><span class="gallery-card__type">${item.type}</span></div>`
        }
      </div>
      <div class="gallery-card__meta">
        <span class="gallery-card__type-label">${item.type}</span>
        <span class="gallery-card__title">${item.title}</span>
      </div>
    </article>
  `;
}

function statCard(s) {
  return `
    <div class="stat-card" data-animate="fade-up">
      <div class="stat-card__value js-counter" data-value="${s.value}">${s.value}</div>
      <div class="stat-card__label">${s.label}</div>
    </div>
  `;
}

function testimonialCard(t) {
  return `
    <div class="testimonial-card" data-id="${t.id}">
      <p class="testimonial-card__quote">"${t.quote}"</p>
      <div class="testimonial-card__author">
        ${t.image ? `<img src="${t.image}" alt="${t.name}" class="testimonial-card__img">` : `<div class="testimonial-card__avatar"></div>`}
        <div>
          <strong class="testimonial-card__name">${t.name}</strong>
          <span class="testimonial-card__company">${t.company}</span>
        </div>
      </div>
    </div>
  `;
}

function experienceItem(item) {
  return `
    <article class="experience-item" data-animate="fade-up">
      <span class="experience-item__year">${item.year}</span>
      <div class="experience-item__body">
        <span class="experience-item__period">${item.period}</span>
        <h3 class="experience-item__company">${item.company}</h3>
        <p class="experience-item__role">${item.role}</p>
        <ul class="experience-item__list">
          ${item.highlights.map((highlight) => `<li>${highlight}</li>`).join("")}
        </ul>
      </div>
    </article>
  `;
}

function credentialList() {
  return `
    <div class="credentials-grid">
      <div class="credential-card" data-animate="fade-up">
        <span class="credential-card__label">Education</span>
        ${education.map((item) => `<p><strong>${item.title}</strong><span>${item.year}</span></p>`).join("")}
      </div>
      <div class="credential-card" data-animate="fade-up">
        <span class="credential-card__label">Certifications</span>
        ${certifications.map((item) => `<p>${item}</p>`).join("")}
      </div>
      <div class="credential-card" data-animate="fade-up">
        <span class="credential-card__label">Recognition</span>
        ${awards.map((item) => `<p><strong>${item.title}</strong><span>${item.issuer}</span></p>`).join("")}
      </div>
    </div>
  `;
}

function processStep(p, i) {
  return `
    <div class="process-step js-process-step" data-step="${i}" data-animate="fade-up">
      <span class="process-step__num">${p.step}</span>
      <div class="process-step__body">
        <h3 class="process-step__title">${p.title}</h3>
        <p class="process-step__desc">${p.desc || p.description}</p>
      </div>
    </div>
  `;
}

/* ── main page export ─────────────────────────────────── */
export function HomePage() {
  return `
  <div class="page page--home">

    <!-- 1. HERO ─────────────────────────────────────── -->
    <section class="hero hero--campaign" id="section-hero" style="padding-top: 180px; padding-bottom: 80px;">
      <div class="container">
        <p class="hero__kicker" data-animate="fade-up">${hero.kicker}</p>
        <h1 class="hero__title animate-title" data-animate="split-text">
          ${hero.headline.join("<br>")}
        </h1>
        <p class="hero__tagline" data-animate="fade-up">
          ${hero.subheadline}
        </p>
        <div class="hero__actions" data-animate="fade-up">
          <a href="${hero.cta1Href}" class="btn btn--primary magnetic" data-route>${hero.cta1Label}</a>
          <a href="${hero.cta2Href}" class="btn btn--ghost magnetic" data-route>${hero.cta2Label}</a>
        </div>

        <div class="hero-image-wrap js-image-reveal" style="margin-top: 60px; border-radius: 16px; overflow: hidden; max-height: 100vh; background: #000;">
          <img src="${c.brand.images.hero}" alt="Hero" style="width: 100%; height: 100%; object-fit: cover; opacity: 1;">
        </div>

        <div class="hero-orbit" aria-hidden="true" style="z-index: -1;">
          ${hero.orbitCards.map((label, i) => `<span class="hero-orbit__card hero-orbit__card--${i + 1}">${label}</span>`).join("")}
        </div>

        <div class="hero__scroll-indicator" aria-hidden="true">
          <span class="hero__scroll-text">SCROLL</span>
          <span class="hero__scroll-line"></span>
        </div>
      </div>
    </section>

    <!-- 2. METRIC RIBBON ─────────────────────────────── -->
    <section class="metric-ribbon" aria-label="Key marketing metrics">
      <div class="container">
        <div class="metric-ribbon__grid">
          ${hero.metrics
            .map(
              (m) => `
            <div class="metric-ribbon__item" data-animate="fade-up">
              <strong class="metric-ribbon__value">${m.value}</strong>
              <span class="metric-ribbon__label">${m.label}</span>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    </section>

    <!-- 3. INTRO / ABOUT ─────────────────────────────── -->
    <section class="intro-section" id="section-about">
      <div class="container">
        <div class="intro-section__headline">
          ${intro.lines
            .filter((l) => l !== "")
            .map(
              (line, i, arr) =>
                `<span class="intro-line animate-title" style="--delay:${i * 0.08}s">${line}</span>${i === 2 ? '<br class="intro-break">' : ""}`,
            )
            .join("")}
        </div>
        <div class="intro-section__layout" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; margin-top: 40px; align-items: center;">
          <div class="intro-section__copy" data-animate="fade-up">
            <p>${intro.paragraph}</p>
            <p class="intro-section__beyond" style="margin-top:20px;">${intro.beyond}</p>
          </div>
          <div class="intro-section__image js-image-reveal" style="border-radius: 12px; overflow: hidden; aspect-ratio: 4/3; background: #111;">
            <img src="${intro.image}" alt="Digital Marketing Strategy" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8;">
          </div>
        </div>
      </div>
    </section>

    <!-- 4. SERVICES ──────────────────────────────────── -->
    <section class="services-section" id="section-services">
      <div class="container">
        <div class="services-section__header">
          <p class="section-label" data-animate="fade-up">What I Do</p>
          <h2 class="services-section__title animate-title" data-animate="split-text">WHAT I DO</h2>
        </div>
        <div class="services-list">
          ${services.map(serviceRow).join("")}
        </div>
      </div>
    </section>

    <!-- 5. SELECTED WORK ─────────────────────────────── -->
    <section class="work-section" id="section-work">
      <div class="container">
        <div class="work-section__header">
          <p class="section-label" data-animate="fade-up">Portfolio</p>
          <h2 class="animate-title" data-animate="split-text">SELECTED<br>WORK</h2>
        </div>
        <div class="work-filters" role="tablist" aria-label="Filter work by category">
          ${projectCategories
            .map(
              (cat, i) => `
            <button class="work-filter-btn js-filter-btn${i === 0 ? " is-active" : ""}" data-filter="${cat.toLowerCase()}" role="tab" aria-selected="${i === 0}">
              ${cat}
            </button>
          `,
            )
            .join("")}
        </div>
        <div class="stack-carousel stack-carousel--work" data-carousel="work" aria-label="Selected work carousel">
          <div class="stack-carousel__stage">
            ${projects.map(stackedProjectCard).join("")}
          </div>
          <div class="stack-carousel__meta">
            <span class="stack-carousel__index" data-carousel-index>01 / ${String(projects.length).padStart(2, "0")}</span>
            <span class="stack-carousel__category" data-carousel-category>${projects[0].categoryLabel}</span>
            <h3 class="stack-carousel__title" data-carousel-title>${projects[0].title}</h3>
            <p class="stack-carousel__description" data-carousel-description>${projects[0].description}</p>
          </div>
          <div class="stack-carousel__controls">
            <button class="stack-carousel__control magnetic" type="button" data-carousel-prev aria-label="Previous project">Prev</button>
            <button class="stack-carousel__control magnetic" type="button" data-carousel-next aria-label="Next project">Next</button>
          </div>
        </div>
        <div class="work-grid js-work-grid work-grid--fallback">
          ${projects.map(projectCard).join("")}
        </div>
      </div>
    </section>

    <!-- 6. CANVA GALLERY ─────────────────────────────── -->
    <section class="canva-section" id="section-canva">
      <div class="container">
        <div class="canva-section__header">
          <p class="section-label" data-animate="fade-up">Creative Design</p>
          <h2 class="canva-section__title animate-title" data-animate="split-text">
            ${canvaGallery.heading.join("<br>")}
          </h2>
          <p class="canva-section__sub" data-animate="fade-up">${canvaGallery.subheading}</p>
        </div>
      </div>
      <div class="container">
        <div class="stack-carousel stack-carousel--canva" data-carousel="canva" aria-label="Canva design carousel">
          <div class="stack-carousel__stage">
            ${canvaGallery.items.map(stackedCanvaCard).join("")}
          </div>
          <div class="stack-carousel__meta">
            <span class="stack-carousel__index" data-carousel-index>01 / ${String(canvaGallery.items.length).padStart(2, "0")}</span>
            <span class="stack-carousel__category" data-carousel-category>${canvaGallery.items[0].type}</span>
            <h3 class="stack-carousel__title" data-carousel-title>${canvaGallery.items[0].title}</h3>
            <p class="stack-carousel__description" data-carousel-description>Swipe, drag, or use controls to explore creative formats.</p>
          </div>
          <div class="stack-carousel__controls">
            <button class="stack-carousel__control magnetic" type="button" data-carousel-prev aria-label="Previous design">Prev</button>
            <button class="stack-carousel__control magnetic" type="button" data-carousel-next aria-label="Next design">Next</button>
          </div>
        </div>
      </div>
      <div class="gallery-track-wrap js-gallery-wrap">
        <div class="gallery-track js-gallery-track" role="list">
          ${canvaGallery.items.map(canvaCard).join("")}
        </div>
      </div>
      <div class="gallery-hint" aria-hidden="true">← DRAG TO EXPLORE →</div>
    </section>

    <!-- 7. CASE STUDIES ──────────────────────────────── -->
    <section class="case-section" id="section-case">
      <div class="container">
        <div class="case-section__header">
          <p class="section-label" data-animate="fade-up">Case Studies</p>
          <h2 class="animate-title" data-animate="split-text">HOW GROWTH<br>ACTUALLY HAPPENS</h2>
        </div>
        <div class="case-timeline">
          ${c.caseStudies
            .map(
              (cs) => `
            <div class="case-block" data-animate="fade-up">
              <div class="case-block__meta">
                <span class="case-block__client">${cs.client}</span>
                <span class="case-block__industry">${cs.industry}</span>
              </div>
              <div class="case-journey">
                <div class="case-visual" aria-hidden="true">
                  <svg viewBox="0 0 320 160" role="img">
                    <path class="case-graph__line" d="M18 128 C78 108 88 88 132 96 S204 52 302 28" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
                    <rect class="case-graph__bar" x="44" y="96" width="24" height="40" rx="4"/>
                    <rect class="case-graph__bar" x="116" y="76" width="24" height="60" rx="4"/>
                    <rect class="case-graph__bar" x="188" y="56" width="24" height="80" rx="4"/>
                    <rect class="case-graph__bar" x="260" y="36" width="24" height="100" rx="4"/>
                  </svg>
                </div>
                <div class="case-journey__step">
                  <span class="case-journey__label">CHALLENGE</span>
                  <p class="case-journey__text">${cs.challenge}</p>
                </div>
                <div class="case-journey__arrow">↓</div>
                <div class="case-journey__step">
                  <span class="case-journey__label">STRATEGY</span>
                  <p class="case-journey__text">${cs.strategy}</p>
                </div>
                <div class="case-journey__arrow">↓</div>
                <div class="case-journey__step">
                  <span class="case-journey__label">CREATIVE</span>
                  <p class="case-journey__text">${cs.creative}</p>
                </div>
                <div class="case-journey__arrow">↓</div>
                <div class="case-journey__step">
                  <span class="case-journey__label">CAMPAIGN</span>
                  <p class="case-journey__text">${cs.campaign}</p>
                </div>
                <div class="case-journey__arrow">↓</div>
                <div class="case-journey__step case-journey__step--result">
                  <span class="case-journey__label">RESULT</span>
                  <p class="case-journey__text">${cs.result}</p>
                  <div class="case-metrics">
                    ${cs.metrics
                      .map(
                        (m) => `
                      <div class="case-metric">
                        <span class="case-metric__value">${m.value}</span>
                        <span class="case-metric__label">${m.label}</span>
                      </div>
                    `,
                      )
                      .join("")}
                  </div>
                </div>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    </section>

    <section class="experience-section" id="section-experience">
      <div class="container">
        <div class="experience-section__header">
          <p class="section-label" data-animate="fade-up">Experience</p>
          <h2 class="animate-title" data-animate="split-text">DIGITAL<br>MARKETING JOURNEY</h2>
        </div>
        <div class="experience-timeline">
          ${experience.map(experienceItem).join("")}
        </div>
      </div>
    </section>

    <!-- 8. PROCESS ──────────────────────────────────── -->
    <section class="process-section" id="section-process">
      <div class="container">
        <div class="process-section__header">
          <p class="section-label" data-animate="fade-up">How It Works</p>
          <h2 class="animate-title" data-animate="split-text">HOW IT<br>WORKS</h2>
        </div>
        <div class="process-steps js-process-steps">
          ${process.map((step, i) => processStep(step, i)).join("")}
        </div>
      </div>
    </section>

    <!-- 9. RESULTS / METRICS ─────────────────────────── -->
    <section class="results-section" id="section-results">
      <div class="container">
        <div class="results-section__header">
          <p class="section-label" data-animate="fade-up">${results.subheading}</p>
          <h2 class="animate-title" data-animate="split-text">${results.heading}</h2>
        </div>
        <div class="stats-grid">
          ${results.stats.map(statCard).join("")}
        </div>
        <p class="results-disclaimer">${results.disclaimer}</p>
      </div>
    </section>

    <section class="credentials-section" id="section-credentials">
      <div class="container">
        <div class="credentials-section__header">
          <p class="section-label" data-animate="fade-up">Credentials</p>
          <h2 class="animate-title" data-animate="split-text">PROOF<br>POINTS</h2>
        </div>
        ${credentialList()}
      </div>
    </section>

    <!-- 11. FINAL CTA ────────────────────────────────── -->
    <section class="cta-section" id="section-cta">
      <div class="container">
        <h2 class="cta-section__title animate-title" data-animate="split-text">
          ${finalCta.headline.join("<br>")}
        </h2>
        <p class="cta-section__sub" data-animate="fade-up">${finalCta.sub}</p>
        <div class="cta-section__actions" data-animate="fade-up">
          <a href="${finalCta.ctaHref}" class="btn btn--primary btn--lg magnetic" data-route>${finalCta.ctaLabel}</a>
        </div>
      </div>
    </section>

  </div>
  `;
}
