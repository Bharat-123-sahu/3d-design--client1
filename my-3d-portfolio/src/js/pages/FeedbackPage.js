import { feedbackContent as content } from "../data/experienceConfig.js";

export function FeedbackPage() {
  return `<div class="page page--feedback"><section class="feedback-experience container">
    <p class="section-label">A note for the journey · 07</p>
    <h1>${content.title}</h1>
    <p class="feedback-experience__intro">${content.description}</p>
    <form class="feedback-form">
      <fieldset><legend>Choose how it felt</legend><div class="feedback-options">
        ${content.options.map(option => `<label class="feedback-option"><input type="radio" name="rating" value="${option.value}" required><span class="feedback-option__face" aria-hidden="true">${option.symbol}</span><span>${option.label}</span></label>`).join("")}
      </div></fieldset>
      <p class="feedback-reaction" role="status" aria-live="polite">Pick a feeling. Watch Pip respond.</p>
      <label for="feedback-message">Tell us what you think <span>(optional)</span></label>
      <textarea id="feedback-message" name="message" rows="4" maxlength="2000" placeholder="One thing you enjoyed. One thing we could improve."></textarea>
      <div class="feedback-form__actions"><button class="btn btn--primary" type="submit">Submit feedback <span aria-hidden="true">↗</span></button><p>Feedback delivery is not connected yet. Nothing will be sent.</p></div>
      <p class="feedback-status" role="status" aria-live="polite"></p>
    </form>
  </section></div>`;
}
