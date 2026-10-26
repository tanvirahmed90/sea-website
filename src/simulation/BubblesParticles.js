/**
 * Environmental systems:
 * 1. Rising Buoyant Bubbles with specular highlights and wobble
 * 2. Marine Snow (suspended organic underwater particles)
 * 3. Animated Caustics & Volumetric Light Beam for the ceiling opening
 */

import { CONFIG } from '../config.js';

export class BubbleSystem {
  constructor(canvasWidth, canvasHeight) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.bubbles = [];
    this.init();
  }

  init() {
    this.bubbles = [];
    for (let i = 0; i < CONFIG.BUBBLE_COUNT; i++) {
      this.bubbles.push(this.createBubble(true));
    }
  }

  createBubble(randomY = false) {
    return {
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : this.height + 15 + Math.random() * 80,
      radius: 2 + Math.random() * 6.5,
      speedY: 0.8 + Math.random() * 1.8,
      wobbleSpeed: 0.03 + Math.random() * 0.04,
      wobbleAmp: 0.6 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.15 + Math.random() * 0.4
    };
  }

  update(width, height, depthRatio) {
    this.width = width;
    this.height = height;

    for (let b of this.bubbles) {
      b.y -= b.speedY;
      b.phase += b.wobbleSpeed;
      b.x += Math.sin(b.phase) * b.wobbleAmp;

      // When reaching top, respawn at bottom
      if (b.y < -30) {
        Object.assign(b, this.createBubble(false));
      }
    }
  }

  draw(ctx, depthRatio) {
    // Bubbles become slightly sparser in abyss but still emit occasionally
    const visibility = Math.max(0.3, 1.0 - depthRatio * 0.5);

    ctx.save();
    for (let b of this.bubbles) {
      ctx.globalAlpha = b.alpha * visibility;

      // Bubble rim
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Soft blue/cyan inner gradient
      const grad = ctx.createRadialGradient(
        b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.1,
        b.x, b.y, b.radius
      );
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
      grad.addColorStop(0.5, 'rgba(15, 111, 134, 0.2)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
      ctx.fillStyle = grad;
      ctx.fill();

      // Specular highlight gleam
      ctx.beginPath();
      ctx.arc(b.x - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fill();
    }
    ctx.restore();
  }
}

export class MarineSnowSystem {
  constructor(canvasWidth, canvasHeight) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.particles = [];
    this.init();
  }

  init() {
    this.particles = [];
    for (let i = 0; i < CONFIG.MARINE_SNOW_COUNT; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 0.8 + Math.random() * 2.2,
        speedY: -(0.15 + Math.random() * 0.35), // Drifts gently upward
        speedX: (Math.random() - 0.5) * 0.2,
        driftPhase: Math.random() * Math.PI * 2,
        driftSpeed: 0.01 + Math.random() * 0.02,
        alpha: 0.1 + Math.random() * 0.45,
        depthFactor: 0.5 + Math.random() * 0.5
      });
    }
  }

  update(width, height) {
    this.width = width;
    this.height = height;

    for (let p of this.particles) {
      p.driftPhase += p.driftSpeed;
      p.y += p.speedY;
      p.x += p.speedX + Math.sin(p.driftPhase) * 0.4;

      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
    }
  }

  draw(ctx, depthRatio) {
    // Marine snow shines more brightly as contrast increases in dark water
    const snowAlphaMult = 0.5 + depthRatio * 0.5;

    ctx.save();
    for (let p of this.particles) {
      ctx.globalAlpha = p.alpha * snowAlphaMult;
      ctx.fillStyle = depthRatio > 0.6 ? '#67e8f9' : '#e2e8f0';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export class HeroCausticsBeam {
  constructor() {
    this.time = 0;
  }

  update() {
    this.time += 0.018;
  }

  draw(ctx, width, height, depthRatio, heroRect) {
    // Light rays and caustics are intense at surface (hero), fading rapidly as user descends
    if (depthRatio > 0.22) return;
    const fade = Math.max(0, 1.0 - depthRatio * 4.5);

    ctx.save();
    ctx.globalAlpha = fade * 0.45; // Subtle ethereal accent over 3D background

    const originX = width * 0.77;
    const originY = 60;
    const skylightWidth = Math.min(width * 0.32, 340);

    // --- 1. Volumetric Light Shafts Streaming Downwards ---
    for (let i = 0; i < CONFIG.LIGHT_RAY_COUNT; i++) {
      const rayPhase = this.time + i * 1.35;
      const rayOpacity = (0.08 + 0.07 * Math.sin(rayPhase)) * fade;
      const angleOffset = Math.sin(rayPhase * 0.7) * 45;
      const spread = 90 + i * 35;

      const beamGrad = ctx.createLinearGradient(originX, originY, originX + angleOffset, originY + height * 0.85);
      beamGrad.addColorStop(0, 'rgba(0, 240, 255, 0.35)');
      beamGrad.addColorStop(0.3, 'rgba(15, 111, 134, 0.2)');
      beamGrad.addColorStop(0.7, 'rgba(15, 111, 134, 0.08)');
      beamGrad.addColorStop(1, 'rgba(2, 8, 18, 0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(originX - skylightWidth * 0.4 + i * 20, originY);
      ctx.lineTo(originX + skylightWidth * 0.4 - i * 15, originY);
      ctx.lineTo(originX + spread * 2 + angleOffset, originY + height * 0.85);
      ctx.lineTo(originX - spread * 1.5 + angleOffset, originY + height * 0.85);
      ctx.closePath();
      ctx.fill();
    }

    // --- 2. Shimmering Caustics Web at bottom of hero chamber ---
    const floorY = originY + height * 0.65;
    const causticsGrad = ctx.createRadialGradient(originX, floorY, 20, originX, floorY, skylightWidth * 1.2);
    causticsGrad.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
    causticsGrad.addColorStop(0.5, 'rgba(15, 111, 134, 0.12)');
    causticsGrad.addColorStop(1, 'rgba(2, 8, 18, 0)');

    ctx.fillStyle = causticsGrad;
    ctx.beginPath();
    ctx.ellipse(originX, floorY, skylightWidth * 1.1, 80, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle shifting caustic ripple lines
    ctx.strokeStyle = 'rgba(180, 250, 255, 0.18)';
    ctx.lineWidth = 1.6;
    for (let c = 0; c < 5; c++) {
      ctx.beginPath();
      const waveX = originX + Math.sin(this.time + c) * 30;
      const waveY = floorY + (c - 2) * 14;
      ctx.ellipse(waveX, waveY, skylightWidth * (0.6 - c * 0.08), 24 + Math.sin(this.time * 2 + c) * 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
