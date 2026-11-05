// UI scene: responsive layout, HUD, customer cards, pointer input, Customer Book and game over overlays.
// Coordinates here are game pixels (device pixels); the Game scene's camera is fitted into layout.cap.

const FONT = ERA_FONTS.title;

// White icons for the square icon buttons, drawn centred on (cx, cy) inside a box of size s.
// off = true adds a cross (a switched-off toggle).
const ICONS = {
  pause(g, cx, cy, s) {
    g.fillStyle(0xffffff, 1).fillRoundedRect(cx - s * 0.32, cy - s * 0.36, s * 0.22, s * 0.72, s * 0.05)
      .fillRoundedRect(cx + s * 0.1, cy - s * 0.36, s * 0.22, s * 0.72, s * 0.05);
  },
  play(g, cx, cy, s) {
    g.fillStyle(0xffffff, 1).fillTriangle(cx - s * 0.26, cy - s * 0.38, cx - s * 0.26, cy + s * 0.38, cx + s * 0.38, cy);
  },
  // Two beamed eighth notes. Off: the notes shift left and get a white x, like the SFX icon.
  music(g, cx, cy, s, off) {
    if (off) cx -= s * 0.14;
    const lw = Math.max(2, s * 0.1), hw = s * 0.3, hh = s * 0.22, beam = s * 0.15;
    const lx = cx - s * 0.08, rx = cx + s * 0.34;          // right edges of the two stems
    const lTop = cy - s * 0.3, rTop = cy - s * 0.4, lBot = cy + s * 0.26, rBot = cy + s * 0.16;
    g.fillStyle(0xffffff, 1)
      .fillRect(lx - lw, lTop, lw, lBot - lTop)
      .fillRect(rx - lw, rTop, lw, rBot - rTop)
      .fillEllipse(lx - hw / 2, lBot, hw, hh)
      .fillEllipse(rx - hw / 2, rBot, hw, hh)
      .fillPoints([{ x: lx - lw, y: lTop }, { x: rx, y: rTop }, { x: rx, y: rTop + beam }, { x: lx - lw, y: lTop + beam }], true);
    if (off) {
      const x0 = cx + s * 0.46;
      g.lineStyle(Math.max(2, s * 0.09), 0xffffff, 1)
        .lineBetween(x0, cy - s * 0.16, x0 + s * 0.3, cy + s * 0.16).lineBetween(x0, cy + s * 0.16, x0 + s * 0.3, cy - s * 0.16);
    }
  },
  sfx(g, cx, cy, s, off) {
    cx -= s * 0.12;
    g.fillStyle(0xffffff, 1).fillRect(cx - s * 0.42, cy - s * 0.15, s * 0.22, s * 0.3);
    g.fillTriangle(cx - s * 0.22, cy - s * 0.15, cx + s * 0.08, cy - s * 0.42, cx + s * 0.08, cy + s * 0.42);
    g.fillTriangle(cx - s * 0.22, cy - s * 0.15, cx - s * 0.22, cy + s * 0.15, cx + s * 0.08, cy + s * 0.42);
    g.lineStyle(Math.max(2, s * 0.09), 0xffffff, 1);
    if (off) {
      g.lineBetween(cx + s * 0.2, cy - s * 0.18, cx + s * 0.52, cy + s * 0.18).lineBetween(cx + s * 0.2, cy + s * 0.18, cx + s * 0.52, cy - s * 0.18);
    } else {
      for (const k of [0.25, 0.45]) {
        g.beginPath();
        g.arc(cx + s * 0.08, cy, s * k, -0.75, 0.75);
        g.strokePath();
      }
    }
  },
  book(g, cx, cy, s) {
    const lw = Math.max(2, s * 0.07);
    g.fillStyle(0xffffff, 1).fillRoundedRect(cx - s * 0.42, cy - s * 0.3, s * 0.4, s * 0.6, s * 0.05)
      .fillRoundedRect(cx + s * 0.02, cy - s * 0.3, s * 0.4, s * 0.6, s * 0.05);
    g.lineStyle(lw, 0x6a3fd0, 1);
    for (const k of [-0.14, 0, 0.14]) {
      g.lineBetween(cx - s * 0.34, cy + s * k, cx - s * 0.1, cy + s * k).lineBetween(cx + s * 0.1, cy + s * k, cx + s * 0.34, cy + s * k);
    }
  },
  // Circular arrow with a gap on the left; the head sits at the gap's lower end and points up into it.
  restart(g, cx, cy, s) {
    const r = s * 0.3, lw = Math.max(2, s * 0.11);
    const a0 = -Math.PI * 0.8, a1 = Math.PI * 0.9;     // arc runs clockwise from a0 to a1, leaving a gap
    g.lineStyle(lw, 0xffffff, 1);
    g.beginPath();
    g.arc(cx, cy, r, a0, a1);
    g.strokePath();
    // Head at the a1 end, pointing along the arc (clockwise).
    const px = cx + r * Math.cos(a1), py = cy + r * Math.sin(a1);
    const dx = -Math.sin(a1), dy = Math.cos(a1);        // clockwise tangent
    const ox = Math.cos(a1), oy = Math.sin(a1);         // outward
    const hl = s * 0.24, hw = s * 0.19;
    g.fillStyle(0xffffff, 1).fillTriangle(
      px + dx * hl, py + dy * hl,
      px + ox * hw, py + oy * hw,
      px - ox * hw, py - oy * hw);
  },
  cross(g, cx, cy, s) {
    g.lineStyle(Math.max(3, s * 0.1), 0xff4f6a, 1).lineBetween(cx - s * 0.42, cy - s * 0.42, cx + s * 0.42, cy + s * 0.42);
  },
};


class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UI' });
  }

  create() {
    this.C = window.ERA_POP_CONFIG;
    this.G = this.scene.get('Game');
    this.g = this.add.graphics();

    const txt = (origin) => this.add.text(0, 0, '', {
      fontFamily: FONT, fontStyle: '900', color: '#ffffff', stroke: '#241b3d', strokeThickness: 4,
    }).setOrigin(origin[0], origin[1]);

    this.titleText = txt([0.5, 0]).setText('ERA POP').setColor('#ffe066');
    this.logoImg = this.textures.exists('ui_logo') ? this.add.image(0, 0, 'ui_logo').setOrigin(0.5, 0) : null;
    this.scoreText = txt([0, 0.5]);
    this.bestText = txt([0, 0.5]).setColor('#cfc6ff');
    this.nextLabel = txt([0.5, 0.5]).setText('NEXT');
    this.nextImg = this.add.image(0, 0, 'bubble0');
    this.versionText = txt([0, 1]).setText('v' + this.C.version).setColor('#8f86b8').setStroke('#241b3d', 0)
      .setVisible(!window.ERA_RELEASE);   // hidden in the portal build (release/), shown on GitHub Pages

    this.cards = [];
    for (let i = 0; i < this.C.customers.maxSlots; i++) {
      this.cards.push({
        avatar: this.add.image(0, 0, 'cust_0_0').setVisible(false).setDepth(1), // below order bubble
        name: this.add.text(0, 0, '', { fontFamily: ERA_FONTS.body, fontStyle: 'bold', color: '#ffffff', align: 'center' }).setOrigin(0.5, 0).setDepth(2),
        speech: this.add.text(0, 0, '', { fontFamily: ERA_FONTS.body, fontStyle: 'bold', color: '#241b3d', align: 'center' })
          .setOrigin(0.5, 0).setDepth(2).setVisible(false),
        order: this.add.image(0, 0, 'bubble0').setVisible(false).setDepth(2),
        float: txt([0.5, 0.5]).setVisible(false).setDepth(3),
        hint: this.add.text(0, 0, '', { fontFamily: ERA_FONTS.body, fontStyle: 'bold', color: '#cfc6ff', align: 'center' })
          .setOrigin(0.5, 0.5).setDepth(2).setVisible(false),
        rect: null,
      });
    }
    // Landscape side panel: the item ladder (what merges into what) and a Customer Book button.
    this.itemsLabel = txt([0.5, 0]).setText('MERGE LADDER').setColor('#cfc6ff');
    this.ladder = [];
    for (let t = 0; t < this.C.bubbleRadius.length; t++) this.ladder.push(this.add.image(0, 0, 'bubble' + t));
    this.bookText = txt([0, 0.5]);
    this.skipText = txt([0.5, 0.5]).setText('SKIP').setDepth(57).setVisible(false);
    this.comboText = txt([0.5, 0.5]).setDepth(56).setVisible(false).setColor('#ffe066');
    this.ghost = this.add.image(0, 0, 'bubble0').setVisible(false).setAlpha(0.9).setDepth(50);
    this.toastText = txt([0.5, 0.5]).setDepth(60).setVisible(false);
    this.stormText = txt([0.5, 0]).setDepth(55).setVisible(false).setColor('#ffe066');
    this.toastUntil = 0;
    this.tutText = this.add.text(0, 0, '', {
      fontFamily: ERA_FONTS.body, fontStyle: 'bold', color: '#ffffff', align: 'center', lineSpacing: 4,
    }).setOrigin(0.5, 0.5).setDepth(58).setVisible(false);

    this.overlay = null;
    this.press = null;
    this.aiming = false;

    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);
    this.input.on('pointerupoutside', this.onUp, this);
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));

    this.layout();
  }

  // Called by the Game scene when it restarts.
  onGameRestart() {
    this.closeOverlay();
    this.press = null;
    this.aiming = false;
    this.ghost.setVisible(false);
    this.toastText.setVisible(false);
    this.layout();
  }

  // ---------- Layout ----------
  layout() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.cameras.main.setSize(W, H);
    const n = this.C.customers.maxSlots;
    const portrait = H > W * 1.05;
    const L = { W, H, portrait, cards: [] };

    if (portrait) {
      const pad = Math.round(W * 0.02);
      const hudH = Math.round(Math.min(H * 0.08, W * 0.16));
      const custH = Math.round(Math.min(H * 0.2, W * 0.4));
      L.pad = pad;
      L.hud = { x: 0, y: 0, w: W, h: hudH };
      L.cap = { x: pad, y: hudH + custH, w: W - pad * 2, h: H - hudH - custH - pad };
      const cw = (W - pad * 2 - (n - 1) * pad) / n;
      for (let i = 0; i < n; i++) L.cards.push({ x: pad + i * (cw + pad), y: hudH, w: cw, h: custH - pad });
      const fs = Math.round(hudH * 0.3);
      this.titleText.setVisible(false);
      if (this.logoImg) this.logoImg.setVisible(false);
      this.scoreText.setFontSize(fs).setPosition(pad * 2, hudH * 0.33);
      this.bestText.setFontSize(Math.round(fs * 0.7)).setPosition(pad * 2, hudH * 0.72);
      this.nextLabel.setFontSize(Math.round(fs * 0.7)).setPosition(W * 0.5 - hudH * 0.55, hudH * 0.5);
      L.scoreMaxW = this.nextLabel.x - this.nextLabel.width / 2 - pad * 4;
      L.next = { x: W * 0.5 + hudH * 0.15, y: hudH * 0.5, r: hudH * 0.36 };
      const mw = hudH * 0.64;
      L.pauseBtn = { x: W - pad * 2 - mw, y: hudH * 0.5 - mw / 2, w: mw, h: mw };
      L.bookBtn = { x: L.pauseBtn.x - mw - pad, y: L.pauseBtn.y, w: mw, h: mw };
      this.itemsLabel.setVisible(false);
      for (const im of this.ladder) im.setVisible(false);
      this.bookText.setVisible(false);
      this.versionText.setFontSize(Math.max(10, Math.round(fs * 0.45))).setPosition(pad, H - pad * 0.3);
    } else {
      const side = Math.round(Math.min(W * 0.25, H * 0.62));
      const pad = Math.round(Math.min(W, H) * 0.02);
      L.pad = pad;
      L.hud = { x: 0, y: 0, w: side, h: H };
      L.cap = { x: side, y: pad, w: W - side * 2, h: H - pad * 2 };
      const ch = Math.min((H * 0.52 - pad * 2 - (n - 1) * pad) / n, (side - pad * 2) * 1.8);
      for (let i = 0; i < n; i++) L.cards.push({ x: W - side + pad, y: pad + i * (ch + pad), w: side - pad * 2, h: ch });
      const fs = Math.round(Math.min(side * 0.11, H * 0.05));
      // Under the card: the merge ladder (4 + 3 grid) and the Customer Book button.
      const px = W - side + pad, pw = side - pad * 2;
      const lfs = Math.round(fs * 0.62);
      const y0 = pad + n * (ch + pad) + pad * 0.5;
      const bh = Math.round(Math.min(H * 0.1, pw * 0.26));
      const cell = Math.max(10, Math.min(pw / 4, (H - pad * 2 - bh - y0 - lfs * 1.5) / 2));
      this.itemsLabel.setVisible(true).setFontSize(lfs).setPosition(W - side / 2, y0);
      const gy = y0 + lfs * 1.5;
      L.ladder = [];
      for (let t = 0; t < this.ladder.length; t++) {
        const row = t < 4 ? 0 : 1, col = t < 4 ? t : t - 4, cols = row ? 3 : 4;
        const cx = W - side / 2 + (col - (cols - 1) / 2) * cell, cy = gy + cell * (row + 0.5);
        L.ladder.push({ x: cx, y: cy, r: cell * 0.42 });
        this.ladder[t].setVisible(true).setPosition(cx, cy)
          .setScale((cell * 0.42) / (this.C.bubbleRadius[t] * EraDraw.TEX_SCALE));
      }
      L.bookBtn = { x: px, y: gy + cell * 2 + pad * 0.6, w: pw, h: bh };
      this.bookText.setVisible(true).setFontSize(Math.round(Math.min(bh * 0.34, pw * 0.085)))
        .setPosition(px + bh * 0.95, L.bookBtn.y + bh / 2);
      this.titleText.setVisible(true).setFontSize(Math.round(fs * 1.4)).setPosition(side / 2, H * 0.05);
      if (this.logoImg) {
        this.titleText.setVisible(false);
        this.logoImg.setVisible(true).setPosition(side / 2, H * 0.02)
          .setScale(Math.min((side * 0.86) / this.logoImg.width, (H * 0.18) / this.logoImg.height));
      }
      this.scoreText.setFontSize(fs).setPosition(side * 0.12, H * 0.24);
      this.bestText.setFontSize(Math.round(fs * 0.7)).setPosition(side * 0.12, H * 0.31);
      L.scoreMaxW = side * 0.8;
      this.nextLabel.setFontSize(Math.round(fs * 0.7)).setPosition(side / 2, H * 0.42);
      L.next = { x: side / 2, y: H * 0.53, r: Math.min(side * 0.18, H * 0.08) };
      const mw = Math.min(H * 0.12, side * 0.36);
      L.pauseBtn = { x: side / 2 - mw / 2, y: H * 0.72, w: mw, h: mw };
      this.versionText.setFontSize(Math.max(10, Math.round(fs * 0.45))).setPosition(pad, H - pad);
    }
    this.nextImg.setPosition(L.next.x, L.next.y);
    this.toastText.setFontSize(Math.round(Math.min(W, H) * 0.035)).setPosition(L.cap.x + L.cap.w / 2, L.cap.y + L.cap.h * 0.3)
      .setWordWrapWidth(L.cap.w * 0.95).setAlign('center');
    this.stormText.setFontSize(Math.round(Math.min(W, H) * 0.03)).setPosition(L.cap.x + L.cap.w / 2, L.cap.y + L.cap.h * 0.2)
      .setWordWrapWidth(L.cap.w * 0.95).setAlign('center');
    this.tutText.setFontSize(Math.round(Math.min(W, H) * 0.034)).setPosition(L.cap.x + L.cap.w / 2, L.cap.y + L.cap.h * 0.52)
      .setWordWrapWidth(L.cap.w * 0.8);
    const sh = Math.round(Math.max(28, Math.min(L.cap.h * 0.06, L.cap.w * 0.12)));
    L.skipBtn = { x: L.cap.x + L.cap.w - sh * 2.6 - L.pad, y: L.cap.y + L.pad, w: sh * 2.6, h: sh };
    this.skipText.setFontSize(Math.round(sh * 0.42)).setPosition(L.skipBtn.x + L.skipBtn.w / 2, L.skipBtn.y + sh / 2);
    this.comboText.setFontSize(Math.round(Math.min(W, H) * 0.06)).setPosition(L.cap.x + L.cap.w / 2, L.cap.y + L.cap.h * 0.36);
    this.L = L;
    this.G.setScreenRect(L.cap);

    if (this.overlay) {
      const type = this.overlay.type;
      this.closeOverlay(true);
      this.openOverlay(type);
    }
  }

  // ---------- Per-frame drawing ----------
  update() {
    const G = this.G;
    if (!G || !G.bubbles || !this.L) return;
    const L = this.L;
    const g = this.g;
    g.clear();

    // HUD
    g.fillStyle(0x1a1430, 0.55).fillRect(L.hud.x, L.hud.y, L.hud.w, L.hud.h);
    if (!L.portrait) g.fillStyle(0x1a1430, 0.55).fillRect(L.W - L.hud.w, 0, L.hud.w, L.H);
    // Shrink long scores to fit (Orbitron is wide).
    const now = this.game.loop.time;
    this.scoreText.setText('SCORE ' + G.score);
    const punch = 1 + 0.28 * Math.max(0, 1 - (now - G.scorePunchAt) / 240);
    this.scoreText.setScale(Math.min(1, L.scoreMaxW / this.scoreText.width) * punch);
    this.scoreText.setColor(punch > 1.05 ? '#ffe066' : '#ffffff');
    this.bestText.setText('BEST ' + Math.max(G.best, G.score));
    this.bestText.setScale(Math.min(1, L.scoreMaxW / this.bestText.width));
    this.nextImg.setTexture('bubble' + G.nextTier);
    const nr = this.C.bubbleRadius[G.nextTier] * EraDraw.TEX_SCALE;
    this.nextImg.setScale(L.next.r / nr);
    g.fillStyle(0xffffff, 0.08).fillCircle(L.next.x, L.next.y, L.next.r * 1.1);
    this.button(g, L.pauseBtn, 0x2fb8b0);
    ICONS.pause(g, L.pauseBtn.x + L.pauseBtn.w / 2, L.pauseBtn.y + L.pauseBtn.h / 2, Math.min(L.pauseBtn.w, L.pauseBtn.h) * 0.6);
    // Customer Book button (+ the merge ladder in landscape).
    const bb = L.bookBtn;
    this.button(g, bb, 0x6a3fd0);
    ICONS.book(g, bb.x + bb.h / 2, bb.y + bb.h / 2, bb.h * 0.6);
    if (!L.portrait) {
      this.bookText.setText('BOOK ' + EraStorage.bookCount() + '/49');
      const lr = L.ladder;
      for (let t = 0; t < lr.length; t++) {
        const got = t <= G.maxTier;
        if (t > 0) {
          // Little arrow from the previous item.
          const a = lr[t - 1], b = lr[t];
          if (a.y === b.y) g.fillStyle(0xffffff, 0.35).fillTriangle(
            (a.x + b.x) / 2 - b.r * 0.12, b.y - b.r * 0.14, (a.x + b.x) / 2 - b.r * 0.12, b.y + b.r * 0.14, (a.x + b.x) / 2 + b.r * 0.14, b.y);
        }
        if (got) g.fillStyle(ERA_DATA.tierColors[t], 0.22).fillCircle(lr[t].x, lr[t].y, lr[t].r * 1.15);
        this.ladder[t].setAlpha(got ? 1 : 0.28);
      }
    }

    // Customer cards
    const open = G.openSlots();
    const hover = this.press && this.press.dragging ? this.cardAt(this.input.activePointer.x, this.input.activePointer.y) : -1;
    for (let i = 0; i < this.cards.length; i++) this.drawCard(i, L.cards[i], G.customers[i], i < open, hover === i);

    // Time storm banner
    if (G.storm && !G.gameOver) {
      const left = Math.max(0, Math.ceil(G.storm.endsAt - G.elapsed));
      this.stormText.setVisible(true).setText('TIME STORM ' + left + 's\n' + G.storm.label)
        .setAlpha(0.75 + 0.25 * Math.sin(this.time.now * 0.012));
    } else {
      this.stormText.setVisible(false);
    }

    // Toast
    if (this.toastText.visible) {
      const left = this.toastUntil - this.time.now;
      if (left <= 0) this.toastText.setVisible(false);
      else this.toastText.setAlpha(Math.min(1, left / 300));
    }

    // Big COMBO callout for 3+ quick merges.
    const ck = (now - G.comboAt) / 900;
    if (ck >= 0 && ck < 1 && !this.overlay) {
      const pop = ck < 0.2 ? 0.5 + 0.7 * (ck / 0.2) : 1.2 - 0.2 * Math.min(1, (ck - 0.2) / 0.15);
      this.comboText.setVisible(true).setText('COMBO x' + G.combo + '!').setScale(pop).setAlpha(ck < 0.7 ? 1 : (1 - ck) / 0.3);
    } else {
      this.comboText.setVisible(false);
    }

    this.drawTutorial();

    // Skip button during the tutorial.
    const showSkip = !!G.tutorial && !this.overlay;
    this.skipText.setVisible(showSkip);
    if (showSkip) {
      const r = L.skipBtn;
      g.fillStyle(0x1a1430, 0.75).fillRoundedRect(r.x, r.y, r.w, r.h, r.h / 2);
      g.lineStyle(Math.max(2, r.h * 0.06), 0xffffff, 0.6).strokeRoundedRect(r.x, r.y, r.w, r.h, r.h / 2);
    }

    if (G.gameOver && !this.overlay) {
      this.cancelPress();
      this.openOverlay('gameover');
    }
  }

  // First-run tutorial: a hint box in the capsule plus a pointer for the current step.
  drawTutorial() {
    const G = this.G, L = this.L, T = G.tutorial;
    if (!T || this.overlay) { this.tutText.setVisible(false); return; }
    const g = this.g, now = this.time.now;
    const cust = G.customers[0];
    const item = cust ? ERA_DATA.items[cust.tier] : '';
    const msg = {
      drop: 'Merge inventions through\ntime and serve customers\nfrom every era!\n\nTap inside the capsule\nto drop a bubble',
      merge: 'Drop another Wheel on it!\nTwo of the same merge\ninto the next item',
      serve: 'A customer wants a ' + item + '!\nDrag it onto their card',
      line: 'Keep bubbles below\nthe red line!\n\nCollect all 49 customers\nin your Customer Book.\nWatch out for Time Storms!\n\nTap to start',
    }[T.step];
    const t = this.tutText.setText(msg).setVisible(true);
    const pad = t.height * 0.18;
    const box = { x: t.x - t.width / 2 - pad, y: t.y - t.height / 2 - pad, w: t.width + pad * 2, h: t.height + pad * 2 };
    g.fillStyle(0x1a1430, 0.88).fillRoundedRect(box.x, box.y, box.w, box.h, pad);
    g.lineStyle(Math.max(2, pad * 0.18), 0xffe066, 0.6 + 0.4 * Math.sin(now * 0.006)).strokeRoundedRect(box.x, box.y, box.w, box.h, pad);

    const k = (now % 1100) / 1100;
    if (T.step === 'drop' || T.step === 'merge') {
      // Expanding tap rings just under the drop point.
      const p = G.toScreen(this.C.capsule.width / 2, this.C.capsule.height * 0.2);
      const r = Math.min(L.cap.w, L.cap.h) * 0.05;
      g.fillStyle(0xffffff, 0.85).fillCircle(p.x, p.y, r * 0.45);
      g.lineStyle(Math.max(2, r * 0.15), 0xffffff, 1 - k).strokeCircle(p.x, p.y, r * (0.6 + k * 1.2));
    } else if (T.step === 'serve' && cust && cust.state === 'waiting' && !(this.press && this.press.dragging)) {
      // Moving dots from the ordered bubble to the customer's card.
      let b = null;
      for (const x of G.bubbles) if (!x.dead && x.tier === cust.tier && (!b || x.body.position.y < b.body.position.y)) b = x;
      const r = L.cards[0];
      if (b && r) {
        const a = G.toScreen(b.body.position.x, b.body.position.y);
        const z = { x: r.x + r.w / 2, y: r.y + r.h / 2 };
        const n = 8, dr = Math.max(3, Math.min(L.W, L.H) * 0.007);
        for (let i = 0; i < n; i++) {
          const f = (i / n + k) % 1;
          g.fillStyle(0xffe066, 0.3 + 0.7 * f).fillCircle(a.x + (z.x - a.x) * f, a.y + (z.y - a.y) * f, dr);
        }
      }
    }
  }

  button(g, r, color) {
    const rad = Math.min(r.w, r.h) * 0.3;
    g.fillStyle(0x000000, 0.3).fillRoundedRect(r.x, r.y + r.h * 0.08, r.w, r.h, rad);
    g.fillStyle(color, 1).fillRoundedRect(r.x, r.y, r.w, r.h, rad);
    g.lineStyle(Math.max(2, r.h * 0.05), 0xffffff, 0.5).strokeRoundedRect(r.x, r.y, r.w, r.h, rad);
  }

  drawCard(i, r, c, isOpen, hovered) {
    const g = this.g;
    const card = this.cards[i];
    const CC = this.C.customers;
    const rad = Math.min(r.w, r.h) * 0.12;
    card.rect = r;

    if (!c) {
      g.fillStyle(isOpen ? 0x2f2552 : 0x1c1733, isOpen ? 0.9 : 0.6).fillRoundedRect(r.x, r.y, r.w, r.h, rad);
      if (isOpen) {
        // Waiting placeholder: a dim silhouette and a hint, so the slot never looks broken.
        const ar = Math.min(r.w, r.h) * 0.28;
        const look = Math.floor(this.time.now / 1400) % 7;
        const bob = Math.sin(this.time.now * 0.004) * ar * 0.05;
        card.avatar.setVisible(true).setTexture('custlock_' + look + '_' + ((look + 3) % 7))
          .setPosition(r.x + r.w / 2, r.y + r.h * 0.4 + bob).setDisplaySize(ar * 2, ar * 2).setAlpha(0.45);
        card.hint.setVisible(true).setText(this.G.tutorial ? 'Customers order\nitems here!' : 'Next customer\ncoming...')
          .setFontSize(Math.round(Math.max(10, Math.min(r.w * 0.085, r.h * 0.07))))
          .setPosition(r.x + r.w / 2, r.y + r.h * 0.4 + ar * 1.45).setAlpha(0.6 + 0.4 * Math.sin(this.time.now * 0.005));
      } else {
        card.avatar.setVisible(false);
        card.hint.setVisible(false);
      }
      card.name.setVisible(false);
      card.speech.setVisible(false);
      card.order.setVisible(false);
      card.float.setVisible(false);
      return;
    }

    let a = Math.min(1, c.age / CC.arriveSec);
    if (c.state === 'leaving') a = Math.max(0, 1 - c.leaveT / CC.leaveSec);

    g.fillStyle(0x3d3168, 0.95 * a + 0.05).fillRoundedRect(r.x, r.y, r.w, r.h, rad);
    // While a bubble is dragged, every customer waiting for that item flashes.
    const dragTier = this.press && this.press.dragging ? this.press.b.tier : -1;
    const wants = c.state === 'waiting' && c.tier === dragTier;
    let border = null, lw = Math.max(3, r.h * 0.03), ba = 1;
    if (hovered) border = wants ? 0x62ff8a : 0xff4f6a;
    else if (wants) {
      const pulse = 0.5 + 0.5 * Math.sin(this.time.now * 0.02);
      border = 0xffe066;
      lw *= 1.6;
      ba = 0.35 + 0.65 * pulse;
      g.fillStyle(0xffe066, 0.12 + 0.18 * pulse).fillRoundedRect(r.x, r.y, r.w, r.h, rad);
    }
    else if (c.result === 'served') border = 0x62ff8a;
    else if (c.result === 'timeout') border = 0xff4f6a;
    if (border !== null) g.lineStyle(lw, border, ba).strokeRoundedRect(r.x, r.y, r.w, r.h, rad);

    const pad = Math.min(r.w, r.h) * 0.08;
    const horizontal = r.w > r.h * 1.3;
    let ax, ay, ar, ox, oy, or, nx, ny, nw, fs;
    if (horizontal) {
      ar = Math.min(r.h * 0.34, r.w * 0.2);
      ax = r.x + pad + ar; ay = r.y + pad + ar;
      or = ar * 0.55;
      ox = ax + ar * 0.85; oy = ay + ar * 0.6;
      const left = ox + or + pad * 0.5;
      nx = (left + r.x + r.w - pad) / 2; nw = r.x + r.w - pad - left;
      fs = Math.max(9, Math.min(r.h * 0.12, nw * 0.09));
      ny = r.y + pad * 0.8;
    } else {
      ar = Math.min(r.w * 0.38, r.h * 0.26);
      ax = r.x + r.w / 2 - r.w * 0.06; ay = r.y + pad + ar;
      or = ar * 0.58;
      ox = r.x + r.w - pad - or * 0.8; oy = ay + ar * 0.35;
      nx = r.x + r.w / 2; nw = r.w - pad;
      fs = Math.max(8, Math.min(r.w * 0.1, r.h * 0.06));
      // Name starts below both the avatar and the order bubble so they never overlap.
      ny = Math.max(ay + ar, oy + or) + pad * 0.6;
    }

    card.hint.setVisible(false);
    card.avatar.setVisible(true).setTexture('cust_' + c.look + '_' + c.job).setPosition(ax, ay)
      .setDisplaySize(ar * 2, ar * 2).setAlpha(a);

    card.order.setVisible(true).setTexture('bubble' + c.tier).setPosition(ox, oy)
      .setScale(or / (this.C.bubbleRadius[c.tier] * EraDraw.TEX_SCALE)).setAlpha(a);
    card.name.setVisible(true).setText(c.name).setFontSize(Math.round(fs)).setWordWrapWidth(nw)
      .setPosition(nx, ny).setAlpha(a);

    // Timer bar
    const bh = Math.max(4, r.h * (horizontal ? 0.08 : 0.04));
    const bx = r.x + pad, by = r.y + r.h - pad - bh, bw = r.w - pad * 2;

    // Speech bubble under the name: the order line, then their reaction when they leave.
    const sx0 = horizontal ? nx - nw / 2 : r.x + pad, sx1 = horizontal ? nx + nw / 2 : r.x + r.w - pad;
    const sy0 = card.name.y + card.name.height + pad * 0.5, sy1 = by - pad * 0.6;
    const sp = pad * 0.45;
    let sfs = fs * (horizontal ? 0.85 : 0.95);
    card.speech.setVisible(true).setText(c.line || '').setWordWrapWidth(sx1 - sx0 - sp * 2).setAlpha(a);
    for (let k = 0; k < 6; k++) {
      card.speech.setFontSize(Math.max(8, Math.round(sfs)));
      if (card.speech.height + sp * 2 <= sy1 - sy0 || sfs <= 8) break;
      sfs *= 0.88;
    }
    const sh = card.speech.height + sp * 2;
    g.fillStyle(0xffffff, 0.95 * a).fillRoundedRect(sx0, sy0, sx1 - sx0, sh, sp * 1.5);
    if (horizontal) g.fillTriangle(sx0 + 1, sy0 + sp, sx0 + 1, sy0 + sp * 3, sx0 - sp * 1.6, sy0 + sp * 0.6);
    else g.fillTriangle(sx0 + sp * 2, sy0 + 1, sx0 + sp * 4, sy0 + 1, sx0 + sp * 2.6, sy0 - sp * 1.4);
    card.speech.setPosition((sx0 + sx1) / 2, sy0 + sp);
    const frac = Phaser.Math.Clamp(c.timeLeft / c.timeTotal, 0, 1);
    let col = frac > 0.5 ? 0x62c97a : frac > 0.25 ? 0xf2c14e : 0xff4f6a;
    if (frac <= 0.25 && c.state === 'waiting' && Math.floor(this.time.now / 250) % 2 === 0) col = 0xffffff;
    g.fillStyle(0x000000, 0.4 * a).fillRoundedRect(bx, by, bw, bh, bh / 2);
    if (frac > 0) g.fillStyle(col, a).fillRoundedRect(bx, by, Math.max(bh, bw * frac), bh, bh / 2);

    // Points float (+ a sparkle when served, a puff of smoke when they give up)
    if (c.state === 'leaving') {
      if (!c.fxDone) {
        c.fxDone = true;
        this.cardFx(c.result === 'served' ? 'fx_sparkle' : 'fx_puff', r);
      }
      const k = c.leaveT / CC.leaveSec;
      card.float.setVisible(true).setText((c.points > 0 ? '+' : '') + c.points + (c.tip ? '\nTIP!' : '')).setAlign('center')
        .setColor(c.points > 0 ? '#62ff8a' : '#ff4f6a').setFontSize(Math.round(Math.min(r.w, r.h) * 0.22))
        .setPosition(r.x + r.w / 2, r.y + r.h * 0.5 - k * r.h * 0.3).setAlpha(1 - k * 0.6);
    } else {
      card.float.setVisible(false);
    }
  }

  // ---------- Input ----------
  inRect(r, x, y) {
    return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  cardAt(x, y) {
    for (let i = 0; i < this.cards.length; i++) if (this.inRect(this.cards[i].rect, x, y)) return i;
    return -1;
  }

  onDown(p) {
    if (this.overlay) { this.overlayClick(p.x, p.y); return; }
    if (this.inRect(this.L.pauseBtn, p.x, p.y)) {
      if (!this.G.gameOver) { EraAudio.play('click'); this.openOverlay('pause'); }
      return;
    }
    const G = this.G;
    if (this.inRect(this.L.bookBtn, p.x, p.y)) {
      if (!G.gameOver) { EraAudio.play('click'); this.openOverlay('book'); }
      return;
    }
    // Skip the tutorial: mark it done and start a fresh run.
    if (G.tutorial && this.inRect(this.L.skipBtn, p.x, p.y)) {
      EraAudio.play('click');
      EraStorage.setTutorialDone();
      G.restartGame();
      return;
    }
    // Last tutorial step: any tap starts the real game.
    if (G.tutorial && G.tutorial.step === 'line') { EraAudio.play('click'); G.finishTutorial(); return; }
    if (G.gameOver || !this.inRect(this.L.cap, p.x, p.y)) return;
    // A press on a bubble is a tap (aim + drop) unless it moves far enough to become a drag-to-serve.
    const w = G.toWorld(p.x, p.y);
    const b = G.bubbleAt(w.x, w.y);
    if (b) this.press = { b, x: p.x, y: p.y, dragging: false };
    this.aiming = true;
    G.setAim(w.x);
  }

  onMove(p) {
    if (this.overlay) return;
    const G = this.G;
    const pr = this.press;
    if (pr) {
      if (!pr.dragging) {
        const th = this.C.input.dragThresholdPx * window.ERA_DPR;
        if (pr.b.dead) {
          this.press = null;
        } else if (Phaser.Math.Distance.Between(p.x, p.y, pr.x, pr.y) > th && G.beginDrag(pr.b)) {
          pr.dragging = true;
          this.aiming = false;
          this.ghost.setTexture('bubble' + pr.b.tier).setVisible(true);
        }
      }
      if (pr.dragging) {
        this.ghost.setPosition(p.x, p.y).setScale(G.worldZoom / EraDraw.TEX_SCALE);
        return;
      }
    }
    if (G.gameOver) return;
    if (this.aiming || (!p.isDown && !p.wasTouch && this.inRect(this.L.cap, p.x, p.y))) {
      G.setAim(G.toWorld(p.x, p.y).x);
    }
  }

  onUp(p) {
    if (this.overlay) return;
    const G = this.G;
    const pr = this.press;
    this.press = null;
    if (pr && pr.dragging) {
      this.ghost.setVisible(false);
      const slot = this.cardAt(p.x, p.y);
      const res = slot >= 0 ? G.serveBubble(pr.b, slot) : { ok: false };
      if (res.ok) this.onServed(res);
      else {
        G.endDrag(pr.b);
        const c = slot >= 0 ? G.customers[slot] : null;
        if (c && c.state === 'waiting') { EraAudio.play('wrong'); this.toast('They want a ' + ERA_DATA.items[c.tier] + '!'); }
      }
      return;
    }
    if (this.aiming) {
      this.aiming = false;
      if (!G.gameOver) {
        G.setAim(G.toWorld(p.x, p.y).x);
        G.dropBubble();
      }
    }
  }

  cancelPress() {
    if (this.press && this.press.dragging) this.G.endDrag(this.press.b);
    this.press = null;
    this.aiming = false;
    this.ghost.setVisible(false);
  }

  onServed(res) {
    if (res.isNew) EraAudio.play('newcard');
    if (res.isNew) this.toast('New in your Customer Book:\n' + res.name + '!', 2200);
  }

  cardFx(key, r) {
    if (!this.textures.exists(key)) return;
    const size = Math.min(r.w, r.h) * 1.1;
    const img = this.add.image(r.x + r.w / 2, r.y + r.h / 2, key).setBlendMode(Phaser.BlendModes.ADD).setDepth(4);
    const base = 1 / Math.max(img.width, img.height);
    img.setScale(size * 0.5 * base);
    this.tweens.add({ targets: img, scale: size * 1.2 * base, alpha: 0, duration: 650, ease: 'Cubic.Out', onComplete: () => img.destroy() });
  }

  toast(msg, ms) {
    this.toastText.setText(msg).setVisible(true).setAlpha(1);
    this.toastUntil = this.time.now + (ms || 1300);
  }

  // ---------- Overlays ----------
  openOverlay(type) {
    const G = this.G;
    if ((type === 'book' || type === 'pause') && !G.gameOver && !this.overlay) {
      this.cancelPress();
      G.scene.pause();
      EraStorage.gameplayStop();
    }
    this.overlay = { type, objs: [], buttons: [] };
    if (type === 'gameover') this.buildGameOver();
    else if (type === 'pause') this.buildPause();
    else if (type === 'story') this.buildStory();
    else this.buildBook();
  }

  closeOverlay(keepPaused) {
    if (!this.overlay) return;
    const type = this.overlay.type;
    for (const o of this.overlay.objs) o.destroy();
    this.overlay = null;
    if (!keepPaused && (type === 'book' || type === 'pause') && !this.G.gameOver) {
      this.G.scene.resume();
      EraStorage.gameplayStart();
    }
  }

  overlayClick(x, y) {
    const ov = this.overlay;
    for (const b of ov.buttons) {
      if (this.inRect(b.rect, x, y)) { EraAudio.play('click'); b.fn(); return; }
    }
    if (ov.type === 'story') { EraAudio.play('click'); this.closeOverlay(true); this.openOverlay('book'); return; }
    if (ov.type === 'book' && !this.inRect(ov.panel, x, y)) this.closeBookOverlay();
  }

  closeBookOverlay() {
    if (this.bookFromPause) {
      this.bookFromPause = false;
      this.closeOverlay(true);
      this.openOverlay('pause');
      return;
    }
    this.closeOverlay();
    if (this.G.gameOver) this.openOverlay('gameover');
  }

  ovText(str, x, y, size, color, origin) {
    const t = this.add.text(x, y, str, {
      fontFamily: FONT, fontStyle: '900', fontSize: Math.round(size) + 'px', color: color || '#ffffff',
      stroke: '#241b3d', strokeThickness: Math.max(2, size * 0.15), align: 'center',
    }).setOrigin(origin ? origin[0] : 0.5, origin ? origin[1] : 0.5).setDepth(101);
    this.overlay.objs.push(t);
    return t;
  }

  ovButton(g, rect, label, color, fn) {
    this.button(g, rect, color);
    this.ovText(label, rect.x + rect.w / 2, rect.y + rect.h / 2, rect.h * 0.4);
    this.overlay.buttons.push({ rect, fn });
  }

  buildGameOver() {
    const { W, H } = this.L;
    const G = this.G;
    const g = this.add.graphics().setDepth(100);
    this.overlay.objs.push(g);
    g.fillStyle(0x0b0818, 0.7).fillRect(0, 0, W, H);
    const pw = Math.min(W * 0.86, H * 0.75), ph = Math.min(H * 0.8, pw * 1.3);
    const px = (W - pw) / 2, py = (H - ph) / 2;
    g.fillStyle(0x2f2552, 1).fillRoundedRect(px, py, pw, ph, pw * 0.06);
    g.lineStyle(Math.max(3, pw * 0.01), 0xbfe9ff, 0.8).strokeRoundedRect(px, py, pw, ph, pw * 0.06);
    this.overlay.panel = { x: px, y: py, w: pw, h: ph };
    this.ovText(G.loseReason === 'order' ? 'ORDER MISSED!' : 'CAPSULE FULL!', W / 2, py + ph * 0.1, pw * 0.09, '#ffe066');
    this.ovText('SCORE', W / 2, py + ph * 0.21, pw * 0.05, '#cfc6ff');
    this.ovText(String(G.score), W / 2, py + ph * 0.29, pw * 0.12);
    this.ovText('BEST ' + G.best, W / 2, py + ph * 0.38, pw * 0.055, '#cfc6ff');
    const bw = pw * 0.76, bh = ph * 0.12;

    // Revive (clears the top of the capsule), once per run. Free for now; a rewarded ad goes here at full launch.
    if (G.canRevive()) {
      this.ovButton(g, { x: W / 2 - bw / 2, y: py + ph * 0.46, w: bw, h: bh }, 'REVIVE', 0xf28b30, () => {
        EraAudio.play('reward');
        this.closeOverlay();
        G.revive();
      });
    }

    this.ovButton(g, { x: W / 2 - bw / 2, y: py + ph * 0.64, w: bw, h: bh }, 'RESTART', 0x2fb86a, () => {
      this.closeOverlay();
      this.G.restartGame();
    });
    this.ovButton(g, { x: W / 2 - bw / 2, y: py + ph * 0.81, w: bw, h: bh }, 'CUSTOMER BOOK ' + EraStorage.bookCount() + '/49', 0x6a3fd0, () => {
      this.closeOverlay(true);
      this.openOverlay('book');
    });
  }

  // Pause menu: icon buttons in the HUD button style.
  //   row 1: Play (centre) · row 2: Music, SFX · row 3: Book, Restart
  buildPause() {
    const { W, H } = this.L;
    const g = this.add.graphics().setDepth(100);
    this.overlay.objs.push(g);
    g.fillStyle(0x0b0818, 0.75).fillRect(0, 0, W, H);
    const pw = Math.min(W * 0.8, H * 0.58), ph = pw * 1.3;
    const px = (W - pw) / 2, py = (H - ph) / 2;
    g.fillStyle(0x2f2552, 1).fillRoundedRect(px, py, pw, ph, pw * 0.06);
    g.lineStyle(Math.max(3, pw * 0.01), 0xbfe9ff, 0.8).strokeRoundedRect(px, py, pw, ph, pw * 0.06);
    this.overlay.panel = { x: px, y: py, w: pw, h: ph };
    this.ovText('PAUSED', W / 2, py + ph * 0.09, pw * 0.1, '#ffe066');

    const s = pw * 0.27, dx = pw * 0.2;
    const off = 0x5a5478;
    const items = [
      { x: W / 2, row: 0, label: 'PLAY', color: 0x2fb86a, icon: 'play', fn: () => this.closeOverlay() },
      { x: W / 2 - dx, row: 1, label: 'MUSIC', color: EraAudio.musicOn ? 0x2fb8b0 : off, icon: 'music', off: !EraAudio.musicOn,
        fn: () => { EraAudio.toggleMusic(); this.closeOverlay(true); this.openOverlay('pause'); } },
      { x: W / 2 + dx, row: 1, label: 'SFX', color: EraAudio.sfxOn ? 0x2fb8b0 : off, icon: 'sfx', off: !EraAudio.sfxOn,
        fn: () => { EraAudio.toggleSfx(); EraAudio.play('click'); this.closeOverlay(true); this.openOverlay('pause'); } },
      { x: W / 2 - dx, row: 2, label: 'BOOK', color: 0x6a3fd0, icon: 'book',
        fn: () => { this.bookFromPause = true; this.closeOverlay(true); this.openOverlay('book'); } },
      { x: W / 2 + dx, row: 2, label: 'RESTART', color: 0xff4f6a, icon: 'restart',
        fn: () => { this.closeOverlay(); this.G.quitRun(); this.G.restartGame(); } },
    ];
    for (const it of items) {
      const cy = py + pw * (0.36 + it.row * 0.36);
      const rect = { x: it.x - s / 2, y: cy - s / 2, w: s, h: s };
      this.button(g, rect, it.color);
      ICONS[it.icon](g, it.x, cy, s * 0.6, it.off);
      this.overlay.buttons.push({ rect, fn: it.fn });
    }
  }

  buildBook() {
    const { W, H } = this.L;
    const g = this.add.graphics().setDepth(100);
    this.overlay.objs.push(g);
    g.fillStyle(0x0b0818, 0.8).fillRect(0, 0, W, H);

    const m = Math.min(W, H) * 0.03;
    const pw = Math.min(W - m * 2, H * 1.05), ph = Math.min(H - m * 2, pw * 1.6);
    const px = (W - pw) / 2, py = (H - ph) / 2;
    g.fillStyle(0x2f2552, 1).fillRoundedRect(px, py, pw, ph, pw * 0.03);
    g.lineStyle(Math.max(3, pw * 0.006), 0xbfe9ff, 0.8).strokeRoundedRect(px, py, pw, ph, pw * 0.03);
    this.overlay.panel = { x: px, y: py, w: pw, h: ph };

    const titleH = ph * 0.1;
    this.ovText('CUSTOMER BOOK  ' + EraStorage.bookCount() + '/49', px + pw * 0.05, py + titleH * 0.55, Math.min(titleH * 0.42, pw * 0.05), '#ffe066', [0, 0.5]);
    const cb = titleH * 0.7;
    this.ovButton(g, { x: px + pw - cb - pw * 0.03, y: py + titleH * 0.55 - cb / 2, w: cb, h: cb }, 'X', 0xff4f6a, () => this.closeBookOverlay());

    // Collection: all 49 customers (7 originals + 42 hybrids) in a 7x7 grid, one look era per row;
    // undiscovered ones are shown as silhouettes.
    const entries = [];
    for (let l = 0; l < 7; l++) for (let j = 0; j < 7; j++) entries.push([l, j]);
    const gx = px + pw * 0.03, gy = py + titleH, gw = pw * 0.94, gh = ph - titleH - pw * 0.04;
    const aspect = 1.3; // card height / width
    const cols = 7, rows = 7;
    const size = Math.min(gw / cols, gh / rows / aspect);
    const ox = gx + (gw - size * cols) / 2, oy = gy + (gh - size * aspect * rows) / 2;
    const gap = size * 0.06;
    const fs = Math.max(8, size * 0.11);
    entries.forEach(([l, j], i) => {
      const x = ox + (i % cols) * size + gap / 2, y = oy + Math.floor(i / cols) * size * aspect + gap / 2;
      const w = size - gap, h = size * aspect - gap;
      const found = EraStorage.hasInBook(l, j);
      g.fillStyle(found ? 0x4a3d7a : 0x221d38, 1).fillRoundedRect(x, y, w, h, w * 0.1);
      const pic = this.add.image(x + w / 2, y + w * 0.46, (found ? 'cust_' : 'custlock_') + l + '_' + j)
        .setDisplaySize(w * 0.76, w * 0.76).setDepth(101);
      this.overlay.objs.push(pic);
      const t = this.ovText(found ? ERA_DATA.customerName(l, j) : '???', x + w / 2, y + w * 0.9, fs, found ? '#ffffff' : '#6d6590', [0.5, 0]);
      t.setStroke('#241b3d', 0).setFontFamily(ERA_FONTS.body).setFontStyle('bold').setWordWrapWidth(w * 0.94);
      // Unlocked customers open their story when tapped.
      if (found) this.overlay.buttons.push({ rect: { x, y, w, h }, fn: () => { this.storyOf = [l, j]; this.closeOverlay(true); this.openOverlay('story'); } });
    });
  }

  // A collected customer's portrait, name and funny story. Any tap goes back to the Book.
  buildStory() {
    const { W, H } = this.L;
    const [l, j] = this.storyOf;
    const g = this.add.graphics().setDepth(100);
    this.overlay.objs.push(g);
    g.fillStyle(0x0b0818, 0.85).fillRect(0, 0, W, H);
    const pw = Math.min(W * 0.88, H * 0.7), ph = Math.min(H * 0.86, pw * 1.45);
    const px = (W - pw) / 2, py = (H - ph) / 2;
    g.fillStyle(0x2f2552, 1).fillRoundedRect(px, py, pw, ph, pw * 0.05);
    g.lineStyle(Math.max(3, pw * 0.01), 0xbfe9ff, 0.8).strokeRoundedRect(px, py, pw, ph, pw * 0.05);
    this.overlay.panel = { x: px, y: py, w: pw, h: ph };
    const ps = Math.min(pw * 0.48, ph * 0.36);
    const pic = this.add.image(W / 2, py + ph * 0.05 + ps / 2, 'cust_' + l + '_' + j).setDisplaySize(ps, ps).setDepth(101);
    this.overlay.objs.push(pic);
    let y = py + ph * 0.05 + ps + ph * 0.03;
    const name = this.ovText(ERA_DATA.customerName(l, j), W / 2, y, pw * 0.065, '#ffe066', [0.5, 0]).setWordWrapWidth(pw * 0.9);
    y += name.height + ph * 0.03;
    // Story text shrinks until it fits above the hint line.
    const maxH = py + ph * 0.9 - y;
    let fs = pw * 0.052;
    const story = this.add.text(px + pw * 0.08, y, ERA_DATA.story(l, j), {
      fontFamily: ERA_FONTS.body, fontStyle: 'bold', fontSize: Math.round(fs) + 'px', color: '#ffffff',
      lineSpacing: fs * 0.25, wordWrap: { width: pw * 0.84 },
    }).setDepth(101);
    while (story.height > maxH && fs > 9) {
      fs *= 0.92;
      story.setFontSize(Math.round(fs)).setLineSpacing(fs * 0.25);
    }
    this.overlay.objs.push(story);
    this.ovText('Tap to go back', W / 2, py + ph * 0.95, pw * 0.035, '#8f86b8').setStroke('#241b3d', 0);
  }
}
