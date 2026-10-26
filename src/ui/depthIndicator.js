/**
 * Depth HUD Indicator:
 * Real-time depth gauge (0m -> 3850m), ocean zone name,
 * temperature, pressure metrics, and interactive zone jump anchors.
 */

import { CONFIG } from '../config.js';

export class DepthIndicator {
  constructor(containerElement, onZoneJump) {
    this.container = containerElement;
    this.onZoneJump = onZoneJump;

    this.meterValEl = null;
    this.zoneNameEl = null;
    this.tempValEl = null;
    this.atmValEl = null;
    this.probeIndicatorEl = null;

    this.currentDepth = 0;
    this.targetDepth = 0;
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="depth-hud-inner" id="depth-hud">
        <div class="depth-header">
          <span class="depth-sublabel">DEPTH TELEMETRY</span>
          <div class="depth-metric">
            <span class="depth-number" id="depth-num">0</span>
            <span class="depth-unit">M</span>
          </div>
        </div>

        <div class="depth-track-wrapper">
          <div class="depth-track">
            <div class="depth-fill" id="depth-fill"></div>
            <div class="depth-probe" id="depth-probe">
              <span class="probe-light"></span>
            </div>
          </div>
          <div class="depth-zone-markers">
            <button class="zone-marker" data-zone="surface" title="Jump to Epipelagic (Sunlight)">
              <span class="marker-dot"></span>
              <span class="marker-label">0m Sunlight</span>
            </button>
            <button class="zone-marker" data-zone="twilight" title="Jump to Mesopelagic (Twilight)">
              <span class="marker-dot"></span>
              <span class="marker-label">200m Twilight</span>
            </button>
            <button class="zone-marker" data-zone="midnight" title="Jump to Bathypelagic (Midnight)">
              <span class="marker-dot"></span>
              <span class="marker-label">1000m Midnight</span>
            </button>
            <button class="zone-marker" data-zone="abyss" title="Jump to Abyssopelagic (Abyss)">
              <span class="marker-dot"></span>
              <span class="marker-label">2500m Abyss</span>
            </button>
          </div>
        </div>

        <div class="depth-footer">
          <div class="zone-badge" id="depth-zone-name">Sunlight Zone</div>
          <div class="env-stats">
            <div class="stat-item"><span class="stat-label">TEMP</span><span class="stat-val" id="temp-val">24°C</span></div>
            <div class="stat-item"><span class="stat-label">BAR</span><span class="stat-val" id="atm-val">1 ATM</span></div>
          </div>
        </div>
      </div>
    `;

    this.meterValEl = this.container.querySelector('#depth-num');
    this.zoneNameEl = this.container.querySelector('#depth-zone-name');
    this.tempValEl = this.container.querySelector('#temp-val');
    this.atmValEl = this.container.querySelector('#atm-val');
    this.depthFillEl = this.container.querySelector('#depth-fill');
    this.probeIndicatorEl = this.container.querySelector('#depth-probe');

    // Click to jump to zones
    this.container.querySelectorAll('.zone-marker').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const zone = btn.getAttribute('data-zone');
        if (this.onZoneJump) {
          this.onZoneJump(zone);
        }
      });
    });
  }

  update(depthRatio) {
    const maxMeters = CONFIG.MAX_DEPTH_METERS;
    this.targetDepth = Math.round(depthRatio * maxMeters);

    // Smooth lerp for depth number
    this.currentDepth += (this.targetDepth - this.currentDepth) * 0.15;
    const rounded = Math.round(this.currentDepth);

    if (this.meterValEl) {
      this.meterValEl.textContent = rounded.toLocaleString();
    }

    // Gauge fill & probe position
    const percent = Math.min(100, Math.max(0, depthRatio * 100));
    if (this.depthFillEl) {
      this.depthFillEl.style.height = `${percent}%`;
    }
    if (this.probeIndicatorEl) {
      this.probeIndicatorEl.style.top = `${percent}%`;
    }

    // Zone info and environmental stats
    let zoneTitle = 'Sunlight Zone';
    let temp = '24°C';
    let atm = '1 ATM';

    if (rounded < 200) {
      zoneTitle = 'Sunlight Zone';
      const t = 24 - (rounded / 200) * 12;
      temp = `${t.toFixed(1)}°C`;
      atm = `${(1 + (rounded / 10)).toFixed(0)} ATM`;
    } else if (rounded < 1000) {
      zoneTitle = 'Twilight Zone';
      const t = 12 - ((rounded - 200) / 800) * 7;
      temp = `${t.toFixed(1)}°C`;
      atm = `${(20 + ((rounded - 200) / 10)).toFixed(0)} ATM`;
    } else if (rounded < 2500) {
      zoneTitle = 'Midnight Zone';
      const t = 5 - ((rounded - 1000) / 1500) * 2.8;
      temp = `${t.toFixed(1)}°C`;
      atm = `${(100 + ((rounded - 1000) / 10)).toFixed(0)} ATM`;
    } else {
      zoneTitle = 'Abyssal Trench';
      temp = '1.8°C';
      atm = `${(250 + ((rounded - 2500) / 10)).toFixed(0)} ATM`;
    }

    if (this.zoneNameEl) this.zoneNameEl.textContent = zoneTitle;
    if (this.tempValEl) this.tempValEl.textContent = temp;
    if (this.atmValEl) this.atmValEl.textContent = atm;
  }
}
