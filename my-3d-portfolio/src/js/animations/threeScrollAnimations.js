import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createRouteTrigger, prefersReducedMotion, trackAnimation } from "../utils/animationRegistry.js";

gsap.registerPlugin(ScrollTrigger);

const sectionStates = [
  { selector: ".hero", state: "home", distortion: 0.8, bloom: 1.05, color: "#080d18" },
  { selector: ".intro-section, .journey, .philosophy-section", state: "about", distortion: 1.25, bloom: 0.82, color: "#10182a" },
  { selector: ".services-section, .services, .campaign-stack", state: "services", distortion: 1.65, bloom: 0.95, color: "#2b1430" },
  { selector: ".work-section", state: "work", distortion: 1.05, bloom: 0.62, color: "#102234" },
  { selector: ".case-section", state: "work", distortion: 1.85, bloom: 0.72, color: "#241a36" },
  { selector: ".process-section, .growth-lab, .process", state: "process", distortion: 1.45, bloom: 0.74, color: "#162a28" },
  { selector: ".cta-section, .contact-section, .footer", state: "contact", distortion: 1.1, bloom: 0.88, color: "#24162b" },
];

export function initThreeScrollAnimations(threeScene, sceneController = null) {
  if (!threeScene?.liquidBackground || prefersReducedMotion()) {
    return;
  }

  const uniforms = threeScene.liquidBackground.material.uniforms;
  const baseColor = uniforms.uColorB.value.clone();

  sectionStates.forEach(({ selector, state, distortion, bloom, color }) => {
    const target = document.querySelector(selector);
    if (!target) return;

    const targetColor = gsap.utils.splitColor(color).map((v) => v / 255);

    createRouteTrigger({
      id: `route:three-section-${state}`,
      trigger: target,
      start: "top 62%",
      end: "bottom 38%",
      onEnter: () => sceneController?.setState(state),
      onEnterBack: () => sceneController?.setState(state),
    });

    trackAnimation(
      gsap.to(uniforms.uDistortion, {
        value: distortion,
        ease: "none",
        scrollTrigger: {
          id: `route:three-distortion-${state}`,
          trigger: target,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      }),
    );

    trackAnimation(
      gsap.to(uniforms.uColorB.value, {
        r: targetColor[0],
        g: targetColor[1],
        b: targetColor[2],
        ease: "none",
        scrollTrigger: {
          id: `route:three-color-${state}`,
          trigger: target,
          start: "top bottom",
          end: "top center",
          scrub: 1,
          onLeaveBack: () => {
            gsap.to(uniforms.uColorB.value, {
              r: baseColor.r,
              g: baseColor.g,
              b: baseColor.b,
              duration: 0.5,
              ease: "power2.out",
            });
          },
        },
      }),
    );

    if (threeScene.postProcessing?.bloomPass) {
      trackAnimation(
        gsap.to(threeScene.postProcessing.bloomPass, {
          strength: bloom,
          ease: "none",
          scrollTrigger: {
            id: `route:three-bloom-${state}`,
            trigger: target,
            start: "top center",
            end: "bottom center",
            scrub: 1,
          },
        }),
      );
    }

    createRouteTrigger({
      id: `route:three-pulse-${state}`,
      trigger: target,
      start: "top 72%",
      onEnter: () => pulseChromatic(threeScene),
      onEnterBack: () => pulseChromatic(threeScene),
    });
  });
}

function pulseChromatic(threeScene) {
  if (!threeScene.postProcessing?.setChromaticOffset) return;

  threeScene.postProcessing.setChromaticOffset(0.01);
  const proxy = { val: 0.01 };
  gsap.to(proxy, {
    val: 0.003,
    duration: 1,
    ease: "power2.out",
    onUpdate: () => threeScene.postProcessing.setChromaticOffset(proxy.val),
  });
}

