import gsap from 'gsap';

export function initCardEffects() {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cards = document.querySelectorAll('.service-card, .service-row, .process-card, .campaign-card, .value-card, .work-card, .team-member, .signal-card, .info-block');
  
  cards.forEach(card => {
    if (card.dataset.cardEffectsManaged === "true") return;
    card.dataset.cardEffectsManaged = "true";
    card.style.willChange = 'transform';
    card.style.transformStyle = 'preserve-3d';
    
    // Add glare element
    const glare = document.createElement('div');
    glare.className = 'card-glare';
    Object.assign(glare.style, {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      opacity: 0,
      background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)',
      transition: 'opacity 0.3s ease',
      zIndex: 2,
      borderRadius: 'inherit' // match card border radius
    });
    card.style.position = card.style.position === 'static' ? 'relative' : card.style.position;
    if (!card.querySelector(".card-glare")) {
      card.appendChild(glare);
    }

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within the element.
      const y = e.clientY - rect.top;  // y position within the element.
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const normalizedX = (x - centerX) / centerX; // -1 to 1
      const normalizedY = (y - centerY) / centerY; // -1 to 1
      
      gsap.to(card, {
        rotationX: -normalizedY * 8,
        rotationY: normalizedX * 8,
        transformPerspective: 800,
        ease: 'power1.out',
        duration: 0.5
      });
      
      gsap.to(glare, {
        opacity: 1,
        background: `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.15) 0%, transparent 60%)`,
        duration: 0.1
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotationX: 0,
        rotationY: 0,
        ease: 'power3.out',
        duration: 0.8
      });
      
      gsap.to(glare, {
        opacity: 0,
        duration: 0.5
      });
    });
  });
}
