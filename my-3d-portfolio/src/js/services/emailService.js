import emailjs from "@emailjs/browser";

export async function sendContactForm(formElement) {
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

  if (!publicKey || !serviceID || !templateID) {
    console.error("EmailJS configuration missing. Check .env variables.");
    throw new Error("MISSING_ENV_KEYS");
  }

  try {
    // In @emailjs/browser v4+, it's safer to pass the publicKey directly into the sendForm call.
    const response = await emailjs.sendForm(
      serviceID,
      templateID,
      formElement,
      { publicKey: publicKey },
    );
    return response;
  } catch (error) {
    console.error("EmailJS Error:", error);
    throw error;
  }
}
