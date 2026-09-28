import { feedbackContent as content } from "../data/experienceConfig.js";

export function FeedbackPage() {
  return `<div class="page page--feedback"><section class="feedback-experience container">
    <p class="section-label">A note for the journey · 07</p>
    <h1>${content.title}</h1>
    <p class="feedback-experience__intro">${content.description}</p>
    <form class="feedback-form" action="https://formspree.io/f/xbglpvrl" method="POST" novalidate>
      <!-- Anti-bot honeypot field (hidden from real users) -->
      <input type="text" name="_gotcha" class="feedback-honeypot" tabindex="-1" autocomplete="off" aria-hidden="true" style="display:none !important">

      <div class="feedback-form__body">
        <fieldset><legend>Choose how it felt</legend><div class="feedback-options">
          ${content.options.map((option) => `<label class="feedback-option"><input type="radio" name="rating" value="${option.value}" required><span class="feedback-option__face" aria-hidden="true">${option.symbol}</span><span>${option.label}</span></label>`).join("")}
        </div></fieldset>
        <p class="feedback-reaction" role="status" aria-live="polite">Pick a feeling. Watch Pip respond.</p>
        
        <label for="feedback-message">Tell us what you think <span>(optional)</span></label>
        <textarea id="feedback-message" name="message" rows="4" maxlength="2000" placeholder="One thing you enjoyed. One thing we could improve."></textarea>
        
        <div class="feedback-fields-row">
          <div class="feedback-field">
            <label for="feedback-name">Your name <span>(optional)</span></label>
            <input type="text" id="feedback-name" name="name" maxlength="100" placeholder="e.g. Alex" autocomplete="name">
          </div>
          <div class="feedback-field">
            <label for="feedback-email">Your email <span>(optional)</span></label>
            <input type="email" id="feedback-email" name="email" maxlength="150" placeholder="e.g. alex@example.com" autocomplete="email">
          </div>
        </div>

        <div class="feedback-form__actions">
          <button class="btn btn--primary feedback-submit-btn" type="submit">
            <span class="btn-text">Submit feedback</span>
            <span class="btn-icon" aria-hidden="true">↗</span>
          </button>
          <p class="feedback-privacy-note">Powered by Formspree. Delivered directly to our team.</p>
        </div>
      </div>

      <p class="feedback-status" role="status" aria-live="polite"></p>

      <div class="feedback-success-card" hidden aria-hidden="true">
        <div class="feedback-success-card__badge" aria-hidden="true">✦</div>
        <h2 class="feedback-success-card__title">Thank you for your feedback!</h2>
        <p class="feedback-success-card__desc">Pip has received your note. Your thoughts help shape and refine this digital experience.</p>
        <button type="button" class="btn btn--primary feedback-reset-btn">Send another note</button>
      </div>
    </form>
  </section></div>`;
}
