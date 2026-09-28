import { videoRevealConfig as content } from "../data/experienceConfig.js";

export function VideoReveal() {
  return `<section class="video-reveal container" aria-labelledby="video-reveal-title">
    <div class="video-reveal__heading"><p class="section-label">${content.label}</p><h2 id="video-reveal-title">${content.title}</h2><p>Scroll to pull the story into view.</p></div>
    <div class="video-reveal__rig">
      <svg class="video-reveal__rope" viewBox="0 0 100 260" preserveAspectRatio="none" aria-hidden="true"><path d="M 85 0 C 85 70 25 130 50 255" /></svg>
      <figure class="video-reveal__card">
        <span class="video-reveal__clip" aria-hidden="true"></span>
        ${content.src ? `<video controls playsinline preload="none" poster="${content.poster}" aria-label="Creative portfolio film"><source src="${content.src}">${content.captions ? `<track kind="captions" src="${content.captions}" srclang="en" label="English" default>` : ""}</video>` : `<img src="${content.poster}" alt="Creative portfolio preview" loading="lazy" width="1280" height="720">`}
        <figcaption>${content.src ? "A closer look at the work." : "A glimpse of the work. Film coming soon."}</figcaption>
      </figure>
      <p class="video-reveal__status" role="status"></p>
    </div>
  </section>`;
}
