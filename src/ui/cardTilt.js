/**
 * Interactive 3D Perspective Card Tilt
 * Computes mouse coordinate relative to card bounding box,
 * applying subtle 3D rotational transforms and glare highlights.
 */

export class CardTiltSystem {
  constructor(cardsSelector = '.project-card') {
    this.cards = document.querySelectorAll(cardsSelector);
    this.init();
  }

  init() {
    this.cards.forEach(card => {
      // Add specular glare overlay
      const glare = document.createElement('div');
      glare.className = 'card-glare';
      card.appendChild(glare);

      const handleMove = (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -9; // Max 9 deg
        const rotateY = ((x - centerX) / centerX) * 9;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(8px)`;

        // Specular highlight angle
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;
        glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 65%)`;
        glare.style.opacity = '1';
      };

      const handleLeave = () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
        glare.style.opacity = '0';
      };

      card.addEventListener('mousemove', handleMove);
      card.addEventListener('mouseleave', handleLeave);
    });
  }
}
