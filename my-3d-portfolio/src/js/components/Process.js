export function Process() {
  const steps = [
    {
      year: "01",
      role: "Find the audience",
      company: "Research",
      description:
        "Understand your customers, competitors, keywords, offers, and current digital presence.",
      technologies: "Audience / Competitors / Search Demand",
    },
    {
      year: "02",
      role: "Build the campaign rhythm",
      company: "Execution",
      description:
        "Create the content, ads, landing flow, and social calendar that move people from curious to ready.",
      technologies: "Content / Paid Ads / Landing Pages",
    },
    {
      year: "03",
      role: "Measure, learn, improve",
      company: "Optimization",
      description:
        "Track what is working, remove what is weak, and keep improving the message, targeting, and spend.",
      technologies: "Analytics / Reports / Experiments",
    },
  ];

  return `
    <section class="process" id="process">
      <div class="container">
        <div class="process__header">
          <div class="section-label">03 / Process</div>
          <h2 class="section-title section-title--narrow process__title">
            Growth feels better when every move has a reason.
          </h2>
        </div>

        <div class="process__timeline">
          ${steps
            .map(
              (step, index) => `
                <article class="process-card" data-index="${index}">
                  <div class="process-card__year">${step.year}</div>
                  <div class="process-card__line"><span></span></div>
                  <div class="process-card__content">
                    <p class="process-card__company">${step.company}</p>
                    <h3 class="process-card__role">${step.role}</h3>
                    <p class="process-card__description">${step.description}</p>
                    <p class="process-card__technologies">${step.technologies}</p>
                  </div>
                </article>
              `,
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}
