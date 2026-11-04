// Era Pop — tuning config.
// Every balancing value the GDD leaves open lives here so it can be tuned during playtesting.
// Tiers are 0-based everywhere: 0 Wheel, 1 Cart, 2 Carriage, 3 Bicycle, 4 Car, 5 Plane, 6 Rocket.

window.ERA_POP_CONFIG = {
  version: '0.1.16',

  // ---- Capsule (world units; the capsule is scaled to fit the screen) ----
  capsule: {
    width: 460,          // inner width
    height: 640,         // inner height
    wallThickness: 60,
    dropY: -55,          // where the held bubble sits, inside the portal above the capsule
    dangerLineY: 85,     // Suika-style lose line, measured from the capsule top
  },

  // Bubble radius per tier (world units).
  bubbleRadius: [22, 30, 39, 49, 60, 72, 86],

  // ---- Physics (Matter.js) — low friction and a little bounce so bubbles slide off each other ----
  physics: {
    gravityY: 2.4,
    restitution: 0.2,    // bounciness (0 = none)
    friction: 0.02,
    frictionStatic: 0.05,
    frictionAir: 0.01,
    density: 0.002,
    lockRotation: true,  // keeps vehicles upright inside their bubbles
  },

  // ---- Dropping ----
  drop: {
    cooldownMs: 300,           // delay before the next bubble is ready
    spawnTierWeights: [1, 1, 1], // random pick among the lowest three tiers (Wheel, Cart, Carriage)
  },

  // ---- Lose condition ----
  lose: {
    graceMs: 2000,       // how long a settled bubble may stay above the line before game over
  },

  // ---- Scoring ----
  scoring: {
    // Points for creating each tier by merging (index = tier created; index 0 unused).
    mergePoints: [0, 2, 5, 10, 20, 40, 80],
    rocketPopPoints: 160,              // two Rockets merging and disappearing
    orderBonus: [15, 30, 60, 120, 240, 480, 1000],   // per ordered tier
    timeoutPenalty: [10, 15, 25, 40, 60, 90, 150],   // per ordered tier
    scoreFloor: 0,                     // score never drops below this
  },

  // ---- Customers & orders ----
  customers: {
    maxSlots: 5,                 // up to 5 customers wait at once
    // How many slots are open over time (seconds of play).
    slotRamp: [
      { atSec: 0, slots: 3 },
      { atSec: 40, slots: 4 },
      { atSec: 100, slots: 5 },
    ],
    firstCustomerDelayMs: 1500,
    spawnIntervalStartMs: 6500,  // time between arrivals at the start...
    spawnIntervalEndMs: 3800,    // ...shrinking to this...
    spawnIntervalRampSec: 200,   // ...over this many seconds
    retryWhenFullMs: 1500,       // if every open slot is taken, try again after this
    hybridChance: 0.75,          // chance a customer is a hybrid (look era != job era)
    orderTimeBaseSec: 22,        // order time limit = base + perTier * tier
    orderTimePerTierSec: 6,
    // Order size ramp: the ordered tier is picked uniformly between min and max.
    orderTierRamp: [
      { atSec: 0, min: 0, max: 1 },
      { atSec: 30, min: 0, max: 2 },
      { atSec: 60, min: 1, max: 3 },
      { atSec: 100, min: 1, max: 4 },
      { atSec: 150, min: 2, max: 5 },
      { atSec: 200, min: 2, max: 6 },
      { atSec: 280, min: 3, max: 6 },
    ],
    arriveSec: 0.35,             // card fade-in
    leaveSec: 0.8,               // card fade-out after serve / timeout
  },

  // ---- Input ----
  input: {
    dragThresholdPx: 12,         // CSS pixels a press on a bubble must move to become a drag (otherwise it's a tap = drop)
  },

  // ---- Display ----
  display: {
    maxPixelRatio: 2,            // render at device resolution, capped for performance
  },
};
