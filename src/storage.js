// Platform layer (Playgama Bridge SDK) + persistent data across sessions: best score, Customer Book,
// audio switches, tutorial flag.
// Saves go through bridge.storage (the platform's own save on Playgama and its partner portals; the
// Bridge falls back to local storage elsewhere). If the Bridge script is missing or fails, the game
// keeps working on plain localStorage. EraStorage.init() must finish before the game starts (main.js waits).

window.EraStorage = (function () {
  const BOOK_KEY = 'erapop.book.v1';
  const BEST_KEY = 'erapop.best.v1';
  const AUDIO_KEY = 'erapop.audio.v1';
  const TUTORIAL_KEY = 'erapop.tutorial.v1';
  const KEYS = [BOOK_KEY, BEST_KEY, AUDIO_KEY, TUTORIAL_KEY];
  const SDK_TIMEOUT_MS = 10000;

  let local = null;
  try { local = window.localStorage; } catch (e) { /* blocked: progress lasts for this session only */ }

  let bridge = null;          // window.bridge once initialized
  const cache = {};           // key -> JSON string (or null), loaded once at startup

  function parse(v, fallback) {
    if (v === null || v === undefined || v === '') return fallback;
    if (typeof v !== 'string') return v;   // some platforms hand back parsed values
    try { return JSON.parse(v); } catch (e) { return fallback; }
  }

  function read(key, fallback) {
    return parse(cache[key], fallback);
  }

  function write(key, value) {
    const s = JSON.stringify(value);
    cache[key] = s;
    if (bridge) {
      try { bridge.storage.set([key], [s]).catch(() => {}); } catch (e) { /* save failed: kept for this session */ }
    } else {
      try { if (local) local.setItem(key, s); } catch (e) { /* storage unavailable */ }
    }
  }

  async function initBridge() {
    const B = window.bridge;
    if (!B || typeof B.initialize !== 'function') return;   // SDK script missing/blocked
    await Promise.race([
      B.initialize(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('Playgama Bridge init timed out')), SDK_TIMEOUT_MS)),
    ]);
    const data = await B.storage.get(KEYS);
    KEYS.forEach((k, i) => { cache[k] = data ? data[i] : null; });
    // Players from an earlier build on the same site keep their local progress.
    if (local) {
      const moved = [], vals = [];
      for (const k of KEYS) {
        if (cache[k] === null || cache[k] === undefined) {
          const v = local.getItem(k);
          if (v !== null) { cache[k] = v; moved.push(k); vals.push(v); }
        }
      }
      if (moved.length) B.storage.set(moved, vals).catch(() => {});
    }
    bridge = B;
  }

  // Platform pause (tab hidden, ad open) and audio switch. Both mute; pause also freezes the game loop.
  let platformPaused = false, platformMuted = false;
  function applyPlatformState() {
    const game = window.ERA_GAME;
    if (!game) return;
    if (game.sound) game.sound.mute = platformPaused || platformMuted;
    try {
      if (platformPaused && !game.isPaused) game.pause();
      else if (!platformPaused && game.isPaused) game.resume();
    } catch (e) { /* older engine: mute only */ }
  }

  function message(name) {
    if (!bridge) return;
    try { bridge.platform.sendMessage(name).catch(() => {}); } catch (e) { /* the game keeps running */ }
  }

  let book = new Set();
  let readySent = false;

  return {
    // Starts the Bridge and loads the saves. Never rejects.
    async init() {
      try {
        await initBridge();
      } catch (e) {
        console.warn('[EraStorage] Playgama Bridge unavailable, using localStorage:', e && (e.message || e));
        bridge = null;
      }
      if (!bridge) for (const k of KEYS) { try { cache[k] = local ? local.getItem(k) : null; } catch (e) { cache[k] = null; } }
      book = new Set(read(BOOK_KEY, []));
      if (bridge) {
        try {
          platformMuted = bridge.platform.isAudioEnabled === false;
          bridge.platform.on(bridge.EVENT_NAME.AUDIO_STATE_CHANGED, (on) => { platformMuted = !on; applyPlatformState(); });
          bridge.platform.on(bridge.EVENT_NAME.PAUSE_STATE_CHANGED, (p) => { platformPaused = !!p; applyPlatformState(); });
        } catch (e) { /* events unsupported */ }
      }
    },
    backend() { return bridge ? 'playgama:' + bridge.platform.id : 'local'; },
    // First playable frame is up (GameScene.create): call once.
    gameReady() {
      applyPlatformState();
      if (!readySent) { readySent = true; message('game_ready'); }
    },
    levelStarted() { message('level_started'); },
    levelPaused() { message('level_paused'); },
    levelResumed() { message('level_resumed'); },
    levelFailed() { message('level_failed'); },

    // Interstitial at natural breaks (restart after game over). The Bridge decides if one actually shows.
    showInterstitial() {
      if (!bridge) return;
      try { if (bridge.advertisement.isInterstitialSupported) bridge.advertisement.showInterstitial(); } catch (e) { /* no ad */ }
    },
    rewardedAvailable() {
      try { return !!(bridge && bridge.advertisement.isRewardedSupported); } catch (e) { return false; }
    },
    // Rewarded ad: onReward runs only when the platform reports 'rewarded'; onDone runs once the ad
    // closes or fails (reward or not).
    showRewarded(onReward, onDone) {
      if (!this.rewardedAvailable()) { onReward(); if (onDone) onDone(); return; }
      const A = bridge.advertisement, EV = bridge.EVENT_NAME.REWARDED_STATE_CHANGED;
      let rewarded = false;
      const h = (state) => {
        if (state === 'rewarded' && !rewarded) { rewarded = true; onReward(); }
        if (state === 'closed' || state === 'failed') {
          try { A.off(EV, h); } catch (e) { /* ignore */ }
          if (onDone) onDone();
        }
      };
      A.on(EV, h);
      try { A.showRewarded(); } catch (e) { h('failed'); }
    },

    loadBest() { return Number(read(BEST_KEY, 0)) || 0; },
    saveBest(v) { write(BEST_KEY, v); },
    hasInBook(look, job) { return book.has(look + '-' + job); },
    bookCount() { return book.size; },
    // Music and sound effects switch on/off separately.
    getAudio() {
      const a = read(AUDIO_KEY, null);
      return { music: !a || a.music !== false, sfx: !a || a.sfx !== false };
    },
    setAudio(a) { write(AUDIO_KEY, { music: !!a.music, sfx: !!a.sfx }); },
    // The first-run tutorial is shown until it has been finished once.
    tutorialDone() { return read(TUTORIAL_KEY, false) === true; },
    setTutorialDone() { write(TUTORIAL_KEY, true); },
    // Returns true if this customer is new to the book.
    addToBook(look, job) {
      const k = look + '-' + job;
      if (book.has(k)) return false;
      book.add(k);
      write(BOOK_KEY, [...book]);
      return true;
    },
  };
})();
