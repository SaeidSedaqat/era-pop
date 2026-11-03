// UI scene: responsive layout, HUD, customer cards, pointer input, Customer Book and game over overlays.
// Coordinates here are game pixels (device pixels); the Game scene's camera is fitted into layout.cap.

const FONT = 'Arial Black, Arial, sans-serif';

class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UI' });
  }

  create() {
    this.C = window.ERA_POP_CONFIG;
    this.G = this.scene.get('Game');
    this.g = this.add.graphics();

    const txt = (origin) => this.add.text(0, 0, '', {
      fontFamily: FONT, color: '#ffffff', stroke: '#241b3d', strokeThickness: 4,
    }).setOrigin(origin[0], origin[1]);

    this.titleText = txt([0.5, 0]).setText('ERA POP').setColor('#ffe066');
    this.scoreText = txt([0, 0.5]);
    this.bestText = txt([0, 0.5]).setColor('#cfc6ff');
    this.nextLabel = txt([0.5, 0.5]).setText('NEXT');
    this.nextImg = this.add.image(0, 0, 'bubble0');
    this.bookText = txt([0.5, 0.5]);
    this.versionText = txt([0, 1]).setText('v' + this.C.version).setColor('#8f86b8').setStroke('#241b3d', 0);

    this.avatarG = this.add.graphics().setDepth(1); // above card backgrounds, below order bubbles
    this.cards = [];
    for (let i = 0; i < this.C.customers.maxSlots; i++) {
      this.cards.push({
        name: this.add.text(0, 0, '', { fontFamily: 'Arial, sans-serif', fontStyle: 'bold', color: '#ffffff', align: 'center' }).setOrigin(0.5, 0).setDepth(2),
        order: this.add.image(0, 0, 'bubble0').setVisible(false).setDepth(2),
        float: txt([0.5, 0.5]).setVisible(false).setDepth(3),
        rect: null,
      });
    }
    this.ghost = this.add.image(0, 0, 'bubble0').setVisible(false).setAlpha(0.9).setDepth(50);
    this.toastText = txt([0.5, 0.5]).setDepth(60).setVisible(false);
    this.toastUntil = 0;

    this.overlay = null;
    this.press = null;
    this.lastTap = null;
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
    this.lastTap = null;
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
      L.cap = { x: pad, y: hudH + custH + pad, w: W - pad * 2, h: H - hudH - custH - pad * 2 };
      const cw = (W - pad * 2 - (n - 1) * pad) / n;
      for (let i = 0; i < n; i++) L.cards.push({ x: pad + i * (cw + pad), y: hudH, w: cw, h: custH - pad });
      const fs = Math.round(hudH * 0.3);
      this.titleText.setVisible(false);
      this.scoreText.setFontSize(fs).setPosition(pad * 2, hudH * 0.33);
      this.bestText.setFontSize(Math.round(fs * 0.7)).setPosition(pad * 2, hudH * 0.72);
      this.nextLabel.setFontSize(Math.round(fs * 0.7)).setPosition(W * 0.5 - hudH * 0.55, hudH * 0.5);
      L.next = { x: W * 0.5 + hudH * 0.15, y: hudH * 0.5, r: hudH * 0.36 };
      L.bookBtn = { x: W - pad * 2 - W * 0.26, y: hudH * 0.18, w: W * 0.26, h: hudH * 0.64 };
      this.bookText.setFontSize(Math.round(fs * 0.7));
      this.versionText.setFontSize(Math.max(10, Math.round(fs * 0.45))).setPosition(pad, H - pad * 0.3);
    } else {
      const side = Math.round(Math.min(W * 0.25, H * 0.62));
      const pad = Math.round(Math.min(W, H) * 0.02);
      L.pad = pad;
      L.hud = { x: 0, y: 0, w: side, h: H };
      L.cap = { x: side, y: pad, w: W - side * 2, h: H - pad * 2 };
      const ch = (H - pad * 2 - (n - 1) * pad) / n;
      for (let i = 0; i < n; i++) L.cards.push({ x: W - side + pad, y: pad + i * (ch + pad), w: side - pad * 2, h: ch });
      const fs = Math.round(Math.min(side * 0.11, H * 0.05));
      this.titleText.setVisible(true).setFontSize(Math.round(fs * 1.4)).setPosition(side / 2, H * 0.05);
      this.scoreText.setFontSize(fs).setPosition(side * 0.12, H * 0.24);
      this.bestText.setFontSize(Math.round(fs * 0.7)).setPosition(side * 0.12, H * 0.31);
      this.nextLabel.setFontSize(Math.round(fs * 0.7)).setPosition(side / 2, H * 0.42);
      L.next = { x: side / 2, y: H * 0.53, r: Math.min(side * 0.18, H * 0.08) };
      L.bookBtn = { x: side * 0.12, y: H * 0.7, w: side * 0.76, h: Math.min(H * 0.1, side * 0.3) };
      this.bookText.setFontSize(Math.round(fs * 0.7));
      this.versionText.setFontSize(Math.max(10, Math.round(fs * 0.45))).setPosition(pad, H - pad);
    }
    this.bookText.setPosition(L.bookBtn.x + L.bookBtn.w / 2, L.bookBtn.y + L.bookBtn.h / 2);
    this.nextImg.setPosition(L.next.x, L.next.y);
    this.toastText.setFontSize(Math.round(Math.min(W, H) * 0.035)).setPosition(L.cap.x + L.cap.w / 2, L.cap.y + L.cap.h * 0.3)
      .setWordWrapWidth(L.cap.w * 0.95).setAlign('center');
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
    const ag = this.avatarG;
    g.clear();
    ag.clear();

    // HUD
    g.fillStyle(0x1a1430, 0.85).fillRect(L.hud.x, L.hud.y, L.hud.w, L.hud.h);
    if (!L.portrait) g.fillStyle(0x1a1430, 0.85).fillRect(L.W - L.hud.w, 0, L.hud.w, L.H);
    this.scoreText.setText('SCORE ' + G.score);
    this.bestText.setText('BEST ' + Math.max(G.best, G.score));
    this.nextImg.setTexture('bubble' + G.nextTier);
    const nr = this.C.bubbleRadius[G.nextTier] * EraDraw.TEX_SCALE;
    this.nextImg.setScale(L.next.r / nr);
    g.fillStyle(0xffffff, 0.08).fillCircle(L.next.x, L.next.y, L.next.r * 1.1);
    this.button(g, L.bookBtn, 0x6a3fd0);
    this.bookText.setText('BOOK ' + EraStorage.bookCount() + '/42');

    // Customer cards
    const open = G.openSlots();
    const hover = this.press && this.press.dragging ? this.cardAt(this.input.activePointer.x, this.input.activePointer.y) : -1;
    for (let i = 0; i < this.cards.length; i++) this.drawCard(i, L.cards[i], G.customers[i], i < open, hover === i);

    // Toast
    if (this.toastText.visible) {
      const left = this.toastUntil - this.time.now;
      if (left <= 0) this.toastText.setVisible(false);
      else this.toastText.setAlpha(Math.min(1, left / 300));
    }

    if (G.gameOver && !this.overlay) {
      this.cancelPress();
      this.openOverlay('gameover');
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
    const ag = this.avatarG;
    const card = this.cards[i];
    const CC = this.C.customers;
    const rad = Math.min(r.w, r.h) * 0.12;
    card.rect = r;

    if (!c) {
      g.fillStyle(isOpen ? 0x2f2552 : 0x1c1733, isOpen ? 0.9 : 0.6).fillRoundedRect(r.x, r.y, r.w, r.h, rad);
      card.name.setVisible(false);
      card.order.setVisible(false);
      card.float.setVisible(false);
      return;
    }

    let a = Math.min(1, c.age / CC.arriveSec);
    if (c.state === 'leaving') a = Math.max(0, 1 - c.leaveT / CC.leaveSec);

    g.fillStyle(0x3d3168, 0.95 * a + 0.05).fillRoundedRect(r.x, r.y, r.w, r.h, rad);
    let border = null;
    if (hovered) border = this.press && this.press.b.tier === c.tier ? 0x62ff8a : 0xff4f6a;
    else if (c.result === 'served') border = 0x62ff8a;
    else if (c.result === 'timeout') border = 0xff4f6a;
    if (border !== null) g.lineStyle(Math.max(3, r.h * 0.03), border, 1).strokeRoundedRect(r.x, r.y, r.w, r.h, rad);

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
      fs = Math.max(9, Math.min(r.h * 0.15, nw * 0.13));
      ny = r.y + pad;
    } else {
      ar = Math.min(r.w * 0.38, r.h * 0.26);
      ax = r.x + r.w / 2 - r.w * 0.06; ay = r.y + pad + ar;
      or = ar * 0.58;
      ox = r.x + r.w - pad - or * 0.8; oy = ay + ar * 0.65;
      nx = r.x + r.w / 2; nw = r.w - pad;
      fs = Math.max(8, Math.min(r.w * 0.13, r.h * 0.075));
      ny = ay + ar + pad * 0.6;
    }

    ag.setAlpha(1);
    EraDraw.drawAvatar(ag, c.look, c.job, ax, ay, ar, false);
    if (a < 1) { // fade avatar by painting the card colour over it
      ag.fillStyle(0x3d3168, 1 - a).fillCircle(ax, ay, ar + 1);
    }

    card.order.setVisible(true).setTexture('bubble' + c.tier).setPosition(ox, oy)
      .setScale(or / (this.C.bubbleRadius[c.tier] * EraDraw.TEX_SCALE)).setAlpha(a);
    card.name.setVisible(true).setText(c.name).setFontSize(Math.round(fs)).setWordWrapWidth(nw)
      .setPosition(nx, ny).setAlpha(a);
    if (horizontal) card.name.setY(r.y + r.h * 0.5 - card.name.height / 2 - r.h * 0.08);

    // Timer bar
    const bh = Math.max(4, r.h * (horizontal ? 0.1 : 0.06));
    const bx = r.x + pad, by = r.y + r.h - pad - bh, bw = r.w - pad * 2;
    const frac = Phaser.Math.Clamp(c.timeLeft / c.timeTotal, 0, 1);
    let col = frac > 0.5 ? 0x62c97a : frac > 0.25 ? 0xf2c14e : 0xff4f6a;
    if (frac <= 0.25 && c.state === 'waiting' && Math.floor(this.time.now / 250) % 2 === 0) col = 0xffffff;
    g.fillStyle(0x000000, 0.4 * a).fillRoundedRect(bx, by, bw, bh, bh / 2);
    if (frac > 0) g.fillStyle(col, a).fillRoundedRect(bx, by, Math.max(bh, bw * frac), bh, bh / 2);

    // Points float
    if (c.state === 'leaving') {
      const k = c.leaveT / CC.leaveSec;
      card.float.setVisible(true).setText((c.points > 0 ? '+' : '') + c.points)
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
    if (this.inRect(this.L.bookBtn, p.x, p.y)) { this.openOverlay('book'); return; }
    const G = this.G;
    if (G.gameOver || !this.inRect(this.L.cap, p.x, p.y)) return;
    const w = G.toWorld(p.x, p.y);
    const b = G.bubbleAt(w.x, w.y);
    if (b) {
      this.press = { b, x: p.x, y: p.y, dragging: false };
      return;
    }
    this.aiming = true;
    G.setAim(w.x);
  }

  onMove(p) {
    if (this.overlay) return;
    const G = this.G;
    const pr = this.press;
    if (pr) {
      if (!pr.dragging) {
        if (pr.b.dead) { this.press = null; return; }
        const th = this.C.input.dragThresholdPx * window.ERA_DPR;
        if (Phaser.Math.Distance.Between(p.x, p.y, pr.x, pr.y) > th && G.beginDrag(pr.b)) {
          pr.dragging = true;
          this.lastTap = null;
          this.ghost.setTexture('bubble' + pr.b.tier).setVisible(true);
        }
      }
      if (pr.dragging) this.ghost.setPosition(p.x, p.y).setScale(G.worldZoom / EraDraw.TEX_SCALE);
      return;
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
    if (pr) {
      this.press = null;
      if (pr.dragging) {
        this.ghost.setVisible(false);
        const slot = this.cardAt(p.x, p.y);
        const res = slot >= 0 ? G.serveBubble(pr.b, slot) : { ok: false };
        if (res.ok) this.onServed(res);
        else {
          G.endDrag(pr.b);
          const c = slot >= 0 ? G.customers[slot] : null;
          if (c && c.state === 'waiting') this.toast('They want a ' + ERA_DATA.items[c.tier] + '!');
        }
      } else if (!pr.b.dead) {
        const now = this.time.now;
        if (this.lastTap && this.lastTap.b === pr.b && now - this.lastTap.t <= this.C.input.doubleTapMs) {
          this.lastTap = null;
          const res = G.serveBubble(pr.b);
          if (res.ok) this.onServed(res);
          else this.toast('Nobody ordered a ' + ERA_DATA.items[pr.b.tier] + '!');
        } else {
          this.lastTap = { b: pr.b, t: now };
        }
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
    if (res.isNew) this.toast('New in your Customer Book:\n' + res.name + '!', 2200);
  }

  toast(msg, ms) {
    this.toastText.setText(msg).setVisible(true).setAlpha(1);
    this.toastUntil = this.time.now + (ms || 1300);
  }

  // ---------- Overlays ----------
  openOverlay(type) {
    const G = this.G;
    if (type === 'book' && !G.gameOver && !this.overlay) {
      this.cancelPress();
      G.scene.pause();
    }
    this.overlay = { type, objs: [], buttons: [] };
    if (type === 'gameover') this.buildGameOver();
    else this.buildBook();
  }

  closeOverlay(keepPaused) {
    if (!this.overlay) return;
    const type = this.overlay.type;
    for (const o of this.overlay.objs) o.destroy();
    this.overlay = null;
    if (!keepPaused && type === 'book' && !this.G.gameOver) this.G.scene.resume();
  }

  overlayClick(x, y) {
    const ov = this.overlay;
    for (const b of ov.buttons) {
      if (this.inRect(b.rect, x, y)) { b.fn(); return; }
    }
    if (ov.type === 'book' && !this.inRect(ov.panel, x, y)) this.closeBookOverlay();
  }

  closeBookOverlay() {
    this.closeOverlay();
    if (this.G.gameOver) this.openOverlay('gameover');
  }

  ovText(str, x, y, size, color, origin) {
    const t = this.add.text(x, y, str, {
      fontFamily: FONT, fontSize: Math.round(size) + 'px', color: color || '#ffffff',
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
    const pw = Math.min(W * 0.86, H * 0.8), ph = Math.min(H * 0.6, pw * 1.1);
    const px = (W - pw) / 2, py = (H - ph) / 2;
    g.fillStyle(0x2f2552, 1).fillRoundedRect(px, py, pw, ph, pw * 0.06);
    g.lineStyle(Math.max(3, pw * 0.01), 0xbfe9ff, 0.8).strokeRoundedRect(px, py, pw, ph, pw * 0.06);
    this.overlay.panel = { x: px, y: py, w: pw, h: ph };
    this.ovText('CAPSULE FULL!', W / 2, py + ph * 0.14, pw * 0.09, '#ffe066');
    this.ovText('SCORE', W / 2, py + ph * 0.3, pw * 0.05, '#cfc6ff');
    this.ovText(String(G.score), W / 2, py + ph * 0.4, pw * 0.12);
    this.ovText('BEST ' + G.best, W / 2, py + ph * 0.52, pw * 0.055, '#cfc6ff');
    const bw = pw * 0.7, bh = ph * 0.13;
    this.ovButton(g, { x: W / 2 - bw / 2, y: py + ph * 0.62, w: bw, h: bh }, 'PLAY AGAIN', 0x2fb86a, () => {
      this.closeOverlay();
      this.G.restartGame();
    });
    this.ovButton(g, { x: W / 2 - bw / 2, y: py + ph * 0.8, w: bw, h: bh }, 'CUSTOMER BOOK ' + EraStorage.bookCount() + '/42', 0x6a3fd0, () => {
      this.closeOverlay(true);
      this.openOverlay('book');
    });
  }

  buildBook() {
    const { W, H } = this.L;
    const eras = ERA_DATA.eras;
    const g = this.add.graphics().setDepth(100);
    this.overlay.objs.push(g);
    g.fillStyle(0x0b0818, 0.8).fillRect(0, 0, W, H);

    const m = Math.min(W, H) * 0.03;
    const pw = Math.min(W - m * 2, H * 1.05), ph = Math.min(H - m * 2, pw * 1.12);
    const px = (W - pw) / 2, py = (H - ph) / 2;
    g.fillStyle(0x2f2552, 1).fillRoundedRect(px, py, pw, ph, pw * 0.03);
    g.lineStyle(Math.max(3, pw * 0.006), 0xbfe9ff, 0.8).strokeRoundedRect(px, py, pw, ph, pw * 0.03);
    this.overlay.panel = { x: px, y: py, w: pw, h: ph };

    const titleH = ph * 0.1;
    this.ovText('CUSTOMER BOOK  ' + EraStorage.bookCount() + '/42', px + pw * 0.05, py + titleH * 0.55, Math.min(titleH * 0.42, pw * 0.05), '#ffe066', [0, 0.5]);
    const cb = titleH * 0.7;
    this.ovButton(g, { x: px + pw - cb - pw * 0.03, y: py + titleH * 0.55 - cb / 2, w: cb, h: cb }, 'X', 0xff4f6a, () => this.closeBookOverlay());

    // Grid: rows = Look era, columns = Job (what they order). Diagonal = base customers (not collected).
    const gx = px + pw * 0.03, gy = py + titleH, gw = pw * 0.94, gh = ph - titleH - pw * 0.03;
    const labelW = Math.min(gw * 0.2, gh * 0.2);
    const cell = Math.min((gw - labelW) / 7, (gh - labelW * 0.6) / 7.6);
    const gridX = gx + labelW + ((gw - labelW) - cell * 7) / 2;
    const headY = gy + cell * 0.45;
    const gridY = gy + cell * 0.9;
    const lf = Math.max(9, Math.min(cell * 0.22, labelW * 0.17));
    this.ovText('LOOK ↓  JOB →', gx, headY, lf * 0.8, '#8f86b8', [0, 0.5]);

    for (let j = 0; j < 7; j++) {
      const cx = gridX + cell * (j + 0.5);
      const rr = cell * 0.36;
      g.fillStyle(ERA_DATA.tierColors[j], 0.35).fillCircle(cx, headY, rr);
      EraDraw.drawItem(g, j, cx, headY, rr * 0.7);
    }
    for (let l = 0; l < 7; l++) {
      const cy = gridY + cell * (l + 0.5);
      this.ovText(eras[l].short, gx + labelW - lf * 0.4, cy, lf, '#ffffff', [1, 0.5]);
      for (let j = 0; j < 7; j++) {
        const cx = gridX + cell * (j + 0.5);
        const s = cell * 0.42;
        if (l === j) {
          g.fillStyle(0x000000, 0.25).fillCircle(cx, cy, s);
          g.lineStyle(Math.max(1, s * 0.06), 0xffffff, 0.15).strokeCircle(cx, cy, s);
        } else if (EraStorage.hasInBook(l, j)) {
          EraDraw.drawAvatar(g, l, j, cx, cy, s, false);
        } else {
          EraDraw.drawAvatar(g, l, j, cx, cy, s, true);
        }
      }
    }
  }
}
