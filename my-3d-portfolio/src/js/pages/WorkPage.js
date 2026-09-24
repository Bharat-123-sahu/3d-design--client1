import { workCinematics } from "../components/WorkCinematics.js";
import { siteContent as c } from "../data/siteContent.js";

const projectCategories = [
  "ALL",
  "SOCIAL",
  "ADS",
  "ECOMMERCE",
  "CONTENT",
  "SEO",
  "BRANDING",
];

function projectCard(p) {
  return `
    <div class="work-card magnetic js-work-card" data-category="${p.category}" data-animate="fade-up" data-cursor="project">
      <div class="work-card__image js-image-reveal" style="background:${p.color}20;">
        ${
          p.image
            ? `<img src="${p.image}" alt="${p.title}" loading="lazy">`
            : `<div class="work-card__placeholder" style="--card-color:${p.color};"></div>`
        }
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

export function WorkPage() {
  const { projects, canvaGallery, caseStudies } = c;
  return `
  <div class="page page--work parallax-container">

    <section class="hero" id="section-hero">
      <div class="container">
        <p class="hero__kicker" data-animate="fade-up">Portfolio</p>
        <h1 class="hero__title animate-title" data-animate="split-text">SELECTED<br>WORK</h1>
        <p class="hero__tagline" data-animate="fade-up">
          Growth systems, campaign ideas, and measurable marketing work.
        </p>
      </div>
    </section>

    ${workCinematics(projects)}

    <!-- Work grid with filters -->
    <section class="work-section" id="work-grid">
      <div class="container">
        <div class="work-filters" role="tablist">
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
        <div class="work-grid js-work-grid">
          ${projects.map(projectCard).join("")}
        </div>
      </div>
    </section>

    <!-- Canva gallery -->

  <!--     <section class="canva-section" id="section-canva">
      <div class="container">
        <p class="section-label" data-animate="fade-up">Creative Design</p>
        <h2 class="animate-title" data-animate="split-text">
          ${canvaGallery.heading.join("<br>")}
        </h2>
        <p class="canva-section__sub" data-animate="fade-up">${canvaGallery.subheading}</p>
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
        <div class="gallery-track js-gallery-track">
          ${canvaGallery.items
            .map(
              (item) => `
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
          `,
            )
            .join("")}
        </div>
      </div>
      <div class="gallery-hint" aria-hidden="true">← DRAG TO EXPLORE →</div>
    </section>
-->


    <!-- Case Studies -->
    <section class="case-section" id="section-case">
      <div class="container">
        <p class="section-label" data-animate="fade-up">Case Studies</p>
        <h2 class="animate-title" data-animate="split-text">HOW GROWTH<br>ACTUALLY HAPPENS</h2>
        ${caseStudies
          .map(
            (cs) => `
          <div class="case-block" data-animate="fade-up">
            <div class="case-block__meta">
              <span class="case-block__client">${cs.client}</span>
              <span class="case-block__industry">${cs.industry}</span>
            </div>
            <div class="case-journey">
              ${[
                { label: "CHALLENGE", text: cs.challenge },
                { label: "STRATEGY", text: cs.strategy },
                { label: "CREATIVE", text: cs.creative },
                { label: "CAMPAIGN", text: cs.campaign },
                { label: "RESULT", text: cs.result },
              ]
                .map(
                  (item, i, arr) => `
                <div class="case-journey__step${item.label === "RESULT" ? " case-journey__step--result" : ""}">
                  <span class="case-journey__label">${item.label}</span>
                  <p class="case-journey__text">${item.text}</p>
                  ${
                    item.label === "RESULT"
                      ? `
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
                  `
                      : `<div class="case-journey__arrow">↓</div>`
                  }
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    </section>

    <section class="cta-section">
      <div class="container">
        <h2 class="cta-section__title animate-title" data-animate="split-text">
          HAVE A PROJECT<br>IN MIND?
        </h2>
        <div class="cta-section__actions" data-animate="fade-up">
          <a href="/contact" class="btn btn--primary magnetic" data-route>Let's Collaborate</a>
        </div>
      </div>
    </section>

  </div>
  `;
}
