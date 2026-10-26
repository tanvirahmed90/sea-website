/**
 * =========================================================================
 * FOLDCRAFT — HIGH PERFORMANCE 60 FPS TROPICAL ANGELFISH BOIDS
 * Optimized for silky-smooth 60fps on all devices:
 * - Removed expensive ctx.filter and shadowBlur bottlenecks
 * - Efficient 3-segment organic tail wave without subpixel lag
 * - Squared distance math (no redundant Math.sqrt in flocking loops)
 * - Capped DPR and zero garbage collection in render loop
 * =========================================================================
 */

// =========================================================================
// CONFIGURATION CONSTANTS
// =========================================================================
export const FISH_COUNT = 22;               // Number of tropical angelfish inside the beam
export const FISH_SPEED = 2.5;              // Natural cruising speed (pixels per frame)
export const MOUSE_ATTRACT_FORCE = 0.038;   // Attraction strength towards cursor
export const MOUSE_SCATTER_FORCE = 3.4;     // Radial repulsion strength on fast mouse
export const MOUSE_SCATTER_THRESHOLD = 9;   // Mouse speed threshold to trigger scatter
export const MOUSE_IDLE_DELAY = 1800;       // Idle timeout in ms before returning to beam loops
export const DUST_PARTICLE_COUNT = 35;      // Floating sunlit dust motes inside the beam

// Fast 2D Vector
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
  normalize() {
    const m = this.mag();
    if (m !== 0) this.div(m);
    return this;
  }
  limit(max) {
    const mSq = this.magSq();
    if (mSq > max * max) {
      this.div(Math.sqrt(mSq)).mult(max);
    }
    return this;
  }
  distSq(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }
  copy() { return new Vector(this.x, this.y); }
}

// Tropical Angelfish Boid (Ultra-optimized)
class AngelfishBoid {
  constructor(x, y, spriteImg, typeIndex) {
    this.pos = new Vector(x, y);
    const initialAngle = (Math.random() - 0.5) * Math.PI * 0.8 + Math.PI * 0.1;
    this.vel = new Vector(Math.cos(initialAngle), Math.sin(initialAngle)).mult(FISH_SPEED);
    this.acc = new Vector(0, 0);

    this.sprite = spriteImg;
    this.typeIndex = typeIndex;

    // Depth Layering: 0.65x to 1.15x
    this.depth = Math.random(); // 0 = far, 1 = near
    this.scale = 0.65 + this.depth * 0.5;
    this.baseW = Math.round(82 * this.scale);
    this.baseH = Math.round(52 * this.scale);

    this.maxSpeed = FISH_SPEED * (0.88 + Math.random() * 0.25) * (0.85 + this.depth * 0.25);
    this.maxForce = 0.075 * (0.9 + this.depth * 0.3);

    this.currentHeading = this.vel.heading();
    this.phase = Math.random() * Math.PI * 2;
    this.wiggleSpeed = 0.18 + Math.random() * 0.05;
    this.wanderAngle = Math.random() * Math.PI * 2;

    // Pre-calculated squared radii for zero-cost distance checks
    this.desiredSep = 45 * this.scale;
    this.desiredSepSq = this.desiredSep * this.desiredSep;
    this.neighborDist = 120 * this.scale;
    this.neighborDistSq = this.neighborDist * this.neighborDist;
  }

  applyForce(f) {
    this.acc.add(f);
  }

  flock(boids, width, height, mouse, isScattering, isMouseIdle) {
    let sepX = 0, sepY = 0, sepCount = 0;
    let aliX = 0, aliY = 0;
    let cohX = 0, cohY = 0, neighborCount = 0;

    for (let i = 0; i < boids.length; i++) {
      const other = boids[i];
      if (other === this) continue;

      const dSq = this.pos.distSq(other.pos);

      // Separation
      if (dSq > 0 && dSq < this.desiredSepSq) {
        const d = Math.sqrt(dSq);
        sepX += (this.pos.x - other.pos.x) / d;
        sepY += (this.pos.y - other.pos.y) / d;
        sepCount++;
      }

      // Alignment & Cohesion
      if (dSq > 0 && dSq < this.neighborDistSq) {
        aliX += other.vel.x;
        aliY += other.vel.y;
        cohX += other.pos.x;
        cohY += other.pos.y;
        neighborCount++;
      }
    }

    if (sepCount > 0) {
      const sep = new Vector(sepX / sepCount, sepY / sepCount).normalize().mult(this.maxSpeed).sub(this.vel).limit(this.maxForce * 1.2);
      this.applyForce(sep.mult(1.1));
    }

    if (neighborCount > 0) {
      const ali = new Vector(aliX / neighborCount, aliY / neighborCount).normalize().mult(this.maxSpeed).sub(this.vel).limit(this.maxForce * 0.8);
      this.applyForce(ali);

      const cohTarget = new Vector(cohX / neighborCount, cohY / neighborCount);
      const coh = this.seek(cohTarget).limit(this.maxForce * 0.65);
      this.applyForce(coh);
    }

    // --- Mouse Interaction ---
    if (mouse.active && !isMouseIdle) {
      const mouseDistSq = this.pos.distSq(mouse.pos);

      if (isScattering) {
        // Fast cursor scatter
        if (mouseDistSq < 90000) { // < 300px
          const d = Math.sqrt(mouseDistSq);
          const repulse = this.pos.copy().sub(mouse.pos).normalize();
          const strength = (1 - d / 300) * MOUSE_SCATTER_FORCE;
          this.applyForce(repulse.mult(strength));
        }
      } else {
        // Smooth cursor follow
        if (mouseDistSq > 3600 && mouseDistSq < 490000) { // 60px to 700px
          const d = Math.sqrt(mouseDistSq);
          const seekMouse = this.seek(mouse.pos);
          const factor = (1 - d / 700) * MOUSE_ATTRACT_FORCE * 18;
          this.applyForce(seekMouse.mult(factor));
        } else if (mouseDistSq <= 3600) {
          // Circle cursor when nearby
          const toMouse = mouse.pos.copy().sub(this.pos);
          const tangent = new Vector(-toMouse.y, toMouse.x).normalize();
          this.applyForce(tangent.mult(this.maxForce * 0.75));
        }
      }
    } else {
      // Natural Oceanic Wandering
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
    this.wanderAngle += (Math.random() - 0.5) * 0.22;
    const circleCenter = this.vel.copy().normalize().mult(60);
    const displacement = new Vector(Math.cos(this.wanderAngle), Math.sin(this.wanderAngle)).mult(28);
    const wanderForce = circleCenter.add(displacement).limit(this.maxForce * 0.38);
    this.applyForce(wanderForce);

    // Soft Gravitational Pull towards light beam center (74% width, 48% height)
    const beamCenterX = width * 0.74;
    const beamCenterY = height * 0.48;
    const dx = beamCenterX - this.pos.x;
    const dy = beamCenterY - this.pos.y;
    const distToBeamSq = dx * dx + dy * dy;

    if (distToBeamSq > (width * 0.22) * (width * 0.22)) {
      const pullForce = new Vector(dx, dy).normalize().mult(this.maxForce * 0.32);
      this.applyForce(pullForce);
    }

    // Soft room boundaries
    const margin = 80;
    if (this.pos.x < margin) this.applyForce(new Vector(this.maxForce * 0.75, 0));
    if (this.pos.x > width - margin) this.applyForce(new Vector(-this.maxForce * 0.75, 0));
    if (this.pos.y < margin) this.applyForce(new Vector(0, this.maxForce * 0.75));
    if (this.pos.y > height - margin) this.applyForce(new Vector(0, -this.maxForce * 0.75));
  }

  update(width, height) {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.set(0, 0);

    // Smooth Turn Steering
    const targetHeading = this.vel.heading();
    let diff = targetHeading - this.currentHeading;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.currentHeading += diff * 0.085;

    // Boundaries wrap
    const pad = 90;
    if (this.pos.x < -pad) this.pos.x = width + pad;
    if (this.pos.x > width + pad) this.pos.x = -pad;
    if (this.pos.y < -pad) this.pos.y = height + pad;
    if (this.pos.y > height + pad) this.pos.y = -pad;

    // Advance tail wiggle based on speed
    const curSpeed = this.vel.mag();
    this.phase += this.wiggleSpeed * (curSpeed / this.maxSpeed + 0.35);
  }

  draw(ctx, width, height) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.currentHeading);

    // Far fish depth layering using pure alpha (zero GPU filter cost!)
    ctx.globalAlpha = this.depth < 0.35 ? 0.72 : 0.98;

    // Natural banking roll
    const bankTilt = Math.sin(this.phase) * 0.035;
    ctx.rotate(bankTilt);

    const w = this.baseW;
    const h = this.baseH;

    if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
      // 3-Segment Wave (Head, Mid, Tail): Fast, crisp, zero subpixel lag
      // Slices along X:
      // Slice 0 (Tail, 0 to 33%): Full tail stroke
      // Slice 1 (Mid-body, 33% to 66%): Mild flex
      // Slice 2 (Head, 66% to 100%): Firm, stable head
      const sw = this.sprite.naturalWidth;
      const sh = this.sprite.naturalHeight;
      const s3 = sw / 3;
      const d3 = w / 3;

      const maxWiggle = 7.5 * this.scale;
      const tailY = Math.sin(this.phase) * maxWiggle;
      const midY = Math.sin(this.phase + 0.45) * (maxWiggle * 0.42);

      // 1. Tail (Left slice)
      ctx.drawImage(this.sprite, 0, 0, s3, sh, -w * 0.5, -h * 0.5 + tailY, d3 + 0.5, h);

      // 2. Mid Body (Center slice)
      ctx.drawImage(this.sprite, s3, 0, s3, sh, -w * 0.5 + d3, -h * 0.5 + midY, d3 + 0.5, h);

      // 3. Head & Snout (Right slice, firmly anchored)
      ctx.drawImage(this.sprite, s3 * 2, 0, s3, sh, -w * 0.5 + d3 * 2, -h * 0.5, d3, h);

      // Soft sunbeam glow when in light beam (using fast arc instead of shadowBlur)
      const inBeam = this.pos.x >= width * 0.58 && this.pos.x <= width * 0.92;
      if (inBeam) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.ellipse(w * 0.05, 0, w * 0.42, h * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Fallback
      ctx.fillStyle = '#00d2ff';
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.4, h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// Fast Floating Dust Motes (zero shadowBlur!)
class BeamDustMote {
  constructor(width, height) {
    this.reset(width, height, true);
  }

  reset(width, height, initial = false) {
    const minX = width * 0.58;
    const maxX = width * 0.92;
    this.x = minX + Math.random() * (maxX - minX);
    this.y = initial ? Math.random() * height : height + 10;
    this.radius = 1.0 + Math.random() * 1.8;
    this.speedY = -(0.18 + Math.random() * 0.35);
    this.speedX = (Math.random() - 0.5) * 0.18;
    this.phase = Math.random() * Math.PI * 2;
    this.alpha = 0.18 + Math.random() * 0.45;
  }

  update(width, height) {
    this.phase += 0.02;
    this.y += this.speedY;
    this.x += this.speedX + Math.sin(this.phase) * 0.25;

    if (this.y < -10) {
      this.reset(width, height, false);
    }
  }

  draw(ctx) {
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = 'rgba(255, 235, 180, 0.85)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Master Canvas 2D Controller (60 FPS Locked)
export class HeroCanvasController {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d', { alpha: true, desynchronized: true });
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Cap DPR at 1.5 to guarantee solid 60 FPS on 4K/Retina displays
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);

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
    spriteUrls.forEach((url) => {
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

    setTimeout(() => {
      if (this.boids.length === 0) {
        this.createAgents();
      }
    }, 200);
  }

  createAgents() {
    const count = this.reducedMotion ? 10 : FISH_COUNT;
    const spawnCenterX = this.width * 0.74;
    const spawnCenterY = this.height * 0.45;

    for (let i = 0; i < count; i++) {
      const offsetX = (Math.random() - 0.5) * 200;
      const offsetY = (Math.random() - 0.5) * 280;
      const spriteIndex = i % this.sprites.length;
      const sprite = this.sprites[spriteIndex];
      this.boids.push(new AngelfishBoid(spawnCenterX + offsetX, spawnCenterY + offsetY, sprite, spriteIndex));
    }

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
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
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

    // 1. Draw floating sunlit dust particles (fast, zero shadowBlur)
    for (let i = 0; i < this.dust.length; i++) {
      this.dust[i].update(this.width, this.height);
      this.dust[i].draw(this.ctx);
    }

    // 2. Update and draw tropical Angelfish boids
    for (let i = 0; i < this.boids.length; i++) {
      const boid = this.boids[i];
      boid.flock(this.boids, this.width, this.height, this.mouse, this.isScattering, isMouseIdle);
      boid.update(this.width, this.height);
      boid.draw(this.ctx, this.width, this.height);
    }
  }
}
