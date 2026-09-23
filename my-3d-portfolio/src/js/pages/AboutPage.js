import { siteContent as c } from "../data/siteContent.js";

export function AboutPage() {
  const { intro, process: steps, brand, contact } = c;
  return `
  <div class="page page--about parallax-container">

    <section class="hero" id="section-hero">
      <div class="container">
        <p class="hero__kicker" data-animate="fade-up">About</p>
        <h1 class="hero__title animate-title" data-animate="split-text">MARKETING<br>WITH A<br>PURPOSE.</h1>
        <p class="hero__tagline" data-animate="fade-up">
          ${intro.paragraph}
        </p>
      </div>
    </section>

    <section class="philosophy-section">
      <div class="container">
        <div class="philosophy-layout" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; align-items: center;">
          <div class="philosophy-block" data-animate="fade-up">
            <p class="section-label">Philosophy</p>
            <h2 class="philosophy-block__title animate-title">
              Good marketing doesn't shout louder.<br>
              It makes the right people feel seen —<br>
              then gives them a reason to act.
            </h2>
          </div>
          <div class="philosophy-image js-image-reveal" style="border-radius:12px; overflow:hidden; aspect-ratio:1/1;">
            <img src="${brand.images.marketing}" alt="Marketing Philosophy" loading="lazy" style="width:100%; height:100%; object-fit:cover;">
          </div>
        </div>
      </div>
    </section>

    <section class="capabilities-section" style="padding-top: 100px;">
      <div class="container">
        <div class="capabilities-header-layout" style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 60px;">
          <p class="section-label" data-animate="fade-up">What I Bring</p>
          <div class="team-image js-image-reveal" style="width: 200px; height: 120px; border-radius: 8px; overflow:hidden;">
            <img src="${brand.images.team}" alt="Team Collaboration" loading="lazy" style="width:100%; height:100%; object-fit:cover;">
          </div>
        </div>
        <div class="capabilities-grid">
          ${[
            {
              title: "Strategy First",
              desc: "Every project starts with a clear brief, audience map, and offer framework before any creative or ad spend begins.",
            },
            {
              title: "Creative Volume",
              desc: "High-output creative testing — more hooks, more angles, better signals from every campaign cycle.",
            },
            {
              title: "Performance Rhythm",
              desc: "Weekly optimisation, simple dashboards, and decisions driven by actual platform behaviour.",
            },
            {
              title: "Full Funnel",
              desc: "From cold scroll to warm lead to paying customer — traffic connects to landing pages, nurture, and follow-up.",
            },
          ]
            .map(
              (cap) => `
            <div class="capability-card magnetic" data-animate="fade-up">
              <h3 class="capability-card__title">${cap.title}</h3>
              <p class="capability-card__desc">${cap.desc}</p>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    </section>

    <section class="process-section" style="padding-top: 100px;">
      <div class="container">
        <p class="section-label" data-animate="fade-up">The Playbook</p>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; align-items: center; margin-bottom: 60px;">
          <h2 class="animate-title" data-animate="split-text">HOW I WORK<br>& DELIVER</h2>
          <div class="location-image js-image-reveal" style="border-radius:12px; overflow:hidden; aspect-ratio:16/9; max-width: 400px; margin-left: auto;">
             <img src="${brand.images.location}" alt="Based in India" loading="lazy" style="width:100%; height:100%; object-fit:cover;">
          </div>
        </div>
        
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

    <section class="cta-section">
      <div class="container">
        <h2 class="cta-section__title animate-title" data-animate="split-text">
          READY TO<br>GROW?
        </h2>
        <div class="cta-section__actions" data-animate="fade-up">
          <a href="/contact" class="btn btn--primary magnetic" data-route>Start a Project</a>
          <a href="/work" class="btn btn--ghost magnetic" data-route>See My Work</a>
        </div>
      </div>
    </section>

  </div>
  `;
}
