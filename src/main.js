/**
 * =========================================================================
 * TANVIR — OCEAN DESCENT (BRAND & VISUAL STORYTELLING STUDIO)
 * 
 * CONFIGURATION PARAMETERS (Easy to tune right here):
 * =========================================================================
 */
export const FISH_COUNT = 28;                 // Number of glowing orange/gold fish in main school
export const FISH_SPEED = 2.6;                // Cruising speed of schooling fish (pixels/frame)
export const FISH_SEPARATION = 36;            // Separation distance between fish
export const FISH_ALIGNMENT = 70;             // Alignment sensing radius
export const FISH_COHESION = 90;              // Cohesion sensing radius
export const MOUSE_SCATTER_SENSITIVITY = 10;  // Mouse speed threshold to scatter fish
export const MAX_OCEAN_DEPTH = 3850;          // Maximum depth in meters (Abyssal Trench)

import { OceanScene } from './simulation/OceanScene.js';
import { DepthIndicator } from './ui/depthIndicator.js';
import { CustomCursor } from './ui/customCursor.js';
import { CardTiltSystem } from './ui/cardTilt.js';
import { audioSystem } from './audio/underwaterAudio.js';
import Lenis from 'lenis';

class TanvirApp {
  constructor() {
    this.lenis = null;
    this.oceanScene = null;
    this.depthIndicator = null;
    this.cursor = null;
    this.cardTilt = null;

    this.depthRatio = 0;
    this.init();
  }

  async init() {
    // 1. Initialize Loading Screen
    this.handleLoadingScreen();

    // 2. Initialize Custom Cursor
    this.cursor = new CustomCursor();

    // 3. Initialize Ocean Canvas Simulator
    const canvas = document.getElementById('ocean-canvas');
    this.oceanScene = new OceanScene(canvas);
    const heroAperture = document.getElementById('hero-aperture');
    if (heroAperture) {
      this.oceanScene.setHeroAperture(heroAperture);
    }
    this.oceanScene.start();

    // 4. Initialize Smooth Scroll with Lenis
    this.setupSmoothScroll();

    // 5. Initialize Depth HUD Telemetry
    const depthMount = document.getElementById('depth-hud-mount');
    if (depthMount) {
      this.depthIndicator = new DepthIndicator(depthMount, (zoneKey) => {
        this.scrollToZone(zoneKey);
      });
    }

    // 6. Initialize 3D Card Tilt for Projects
    this.cardTilt = new CardTiltSystem('.project-card');

    // 7. Setup Interactive Triggers, Audio, Form & Menu
    this.setupInteractivity();
    this.setupScrollTriggers();
    this.setupAudio();
  }

  handleLoadingScreen() {
    const loaderScreen = document.getElementById('loader-screen');
    const loaderBar = document.getElementById('loader-bar');
    const loaderPercent = document.getElementById('loader-percent');
    const loaderStatus = document.getElementById('loader-status');

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 4;
      if (progress > 100) progress = 100;

      if (loaderBar) loaderBar.style.width = `${progress}%`;
      if (loaderPercent) loaderPercent.textContent = `${progress}%`;

      if (progress >= 100) {
        clearInterval(interval);
        if (loaderStatus) loaderStatus.textContent = 'SURFACE REACHED';
        setTimeout(() => {
          if (loaderScreen) loaderScreen.classList.add('hidden');
          // Trigger hero elements fade in
          document.querySelectorAll('.hero-section .reveal-fade').forEach(el => {
            el.classList.add('is-revealed');
          });
        }, 400);
      }
    }, 45);
  }

  setupSmoothScroll() {
    this.lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.8
    });

    const raf = (time) => {
      this.lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    // Scroll listener
    this.lenis.on('scroll', (e) => {
      this.onScroll(e.scroll, e.limit);
    });
  }

  onScroll(scroll, limit) {
    const totalHeight = limit || (document.documentElement.scrollHeight - window.innerHeight);
    this.depthRatio = totalHeight > 0 ? Math.max(0, Math.min(1, scroll / totalHeight)) : 0;

    // 1. Update Ocean Canvas Simulation depth
    if (this.oceanScene) {
      this.oceanScene.setDepthRatio(this.depthRatio);
    }

    // 2. Update Depth Telemetry HUD
    if (this.depthIndicator) {
      this.depthIndicator.update(this.depthRatio);
    }

    // 3. Update Audio Low-pass filter for water pressure
    audioSystem.updateDepth(this.depthRatio);

    // 4. Update Backdrop Dynamic Gradient Color
    this.updateOceanBackdrop(this.depthRatio);

    // 5. Update Navbar transparency
    const navbar = document.getElementById('navbar');
    if (navbar) {
      if (scroll > 60) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
  }

  updateOceanBackdrop(ratio) {
    const backdrop = document.getElementById('ocean-backdrop');
    if (!backdrop) return;

    // Smooth gradient transitions from surface teal to abyssal darkness:
    // 0.0: Surface (Teal & Cyan sunlight shafts)
    // 0.25: Mesopelagic (Deep oceanic blue)
    // 0.55: Twilight (Midnight indigo)
    // 0.8+: Abyssal Floor (Near pitch black with faint deep vent glow)
    let c1, c2, c3;
    if (ratio < 0.2) {
      // Surface
      c1 = '#0f5468';
      c2 = '#062b3a';
      c3 = '#020812';
    } else if (ratio < 0.5) {
      // Midwater / Studio
      c1 = '#093648';
      c2 = '#041c2a';
      c3 = '#020812';
    } else if (ratio < 0.75) {
      // Twilight / Projects
      c1 = '#051f33';
      c2 = '#031220';
      c3 = '#01060e';
    } else {
      // Midnight / Abyss / Seabed
      c1 = '#020f1c';
      c2 = '#010914';
      c3 = '#010307';
    }

    const lightPos = Math.max(5, 75 - ratio * 50);
    backdrop.style.background = `radial-gradient(circle at ${lightPos}% 15%, ${c1} 0%, ${c2} 40%, ${c3} 85%)`;
  }

  setupScrollTriggers() {
    // Reveal text sections gracefully as user scrolls
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.reveal-fade').forEach(el => {
      observer.observe(el);
    });
  }

  setupInteractivity() {
    // 1. Navigation anchor links smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        const targetEl = document.querySelector(targetId);
        if (targetEl && this.lenis) {
          this.lenis.scrollTo(targetEl, { offset: -60 });
        }
        // Close mobile nav if open
        const navMenu = document.getElementById('nav-menu');
        if (navMenu) navMenu.classList.remove('open');
      });
    });

    // 2. Fish gathering behavior on button hover!
    // As requested: "with the fish gathering near the button when hovered"
    const dispatchBtn = document.getElementById('btn-dispatch-cta');
    const talkNavBtn = document.getElementById('nav-cta-btn');

    const attachGatherEvent = (btn) => {
      if (!btn) return;
      btn.addEventListener('mouseenter', () => {
        const rect = btn.getBoundingClientRect();
        this.oceanScene.setGatherTarget({
          x: rect.left + rect.width * 0.5,
          y: rect.top + rect.height * 0.5
        });
      });

      btn.addEventListener('mouseleave', () => {
        this.oceanScene.setGatherTarget(null);
      });
    };

    attachGatherEvent(dispatchBtn);
    attachGatherEvent(talkNavBtn);

    // 3. Mobile Navigation Menu Toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (mobileToggle && navMenu) {
      mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('open');
      });
    }

    // 4. Contact Form Submission
    const contactForm = document.getElementById('contact-form');
    const toast = document.getElementById('ocean-toast');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Play acoustic ping if audio is running
        audioSystem.triggerBubblePing();

        // Show toast
        if (toast) {
          toast.classList.add('show');
          setTimeout(() => {
            toast.classList.remove('show');
          }, 4500);
        }

        contactForm.reset();
      });
    }
  }

  setupAudio() {
    const audioBtn = document.getElementById('audio-btn');
    const audioLabel = document.getElementById('audio-label');

    if (!audioBtn) return;

    audioBtn.addEventListener('click', async () => {
      const isPlaying = await audioSystem.toggle();
      if (isPlaying) {
        audioBtn.classList.add('is-playing');
        if (audioLabel) audioLabel.textContent = 'SOUND ON';
      } else {
        audioBtn.classList.remove('is-playing');
        if (audioLabel) audioLabel.textContent = 'SOUND OFF';
      }
    });
  }

  scrollToZone(zoneKey) {
    let targetSectionId = '#hero';
    if (zoneKey === 'surface') targetSectionId = '#hero';
    else if (zoneKey === 'twilight') targetSectionId = '#studio';
    else if (zoneKey === 'midnight') targetSectionId = '#process';
    else if (zoneKey === 'abyss') targetSectionId = '#contact';

    const targetEl = document.querySelector(targetSectionId);
    if (targetEl && this.lenis) {
      this.lenis.scrollTo(targetEl, { offset: -40 });
    }
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new TanvirApp();
});
