// Persistent data across sessions: best score and the Customer Book.

window.EraStorage = (function () {
  const BOOK_KEY = 'erapop.book.v1';
  const BEST_KEY = 'erapop.best.v1';
  const SKIN_KEY = 'erapop.skin.v1';
  const MUTE_KEY = 'erapop.mute.v1';

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
    // How many of the 6 hybrids with this era's look have been collected.
    eraCount(look) {
      let n = 0;
      for (let j = 0; j < 7; j++) if (j !== look && book.has(look + '-' + j)) n++;
      return n;
    },
    getSkin() {
      const s = Number(read(SKIN_KEY, -1));
      return s >= 0 && s < 7 && this.eraCount(s) === 6 ? s : -1;
    },
    setSkin(i) { write(SKIN_KEY, i); },
    getMuted() { return read(MUTE_KEY, false) === true; },
    setMuted(m) { write(MUTE_KEY, !!m); },
    // Returns true if this hybrid is new to the book.
    addToBook(look, job) {
      const k = look + '-' + job;
      if (book.has(k)) return false;
      book.add(k);
      write(BOOK_KEY, [...book]);
      return true;
    },
  };
})();
