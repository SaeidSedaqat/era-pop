// Era Pop — tuning config.
// Every balancing value the GDD leaves open lives here so it can be tuned during playtesting.
// Tiers are 0-based everywhere: 0 Wheel, 1 Cart, 2 Carriage, 3 Bicycle, 4 Car, 5 Plane, 6 Rocket.

window.ERA_POP_CONFIG = {
  version: '0.1.265',

  // ---- Capsule (world units; the capsule is scaled to fit the screen) ----
  capsule: {
    width: 460,          // inner width
    height: 640,         // inner height
    wallThickness: 60,
    dropY: -65,          // where the held bubble sits, above the capsule
    dangerLineY: 85,     // Suika-style lose line, measured from the capsule top
    // The danger line creeps down over the run, shrinking the capsule: after startSec it moves
    // pxPerMin world units per minute until it reaches maxY.
    dangerCreep: { startSec: 60, pxPerMin: 24, maxY: 285 },
  },

  // Bubble radius per tier (world units).
  bubbleRadius: [31, 42, 55, 69, 84, 101, 120],

  // ---- Physics (Matter.js) — low friction and a little bounce so bubbles slide off each other ----
  physics: {
    gravityY: 2.4,
    restitution: 0.2,    // bounciness (0 = none)
    friction: 0.02,
    frictionStatic: 0.05,
    frictionAir: 0.01,
    density: 0.002,
    lockRotation: true,  // physics bodies don't rotate (stable stacking); the visual spin below is separate
    // Visual spin: bubbles get a spin kick when they hit each other and roll with their sideways motion.
    spin: { hitKick: 0.6, rollFollow: 0.12, maxSpin: 0.3 },  // maxSpin in radians per frame
  },

  // ---- Dropping ----
  drop: {
    cooldownMs: 300,           // delay before the next bubble is ready (a tap during it is queued)
    // Odds for the next bubble among the lowest three tiers [Wheel, Cart, Carriage], shifting
    // toward Carriage over time so the capsule fills faster as the game goes on.
    spawnWeightRamp: [
      { atSec: 0, weights: [3, 2, 1] },
      { atSec: 90, weights: [2, 2, 2] },
      { atSec: 240, weights: [1, 2, 3] },
      { atSec: 420, weights: [1, 1, 4] },
    ],
  },

  // ---- Lose condition ----
  lose: {
    graceMs: 2000,       // how long a settled bubble may stay above the line before game over
  },

  // ---- Scoring ----
  scoring: {
    // Points for creating each tier by merging (index = tier created; index 0 unused).
    mergePoints: [0, 4, 10, 25, 60, 150, 400],
    rocketPopPoints: 1000,             // two Rockets merging and disappearing
    orderBonus: [15, 30, 60, 150, 300, 600, 1500],   // per ordered tier
    timeoutPenalty: [10, 15, 25, 50, 80, 120, 200],  // per ordered tier
    // Orders pay more as the run goes on: each order served adds perOrder to the order multiplier, up to max.
    orderGrowth: { perOrder: 0.1, max: 2.5 },
    scoreFloor: 0,                     // score never drops below this
    // Combo: each merge within windowMs of the previous one adds stepMultiplier (x1, x1.5, x2 ... up to max).
    combo: { windowMs: 1000, stepMultiplier: 0.5, maxMultiplier: 4 },
    // Tip: serving while the order still has this fraction of its time left adds rate × the order bonus.
    tip: { windowFraction: 0.33, rate: 0.5 },
  },

  // ---- Time storms: every so often time glitches for a short burst with a twist ----
  storms: {
    firstAtSec: 120,
    everySec: 150,               // gap between the end of one storm and the start of the next
    durationSec: 15,
    eraOrderMultiplier: 2,       // "Era invasion": every new customer has one era's look, orders pay x2
    mergeMultiplier: 2,          // "Merge frenzy": merge points x2
    rushSpawnFactor: 0.4,        // "Rush hour": customers arrive this much faster...
    rushOrderMultiplier: 1.5,    // ...and their orders pay x1.5
  },

  // ---- Customers & orders ----
  customers: {
    maxSlots: 1,                 // one customer (one order) at a time
    // How many slots are open over time (seconds of play).
    slotRamp: [
      { atSec: 0, slots: 1 },
    ],
    firstCustomerDelayMs: 4000,
    betweenOrdersMs: 5000,       // pause after a customer leaves before the next one walks in
    retryWhenFullMs: 1500,       // if every open slot is taken, try again after this
    hybridChance: 0.75,          // chance a customer is a hybrid (look era != job era)
    orderTimeBaseSec: 20,        // order time limit = base + perTier * tier (Wheel 20 s, Bicycle 50 s ... Plane 70 s)
    orderTimePerTierSec: 10,
    gentleCustomers: 2,          // the first N customers can time out safely; after that a missed order is game over
    // Order time shrinks with every order served: time × max(minFactor, 1 − perOrder × served).
    orderTimeShrink: { perOrder: 0.04, minFactor: 0.5 },
    // Rocket orders only appear when one could be served soon (a Rocket or this many Planes in the
    // capsule), otherwise a smaller order is picked. They also get extra time.
    rocketOrders: { minPlanes: 2, extraTimeSec: 40 },
    // Order size ramp: the ordered tier is picked uniformly between min and max. Every tier from Wheel (0)
    // can be ordered; bigger items join the pool over time.
    orderTierRamp: [
      { atSec: 0, min: 0, max: 3 },
      { atSec: 90, min: 0, max: 4 },
      { atSec: 180, min: 0, max: 5 },
      { atSec: 300, min: 0, max: 6 },
    ],
    arriveSec: 0.35,             // card fade-in
    leaveSec: 0.8,               // card fade-out after serve / timeout
  },

  // ---- Audio ----
  audio: {
    musicVolume: 0.35,
    sfxVolume: { default: 0.6, drop: 0.5, merge: 0.7, tick: 0.35, gameover: 0.7 },
    mergePitchBase: 1.35,        // smallest merge plays at this rate...
    mergePitchPerTier: -0.08,    // ...each bigger tier a bit lower
    comboPitchStep: 0.06,        // each combo step raises the pitch a little
    dangerTickMs: 500,           // tick while a bubble is above the danger line
  },

  // ---- Revive (free for now; becomes a rewarded ad at full launch) ----
  revive: {
    perRun: 1,                   // "Revive" uses per run
    clearDepth: 260,             // revive removes every bubble whose top is within this distance below the danger line (or above it)
  },

  // ---- Input ----
  input: {
    dragThresholdPx: 12,         // CSS pixels a press on a bubble must move to become a drag (otherwise it's a tap = drop)
  },

  // ---- Display ----
  display: {
    maxPixelRatio: 2,            // render at device resolution, capped for performance
    fps: 60,                     // frame rate cap (high-refresh screens would otherwise run faster)
  },
};
