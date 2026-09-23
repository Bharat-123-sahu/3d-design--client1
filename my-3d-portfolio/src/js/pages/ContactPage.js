import { siteContent as c } from "../data/siteContent.js";

export function ContactPage() {
  const { contact, brand, finalCta } = c;
  return `
  <div class="page page--contact parallax-container">

    <section class="hero" id="section-hero">
      <div class="container">
        <p class="hero__kicker" data-animate="fade-up">Let's Work Together</p>
        <h1 class="hero__title animate-title" data-animate="split-text">
          ${finalCta.headline.join("<br>")}
        </h1>
        <p class="hero__tagline" data-animate="fade-up">
          ${finalCta.sub}
        </p>
      </div>
    </section>

    <section class="contact-section">
      <div class="container">
        <div class="contact-layout">

          <!-- Form -->
          <div class="contact-form-wrap" data-animate="fade-up">
            <form class="contact-form js-contact-form" novalidate>
              <div class="form-group">
                <label class="form-label" for="cf-name">Name</label>
                <input type="text" id="cf-name" name="from_name" class="form-control" placeholder="Your name" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="cf-email">Email</label>
                <input type="email" id="cf-email" name="reply_to" class="form-control" placeholder="your@email.com" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="cf-company">Company (Optional)</label>
                <input type="text" id="cf-company" name="company" class="form-control" placeholder="Your company name">
              </div>
              <div class="form-group">
                <label class="form-label" for="cf-type">Project Type</label>
                <select id="cf-type" name="project_type" class="form-control" required>
                  <option value="" disabled selected>Select a service</option>
                  <option value="social-media">Social Media Marketing</option>
                  <option value="meta-ads">Meta Ads</option>
                  <option value="ecommerce">Ecommerce Advertising</option>
                  <option value="seo">SEO</option>
                  <option value="content">Content Strategy</option>
                  <option value="creative">Creative Direction</option>
                  <option value="influencer">Influencer Marketing</option>
                  <option value="marketplace">Marketplace Management</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="cf-message">Message</label>
                <textarea id="cf-message" name="message" class="form-control" placeholder="Tell me about your brand, goals, and timeline..." rows="5" required></textarea>
              </div>
              
              <div class="form-status js-form-status" aria-live="polite"></div>
              
              <button type="submit" class="btn btn--primary btn--full magnetic js-submit-btn">
                <span class="btn__text">Send Message →</span>
              </button>
            </form>
          </div>

          <!-- Contact details -->
          <div class="contact-details" data-animate="fade-up">
            <div class="contact-details__block">
              <h3 class="contact-details__label">Email</h3>
              <a href="mailto:${contact.email}" class="contact-details__value magnetic">${contact.email}</a>
            </div>
            <div class="contact-details__block">
              <h3 class="contact-details__label">WhatsApp</h3>
              <a href="https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, "")}" target="_blank" rel="noopener" class="contact-details__value magnetic">${contact.whatsapp}</a>
            </div>
            <div class="contact-details__block">
              <h3 class="contact-details__label">Based In</h3>
              <p class="contact-details__value">${brand.location}<br><span class="contact-details__sub">${brand.availableFor}</span></p>
            </div>

            <div class="contact-social">
              <h3 class="contact-details__label">Find Me On</h3>
              <div class="contact-social__links">
                <a href="${contact.instagram}" target="_blank" rel="noopener" class="contact-social__link magnetic">Instagram ↗</a>
                <a href="${contact.linkedin}" target="_blank" rel="noopener" class="contact-social__link magnetic">LinkedIn ↗</a>
                <a href="${contact.twitter}" target="_blank" rel="noopener" class="contact-social__link magnetic">X / Twitter ↗</a>
                <a href="${contact.youtube}" target="_blank" rel="noopener" class="contact-social__link magnetic">YouTube ↗</a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <section class="closing-section">
      <div class="container">
        <h2 class="closing-text animate-title" data-animate="split-text">
          Every strong campaign<br>starts with one clear conversation.
        </h2>
      </div>
    </section>

  </div>
  `;
}
