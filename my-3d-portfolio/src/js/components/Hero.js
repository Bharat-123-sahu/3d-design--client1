export function Hero() {
  return `
    <section class="hero parallax-container" id="hero">
      <div class="hero__canvas" id="hero-canvas" aria-hidden="true"></div>

      <div class="container hero__container">
        <p class="hero__eyebrow">Digital Marketing / Growth Strategy / Brand Visibility</p>

        <h1 class="hero__title animate-title glitch-text">
          Bharat Sahu
          <span>turns attention into measurable growth.</span>
        </h1>

        <p class="hero__description">
          A bold digital marketing partner for brands that want stronger online
          presence, sharper campaigns, and content people actually stop for.
        </p>

        <div class="hero__actions">
          <a href="#services" data-nav-target="#services" class="button button--primary magnetic">
            Explore Services
          </a>
          <a href="#contact" data-nav-target="#contact" class="button button--ghost magnetic">
            Start Growth
          </a>
        </div>
      </div>

      <div class="hero__metrics" aria-label="Marketing highlights">
        <span><strong>SEO</strong> Visibility</span>
        <span><strong>Ads</strong> Performance</span>
        <span><strong>Social</strong> Growth</span>
      </div>
    </section>
  `;
}
