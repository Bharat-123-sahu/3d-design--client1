import { videoRevealConfig as content } from "../data/experienceConfig.js";

/**
 * VideoReveal Component
 * FunTech-inspired scroll-driven physical video reveal section.
 * The video card emerges suspended on a dynamic physical rope
 * as the user scrolls into the section.
 */
export function VideoReveal() {
  const hasVideo = Boolean(content.src && content.src.trim());

  return `
  <section class="video-reveal" id="section-video-reveal" aria-labelledby="video-reveal-title">
    <div class="video-reveal__container container">
      <div class="video-reveal__header">
        <p class="section-label">${content.label || "IN MOTION"}</p>
        <h2 id="video-reveal-title" class="video-reveal__title">${content.title}</h2>
        <p class="video-reveal__tagline">${content.tagline || "Scroll to pull the story into view."}</p>
      </div>

      <div class="video-reveal__stage">
        <!-- Physical ceiling anchor bracket -->
        <div class="video-reveal__anchor" aria-hidden="true">
          <span class="video-reveal__anchor-bolt"></span>
          <span class="video-reveal__anchor-bracket"></span>
        </div>

        <!-- Dynamic physical rope SVG -->
        <svg class="video-reveal__rope-svg" aria-hidden="true">
          <defs>
            <linearGradient id="rope-metal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#f5e2be" />
              <stop offset="35%" stop-color="#b89e6c" />
              <stop offset="70%" stop-color="#80693f" />
              <stop offset="100%" stop-color="#e0caa2" />
            </linearGradient>
            <filter id="rope-glow-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <path class="video-reveal__rope-shadow" />
          <path class="video-reveal__rope-main" stroke="url(#rope-metal-grad)" />
          <path class="video-reveal__rope-highlight" />
        </svg>

        <!-- Suspended 3D Video Card -->
        <div class="video-reveal__card-wrapper">
          <figure class="video-reveal__card">
            <!-- Metallic carabiner clip ring connecting to the rope -->
            <div class="video-reveal__clip" aria-hidden="true">
              <span class="video-reveal__clip-ring"></span>
              <span class="video-reveal__clip-pin"></span>
            </div>

            <div class="video-reveal__media">
              ${
                hasVideo
                  ? `
                <video class="video-reveal__video"
                  playsinline
                  muted
                  loop
                  preload="metadata"
                  poster="${content.poster}"
                  aria-label="${content.title}">
                  <source src="${content.src}" type="video/mp4">
                  ${content.captions ? `<track kind="captions" src="${content.captions}" srclang="en" label="English" default>` : ""}
                </video>
                <button class="video-reveal__sound-btn" type="button" aria-label="Toggle video sound">
                  <span class="sound-icon sound-icon--muted" aria-hidden="true">🔇</span>
                  <span class="sound-icon sound-icon--unmuted" aria-hidden="true" style="display:none;">🔊</span>
                </button>
              `
                  : `
                <div class="video-reveal__poster-wrapper">
                  <img class="video-reveal__poster"
                    src="${content.poster}"
                    alt="${content.title}"
                    loading="lazy"
                    width="1280"
                    height="720">
                  <div class="video-reveal__play-badge" aria-hidden="true">
                    <span class="play-badge-icon">▶</span>
                    <span class="play-badge-label">SHOWREEL</span>
                  </div>
                </div>
              `
              }
            </div>

            <figcaption class="video-reveal__caption">
              <div class="video-reveal__caption-text">
                <span class="video-reveal__caption-tag">${content.label || "SHOWCASE"}</span>
                <span class="video-reveal__caption-sub">${content.caption || "Crafted with precision & motion"}</span>
              </div>
              <div class="video-reveal__badge" aria-hidden="true">
                <span class="video-reveal__badge-dot"></span>
                <span>PROD · 2026</span>
              </div>
            </figcaption>
          </figure>
        </div>

        <p class="video-reveal__status sr-only" role="status" aria-live="polite"></p>
      </div>
    </div>
  </section>
  `;
}
