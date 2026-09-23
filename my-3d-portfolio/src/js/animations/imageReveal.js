import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createRouteTrigger, prefersReducedMotion } from "../utils/animationRegistry.js";

gsap.registerPlugin(ScrollTrigger);

export function initImageReveal() {
  const wrappers = gsap.utils.toArray(
    ".js-image-reveal, .work-card__image, .gallery-card__inner, .case-visual",
  );

  wrappers.forEach((wrapper) => {
    if (wrapper.dataset.imageRevealManaged === "true") return;
    wrapper.dataset.imageRevealManaged = "true";

    const image = wrapper.querySelector("img") || wrapper.firstElementChild;

    if (prefersReducedMotion()) {
      gsap.set(wrapper, { clipPath: "inset(0% 0% 0% 0%)" });
      if (image) gsap.set(image, { scale: 1 });
      return;
    }

    gsap.set(wrapper, {
      clipPath: "inset(0% 100% 0% 0%)",
      willChange: "clip-path",
    });
    if (image) {
      gsap.set(image, { scale: 1.12, willChange: "transform" });
    }

    const show = () => {
      gsap.to(wrapper, {
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.05,
        ease: "power3.out",
        overwrite: "auto",
      });
      if (image) {
        gsap.to(image, {
          scale: 1,
          duration: 1.25,
          ease: "power3.out",
          overwrite: "auto",
        });
      }
    };

    const hide = () => {
      gsap.to(wrapper, {
        clipPath: "inset(0% 0% 0% 100%)",
        duration: 0.72,
        ease: "power2.inOut",
        overwrite: "auto",
      });
      if (image) {
        gsap.to(image, {
          scale: 1.08,
          duration: 0.72,
          ease: "power2.inOut",
          overwrite: "auto",
        });
      }
    };

    createRouteTrigger({
      id: "route:image-reveal",
      trigger: wrapper,
      start: "top 88%",
      end: "bottom 12%",
      onEnter: show,
      onLeave: hide,
      onEnterBack: show,
      onLeaveBack: hide,
    });
  });
}

