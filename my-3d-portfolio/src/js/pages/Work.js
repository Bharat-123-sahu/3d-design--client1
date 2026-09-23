export function Work() {
  const works = [
    { title: "Brand Campaign X", category: "Digital Marketing" },
    { title: "E-commerce Redesign", category: "Web Design" },
    { title: "Social Media Strategy Y", category: "Social" },
    { title: "SEO Optimization Z", category: "SEO" },
    { title: "Product Launch Strategy", category: "Marketing" },
    { title: "Corporate Rebranding", category: "Branding" }
  ];

  return `
    <div class="page page--work parallax-container">
      <div class="container" style="padding-top: 8rem; padding-bottom: 4rem;">
        <h1 class="animate-title glitch-text" style="margin-bottom: 3rem; font-size: clamp(3rem, 5vw, 5rem);">Selected Works</h1>
        <div class="work-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
          ${works.map(work => `
            <div class="work-item magnetic" style="padding: 3rem 2rem; border: 1px solid var(--border-color, rgba(255,255,255,0.1)); border-radius: 1rem; cursor: pointer; transition: transform 0.3s ease;">
              <h3 class="work-title" style="margin-bottom: 0.5rem; font-size: 1.5rem;">${work.title}</h3>
              <p class="work-category" style="color: var(--text-muted, #888);">${work.category}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}
