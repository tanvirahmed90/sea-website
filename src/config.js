/**
 * =========================================================================
 * TANVIR — OCEAN DESCENT CONFIGURATION
 * Tune any parameter here to customize simulation dynamics, species,
 * speed, colors, and ocean depth thresholds.
 * =========================================================================
 */

export const CONFIG = {
  // --- Hero & Surface Schooling Fish (Boids) ---
  FISH_COUNT: 28,                  // Number of glowing orange/gold fish
  FISH_MAX_SPEED: 2.6,             // Cruising speed
  FISH_MAX_FORCE: 0.08,            // Agility / steering force
  FISH_SEPARATION_RADIUS: 36,      // Distance fish maintain from each other
  FISH_ALIGN_RADIUS: 70,           // Distance within which fish align headings
  FISH_COHESION_RADIUS: 90,        // Distance within which fish flock together
  FISH_WIGGLE_SPEED: 0.22,         // Tail wiggle oscillation speed
  FISH_BODY_LENGTH: 20,            // Length of fish in pixels
  FISH_BODY_WIDTH: 7,              // Width of fish in pixels
  
  // --- Mouse / Touch Interactivity ---
  MOUSE_ATTRACTION_FORCE: 0.035,   // Gentle attraction to mouse when calm
  MOUSE_SCATTER_FORCE: 2.8,        // Repulsion force when mouse moves fast
  MOUSE_SCATTER_SPEED_THRESHOLD: 10,// Mouse speed in px/frame to trigger scattering
  MOUSE_IDLE_TIMEOUT: 2000,        // Milliseconds before fish enter wandering mode

  // --- Depth Simulation & Zones ---
  MAX_DEPTH_METERS: 3850,          // Deep sea trench maximum depth
  ZONES: {
    SUNLIGHT: { min: 0, max: 200, name: "Epipelagic Zone", title: "Sunlight Zone", temp: "22°C", atm: "1–20 ATM" },
    TWILIGHT: { min: 200, max: 1000, name: "Mesopelagic Zone", title: "Twilight Zone", temp: "8°C", atm: "20–100 ATM" },
    MIDNIGHT: { min: 1000, max: 2500, name: "Bathypelagic Zone", title: "Midnight Zone", temp: "4°C", atm: "100–250 ATM" },
    ABYSS: { min: 2500, max: 4000, name: "Abyssopelagic Zone", title: "The Abyss", temp: "1.8°C", atm: "250–385 ATM" }
  },

  // --- Particles & Marine Environment ---
  BUBBLE_COUNT: 38,                // Number of buoyant bubbles rising
  MARINE_SNOW_COUNT: 110,          // Suspended floating organic particles
  LIGHT_RAY_COUNT: 5,              // Volumetric light shafts streaming from ceiling

  // --- Creature Populations Across Depths ---
  MIDWATER_FISH_COUNT: 12,         // Calmer silver/blue fish at mid-depths
  JELLYFISH_COUNT: 6,              // Bioluminescent jellyfish in deep water
  ANGLERFISH_ENABLED: true,        // Mysterious glowing anglerfish in the abyss
  MANTA_RAY_ENABLED: true,         // Silhouetted manta ray gliding across twilight zone

  // --- Color Palette ---
  COLORS: {
    DEEP_BG: "#020812",            // Deep navy/black ocean background
    TEAL_SURFACE: "#0f6f86",       // Surface teal tone
    CYAN_BEAM: "rgba(0, 240, 255, 0.22)", // Volumetric light beam
    FISH_PRIMARY: "#ff9500",       // Golden orange fish core
    FISH_ACCENT: "#ffd166",        // Warm golden highlight
    FISH_GLOW: "rgba(255, 149, 0, 0.45)", // Bioluminescent aura
    SILVER_FISH: "#94a3b8",        // Mid-water fish color
    SILVER_GLOW: "rgba(148, 163, 184, 0.35)",
    JELLY_CYAN: "rgba(0, 240, 255, 0.7)",
    JELLY_PURPLE: "rgba(192, 132, 252, 0.6)",
    ANGLER_LURE: "rgba(56, 239, 125, 0.95)"
  }
};
