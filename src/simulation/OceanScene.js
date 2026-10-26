/**
 * Fixed Fullscreen Ocean Canvas Scene Orchestrator.
 * Handles boid flocking, mouse velocity detection (scatter/regroup),
 * depth-based fauna transitions, and 60fps rendering.
 */

import { CONFIG } from '../config.js';
import { Vector2D, FishBoid } from './Boid.js';
import { MantaRay, BioluminescentJellyfish, DeepSeaAnglerfish, BenthicPlankton } from './Creatures.js';
import { BubbleSystem, MarineSnowSystem, HeroCausticsBeam } from './BubblesParticles.js';

export class OceanScene {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');

    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.depthRatio = 0; // 0 (surface) to 1 (seabed)
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Mouse & Touch Tracking
    this.mouse = {
      pos: new Vector2D(this.width * 0.72, this.height * 0.4),
      prevPos: new Vector2D(this.width * 0.72, this.height * 0.4),
      speed: 0,
      active: false,
      lastMoveTime: Date.now()
    };
    this.isScattering = false;
    this.scatterTimer = null;
    this.gatherTarget = null; // Specific element pos (e.g. CTA button)

    // Hero skylight opening DOM reference
    this.heroApertureEl = null;

    // Simulation components
    this.orangeFish = [];
    this.silverFish = [];
    this.manta = null;
    this.jellyfish = [];
    this.angler = null;
    this.plankton = null;
    this.bubbles = null;
    this.marineSnow = null;
    this.causticsBeam = null;

    this.rafId = null;
    this.init();
  }

  init() {
    this.resize();

    // 1. Primary school of orange/gold glowing fish inside the light beam
    const fishCount = this.reducedMotion ? Math.floor(CONFIG.FISH_COUNT * 0.5) : CONFIG.FISH_COUNT;
    const initialCenterX = this.width * 0.76;
    const initialCenterY = this.height * 0.45;

    for (let i = 0; i < fishCount; i++) {
      const offsetX = (Math.random() - 0.5) * 140;
      const offsetY = (Math.random() - 0.5) * 220;
      this.orangeFish.push(new FishBoid(initialCenterX + offsetX, initialCenterY + offsetY, 'orange'));
    }

    // 2. Mid-water silver-blue fish
    const silverCount = this.reducedMotion ? 5 : CONFIG.MIDWATER_FISH_COUNT;
    for (let i = 0; i < silverCount; i++) {
      this.silverFish.push(new FishBoid(Math.random() * this.width, Math.random() * this.height, 'silver'));
    }

    // 3. Deep sea creatures
    this.manta = new MantaRay(this.width, this.height);
    for (let i = 0; i < (this.reducedMotion ? 3 : CONFIG.JELLYFISH_COUNT); i++) {
      this.jellyfish.push(new BioluminescentJellyfish(this.width, this.height));
    }
    this.angler = new DeepSeaAnglerfish(this.width, this.height);
    this.plankton = new BenthicPlankton(this.width, this.height);

    // 4. Environmental layers
    this.bubbles = new BubbleSystem(this.width, this.height);
    this.marineSnow = new MarineSnowSystem(this.width, this.height);
    this.causticsBeam = new HeroCausticsBeam();

    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.resize(), { passive: true });

    // Mouse movement with velocity calculation
    const handlePointerMove = (clientX, clientY) => {
      this.mouse.active = true;
      this.mouse.lastMoveTime = Date.now();

      const dx = clientX - this.mouse.pos.x;
      const dy = clientY - this.mouse.pos.y;
      this.mouse.speed = Math.sqrt(dx * dx + dy * dy);

      this.mouse.prevPos.set(this.mouse.pos.x, this.mouse.pos.y);
      this.mouse.pos.set(clientX, clientY);

      // Fast mouse movement triggers fish scatter!
      if (this.mouse.speed > CONFIG.MOUSE_SCATTER_SPEED_THRESHOLD) {
        this.isScattering = true;
        clearTimeout(this.scatterTimer);
        this.scatterTimer = setTimeout(() => {
          this.isScattering = false;
        }, 600);
      }
    };

    window.addEventListener('mousemove', (e) => handlePointerMove(e.clientX, e.clientY), { passive: true });

    // Touch support
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      this.mouse.active = false;
    });

    // Check motion preference change
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.reducedMotion = e.matches;
    });
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.resetTransform();
    this.ctx.scale(this.dpr, this.dpr);
  }

  setHeroAperture(element) {
    this.heroApertureEl = element;
  }

  setGatherTarget(pointOrNull) {
    this.gatherTarget = pointOrNull ? new Vector2D(pointOrNull.x, pointOrNull.y) : null;
  }

  setDepthRatio(ratio) {
    this.depthRatio = Math.max(0, Math.min(1, ratio));
  }

  start() {
    if (!this.rafId) {
      this.render();
    }
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  render() {
    this.rafId = requestAnimationFrame(() => this.render());

    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    const now = Date.now();
    const isMouseIdle = now - this.mouse.lastMoveTime > CONFIG.MOUSE_IDLE_TIMEOUT;

    // --- 1. Draw Hero Volumetric Beams & Shimmering Caustics ---
    let heroRect = null;
    if (this.heroApertureEl) {
      heroRect = this.heroApertureEl.getBoundingClientRect();
    }
    this.causticsBeam.update();
    this.causticsBeam.draw(this.ctx, this.width, this.height, this.depthRatio, heroRect);

    // --- 2. Marine Snow & Particles ---
    this.marineSnow.update(this.width, this.height);
    this.marineSnow.draw(this.ctx, this.depthRatio);

    // --- 3. Manta Ray (Midwater zone) ---
    this.manta.update(this.width, this.height, this.depthRatio);
    this.manta.draw(this.ctx);

    // --- 4. Midwater Silver Fish ---
    const silverVisibility = (this.depthRatio >= 0.1 && this.depthRatio <= 0.65) ? 1.0 : 0.0;
    for (let fish of this.silverFish) {
      fish.opacity += (silverVisibility - fish.opacity) * 0.05;
      if (fish.opacity > 0.01) {
        fish.flock(this.silverFish);
        fish.wander();
        fish.update(this.width, this.height);
        fish.draw(this.ctx);
      }
    }

    // --- 5. Bioluminescent Jellyfish (Twilight / Midnight) ---
    for (let jelly of this.jellyfish) {
      jelly.update(this.width, this.height, this.depthRatio);
      jelly.draw(this.ctx);
    }

    // --- 6. Deep Sea Anglerfish (Midnight / Abyss) ---
    this.angler.update(this.width, this.height, this.depthRatio);
    this.angler.draw(this.ctx);

    // --- 7. Benthic Plankton (Seabed floor) ---
    this.plankton.update(this.width, this.height, this.depthRatio);
    this.plankton.draw(this.ctx, this.depthRatio);

    // --- 8. Primary Orange/Gold Fish Flocking (Hero & Seabed Button Gathering) ---
    // In middle zones, orange fish disperse slightly or swim subtly behind project cards;
    // they reappear strongly in hero and gather around the contact button at the seabed!
    const orangeVisibility = (this.depthRatio < 0.25 || this.depthRatio > 0.75) 
      ? 1.0 
      : (0.35 + 0.15 * Math.sin(now * 0.001));

    for (let fish of this.orangeFish) {
      fish.opacity += (orangeVisibility - fish.opacity) * 0.08;

      // Flocking rules
      fish.flock(this.orangeFish);

      if (this.gatherTarget) {
        // Special button gathering mode!
        fish.flockToTarget(this.gatherTarget, 55);
      } else if (this.isScattering) {
        // Mouse scattering
        fish.interactWithMouse(this.mouse, true, 1.2);
      } else if (this.mouse.active && !isMouseIdle) {
        // Gentle cursor attraction
        fish.interactWithMouse(this.mouse, false);
      } else {
        // Lazy wandering loops when idle or naturally swimming inside hero light beam
        if (this.depthRatio < 0.22) {
          const lightbeamCenter = new Vector2D(this.width * 0.76, this.height * 0.46);
          fish.flockToTarget(lightbeamCenter, 130);
        } else {
          fish.wander();
        }
      }

      fish.update(this.width, this.height);
      fish.draw(this.ctx);
    }

    // --- 9. Rising Bubbles ---
    this.bubbles.update(this.width, this.height, this.depthRatio);
    this.bubbles.draw(this.ctx, this.depthRatio);
  }
}
