// Persistent data across sessions: best score, Customer Book, audio switches, tutorial flag.
// On CrazyGames the saves go through the SDK Data module (synced to the player's account, or kept
// as guest data by the SDK). Anywhere else (GitHub Pages, SDK blocked or failing) they use localStorage.
// EraStorage.init() must finish before the game starts (main.js waits for it).

window.EraStorage = (function () {
  const BOOK_KEY = 'erapop.book.v1';
  const BEST_KEY = 'erapop.best.v1';
  const AUDIO_KEY = 'erapop.audio.v1';
  const TUTORIAL_KEY = 'erapop.tutorial.v1';
  const KEYS = [BOOK_KEY, BEST_KEY, AUDIO_KEY, TUTORIAL_KEY];
  // Set in localStorage once old local saves were copied into the Data module, so it only happens once.
  const MIGRATED_KEY = 'erapop.cgmigrated.v1';
  const SDK_TIMEOUT_MS = 10000;

  // CrazyGames always runs the game inside an iframe. Opened directly (e.g. on GitHub Pages) the SDK is
  // "disabled" anyway and its init takes ~7 s to find that out, so it is skipped there.
  // localhost and ?useLocalSdk=true still use it (the SDK's "local" test mode).
  function sdkWanted() {
    let framed = true;
    try { framed = window.self !== window.top; } catch (e) { /* cross-origin parent: framed */ }
    const h = location.hostname;
    return framed || h === 'localhost' || h === '127.0.0.1' || /[?&]useLocalSdk=true/.test(location.search);
  }

  let local = null;
  try { local = window.localStorage; } catch (e) { /* blocked: progress lasts for this session only */ }
  let store = local;          // localStorage-like: getItem / setItem
  let backend = 'local';

  function read(key, fallback) {
    try {
      const v = store ? store.getItem(key) : null;
      return v === null || v === undefined ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      if (store) store.setItem(key, JSON.stringify(value));
    } catch (e) { /* storage unavailable: progress lasts for this session only */ }
  }

  // Players who played before the Data module (e.g. an earlier build on the same site) keep their progress.
  function migrate(data) {
    if (!local || local.getItem(MIGRATED_KEY)) return;
    for (const k of KEYS) {
      const v = local.getItem(k);
      if (v !== null && data.getItem(k) === null) data.setItem(k, v);
    }
    local.setItem(MIGRATED_KEY, '1');
  }

  async function initSdk() {
    const CG = window.CrazyGames;
    if (!CG || !CG.SDK || !sdkWanted()) return;   // SDK script missing/blocked, or not on CrazyGames
    await Promise.race([
      CG.SDK.init(),
      new Promise((_, rej) => setTimeout(() => rej(new Error('CrazyGames SDK init timed out')), SDK_TIMEOUT_MS)),
    ]);
    if (CG.SDK.environment === 'disabled') return;   // not on CrazyGames: every SDK call would throw
    const data = CG.SDK.data;
    data.getItem(BEST_KEY);       // throws if the Data module is disabled for this game
    try { migrate(data); } catch (e) { /* keep going with whatever the Data module has */ }
    store = data;
    backend = 'crazygames';
  }

  // CrazyGames game events (gameplayStart/Stop, loadingStart/Stop). No-ops off CrazyGames; never throw.
  // gameplayStart/Stop are deduped so pause -> resume -> restart sequences send each change once.
  let playing = false;
  function sdkGame(name) {
    if (backend !== 'crazygames') return;
    try { window.CrazyGames.SDK.game[name](); } catch (e) { /* SDK call failed: the game keeps running */ }
  }

  let book = new Set();

  return {
    // Picks the save backend and loads the Book. Never rejects.
    async init() {
      try { await initSdk(); } catch (e) { console.warn('[EraStorage] using localStorage:', e && (e.message || e.code || e)); }
      book = new Set(read(BOOK_KEY, []));
      this.loadingStart();   // the art and audio download next (GameScene.preload)
    },
    backend() { return backend; },
    gameplayStart() { if (!playing) { playing = true; sdkGame('gameplayStart'); } },
    gameplayStop() { if (playing) { playing = false; sdkGame('gameplayStop'); } },
    loadingStart() { sdkGame('loadingStart'); },
    loadingStop() { sdkGame('loadingStop'); },
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
