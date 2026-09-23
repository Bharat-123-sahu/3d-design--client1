import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initProcessAnimations() {
  const section = document.querySelector(".process");

  if (!section) return;

  const cards = section.querySelectorAll(".process-card");

  gsap.fromTo(
    ".process__title",
    {
      y: 80,
      opacity: 0,
    },
    {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: "power4.out",
      scrollTrigger: {
        trigger: ".process__header",
        start: "top 80%",
      },
    },
  );

  cards.forEach((card) => {
    const dot = card.querySelector(".process-card__line span");
    const content = card.querySelector(".process-card__content");

    gsap.fromTo(
      content,
      {
        y: 70,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: card,
          start: "top 80%",
        },
      },
    );

    gsap.to(dot, {
      scale: 1,
      duration: 0.5,
      ease: "back.out(2)",
      scrollTrigger: {
        trigger: card,
        start: "top 80%",
      },
    });
  });
}
