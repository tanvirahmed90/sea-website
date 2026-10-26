/**
 * Deep-sea marine fauna:
 * 1. Manta Ray silhouette with undulating wings
 * 2. Bioluminescent Jellyfish with rhythmic bell contractions and trailing tentacles
 * 3. Deep-sea Anglerfish with swinging bioluminescent lure
 * 4. Benthic Plankton clusters for the ocean floor
 */

export class MantaRay {
  constructor(canvasWidth, canvasHeight) {
    this.reset(canvasWidth, canvasHeight, true);
  }

  reset(width, height, initial = false) {
    this.width = width;
    this.height = height;
    // Enter from one side, glide to the other
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.x = this.direction === 1 ? -220 : width + 220;
    this.y = height * (0.2 + Math.random() * 0.5);
    this.speed = (0.55 + Math.random() * 0.35) * this.direction;
    this.scale = 0.85 + Math.random() * 0.35;
    this.phase = Math.random() * Math.PI * 2;
    this.wingSpeed = 0.025;
    this.active = initial ? Math.random() > 0.3 : true;
    this.alpha = 0.55;
  }

  update(width, height, depthRatio) {
    // Visible mainly in mid-water (depthRatio between 0.15 and 0.55)
    const inDepthZone = depthRatio >= 0.12 && depthRatio <= 0.6;
    if (!inDepthZone) {
      this.alpha = Math.max(0, this.alpha - 0.02);
    } else {
      this.alpha = Math.min(0.65, this.alpha + 0.015);
    }

    if (this.alpha <= 0) return;

    this.x += this.speed;
    this.y += Math.sin(this.phase * 0.5) * 0.25;
    this.phase += this.wingSpeed;

    // Wrap around
    if (this.direction === 1 && this.x > width + 300) {
      this.reset(width, height);
    } else if (this.direction === -1 && this.x < -300) {
      this.reset(width, height);
    }
  }

  draw(ctx) {
    if (this.alpha <= 0.01) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.direction * this.scale, this.scale);
    ctx.globalAlpha = this.alpha;

    const wingFlap = Math.sin(this.phase) * 16;

    // Body gradient
    const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 100);
    grad.addColorStop(0, 'rgba(15, 30, 48, 0.95)');
    grad.addColorStop(0.7, 'rgba(8, 18, 30, 0.85)');
    grad.addColorStop(1, 'rgba(3, 10, 18, 0.4)');

    ctx.fillStyle = grad;
    ctx.shadowBlur = 18;
    ctx.shadowColor = 'rgba(15, 111, 134, 0.3)';

    // Manta Ray body & wing silhouette
    ctx.beginPath();
    ctx.moveTo(70, 0); // Head / cephalic horns
    ctx.bezierCurveTo(40, -15, 20, -50 + wingFlap, -30, -90 + wingFlap * 1.5); // Left wing tip
    ctx.bezierCurveTo(-20, -40, -40, -20, -70, -8); // Left flank to tail base
    ctx.lineTo(-180, 0); // Whip tail
    ctx.lineTo(-70, 8); // Right flank
    ctx.bezierCurveTo(-40, 20, -20, 40, -30, 90 - wingFlap * 1.5); // Right wing tip
    ctx.bezierCurveTo(20, 50 - wingFlap, 40, 15, 70, 0); // Head
    ctx.closePath();
    ctx.fill();

    // Cephalic horns (front flaps)
    ctx.beginPath();
    ctx.moveTo(65, -8);
    ctx.quadraticCurveTo(85, -16, 78, -4);
    ctx.lineTo(65, -2);
    ctx.moveTo(65, 8);
    ctx.quadraticCurveTo(85, 16, 78, 4);
    ctx.lineTo(65, 2);
    ctx.fill();

    // Subtle dorsal gill markings
    ctx.strokeStyle = 'rgba(15, 111, 134, 0.25)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const gx = -25 - i * 10;
      ctx.beginPath();
      ctx.arc(gx, 0, 12 + i * 2, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();
    }

    ctx.restore();
  }
}

export class BioluminescentJellyfish {
  constructor(canvasWidth, canvasHeight) {
    this.reset(canvasWidth, canvasHeight, true);
  }

  reset(width, height, initial = false) {
    this.x = width * (0.1 + Math.random() * 0.8);
    this.y = initial ? height * (0.2 + Math.random() * 0.7) : height + 100;
    this.radius = 24 + Math.random() * 18;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.pulseSpeed = 0.035 + Math.random() * 0.02;
    this.speedY = -(0.4 + Math.random() * 0.4);
    this.speedX = (Math.random() - 0.5) * 0.2;
    this.driftPhase = Math.random() * Math.PI * 2;
    this.alpha = 0;
    this.colorType = Math.random() > 0.5 ? 'cyan' : 'purple';
    this.tentacleCount = 6 + Math.floor(Math.random() * 4);
    this.tentacles = [];
    for (let i = 0; i < this.tentacleCount; i++) {
      this.tentacles.push({
        length: this.radius * (2.8 + Math.random() * 1.8),
        offset: (i / (this.tentacleCount - 1) - 0.5) * (this.radius * 1.3),
        phase: Math.random() * Math.PI * 2,
        waveFreq: 0.05 + Math.random() * 0.03
      });
    }
  }

  update(width, height, depthRatio) {
    // Flourishes in Midnight / Bathypelagic zone (depthRatio 0.45 to 0.95)
    const inZone = depthRatio >= 0.42 && depthRatio <= 0.95;
    if (inZone) {
      this.alpha = Math.min(0.85, this.alpha + 0.02);
    } else {
      this.alpha = Math.max(0, this.alpha - 0.02);
    }

    if (this.alpha <= 0) return;

    this.pulsePhase += this.pulseSpeed;
    const pulseFactor = Math.sin(this.pulsePhase);

    // Propel upward during contraction
    const currentSpeedY = this.speedY * (pulseFactor > 0 ? 1.8 : 0.6);
    this.y += currentSpeedY;
    this.driftPhase += 0.02;
    this.x += this.speedX + Math.sin(this.driftPhase) * 0.3;

    // Respawn when floats off the top
    if (this.y < -120) {
      this.reset(width, height);
    }
  }

  draw(ctx) {
    if (this.alpha <= 0.01) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = this.alpha;

    const pulse = Math.sin(this.pulsePhase);
    const rX = this.radius * (1 - pulse * 0.18);
    const rY = this.radius * (1 + pulse * 0.25);

    const isCyan = this.colorType === 'cyan';
    const mainColor = isCyan ? 'rgba(0, 240, 255, ' : 'rgba(216, 180, 254, ';
    const coreColor = isCyan ? 'rgba(56, 189, 248, ' : 'rgba(232, 121, 249, ';

    // Bioluminescent glow aura
    ctx.shadowBlur = 22;
    ctx.shadowColor = isCyan ? '#00f0ff' : '#d8b4fe';

    // --- Trailing Tentacles ---
    ctx.lineWidth = 1.2;
    for (let t of this.tentacles) {
      ctx.beginPath();
      ctx.moveTo(t.offset, rY * 0.2);
      const points = 5;
      const segLength = t.length / points;
      let currentX = t.offset;
      let currentY = rY * 0.2;

      for (let j = 1; j <= points; j++) {
        const nextY = currentY + segLength;
        const wave = Math.sin(this.pulsePhase + t.phase + j * 0.8) * (8 + j * 3);
        const nextX = currentX + wave * 0.35;
        ctx.quadraticCurveTo(currentX + wave, (currentY + nextY) * 0.5, nextX, nextY);
        currentX = nextX;
        currentY = nextY;
      }

      ctx.strokeStyle = `${mainColor}${0.35 + 0.25 * Math.sin(this.pulsePhase + t.phase)})`;
      ctx.stroke();
    }

    // --- Bell (Umbrella) ---
    const bellGrad = ctx.createRadialGradient(0, -rY * 0.2, 2, 0, 0, rX);
    bellGrad.addColorStop(0, `${coreColor}0.95)`);
    bellGrad.addColorStop(0.5, `${mainColor}0.5)`);
    bellGrad.addColorStop(0.9, `${mainColor}0.25)`);
    bellGrad.addColorStop(1, `${mainColor}0.05)`);

    ctx.beginPath();
    // Top dome
    ctx.moveTo(-rX, 0);
    ctx.bezierCurveTo(-rX, -rY * 1.35, rX, -rY * 1.35, rX, 0);
    // Scalloped bottom rim
    const lobes = 5;
    const step = (rX * 2) / lobes;
    for (let i = lobes; i >= 0; i--) {
      const lx = -rX + i * step;
      const midX = lx - step * 0.5;
      ctx.quadraticCurveTo(midX, rY * 0.22 * (pulse * 0.5 + 1), lx - step, 0);
    }
    ctx.fillStyle = bellGrad;
    ctx.fill();

    // Inner glowing core organ
    ctx.beginPath();
    ctx.ellipse(0, -rY * 0.25, rX * 0.35, rY * 0.45, 0, 0, Math.PI * 2);
    ctx.fillStyle = `${coreColor}0.75)`;
    ctx.fill();

    ctx.restore();
  }
}

export class DeepSeaAnglerfish {
  constructor(canvasWidth, canvasHeight) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.x = canvasWidth * 0.82;
    this.y = canvasHeight * 0.65;
    this.speedX = -0.3;
    this.alpha = 0;
    this.lurePhase = 0;
    this.jawAngle = 0;
  }

  update(width, height, depthRatio) {
    // Only lurks in deepest waters (depthRatio > 0.72)
    if (depthRatio > 0.7) {
      this.alpha = Math.min(0.85, this.alpha + 0.02);
    } else {
      this.alpha = Math.max(0, this.alpha - 0.03);
    }

    if (this.alpha <= 0) return;

    this.lurePhase += 0.04;
    this.x += this.speedX;
    this.y += Math.sin(this.lurePhase * 0.5) * 0.2;

    if (this.x < -150) {
      this.x = width + 150;
      this.y = height * (0.5 + Math.random() * 0.35);
    }
  }

  draw(ctx) {
    if (this.alpha <= 0.01) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.globalAlpha = this.alpha;
    ctx.scale(-1, 1); // Facing left

    const lureSway = Math.sin(this.lurePhase) * 12;
    const lureGlow = 0.7 + 0.3 * Math.sin(this.lurePhase * 2);

    // --- Bioluminescent Esca (Lure) ---
    const lureTipX = 55 + Math.sin(this.lurePhase) * 6;
    const lureTipY = -65 + lureSway;

    // Glowing stalk (Illicium)
    ctx.beginPath();
    ctx.moveTo(15, -15);
    ctx.bezierCurveTo(25, -50, 40, -60, lureTipX, lureTipY);
    ctx.strokeStyle = 'rgba(56, 239, 125, 0.4)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Radiant glowing bulb
    ctx.shadowBlur = 28 * lureGlow;
    ctx.shadowColor = '#38ef7d';
    ctx.beginPath();
    ctx.arc(lureTipX, lureTipY, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180, 255, 200, ${lureGlow})`;
    ctx.fill();

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(lureTipX, lureTipY, 9, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(56, 239, 125, ${lureGlow * 0.3})`;
    ctx.fill();

    // Reset shadow for dark predatory body
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';

    // Body silhouette
    ctx.fillStyle = '#050c14';
    ctx.beginPath();
    ctx.moveTo(25, -10); // Snout
    ctx.quadraticCurveTo(0, -32, -35, -20); // Back
    ctx.quadraticCurveTo(-65, -15, -80, 0); // Peduncle
    ctx.lineTo(-95, -12); // Tail upper
    ctx.lineTo(-88, 0);
    ctx.lineTo(-95, 12); // Tail lower
    ctx.lineTo(-80, 0);
    ctx.quadraticCurveTo(-55, 22, -15, 20); // Belly
    ctx.quadraticCurveTo(15, 22, 25, 8); // Lower jaw
    ctx.closePath();
    ctx.fill();

    // Sharp translucent glowing fangs
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.moveTo(20, -6);
    ctx.lineTo(22, 2);
    ctx.lineTo(18, -4);
    ctx.moveTo(14, -7);
    ctx.lineTo(16, 1);
    ctx.lineTo(12, -5);
    ctx.moveTo(22, 6);
    ctx.lineTo(24, -2);
    ctx.lineTo(20, 4);
    ctx.fill();

    // Small bioluminescent eye
    ctx.beginPath();
    ctx.arc(10, -12, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = '#38ef7d';
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#38ef7d';
    ctx.fill();

    ctx.restore();
  }
}

export class BenthicPlankton {
  constructor(canvasWidth, canvasHeight) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.count = 45;
    this.particles = [];
    for (let i = 0; i < this.count; i++) {
      this.particles.push({
        x: Math.random() * canvasWidth,
        y: canvasHeight - Math.random() * 260, // near bottom
        size: 1 + Math.random() * 2.5,
        speedX: (Math.random() - 0.5) * 0.25,
        speedY: -(0.1 + Math.random() * 0.2),
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        color: Math.random() > 0.4 ? 'rgba(0, 240, 255,' : 'rgba(255, 200, 100,'
      });
    }
  }

  update(width, height, depthRatio) {
    // Only visible at extreme depth (seabed, depthRatio > 0.8)
    const active = depthRatio > 0.78;
    for (let p of this.particles) {
      p.x += p.speedX;
      p.y += p.speedY;
      p.pulse += p.pulseSpeed;

      // Wrap around near seabed
      if (p.y < height - 300) p.y = height + 10;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
    }
    return active;
  }

  draw(ctx, depthRatio) {
    if (depthRatio <= 0.78) return;
    const fade = Math.min(1.0, (depthRatio - 0.78) * 4.5);

    ctx.save();
    for (let p of this.particles) {
      const brightness = (0.4 + 0.6 * Math.sin(p.pulse)) * fade;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color + '0.8)';
      ctx.fillStyle = `${p.color}${brightness})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
