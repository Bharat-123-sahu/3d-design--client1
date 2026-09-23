import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initGlitchText() {
  const titles = document.querySelectorAll('.section-title, .hero__title');
  titles.forEach(t => t.classList.add('glitch-text'));

  const glitchElements = document.querySelectorAll('.glitch-text');

  glitchElements.forEach(el => {
    // Set data-text for pseudo-elements
    el.setAttribute('data-text', el.innerText);

    const triggerGlitch = () => {
      if (el.classList.contains('is-glitching')) return;
      el.classList.add('is-glitching');
      el.classList.add('glitch-text--active');

      const tl = gsap.timeline({
        onComplete: () => {
          el.classList.remove('is-glitching');
          el.classList.remove('glitch-text--active');
          gsap.set(el, { x: 0, y: 0, skewX: 0, opacity: 1 });
        }
      });

      tl.to(el, { x: 2, y: -1, skewX: 3, opacity: 0.8, duration: 0.05 })
        .to(el, { x: -3, y: 2, skewX: -5, opacity: 0.9, duration: 0.05 })
        .to(el, { x: 1, y: -2, skewX: 2, opacity: 1, duration: 0.05 })
        .to(el, { x: -2, y: 1, skewX: -2, opacity: 0.85, duration: 0.05 })
        .to(el, { x: 0, y: 0, skewX: 0, opacity: 1, duration: 0.1 });
    };

    el.addEventListener('mouseenter', triggerGlitch);

    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: triggerGlitch
    });
  });
}
