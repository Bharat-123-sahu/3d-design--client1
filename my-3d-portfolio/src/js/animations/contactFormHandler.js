import gsap from "gsap";
import { sendContactForm } from "../services/emailService.js";

export function initContactFormHandler() {
  const form = document.querySelector(".js-contact-form");
  if (!form) return;

  const submitBtn = form.querySelector(".js-submit-btn");
  const btnText = submitBtn.querySelector(".btn__text");
  const statusContainer = form.querySelector(".js-form-status");

  // Prevent duplicate bindings
  if (form.dataset.handlerInitialized) return;
  form.dataset.handlerInitialized = "true";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Basic frontend validation
    const name = form.querySelector('[name="from_name"]').value.trim();
    const email = form.querySelector('[name="reply_to"]').value.trim();
    const type = form.querySelector('[name="project_type"]').value;
    const message = form.querySelector('[name="message"]').value.trim();

    if (!name || !email || !type || !message) {
      showStatus(
        "error",
        "MISSING FIELDS",
        "Please fill out all required fields before submitting.",
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showStatus(
        "error",
        "INVALID EMAIL",
        "Please enter a valid email address.",
      );
      return;
    }

    if (message.length < 10) {
      showStatus(
        "error",
        "MESSAGE TOO SHORT",
        "Please provide a bit more detail in your message.",
      );
      return;
    }

    // Loading state
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.7";
    submitBtn.style.cursor = "not-allowed";
    const originalBtnText = btnText.innerText;
    btnText.innerText = "SENDING...";

    // Clear previous status
    statusContainer.className = "form-status js-form-status";
    statusContainer.innerHTML = "";

    try {
      await sendContactForm(form);

      // Success state
      showStatus(
        "success",
        "MESSAGE SENT",
        "Thanks! Your message has been received. We'll get back to you soon.",
      );
      form.reset();
    } catch (error) {
      // Error state
      console.error("Contact Form Submission Error:", error);

      if (error.message === "MISSING_ENV_KEYS") {
        showStatus(
          "error",
          "SERVER RESTART REQUIRED",
          "Environment keys not loaded. Please restart your Vite server (Ctrl+C then npm run dev) so it can read the .env file.",
        );
      } else {
        showStatus(
          "error",
          "SOMETHING WENT WRONG",
          `Unable to send your message right now. Details: ${error.text || error.message || error}`,
        );
      }
    } finally {
      // Restore button
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.style.cursor = "";
      btnText.innerText = originalBtnText;
    }
  });

  function showStatus(type, title, text) {
    statusContainer.className = `form-status js-form-status is-${type}`;
    statusContainer.innerHTML = `
      <strong class="form-status__title">${title}</strong>
      <p class="form-status__text">${text}</p>
    `;

    // Animate reveal
    gsap.fromTo(
      statusContainer,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
    );
  }
}
