// Persistent data across sessions: best score and the Customer Book.

window.EraStorage = (function () {
  const BOOK_KEY = 'erapop.book.v1';
  const BEST_KEY = 'erapop.best.v1';
  const AUDIO_KEY = 'erapop.audio.v1';
  const TUTORIAL_KEY = 'erapop.tutorial.v1';

  function read(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* storage unavailable: progress lasts for this session only */ }
  }

  let book = new Set(read(BOOK_KEY, []));

  return {
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
