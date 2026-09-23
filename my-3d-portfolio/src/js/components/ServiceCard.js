export function ServiceCard(service) {
  return `
    <article class="service-card service-card--${service.accent}">
      <div class="service-card__preview" aria-hidden="true">
        <div class="service-card__chrome">
          <span></span><span></span><span></span>
        </div>
        <div class="service-card__visual">
          <span class="visual-ring"></span>
          <span class="visual-line visual-line--one"></span>
          <span class="visual-line visual-line--two"></span>
          <span class="visual-panel"></span>
          <span class="visual-dot visual-dot--one"></span>
          <span class="visual-dot visual-dot--two"></span>
        </div>
      </div>

      <div class="service-card__content">
        <p class="service-card__category">${service.category}</p>
        <h3 class="service-card__title">${service.title}</h3>
        <p class="service-card__description">${service.description}</p>
        <a href="${service.link}" class="service-card__link" aria-label="Discuss ${service.title}">
          Discuss This
        </a>
      </div>
    </article>
  `;
}
