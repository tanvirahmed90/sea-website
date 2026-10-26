/**
 * Bioluminescent fluid custom cursor:
 * Outer glowing ring with fluid lag lerp, inner specular core,
 * and magnetic hover states.
 */

export class CustomCursor {
  constructor() {
    this.cursorEl = null;
    this.dotEl = null;
    this.ringEl = null;

    this.mouse = { x: -100, y: -100 };
    this.pos = { x: -100, y: -100 };
    this.isHovering = false;
    this.isVisible = false;
    this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (!this.isTouch) {
      this.init();
    }
  }

  init() {
    this.cursorEl = document.createElement('div');
    this.cursorEl.className = 'custom-cursor-container';
    this.cursorEl.innerHTML = `
      <div class="cursor-glow"></div>
      <div class="cursor-ring"></div>
      <div class="cursor-dot"></div>
    `;
    document.body.appendChild(this.cursorEl);

    this.ringEl = this.cursorEl.querySelector('.cursor-ring');
    this.dotEl = this.cursorEl.querySelector('.cursor-dot');

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      if (!this.isVisible) {
        this.isVisible = true;
        this.cursorEl.classList.add('visible');
      }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      this.isVisible = false;
      this.cursorEl.classList.remove('visible');
    });

    document.addEventListener('mouseenter', () => {
      this.isVisible = true;
      this.cursorEl.classList.add('visible');
    });

    // Hover detection for interactive elements
    const interactiveSelectors = 'a, button, input, textarea, .project-card, .btn, .nav-link, .zone-marker';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interactiveSelectors)) {
        this.cursorEl.classList.add('cursor-hover');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(interactiveSelectors)) {
        this.cursorEl.classList.remove('cursor-hover');
      }
    });

    this.render();
  }

  render() {
    if (!this.isTouch) {
      // Lerp ring towards mouse
      const ease = 0.18;
      this.pos.x += (this.mouse.x - this.pos.x) * ease;
      this.pos.y += (this.mouse.y - this.pos.y) * ease;

      if (this.cursorEl) {
        this.cursorEl.style.transform = `translate3d(${this.pos.x}px, ${this.pos.y}px, 0)`;
      }

      requestAnimationFrame(() => this.render());
    }
  }
}
