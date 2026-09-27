import { feedbackContent } from "../data/experienceConfig.js";

// Integration boundary: replace the unconfigured result with an awaited API call.
// A submitted result must only be returned after the server acknowledges delivery.
export async function submitFeedback({ rating, message }, { signal } = {}) {
  signal?.throwIfAborted();
  if (!feedbackContent.options.some(option => option.value === rating)) throw new Error("Choose a rating first.");
  if (typeof message !== "string" || message.length > 2000) throw new Error("Keep your note within 2,000 characters.");
  return { status: "unconfigured" };
}
