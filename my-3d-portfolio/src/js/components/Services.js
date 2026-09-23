import { ServiceCard } from "./ServiceCard.js";

export function Services() {
  const services = [
    {
      title: "Search Visibility",
      category: "SEO / Local SEO",
      description:
        "Website audits, keyword planning, local listings, and content improvements that help customers find you first.",
      accent: "cyan",
      link: "#contact",
    },
    {
      title: "Performance Campaigns",
      category: "Google Ads / Meta Ads",
      description:
        "Conversion-focused campaigns with clean targeting, stronger creatives, landing-page direction, and reporting.",
      accent: "lime",
      link: "#contact",
    },
    {
      title: "Social Brand Growth",
      category: "Content / Reels / Strategy",
      description:
        "Scroll-stopping content systems, calendar planning, profile polish, and brand storytelling people remember.",
      accent: "rose",
      link: "#contact",
    },
  ];

  return `
    <section class="services parallax-container" id="services">
      <div class="container">
        <div class="services__header">
          <div class="section-label">02 / Services</div>
          <h2 class="section-title animate-title glitch-text">
            Marketing systems made to attract, convince, and convert.
          </h2>
        </div>

        <div class="services__grid">
          ${services.map((service) => ServiceCard(service)).join("")}
        </div>
      </div>
    </section>
  `;
}
