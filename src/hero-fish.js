/**
 * =========================================================================
 * FOLDCRAFT — HERO CANVAS 2D TROPICAL ANGELFISH BOIDS
 * High-fidelity tropical Angelfish matching user reference:
 * - Royal Cobalt Blue, Neon Magenta, Electric Turquoise & Sunburst variants
 * - Fluid cruising momentum with biological surge-and-glide tail strokes
 * - Wide organic flocking paths across the sunlit water column
 * - Natural mouse attraction, fast scatter & smooth regrouping
 * =========================================================================
 */

// =========================================================================
// CONFIGURATION CONSTANTS (Easily tunable)
// =========================================================================
export const FISH_COUNT = 24;               // Number of tropical angelfish inside the beam
export const FISH_SPEED = 2.4;              // Natural cruising speed (pixels per frame)
export const MOUSE_ATTRACT_FORCE = 0.04;    // Attraction strength towards cursor
export const MOUSE_SCATTER_FORCE = 3.6;     // Radial repulsion strength on fast mouse
export const MOUSE_SCATTER_THRESHOLD = 9;   // Mouse speed threshold to trigger scatter
export const MOUSE_IDLE_DELAY = 1800;       // Idle timeout in ms before returning to beam loops
export const DUST_PARTICLE_COUNT = 45;      // Floating sunlit dust motes inside the beam

// 2D Vector Class
class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  set(x, y) { this.x = x; this.y = y; return this; }
  add(v) { this.x += v.x; this.y += v.y; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; return this; }
  mult(n) { this.x *= n; this.y *= n; return this; }
  div(n) { if (n !== 0) { this.x /= n; this.y /= n; } return this; }
  magSq() { return this.x * this.x + this.y * this.y; }
  mag() { return Math.sqrt(this.magSq()); }
  heading() { return Math.atan2(this.y, this.x); }
  normalize() { const m = this.mag(); if (m !== 0) this.div(m); return this; }
  limit(max) {
    const mSq = this.magSq();
    if (mSq > max * max) { this.div(Math.sqrt(mSq)).mult(max); }
    return this;
  }
  dist(v) { return Math.hypot(this.x - v.x, this.y - v.y); }
  copy() { return new Vector(this.x, this.y); }
}

// Tropical Angelfish Boid
class AngelfishBoid {
  constructor(x, y, spriteImg, typeIndex) {
    this.pos = new Vector(x, y);
    const initialAngle = (Math.random() - 0.5) * Math.PI * 0.8 + Math.PI * 0.1; // Gentle diagonal downward/upward heading
    this.vel = new Vector(Math.cos(initialAngle), Math.sin(initialAngle)).mult(FISH_SPEED);
    this.acc = new Vector(0, 0);

    this.sprite = spriteImg;
    this.typeIndex = typeIndex;

    // Depth Layering: 0.65x to 1.15x
    this.depth = Math.random(); // 0 = far, 1 = near
    this.scale = 0.65 + this.depth * 0.5;
    this.baseW = 85 * this.scale;
    this.baseH = 55 * this.scale;

    this.maxSpeed = FISH_SPEED * (0.85 + Math.random() * 0.3) * (0.85 + this.depth * 0.25);
    this.maxForce = 0.075 * (0.9 + this.depth * 0.3);

    this.currentHeading = this.vel.heading();
    this.phase = Math.random() * Math.PI * 2;
    this.wiggleSpeed = 0.18 + Math.random() * 0.06;
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.scatterDuration = 0;
  }

  applyForce(f) {
    this.acc.add(f);
  }

  flock(boids, width, height, mouse, isScattering, isMouseIdle) {
    const sep = new Vector(0, 0);
    const ali = new Vector(0, 0);
    const coh = new Vector(0, 0);
    let sepCount = 0;
    let neighborCount = 0;

    // Spatial perception radii
    const desiredSep = 46 * this.scale;
    const neighborDist = 120 * this.scale;

    for (let other of boids) {
      if (other === this) continue;
      const d = this.pos.dist(other.pos);

      // Separation: gently avoid crowding
      if (d > 0 && d < desiredSep) {
        const diff = this.pos.copy().sub(other.pos).normalize().div(d);
        sep.add(diff);
        sepCount++;
      }

      // Alignment & Cohesion: swim harmoniously as a loose school
      if (d > 0 && d < neighborDist) {
        ali.add(other.vel);
        coh.add(other.pos);
        neighborCount++;
      }
    }

    if (sepCount > 0) {
      sep.div(sepCount).normalize().mult(this.maxSpeed).sub(this.vel).limit(this.maxForce * 1.2);
      sep.mult(1.1);
      this.applyForce(sep);
    }

    if (neighborCount > 0) {
      ali.div(neighborCount).normalize().mult(this.maxSpeed).sub(this.vel).limit(this.maxForce * 0.85);
      this.applyForce(ali);

      coh.div(neighborCount);
      const cohForce = this.seek(coh);
      cohForce.limit(this.maxForce * 0.7);
      this.applyForce(cohForce);
    }

    // --- Mouse Interaction ---
    if (mouse.active && !isMouseIdle) {
      const d = this.pos.dist(mouse.pos);
      if (isScattering) {
        // Fast cursor: burst scatter impulse radiating away
        if (d < 300) {
          const repulse = this.pos.copy().sub(mouse.pos).normalize();
          const strength = (1 - d / 300) * MOUSE_SCATTER_FORCE;
          repulse.mult(strength);
          this.applyForce(repulse);
        }
      } else {
        // Gentle cursor attraction with smooth circling
        if (d > 60 && d < 700) {
          const seekMouse = this.seek(mouse.pos);
          const factor = (1 - d / 700) * MOUSE_ATTRACT_FORCE * 20;
          seekMouse.mult(factor);
          this.applyForce(seekMouse);
        } else if (d <= 60) {
          // Circle gracefully around cursor when very close
          const toMouse = mouse.pos.copy().sub(this.pos);
          const tangent = new Vector(-toMouse.y, toMouse.x).normalize();
          this.applyForce(tangent.mult(this.maxForce * 0.8));
        }
      }
    } else {
      // Natural Oceanic Wandering & Light Beam Affinity
      this.wanderNatural(width, height);
    }
  }

  seek(target) {
    const desired = target.copy().sub(this.pos);
    const d = desired.mag();
    desired.normalize();
    if (d < 100) {
      desired.mult(this.maxSpeed * (d / 100));
    } else {
      desired.mult(this.maxSpeed);
    }
    return desired.sub(this.vel).limit(this.maxForce);
  }

  wanderNatural(width, height) {
    // Smooth wandering with gentle continuous curves
    this.wanderAngle += (Math.random() - 0.5) * 0.25;
    const circleRadius = 30;
    const circleDist = 65;
    const circleCenter = this.vel.copy().normalize().mult(circleDist);
    const displacement = new Vector(Math.cos(this.wanderAngle), Math.sin(this.wanderAngle)).mult(circleRadius);
    const wanderForce = circleCenter.add(displacement).limit(this.maxForce * 0.4);
    this.applyForce(wanderForce);

    // Soft Gravitational Pull towards the light beam center (74% width, 48% height)
    // This allows free swimming anywhere across the water column without bouncing off hard walls!
    const beamCenterX = width * 0.74;
    const beamCenterY = height * 0.48;
    const dx = beamCenterX - this.pos.x;
    const dy = beamCenterY - this.pos.y;
    const distToBeam = Math.hypot(dx, dy);

    if (distToBeam > width * 0.22) {
      const pullForce = new Vector(dx, dy).normalize().mult(this.maxForce * 0.35);
      this.applyForce(pullForce);
    }

    // Soft room boundaries
    const margin = 80;
    if (this.pos.x < margin) this.applyForce(new Vector(this.maxForce * 0.8, 0));
    if (this.pos.x > width - margin) this.applyForce(new Vector(-this.maxForce * 0.8, 0));
    if (this.pos.y < margin) this.applyForce(new Vector(0, this.maxForce * 0.8));
    if (this.pos.y > height - margin) this.applyForce(new Vector(0, -this.maxForce * 0.8));
  }

  update(width, height) {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0); // Reset acceleration

    // Smooth Turn Steering: interpolate angle with limited turn rate
    const targetHeading = this.vel.heading();
    let diff = targetHeading - this.currentHeading;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.currentHeading += diff * 0.085; // Eased natural banking

    // Screen wrapping with generous margins
    const pad = 100;
    if (this.pos.x < -pad) this.pos.x = width + pad;
    if (this.pos.x > width + pad) this.pos.x = -pad;
    if (this.pos.y < -pad) this.pos.y = height + pad;
    if (this.pos.y > height + pad) this.pos.y = -pad;

    // Organic Tail Wiggle: advances with swim speed
    const curSpeed = this.vel.mag();
    this.phase += this.wiggleSpeed * (curSpeed / this.maxSpeed + 0.35);
  }

  draw(ctx, width, height) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.currentHeading);

    // Light beam proximity check (60% to 90% width)
    const inBeam = this.pos.x >= width * 0.55 && this.pos.x <= width * 0.94;

    // Depth of field
    if (this.depth < 0.35) {
      ctx.globalAlpha = 0.78;
      ctx.filter = 'blur(1px)';
    } else {
      ctx.globalAlpha = 0.98;
    }

    // Subtle natural banking tilt as fish swims
    const bankTilt = Math.sin(this.phase) * 0.04;
    ctx.rotate(bankTilt);

    // Bioluminescent glow inside the sunbeam
    if (inBeam) {
      ctx.shadowBlur = 16 * this.scale;
      ctx.shadowColor = 'rgba(0, 240, 255, 0.45)';
    } else {
      ctx.shadowBlur = 6 * this.scale;
      ctx.shadowColor = 'rgba(15, 111, 134, 0.35)';
    }

    const w = this.baseW;
    const h = this.baseH;

    if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
      // Natural biological tail & dorsal/anal fin waving:
      // Slice the Angelfish vertically into 7 segments from tail (left) to snout (right).
      // The snout/face is stable; posterior body & caudal fin undulate with a fluid sine wave!
      const slices = 7;
      const sliceW = this.sprite.naturalWidth / slices;
      const destSliceW = w / slices;
      const maxWiggle = 8.5 * this.scale;

      for (let i = 0; i < slices; i++) {
        // i = slices - 1 is head (right side, x > 0); i = 0 is tail (left side, x < 0)
        const progressFromHead = (slices - 1 - i) / (slices - 1); // 0 at head, 1 at tail
        const yOffset = Math.sin(this.phase + i * 0.55) * (progressFromHead * maxWiggle);

        const sx = i * sliceW;
        const sy = 0;
        const sw = sliceW;
        const sh = this.sprite.naturalHeight;

        const dx = -w * 0.5 + i * destSliceW;
        const dy = -h * 0.5 + yOffset;
        const dw = destSliceW + 0.6; // subtle overlap to eliminate seam gaps
        const dh = h;

        ctx.drawImage(this.sprite, sx, sy, sw, sh, dx, dy, dw, dh);
      }

      // Additive Sunbeam Rim Light inside the light column
      if (inBeam) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.32;
        const rimGrad = ctx.createLinearGradient(0, -h * 0.5, 0, h * 0.5);
        rimGrad.addColorStop(0, '#ffd166');
        rimGrad.addColorStop(0.4, '#00f0ff');
        rimGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = rimGrad;
        ctx.beginPath();
        ctx.ellipse(w * 0.05, 0, w * 0.45, h * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else {
      // Procedural fallback
      this.drawProceduralAngelfish(ctx, w, h, inBeam);
    }

    ctx.restore();
  }

  drawProceduralAngelfish(ctx, w, h, inBeam) {
    const wiggle = Math.sin(this.phase) * (h * 0.32);

    // Tail fin
    ctx.fillStyle = inBeam ? '#00f0ff' : '#2b4bf2';
    ctx.beginPath();
    ctx.moveTo(-w * 0.35, 0);
    ctx.quadraticCurveTo(-w * 0.6, wiggle * 0.5, -w * 0.75, wiggle - h * 0.35);
    ctx.lineTo(-w * 0.68, wiggle);
    ctx.lineTo(-w * 0.75, wiggle + h * 0.35);
    ctx.quadraticCurveTo(-w * 0.6, wiggle * 0.5, -w * 0.35, 0);
    ctx.fill();

    // Body
    const bodyGrad = ctx.createLinearGradient(w * 0.45, 0, -w * 0.4, 0);
    bodyGrad.addColorStop(0, '#00d2ff');
    bodyGrad.addColorStop(0.35, '#2b4bf2');
    bodyGrad.addColorStop(1, '#5d29d6');
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.moveTo(w * 0.45, 0);
    ctx.bezierCurveTo(w * 0.25, -h * 0.5, -w * 0.15, -h * 0.45, -w * 0.35, wiggle * 0.25);
    ctx.bezierCurveTo(-w * 0.15, h * 0.45, w * 0.25, h * 0.5, w * 0.45, 0);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#ffe600';
    ctx.beginPath();
    ctx.arc(w * 0.26, -h * 0.08, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#060a12';
    ctx.beginPath();
    ctx.arc(w * 0.27, -h * 0.08, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Floating Dust Motes inside the light beam
class BeamDustMote {
  constructor(width, height) {
    this.reset(width, height, true);
  }

  reset(width, height, initial = false) {
    const minX = width * 0.55;
    const maxX = width * 0.94;
    this.x = minX + Math.random() * (maxX - minX);
    this.y = initial ? Math.random() * height : height + 10;
    this.radius = 0.8 + Math.random() * 2.2;
    this.speedY = -(0.18 + Math.random() * 0.4);
    this.speedX = (Math.random() - 0.5) * 0.2;
    this.phase = Math.random() * Math.PI * 2;
    this.alpha = 0.15 + Math.random() * 0.45;
  }

  update(width, height) {
    this.phase += 0.02;
    this.y += this.speedY;
    this.x += this.speedX + Math.sin(this.phase) * 0.3;

    if (this.y < -10) {
      this.reset(width, height, false);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = 'rgba(255, 240, 200, 0.9)';
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#00f0ff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Master Canvas 2D Controller
export class HeroCanvasController {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.sprites = [];
    this.boids = [];
    this.dust = [];

    this.mouse = {
      pos: new Vector(this.width * 0.74, this.height * 0.45),
      prevPos: new Vector(this.width * 0.74, this.height * 0.45),
      speed: 0,
      active: false,
      lastMoveTime: Date.now()
    };
    this.isScattering = false;
    this.scatterTimer = null;
    this.rafId = null;

    this.init();
  }

  init() {
    this.resize();
    this.loadSprites();
    this.setupEvents();
  }

  loadSprites() {
    const spriteUrls = [
      './assets/fish/fish-1.png',
      './assets/fish/fish-2.png',
      './assets/fish/fish-3.png',
      './assets/fish/fish-4.png'
    ];

    let loaded = 0;
    spriteUrls.forEach((url, i) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loaded++;
        if (loaded === spriteUrls.length && this.boids.length === 0) {
          this.createAgents();
        }
      };
      img.onerror = () => {
        if (this.boids.length === 0) {
          this.createAgents();
        }
      };
      this.sprites.push(img);
    });

    // Safety timeout
    setTimeout(() => {
      if (this.boids.length === 0) {
        this.createAgents();
      }
    }, 250);
  }

  createAgents() {
    const count = this.reducedMotion ? 10 : FISH_COUNT;
    const spawnCenterX = this.width * 0.74;
    const spawnCenterY = this.height * 0.45;

    for (let i = 0; i < count; i++) {
      const offsetX = (Math.random() - 0.5) * 220;
      const offsetY = (Math.random() - 0.5) * 320;
      const spriteIndex = i % this.sprites.length;
      const sprite = this.sprites[spriteIndex];
      this.boids.push(new AngelfishBoid(spawnCenterX + offsetX, spawnCenterY + offsetY, sprite, spriteIndex));
    }

    // Floating dust particles
    for (let i = 0; i < DUST_PARTICLE_COUNT; i++) {
      this.dust.push(new BeamDustMote(this.width, this.height));
    }

    this.start();
  }

  setupEvents() {
    window.addEventListener('resize', () => this.resize(), { passive: true });

    const handlePointer = (x, y) => {
      this.mouse.active = true;
      this.mouse.lastMoveTime = Date.now();

      const dx = x - this.mouse.pos.x;
      const dy = y - this.mouse.pos.y;
      this.mouse.speed = Math.hypot(dx, dy);

      this.mouse.prevPos.set(this.mouse.pos.x, this.mouse.pos.y);
      this.mouse.pos.set(x, y);

      // Fast cursor triggers radial scatter
      if (this.mouse.speed > MOUSE_SCATTER_THRESHOLD) {
        this.isScattering = true;
        clearTimeout(this.scatterTimer);
        this.scatterTimer = setTimeout(() => {
          this.isScattering = false;
        }, 1000);
      }
    };

    window.addEventListener('mousemove', (e) => handlePointer(e.clientX, e.clientY), { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) handlePointer(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) handlePointer(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      this.mouse.active = false;
    });

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

  start() {
    if (!this.rafId) {
      this.loop();
    }
  }

  loop() {
    this.rafId = requestAnimationFrame(() => this.loop());

    this.ctx.clearRect(0, 0, this.width, this.height);

    const now = Date.now();
    const isMouseIdle = (now - this.mouse.lastMoveTime) > MOUSE_IDLE_DELAY;

    // 1. Draw floating sunlit dust particles inside the light beam
    for (let p of this.dust) {
      p.update(this.width, this.height);
      p.draw(this.ctx);
    }

    // 2. Update and draw tropical Angelfish boids
    for (let boid of this.boids) {
      boid.flock(this.boids, this.width, this.height, this.mouse, this.isScattering, isMouseIdle);
      boid.update(this.width, this.height);
      boid.draw(this.ctx, this.width, this.height);
    }
  }
}
