# Foldcraft — Ocean Descent 🌊

> **Brand & Visual Storytelling Studio**  
> An immersive, single-page "descent into the ocean" web experience running at 60 FPS.

---

## 🎨 Visual Aesthetics & Design System
- **Atmosphere**: Dark, cinematic, moody underwater world transitioning from sunlit teal surface (`#0f6f86`) down to deep midnight navy and pitch-black abyssal trenches (`#020812` / `#010408`).
- **Typography**: Clean, modern sans-serif typography featuring **Space Grotesk** for display headlines, **Inter** for readable muted body text, and **Space Mono** for depth telemetry HUD.
- **Accent Palette**: Radiant bioluminescent orange & gold fish (`#ff8f1c`, `#ffd166`), cyan light shafts (`#00f0ff`), and violet deep-sea glows (`#c084fc`).

---

## 🐟 Fish Flocking Dynamics (Boids Simulation)
The schooling fish are rendered on a full-screen fixed `<canvas>` with custom vector physics and boids flocking algorithms:
1. **Separation**: Fish maintain minimum distances from peers to prevent crowding.
2. **Alignment**: Fish steer towards the average heading of neighboring flockmates.
3. **Cohesion**: Fish gravitate toward the center of mass of the local school.
4. **Mouse & Touch Interaction**:
   - **Gentle movements**: Fish smoothly and organically follow the cursor with natural lag and easing.
   - **Fast movements**: When mouse speed exceeds the sensitivity threshold, fish emit a radial scatter impulse and regroup shortly after.
   - **Idle state**: Fish swim in graceful, lazy sinusoidal loops.
   - **Touch Devices**: Automatically detects touch coordinates for seamless mobile interaction.
5. **Anatomy & Glow**:
   - Rotates to match direction of travel with angular smoothing.
   - Oscillating sinusoidal tail wiggle proportional to swim speed.
   - Translucent dorsal and pectoral fins with warm golden bioluminescent aura.
6. **Button Gathering**: When hovering the **"Send Dispatch →"** button at the seabed or the **"Let's Talk"** pill button, the fish school gathers and orbits curiously around the button!

---

## 🧭 Depth Descent & Fauna Evolution
As the user scrolls down, the page simulates a continuous dive through all oceanic zones:

| Depth (Meters) | Ocean Zone | Featured Fauna & Environment | Section |
| :--- | :--- | :--- | :--- |
| **0m – 200m** | **Epipelagic (Sunlight)** | 28 Glowing Orange/Gold Schooling Fish, Volumetric Skylight Light Beams, Shifting Floor Caustics | Hero |
| **200m – 1,000m** | **Mesopelagic (Twilight)** | Calmer Blue-Silver Fish, Gliding Manta Ray Silhouette with undulating wings | Studio / About |
| **1,000m – 2,500m** | **Bathypelagic (Midnight)** | Bioluminescent Moon Jellyfish with pulsing bells and waving tentacles, Interactive 3D Tilt Project Cards | Projects Archives |
| **2,500m – 3,850m** | **Abyssopelagic (The Abyss)** | Deep-sea Anglerfish with swaying illuminated lure, Twinkling Benthic Plankton, Hydrothermal Seabed Silhouettes | Process & Reach Us |

---

## ⚙️ Easy Configuration
You can easily tune the simulation dynamics directly at the top of [`src/main.js`](file:///d:/sea%20website/src/main.js) or [`src/config.js`](file:///d:/sea%20website/src/config.js):

```javascript
export const FISH_COUNT = 28;                 // Number of glowing orange fish
export const FISH_SPEED = 2.6;                // Cruising speed (pixels/frame)
export const FISH_SEPARATION = 36;            // Separation distance between flockmates
export const FISH_ALIGNMENT = 70;             // Alignment sensing radius
export const FISH_COHESION = 90;              // Cohesion sensing radius
export const MOUSE_SCATTER_SENSITIVITY = 10;  // Mouse speed threshold to trigger scatter
export const MAX_OCEAN_DEPTH = 3850;          // Maximum depth in meters
```

---

## 🛠️ Extra Polish & Technical Features
- **Smooth Inertial Scrolling**: Powered by **Lenis** smooth scroll, synchronizing background gradients, parallax layers, and depth telemetry.
- **Live Depth Telemetry HUD**: Fixed right-hand gauge showing real-time depth (0m → 3,850m), oceanic zone, probe indicator, water temperature, pressure (1 to 385 ATM), and clickable quick-jump zone anchors.
- **Web Audio API Ambient Synthesizer**: 100% self-contained underwater soundscape featuring sub-bass oceanic drone, low-frequency current wash, and dynamic low-pass filtering based on water depth. Off by default with animated dancing equalizer bars on toggle.
- **Bioluminescent Custom Cursor**: Smooth lag lerp, fluid aura ring, and magnetic hover magnification over cards, buttons, and links.
- **3D Interactive Card Tilt**: Project cards calculate mouse position with perspective transforms and real-time specular glare reflection.
- **Preloader Screen**: Deep dive initialization animation with rising bubbles and progress counter.
- **Accessibility**: Automatically detects `prefers-reduced-motion` and scales down boids and parallax accordingly.

---

## 🚀 Running Locally

### Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
npm run build
```
Creates an optimized, production bundle in the `dist/` directory ready for deployment.
