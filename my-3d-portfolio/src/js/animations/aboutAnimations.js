import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initAboutAnimations() {
  const section =
    document.querySelector(".about");

  if (!section) return;

  const intro =
    section.querySelector(
      ".about__intro"
    );

  const text =
    section.querySelector(
      ".about__text"
    );

  const skills =
    section.querySelector(
      ".about__skills"
    );

  if (!intro || !text || !skills) return;

  gsap.fromTo(
    intro,
    {
      y: 100,
      opacity: 0,
    },
    {
      y: 0,
      opacity: 1,

      duration: 1.2,

      ease: "power4.out",

      scrollTrigger: {
        trigger: intro,

        start: "top 85%",
      },
    }
  );

  gsap.fromTo(
    text,
    {
      y: 80,
      opacity: 0,
    },
    {
      y: 0,
      opacity: 1,

      duration: 1,

      ease: "power3.out",

      scrollTrigger: {
        trigger: text,

        start: "top 85%",
      },
    }
  );

  gsap.fromTo(
    skills,
    {
      y: 50,
      opacity: 0,
    },
    {
      y: 0,
      opacity: 1,

      duration: 1,

      ease: "power3.out",

      scrollTrigger: {
        trigger: skills,

        start: "top 90%",
      },
    }
  );
}
