import { siteContent } from "../data/siteContent.js";

export function ExperiencePage() {
  return `<div class="page page--experience"><section class="hero"><div class="container">
    <p class="hero__kicker">Experience · The journey so far</p>
    <h1 class="hero__title">Built through<br>doing.</h1>
  </div></section><section class="experience-section"><div class="container"><div class="experience-timeline">
    ${siteContent.experience.map(item => `<article class="experience-item"><span class="experience-item__year">${item.year}</span><div class="experience-item__body"><span class="experience-item__period">${item.period}</span><h2 class="experience-item__company">${item.company}</h2><p class="experience-item__role">${item.role}</p><ul class="experience-item__list">${item.highlights.map(highlight => `<li>${highlight}</li>`).join("")}</ul></div></article>`).join("")}
  </div></div></section></div>`;
}
