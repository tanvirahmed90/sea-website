/**
 * Boid flocking agent with organic fish anatomy, tail oscillation,
 * and mouse / touch interaction dynamics.
 */

import { CONFIG } from '../config.js';

export class Vector2D {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  mult(n) {
    this.x *= n;
    this.y *= n;
    return this;
  }

  div(n) {
    if (n !== 0) {
      this.x /= n;
      this.y /= n;
    }
    return this;
  }

  magSq() {
    return this.x * this.x + this.y * this.y;
  }

  mag() {
    return Math.sqrt(this.magSq());
  }

  heading() {
    return Math.atan2(this.y, this.x);
  }

  normalize() {
    const m = this.mag();
    if (m !== 0) this.div(m);
    return this;
  }

  limit(max) {
    const mSq = this.magSq();
    if (mSq > max * max) {
      this.div(Math.sqrt(mSq));
      this.mult(max);
    }
    return this;
  }

  dist(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  copy() {
    return new Vector2D(this.x, this.y);
  }
}

export class FishBoid {
  constructor(x, y, type = 'orange') {
    this.pos = new Vector2D(x, y);
    // Random initial velocity
    const angle = Math.random() * Math.PI * 2;
    this.vel = new Vector2D(Math.cos(angle), Math.sin(angle)).mult(CONFIG.FISH_MAX_SPEED * 0.75);
    this.acc = new Vector2D(0, 0);

    this.type = type; // 'orange' or 'silver'
    this.scale = type === 'silver' ? 1.25 : (0.85 + Math.random() * 0.35);
    this.maxSpeed = (CONFIG.FISH_MAX_SPEED * (type === 'silver' ? 0.8 : 1.0)) * (0.9 + Math.random() * 0.2);
    this.maxForce = CONFIG.FISH_MAX_FORCE * (type === 'silver' ? 0.7 : 1.0);

    // Swimming animation phase & characteristics
    this.phase = Math.random() * Math.PI * 2;
    this.wiggleSpeed = CONFIG.FISH_WIGGLE_SPEED * (0.8 + Math.random() * 0.4);
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.currentHeading = this.vel.heading();

    // Unique subtle color variation
    this.hueShift = (Math.random() - 0.5) * 12; // slight golden-orange variance
    this.opacity = 1.0;
    this.depthZ = Math.random(); // 0 to 1 for subtle parallax / size
  }

  applyForce(force) {
    this.acc.add(force);
  }

  // --- Boids Core Rules ---
  flock(boids) {
    const sep = this.separate(boids);
    const ali = this.align(boids);
    const coh = this.cohere(boids);

    // Weightings
    sep.mult(1.5);
    ali.mult(1.0);
    coh.mult(1.1);

    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
  }

  separate(boids) {
    const steer = new Vector2D(0, 0);
    let count = 0;
    const desiredDist = CONFIG.FISH_SEPARATION_RADIUS * this.scale;

    for (let other of boids) {
      if (other === this) continue;
      const d = this.pos.dist(other.pos);
      if (d > 0 && d < desiredDist) {
        const diff = this.pos.copy().sub(other.pos).normalize().div(d); // Closer = stronger push
        steer.add(diff);
        count++;
      }
    }

    if (count > 0) {
      steer.div(count);
      if (steer.magSq() > 0) {
        steer.normalize().mult(this.maxSpeed).sub(this.vel).limit(this.maxForce * 1.5);
      }
    }
    return steer;
  }

  align(boids) {
    const sum = new Vector2D(0, 0);
    let count = 0;
    const neighborDist = CONFIG.FISH_ALIGN_RADIUS * this.scale;

    for (let other of boids) {
      if (other === this) continue;
      const d = this.pos.dist(other.pos);
      if (d > 0 && d < neighborDist) {
        sum.add(other.vel);
        count++;
      }
    }

    if (count > 0) {
      sum.div(count).normalize().mult(this.maxSpeed);
      const steer = sum.sub(this.vel).limit(this.maxForce);
      return steer;
    }
    return new Vector2D(0, 0);
  }

  cohere(boids) {
    const sum = new Vector2D(0, 0);
    let count = 0;
    const neighborDist = CONFIG.FISH_COHESION_RADIUS * this.scale;

    for (let other of boids) {
      if (other === this) continue;
      const d = this.pos.dist(other.pos);
      if (d > 0 && d < neighborDist) {
        sum.add(other.pos);
        count++;
      }
    }

    if (count > 0) {
      sum.div(count);
      return this.seek(sum);
    }
    return new Vector2D(0, 0);
  }

  seek(target) {
    const desired = target.copy().sub(this.pos);
    const d = desired.mag();
    desired.normalize();

    // Slow down smoothly when within 100px
    if (d < 100) {
      const m = (d / 100) * this.maxSpeed;
      desired.mult(m);
    } else {
      desired.mult(this.maxSpeed);
    }

    const steer = desired.sub(this.vel).limit(this.maxForce);
    return steer;
  }

  wander() {
    // Smooth wandering with Perlin-like random walk
    this.wanderAngle += (Math.random() - 0.5) * 0.4;
    const circleRadius = 25;
    const circleDist = 60;
    const change = new Vector2D(Math.cos(this.wanderAngle), Math.sin(this.wanderAngle)).mult(circleRadius);

    const circleCenter = this.vel.copy().normalize().mult(circleDist);
    const wanderForce = circleCenter.add(change).limit(this.maxForce * 0.4);
    this.applyForce(wanderForce);
  }

  interactWithMouse(mouse, isScattering, scatterStrength = 1.0) {
    if (!mouse.active) return;

    const d = this.pos.dist(mouse.pos);
    if (isScattering) {
      // Scatter violently away from fast-moving mouse
      const scatterRadius = 240;
      if (d < scatterRadius) {
        const repulse = this.pos.copy().sub(mouse.pos).normalize();
        const factor = (1 - d / scatterRadius) * CONFIG.MOUSE_SCATTER_FORCE * scatterStrength;
        repulse.mult(factor);
        this.applyForce(repulse);
      }
    } else {
      // Gently follow mouse cursor
      const attractRadius = 550;
      if (d < attractRadius && d > 40) {
        const desired = mouse.pos.copy().sub(this.pos);
        desired.normalize().mult(this.maxSpeed);
        const steer = desired.sub(this.vel).limit(CONFIG.MOUSE_ATTRACTION_FORCE * (1 - d / attractRadius));
        this.applyForce(steer);
      }
    }
  }

  flockToTarget(targetPos, radius = 70) {
    // When gathering near a button or hero light beam
    const d = this.pos.dist(targetPos);
    // Orbit around the target
    const toTarget = targetPos.copy().sub(this.pos);
    const normal = new Vector2D(-toTarget.y, toTarget.x).normalize(); // Tangent vector

    if (d > radius) {
      const seekForce = this.seek(targetPos);
      this.applyForce(seekForce.mult(0.8));
    }
    // Add swirl
    this.applyForce(normal.mult(this.maxForce * 0.6));
  }

  update(width, height) {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0); // Reset acceleration

    // Smooth heading interpolation to eliminate jitter
    const targetHeading = this.vel.heading();
    let diff = targetHeading - this.currentHeading;
    // Normalize angle difference to [-PI, PI]
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.currentHeading += diff * 0.14;

    // Boundaries: soft bounce / wrap with margin
    const margin = 50;
    if (this.pos.x < -margin) this.pos.x = width + margin;
    if (this.pos.x > width + margin) this.pos.x = -margin;
    if (this.pos.y < -margin) this.pos.y = height + margin;
    if (this.pos.y > height + margin) this.pos.y = -margin;

    // Advance tail wiggle based on speed
    const currentSpeed = this.vel.mag();
    this.phase += (this.wiggleSpeed * (currentSpeed / this.maxSpeed + 0.3));
  }

  draw(ctx) {
    if (this.opacity <= 0.01) return;

    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.currentHeading);
    ctx.scale(this.scale, this.scale);
    ctx.globalAlpha = this.opacity;

    const len = CONFIG.FISH_BODY_LENGTH;
    const wid = CONFIG.FISH_BODY_WIDTH;
    const wiggle = Math.sin(this.phase) * (len * 0.32);

    // Color schemes
    let mainColor, accentColor, glowColor, finColor;
    if (this.type === 'orange') {
      mainColor = '#ff8f1c';
      accentColor = '#ffd166';
      glowColor = CONFIG.COLORS.FISH_GLOW;
      finColor = 'rgba(255, 170, 51, 0.45)';
    } else {
      // Silver-blue mid-water fish
      mainColor = '#94a3b8';
      accentColor = '#38bdf8';
      glowColor = CONFIG.COLORS.SILVER_GLOW;
      finColor = 'rgba(148, 163, 184, 0.35)';
    }

    // --- Bioluminescent Glow ---
    ctx.shadowBlur = this.type === 'orange' ? 14 : 10;
    ctx.shadowColor = glowColor;

    // --- Pectoral / Dorsal Fins ---
    ctx.fillStyle = finColor;
    // Top fin
    ctx.beginPath();
    ctx.moveTo(len * 0.1, -wid * 0.7);
    ctx.quadraticCurveTo(-len * 0.2, -wid * 1.5, -len * 0.35, -wid * 0.4);
    ctx.closePath();
    ctx.fill();

    // Side pectoral fins
    ctx.beginPath();
    ctx.moveTo(len * 0.2, wid * 0.4);
    ctx.quadraticCurveTo(0, wid * 1.4, -len * 0.2, wid * 0.6);
    ctx.closePath();
    ctx.fill();

    // --- Articulated Tail Fin ---
    ctx.beginPath();
    ctx.moveTo(-len * 0.5, 0);
    ctx.quadraticCurveTo(-len * 0.8, wiggle * 0.6, -len * 1.1, wiggle - wid * 0.8);
    ctx.lineTo(-len * 0.95, wiggle);
    ctx.lineTo(-len * 1.1, wiggle + wid * 0.8);
    ctx.quadraticCurveTo(-len * 0.8, wiggle * 0.6, -len * 0.5, 0);
    ctx.fillStyle = mainColor;
    ctx.fill();

    // --- Main Fusiform Body ---
    const bodyGrad = ctx.createLinearGradient(len * 0.6, 0, -len * 0.6, 0);
    bodyGrad.addColorStop(0, accentColor);
    bodyGrad.addColorStop(0.35, mainColor);
    bodyGrad.addColorStop(1, this.type === 'orange' ? '#e65100' : '#475569');

    ctx.beginPath();
    // Snout to tail
    ctx.moveTo(len * 0.6, 0);
    // Top curve
    ctx.bezierCurveTo(len * 0.3, -wid, -len * 0.2, -wid * 0.9, -len * 0.5, wiggle * 0.3);
    // Bottom curve
    ctx.bezierCurveTo(-len * 0.2, wid * 0.9, len * 0.3, wid, len * 0.6, 0);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Reset shadow for crisp eye & details
    ctx.shadowBlur = 0;

    // --- Eye ---
    const eyeX = len * 0.38;
    const eyeY = -wid * 0.25;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(eyeX + 0.5, eyeY, 1.0, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    // Subtle spine shimmer line
    ctx.beginPath();
    ctx.moveTo(len * 0.4, 0);
    ctx.quadraticCurveTo(0, -wid * 0.15, -len * 0.4, wiggle * 0.2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }
}
