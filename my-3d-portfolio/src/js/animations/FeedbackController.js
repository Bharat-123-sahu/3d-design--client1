import gsap from "gsap";
import { feedbackContent } from "../data/experienceConfig.js";
import { submitFeedback } from "../services/feedbackService.js";
import {
  trackDisposer,
  prefersReducedMotion,
} from "../utils/animationRegistry.js";

export function initFeedback(character) {
  const form = document.querySelector(".feedback-form");
  if (!form) return;

  const controller = new AbortController();
  const formBody = form.querySelector(".feedback-form__body");
  const reaction = form.querySelector(".feedback-reaction");
  const status = form.querySelector(".feedback-status");
  const submitBtn = form.querySelector(".feedback-submit-btn");
  const btnText = submitBtn?.querySelector(".btn-text");
  const btnIcon = submitBtn?.querySelector(".btn-icon");
  const successCard = form.querySelector(".feedback-success-card");
  const resetBtn = form.querySelector(".feedback-reset-btn");

  let submitting = false;

  // React to rating option change
  form.addEventListener(
    "change",
    (event) => {
      if (event.target.name !== "rating") return;
      const choice = feedbackContent.options.find(
        (option) => option.value === event.target.value,
      );
      if (choice) {
        character?.react(choice.reaction);
        if (reaction) {
          reaction.textContent = choice.reply;
          gsap.fromTo(
            reaction,
            { opacity: 0.4, y: 4 },
            {
              opacity: 1,
              y: 0,
              duration: prefersReducedMotion() ? 0 : 0.25,
              overwrite: true,
            },
          );
        }
        // Clear any previous rating validation error
        if (status?.classList.contains("is-error")) {
          status.textContent = "";
          status.className = "feedback-status";
        }
      }
    },
    { signal: controller.signal },
  );

  // Form submission handler
  form.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();
      if (submitting) return;

      const data = new FormData(form);
      const rating = data.get("rating");
      const message = (data.get("message") || "").trim();
      const name = (data.get("name") || "").trim();
      const email = (data.get("email") || "").trim();
      const gotcha = (data.get("_gotcha") || "").trim();

      // Client-side Validation
      if (!rating) {
        if (status) {
          status.textContent =
            "Please select how your experience felt before submitting.";
          status.className = "feedback-status is-error";
          gsap.fromTo(
            status,
            { opacity: 0, y: -4 },
            { opacity: 1, y: 0, duration: 0.2 },
          );
        }
        const firstRadio = form.querySelector('input[name="rating"]');
        firstRadio?.focus();
        character?.react("curious");
        return;
      }

      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          if (status) {
            status.textContent =
              "Please enter a valid email address or leave it blank.";
            status.className = "feedback-status is-error";
            gsap.fromTo(
              status,
              { opacity: 0, y: -4 },
              { opacity: 1, y: 0, duration: 0.2 },
            );
          }
          form.querySelector('input[name="email"]')?.focus();
          character?.react("thinking");
          return;
        }
      }

      if (message.length > 2000) {
        if (status) {
          status.textContent = "Please keep your note within 2,000 characters.";
          status.className = "feedback-status is-error";
        }
        form.querySelector('textarea[name="message"]')?.focus();
        return;
      }

      // Enter Loading State
      submitting = true;
      if (submitBtn) submitBtn.disabled = true;
      form.setAttribute("aria-busy", "true");

      if (btnText) btnText.textContent = "Sending feedback...";
      if (btnIcon) {
        btnIcon.textContent = "●";
        gsap.to(btnIcon, {
          rotation: 360,
          repeat: -1,
          ease: "linear",
          duration: 0.8,
        });
      }

      if (status) {
        status.textContent = "Delivering your note to Formspree...";
        status.className = "feedback-status is-loading";
      }

      try {
        const result = await submitFeedback(
          { rating, message, name, email, gotcha },
          { signal: controller.signal },
        );

        if (!form.isConnected) return;

        // Character celebrates successful delivery!
        character?.react("celebrate");

        // Clear status text
        if (status) {
          status.textContent = "";
          status.className = "feedback-status";
        }

        // Transition from form body to success card
        if (formBody && successCard) {
          if (prefersReducedMotion()) {
            formBody.hidden = true;
            successCard.hidden = false;
            successCard.removeAttribute("aria-hidden");
          } else {
            gsap.to(formBody, {
              opacity: 0,
              y: -10,
              duration: 0.3,
              ease: "power2.in",
              onComplete: () => {
                formBody.hidden = true;
                successCard.hidden = false;
                successCard.removeAttribute("aria-hidden");
                gsap.fromTo(
                  successCard,
                  { opacity: 0, y: 16, scale: 0.98 },
                  {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.45,
                    ease: "back.out(1.4)",
                  },
                );
              },
            });
          }
        }
      } catch (error) {
        if (error.name !== "AbortError" && form.isConnected) {
          character?.react("thinking");
          if (status) {
            status.textContent =
              error.message ||
              "Something went wrong while sending your feedback. Please try again.";
            status.className = "feedback-status is-error";
            gsap.fromTo(
              status,
              { opacity: 0, y: -4 },
              { opacity: 1, y: 0, duration: 0.25 },
            );
          }
        }
      } finally {
        submitting = false;
        if (submitBtn) submitBtn.disabled = false;
        form.removeAttribute("aria-busy");
        if (btnText) btnText.textContent = "Submit feedback";
        if (btnIcon) {
          gsap.killTweensOf(btnIcon);
          gsap.set(btnIcon, { rotation: 0 });
          btnIcon.textContent = "↗";
        }
      }
    },
    { signal: controller.signal },
  );

  // Reset handler to allow submitting another note
  resetBtn?.addEventListener(
    "click",
    () => {
      form.reset();
      submitting = false;
      if (submitBtn) submitBtn.disabled = false;
      form.removeAttribute("aria-busy");
      if (status) {
        status.textContent = "";
        status.className = "feedback-status";
      }
      if (reaction) {
        reaction.textContent = "Pick a feeling. Watch Pip respond.";
      }
      character?.react("wave");

      if (formBody && successCard) {
        if (prefersReducedMotion()) {
          successCard.hidden = true;
          successCard.setAttribute("aria-hidden", "true");
          formBody.hidden = false;
          gsap.set(formBody, { opacity: 1, y: 0 });
        } else {
          gsap.to(successCard, {
            opacity: 0,
            y: -10,
            duration: 0.25,
            ease: "power2.in",
            onComplete: () => {
              successCard.hidden = true;
              successCard.setAttribute("aria-hidden", "true");
              formBody.hidden = false;
              gsap.fromTo(
                formBody,
                { opacity: 0, y: 16 },
                { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
              );
            },
          });
        }
      }
    },
    { signal: controller.signal },
  );

  trackDisposer(() => {
    controller.abort();
    if (reaction) gsap.killTweensOf(reaction);
    if (btnIcon) gsap.killTweensOf(btnIcon);
    if (status) gsap.killTweensOf(status);
  });
}
