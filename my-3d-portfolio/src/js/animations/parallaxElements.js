import { prefersReducedMotion } from "../utils/animationRegistry.js";
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initParallaxElements() {
  if (prefersReducedMotion() || matchMedia("(pointer: coarse)").matches) return;
  const parallaxFloats = document.querySelectorAll('.parallax-float');
  
  parallaxFloats.forEach(el => {
    const speed = el.dataset.speed || 0.1;
    gsap.to(el, {
      y: () => -100 * speed,
      rotationX: 10,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true
      }
    });
  });

  const containers = document.querySelectorAll('.parallax-container');
  const colors = ['var(--cyan)', 'var(--rose)', 'var(--lime)', 'var(--amber)'];
  const types = ['circle', 'triangle', 'cross', 'diamond'];

  containers.forEach(container => {
    const shapeCount = Math.floor(Math.random() * 4) + 5; // 5-8 shapes
    
    for (let i = 0; i < shapeCount; i++) {
      const shape = document.createElement('div');
      const type = types[Math.floor(Math.random() * types.length)];
      shape.classList.add('parallax-shape', `parallax-shape--${type}`);
      
      const size = Math.random() * 32 + 8;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      shape.style.left = `calc(${Math.random() * 90}% + 8px)`;
      shape.style.top = `calc(${Math.random() * 90}% + 8px)`;
      shape.style.color = color; // For currentColor usage
      
      if (type !== 'triangle' && type !== 'cross') {
        shape.style.width = `${size}px`;
        shape.style.height = `${size}px`;
      } else if (type === 'triangle') {
        shape.style.borderLeft = `${size/2}px solid transparent`;
        shape.style.borderRight = `${size/2}px solid transparent`;
        shape.style.borderBottom = `${size}px solid ${color}`;
      } else if (type === 'cross') {
        shape.style.setProperty('--cross-size', `${size}px`);
      }
      
      container.appendChild(shape);
    }
  });

  const parallaxShapes = document.querySelectorAll('.parallax-shape');
  
  parallaxShapes.forEach(shape => {
    const duration = Math.random() * 3 + 3; // 3-6s
    const yOffset = Math.random() * 10 + 15; // ~20px amplitude
    const rot = Math.random() * 360;
    
    gsap.to(shape, {
      y: `+=${yOffset}`,
      yoyo: true,
      repeat: -1,
      duration: duration,
      ease: 'sine.inOut'
    });
    
    gsap.to(shape, {
      rotation: `+=${rot}`,
      repeat: -1,
      duration: duration * 2,
      ease: 'none'
    });
    
    gsap.to(shape, {
      opacity: 0.7,
      yoyo: true,
      repeat: -1,
      duration: duration * 1.5,
      ease: 'sine.inOut'
    });
  });
}
