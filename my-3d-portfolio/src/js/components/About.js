export function About() {
  const skills = [
    "SEO",
    "Google Ads",
    "Meta Ads",
    "Content Strategy",
    "Social Media",
    "Analytics",
    "Lead Funnels",
    "Brand Growth",
  ];

  return `
    <section class="about parallax-container" id="about">
      <div class="container about__container">
        <div class="about__top">
          <div class="about__eyebrow">01 / About</div>
          <h2 class="about__intro animate-title glitch-text">
            I help businesses look alive online and turn their audience into customers.
          </h2>
        </div>

        <div class="about__content">
          <div class="about__label">The Approach</div>
          <div class="about__text">
            <p>
              I am a digital marketing specialist focused on visibility, trust,
              and clear conversion paths. Every post, ad, landing page, and
              search result should have a reason to exist.
            </p>
            <p>
              My work blends creative content with practical performance thinking,
              so your brand feels memorable while the numbers stay easy to read.
            </p>
          </div>
        </div>

        <div class="about__skills">
          ${skills.map((skill) => `<span class="magnetic">${skill}</span>`).join("")}
        </div>
      </div>
    </section>
  `;
}
