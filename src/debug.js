// Debug mode: add ?debug=1 to the URL to get a cheat/inspect panel (top-left).
// Does nothing without the query parameter.

(function () {
  if (new URLSearchParams(location.search).get('debug') !== '1') return;

  window.ERA_DEBUG = { speed: 1 };

  // Time scale: feed a scaled delta to the Game scene so the clock, timers and physics all speed up together.
  const origUpdate = GameScene.prototype.update;
  GameScene.prototype.update = function (time, delta) {
    const s = window.ERA_DEBUG.speed;
    if (this.time) this.time.timeScale = s;
    if (this.matter && this.matter.world) this.matter.world.engine.timing.timeScale = s;
    origUpdate.call(this, time, delta * s);
    drawBodies(this);
  };

  // Physics view: outline every Matter body (drawn by hand; the built-in Matter debug renderer doesn't show here).
  function drawBodies(scene) {
    if (!window.ERA_DEBUG.phys) { if (scene.dbgG) scene.dbgG.clear(); return; }
    if (!scene.dbgG || !scene.dbgG.scene) scene.dbgG = scene.add.graphics().setDepth(1000);
    const g = scene.dbgG;
    g.clear();
    const lw = 2 / (scene.worldZoom || 1);
    for (const body of scene.matter.world.localWorld.bodies) {
      const parts = body.parts.length > 1 ? body.parts.slice(1) : [body];
      g.lineStyle(lw, body.isStatic ? 0xff4d6d : body.bubble && body.bubble.landed ? 0x00ff88 : 0xffe066, 1);
      for (const p of parts) {
        const v = p.vertices;
        g.beginPath();
        g.moveTo(v[0].x, v[0].y);
        for (let i = 1; i < v.length; i++) g.lineTo(v[i].x, v[i].y);
        g.closePath();
        g.strokePath();
      }
    }
    const C = scene.C.capsule; // danger line
    g.lineStyle(lw, 0xff4d6d, 0.8).lineBetween(0, C.dangerLineY, C.width, C.dangerLineY);
  }

  const game = () => window.ERA_GAME;
  const G = () => game() && game().scene.getScene('Game');
  const UI = () => game() && game().scene.getScene('UI');
  const toast = (msg) => { const u = UI(); if (u && u.toast) u.toast(msg, 1200); };

  const css = `
  #era-debug{position:fixed;top:6px;left:6px;z-index:9999;font:12px/1.35 monospace;color:#e8e4ff;
    background:rgba(16,10,32,.88);border:1px solid #6b5bd6;border-radius:8px;max-width:270px;
    max-height:calc(100vh - 12px);overflow:auto;user-select:none;-webkit-user-select:none}
  #era-debug .hd{display:flex;justify-content:space-between;align-items:center;padding:4px 8px;cursor:pointer;
    background:#2a1f55;border-radius:8px 8px 0 0;font-weight:bold;color:#ffe066}
  #era-debug .bd{padding:6px 8px}
  #era-debug.min .bd{display:none}
  #era-debug .st{white-space:pre;color:#bfb6ff;margin-bottom:6px}
  #era-debug .row{display:flex;flex-wrap:wrap;gap:3px;margin:3px 0;align-items:center}
  #era-debug .lb{width:100%;color:#8f86b8;margin-top:4px}
  #era-debug button{font:11px monospace;color:#fff;background:#3d2f7a;border:1px solid #6b5bd6;border-radius:4px;
    padding:3px 6px;cursor:pointer;min-width:24px}
  #era-debug button:hover{background:#5643a8}
  #era-debug button.on{background:#f28b30;border-color:#ffb46b}
  #era-debug button.warn{background:#7a2f3d;border-color:#d65b6b}`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const box = document.createElement('div');
  box.id = 'era-debug';
  box.innerHTML = '<div class="hd"><span>DEBUG</span><span class="tg">–</span></div><div class="bd"><div class="st"></div></div>';
  const body = box.querySelector('.bd');
  const stats = box.querySelector('.st');
  box.querySelector('.hd').onclick = () => {
    box.classList.toggle('min');
    box.querySelector('.tg').textContent = box.classList.contains('min') ? '+' : '–';
  };
  // Keep clicks on the panel from reaching the game canvas.
  ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'mousedown', 'mouseup'].forEach((ev) =>
    box.addEventListener(ev, (e) => e.stopPropagation()));

  function row(label, buttons) {
    if (label) {
      const l = document.createElement('div');
      l.className = 'lb';
      l.textContent = label;
      body.appendChild(l);
    }
    const r = document.createElement('div');
    r.className = 'row';
    for (const [text, fn, cls] of buttons) {
      const b = document.createElement('button');
      b.textContent = text;
      if (cls) b.className = cls;
      b.onclick = () => { const g = G(); if (g && g.bubbles) fn(g, b); };
      r.appendChild(b);
    }
    body.appendChild(r);
    return r;
  }
  const tiers = [0, 1, 2, 3, 4, 5, 6];

  row('Spawn bubble (tier)', tiers.map((t) => [String(t), (g) => {
    const cap = g.C.capsule, r = g.C.bubbleRadius[t];
    g.spawnBubble(t, Phaser.Math.Between(r, cap.width - r), cap.dropY, false);
  }]));
  row('Set current drop', tiers.map((t) => [String(t), (g) => { g.currentTier = t; }]));
  row('Set next drop', tiers.map((t) => [String(t), (g) => { g.nextTier = t; }]));

  const startStorm = (type) => (g) => {
    const ST = g.C.storms, look = Phaser.Math.Between(0, 6);
    const label = type === 'era' ? ERA_DATA.eras[look].short + ' invasion! Orders x' + ST.eraOrderMultiplier
      : type === 'merge' ? 'Merge frenzy! Merges x' + ST.mergeMultiplier
      : 'Rush hour! Orders x' + ST.rushOrderMultiplier;
    g.storm = { type, look, label, endsAt: g.elapsed + ST.durationSec };
    EraAudio.play('storm');
    if (type === 'rush') g.spawnTimerMs = Math.min(g.spawnTimerMs, 500);
  };
  row('Storm', [
    ['era', startStorm('era')], ['merge', startStorm('merge')], ['rush', startStorm('rush')],
    ['end', (g) => { if (g.storm) g.storm.endsAt = g.elapsed; }],
  ]);
  row('Time', [
    ['+60s', (g) => { g.elapsed += 60; toast('+60s'); }],
    ['storm now', (g) => { g.nextStormAt = g.elapsed; }],
  ]);
  const speedRow = row('Speed', [0.25, 1, 3].map((s) => [s + 'x', (g, b) => {
    window.ERA_DEBUG.speed = s;
    speedRow.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  }, s === 1 ? 'on' : '']));

  row('Customers & score', [
    ['customer now', (g) => {
      let slot = g.customers.findIndex((c, i) => i < g.C.customers.maxSlots && !c);
      if (slot < 0) slot = 0;
      g.spawnCustomer(slot);
    }],
    ['+1000', (g) => g.addScore(1000)],
    ['+10000', (g) => g.addScore(10000)],
  ]);
  row('Capsule', [
    ['clear', (g) => {
      for (const b of g.bubbles.slice()) g.removeBubble(b);
      g.mergeQueue = [];
    }],
    ['game over', (g) => { if (!g.gameOver) g.endGame(); }],
    ['skip tutorial', (g) => { if (g.tutorial) { g.finishTutorial(); toast('Tutorial skipped'); } }],
  ]);
  row('View', [
    ['physics', (g, b) => {
      window.ERA_DEBUG.phys = !window.ERA_DEBUG.phys;
      b.classList.toggle('on', window.ERA_DEBUG.phys);
    }],
    ['ad', () => { const u = UI(); if (u) u.showAd('rewarded', () => {}); }],
    ['all customers', (g, b) => {
      // Toggle: while on, the Customer Book (from any button) shows all 49 customers unlocked. The save is untouched.
      window.ERA_DEBUG.showAll = !window.ERA_DEBUG.showAll;
      b.classList.toggle('on', window.ERA_DEBUG.showAll);
      const u = UI();
      if (!u) return;
      if (u.overlay && u.overlay.type === 'book') u.closeOverlay(true);
      else if (u.overlay) return;
      u.openOverlay('book');
    }],
  ]);
  row('Save data', [
    ['unlock book', () => {
      for (let l = 0; l < 7; l++) for (let j = 0; j < 7; j++) EraStorage.addToBook(l, j);
      toast('Book unlocked');
    }],
    ['reset save', () => {
      if (!confirm('Erase best score, book, tutorial and audio settings?')) return;
      Object.keys(localStorage).filter((k) => k.indexOf('erapop.') === 0).forEach((k) => localStorage.removeItem(k));
      location.reload();
    }, 'warn'],
  ]);

  // Live stats.
  let frames = 0, last = performance.now(), fps = 0;
  function tick(now) {
    frames++;
    if (now - last >= 500) { fps = Math.round(frames * 1000 / (now - last)); frames = 0; last = now; }
    const g = G();
    if (g && g.bubbles && !box.classList.contains('min')) {
      const live = g.bubbles.filter((b) => !b.dead).length;
      const c = g.customers.find((x) => x);
      stats.textContent =
        'fps ' + fps + '   speed ' + window.ERA_DEBUG.speed + 'x\n' +
        'time ' + g.elapsed.toFixed(1) + 's  bubbles ' + live + '\n' +
        'score ' + g.score + '  served ' + g.ordersServed + '\n' +
        'drop ' + g.currentTier + ' next ' + g.nextTier + '\n' +
        'storm ' + (g.storm ? g.storm.type + ' ' + Math.max(0, g.storm.endsAt - g.elapsed).toFixed(0) + 's'
          : 'in ' + Math.max(0, g.nextStormAt - g.elapsed).toFixed(0) + 's') + '\n' +
        'order ' + (c ? 'tier ' + c.tier + ' ' + c.state + ' ' + c.timeLeft.toFixed(0) + 's' : '-') + '\n' +
        (g.tutorial ? 'tutorial: ' + g.tutorial.step : g.gameOver ? 'GAME OVER' : 'playing');
    }
    requestAnimationFrame(tick);
  }

  const mount = () => { document.body.appendChild(box); requestAnimationFrame(tick); };
  if (document.body) mount(); else window.addEventListener('DOMContentLoaded', mount);
})();
