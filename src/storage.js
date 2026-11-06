// Persistent data across sessions: best score, Customer Book, audio switches, tutorial flag.
// Plain localStorage, no platform SDK. If storage is blocked, progress lasts for this session only.
// The platform hooks (gameReady, level events, ads) are kept as no-ops so a portal SDK can be wired
// in here later without touching the scenes. EraStorage.init() must finish before the game starts.

window.EraStorage = (function () {
  const BOOK_KEY = 'erapop.book.v1';
  const BEST_KEY = 'erapop.best.v1';
  const AUDIO_KEY = 'erapop.audio.v1';
  const TUTORIAL_KEY = 'erapop.tutorial.v1';
  const KEYS = [BOOK_KEY, BEST_KEY, AUDIO_KEY, TUTORIAL_KEY];

  let local = null;
  try { local = window.localStorage; } catch (e) { /* blocked */ }

  const cache = {};           // key -> JSON string (or null), loaded once at startup

  function parse(v, fallback) {
    if (v === null || v === undefined || v === '') return fallback;
    try { return JSON.parse(v); } catch (e) { return fallback; }
  }

  function read(key, fallback) {
    return parse(cache[key], fallback);
  }

  function write(key, value) {
    const s = JSON.stringify(value);
    cache[key] = s;
    try { if (local) local.setItem(key, s); } catch (e) { /* storage unavailable */ }
  }

  let book = new Set();

  return {
    // Loads the saves. Never rejects.
    async init() {
      for (const k of KEYS) { try { cache[k] = local ? local.getItem(k) : null; } catch (e) { cache[k] = null; } }
      book = new Set(read(BOOK_KEY, []));
    },
    backend() { return 'local'; },

    // Platform hooks: no SDK, so these do nothing.
    gameReady() {},
    levelStarted() {},
    levelPaused() {},
    levelResumed() {},
    levelFailed() {},
    showInterstitial() {},
    rewardedAvailable() { return false; },
    // No rewarded ads: the reward is granted straight away (Revive is free).
    showRewarded(onReward, onDone) { onReward(); if (onDone) onDone(); },

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
