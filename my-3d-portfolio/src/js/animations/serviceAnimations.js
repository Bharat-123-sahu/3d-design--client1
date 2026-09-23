import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initServiceAnimations() {
  const cards = document.querySelectorAll(".service-card");

  if (!cards.length) return;

  cards.forEach((card) => {
    const preview = card.querySelector(".service-card__preview");
    const content = card.querySelector(".service-card__content");

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: card,
        start: "top 85%",
        end: "top 55%",
        scrub: 1,
      },
    });

    timeline
      .fromTo(
        preview,
        {
          y: 80,
          opacity: 0,
          scale: 0.96,
        },
        {
          y: 0,
          opacity: 1,
          scale: 1,
        },
      )
      .fromTo(
        content,
        {
          y: 40,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
        },
        "-=0.6",
      );

    gsap.to(preview, {
      yPercent: -10,
      ease: "none",
      scrollTrigger: {
        trigger: card,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  });

  const header = document.querySelector(".services__header");

  if (header) {
    gsap.fromTo(
      header,
      {
        y: 80,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        scrollTrigger: {
          trigger: header,
          start: "top 85%",
        },
        ease: "power3.out",
      },
    );
  }
}
