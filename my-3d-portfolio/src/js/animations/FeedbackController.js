import gsap from "gsap";
import { feedbackContent } from "../data/experienceConfig.js";
import { submitFeedback } from "../services/feedbackService.js";
import { trackDisposer, prefersReducedMotion } from "../utils/animationRegistry.js";

export function initFeedback(character) {
  const form = document.querySelector(".feedback-form");
  if (!form) return;
  const controller = new AbortController();
  const reaction = form.querySelector(".feedback-reaction");
  const status = form.querySelector(".feedback-status");
  const submit = form.querySelector('[type="submit"]');
  let submitting = false;
  form.addEventListener("change", event => {
    if (event.target.name !== "rating") return;
    const choice = feedbackContent.options.find(option => option.value === event.target.value);
    character?.react(choice.reaction);
    reaction.textContent = choice.reply;
    gsap.fromTo(reaction, { opacity: 0.4, y: 4 }, { opacity: 1, y: 0, duration: prefersReducedMotion() ? 0 : 0.25, overwrite: true });
  }, { signal: controller.signal });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (submitting || !form.reportValidity()) return;
    submitting = submit.disabled = true;
    form.setAttribute("aria-busy", "true");
    const data = new FormData(form);
    try {
      const result = await submitFeedback({ rating: data.get("rating"), message: data.get("message").trim() }, { signal: controller.signal });
      if (!form.isConnected) return;
      status.textContent = result.status === "submitted" ? "Thank you. Your feedback was sent." : "Your feedback has not been sent. Delivery is not connected yet; your note is still here to edit or copy.";
    } catch (error) {
      if (error.name !== "AbortError" && form.isConnected) status.textContent = `Feedback could not be sent. ${error.message}`;
    } finally {
      submitting = submit.disabled = false;
      form.removeAttribute("aria-busy");
    }
  }, { signal: controller.signal });
  trackDisposer(() => { controller.abort(); gsap.killTweensOf(reaction); });
}
