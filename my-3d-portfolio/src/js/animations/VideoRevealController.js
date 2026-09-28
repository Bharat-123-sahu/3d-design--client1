import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { videoRevealConfig } from "../data/experienceConfig.js";
import { trackDisposer } from "../utils/animationRegistry.js";

gsap.registerPlugin(ScrollTrigger);

/**
 * FunTech-inspired scroll-driven physical video reveal.
 * Pinned section where scrolling physically pulls the suspended video card
 * into view via a dynamic tension rope.
 */
export function initVideoReveal() {
  const section = document.querySelector(".video-reveal");
  if (!section) return;

  const stage = section.querySelector(".video-reveal__stage");
  const card = section.querySelector(".video-reveal__card");
  const anchor = section.querySelector(".video-reveal__anchor");
  const clip = section.querySelector(".video-reveal__clip");
  const ropeSvg = section.querySelector(".video-reveal__rope-svg");
  const ropeShadow = section.querySelector(".video-reveal__rope-shadow");
  const ropeMain = section.querySelector(".video-reveal__rope-main");
  const ropeHighlight = section.querySelector(".video-reveal__rope-highlight");
  const video = section.querySelector("video");
  const soundBtn = section.querySelector(".video-reveal__sound-btn");

  if (!stage || !card || !anchor || !clip || !ropeSvg) return;

  const controller = new AbortController();
  const { signal } = controller;

  // Sound toggle button
  if (video && soundBtn) {
    soundBtn.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        video.muted = !video.muted;
        const mutedIcon = soundBtn.querySelector(".sound-icon--muted");
        const unmutedIcon = soundBtn.querySelector(".sound-icon--unmuted");
        if (mutedIcon && unmutedIcon) {
          mutedIcon.style.display = video.muted ? "inline" : "none";
          unmutedIcon.style.display = video.muted ? "none" : "inline";
        }
      },
      { signal },
    );

    const showError = () => {
      const status = section.querySelector('[role="status"]');
      if (status)
        status.textContent = "The video could not load. Poster is displayed.";
    };
    video.addEventListener("error", showError, { signal });
    video
      .querySelector("source")
      ?.addEventListener("error", showError, { signal });
  }

  // Calculate and draw dynamic rope curve connecting the ceiling anchor to the card clip
  const updateRope = (progress = 0) => {
    const stageRect = stage.getBoundingClientRect();
    if (!stageRect.width || !stageRect.height) return;

    const anchorRect = anchor.getBoundingClientRect();
    const clipRect = clip.getBoundingClientRect();

    // Start point at anchor center
    const startX = anchorRect.left + anchorRect.width / 2 - stageRect.left;
    const startY = anchorRect.top + anchorRect.height * 0.7 - stageRect.top;

    // End point at clip ring center
    const endX = clipRect.left + clipRect.width / 2 - stageRect.left;
    const endY = clipRect.top + clipRect.height * 0.45 - stageRect.top;

    const dx = endX - startX;
    const dy = endY - startY;
    const p = Math.max(0, Math.min(1, progress));
    const slack = 1 - p;

    // Organic catenary curve when slack, taut pull when revealed
    const cp1X = startX + dx * 0.12;
    const cp1Y = startY + dy * (0.38 + 0.18 * slack);

    const cp2X = endX - dx * (0.22 * slack);
    const cp2Y = endY - dy * (0.34 + 0.14 * slack);

    const pathData = `M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${cp1X.toFixed(1)} ${cp1Y.toFixed(1)}, ${cp2X.toFixed(1)} ${cp2Y.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`;

    if (ropeShadow) ropeShadow.setAttribute("d", pathData);
    if (ropeMain) ropeMain.setAttribute("d", pathData);
    if (ropeHighlight) ropeHighlight.setAttribute("d", pathData);
  };

  const media = gsap.matchMedia();

  media.add(
    {
      desktop: "(min-width: 769px)",
      mobile: "(max-width: 768px)",
      reduced: "(prefers-reduced-motion: reduce)",
    },
    (context) => {
      const { reduced, mobile } = context.conditions;

      if (reduced) {
        gsap.set(card, {
          y: 0,
          x: 0,
          rotationZ: 0,
          rotationX: 0,
          scale: 1,
          opacity: 1,
        });
        updateRope(1);
        return;
      }

      const cfg = mobile ? videoRevealConfig.mobile : videoRevealConfig.desktop;
      const rise = cfg?.rise ?? (mobile ? 120 : 240);
      const rotZ = cfg?.rotation ?? (mobile ? -3.5 : -7);
      const rotX = mobile ? 6 : 10;
      const initScale = cfg?.scale ?? (mobile ? 0.82 : 0.74);
      const initX = mobile ? -15 : -35;

      // Set initial suspended pose
      gsap.set(card, {
        y: rise,
        x: initX,
        rotationZ: rotZ,
        rotationX: rotX,
        scale: initScale,
        opacity: 0.75,
      });

      // Draw initial rope
      const ropeFrame = requestAnimationFrame(() => updateRope(0));

      const tl = gsap.timeline({
        onUpdate: () => updateRope(tl.progress()),
        scrollTrigger: {
          id: "route:home-video-reveal",
          trigger: section,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * (mobile ? 0.95 : 1.25))}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.85,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: self => updateRope(self.animation?.progress() || 0),
          onUpdate: (self) => {

            if (video) {
              if (self.progress > 0.12 && video.paused) {
                video.play().catch(() => {});
              } else if (self.progress <= 0.08 && !video.paused) {
                video.pause();
              }
            }
          },
        },
      });

      tl.to(
        card,
        {
          y: 0,
          x: 0,
          rotationZ: 0,
          rotationX: 0,
          scale: 1,
          opacity: 1,
          ease: "power2.out",
          duration: 1,
        },
        0,
      );
      return () => cancelAnimationFrame(ropeFrame);
    },
  );

  // Resize listener to re-align rope geometry on viewport change
  const onResize = () => {
    const trigger = ScrollTrigger.getById("route:home-video-reveal");
    const progress = trigger ? trigger.animation.progress() : 1;
    updateRope(progress);
  };
  window.addEventListener("resize", onResize, { passive: true, signal });

  // Pause video if section leaves viewport
  let observer;
  if (video) {
    observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting && !video.paused) {
        video.pause();
      }
    });
    observer.observe(section);
  }

  // Register clean teardown for route transitions
  trackDisposer(() => {
    media.revert();
    controller.abort();
    observer?.disconnect();
    if (video) video.pause();
  });
}
