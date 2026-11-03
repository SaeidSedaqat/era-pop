// Game scene: the time capsule, bubble physics, merging, customers, scoring.
// All UI (HUD, customer cards, overlays) and pointer input live in UIScene.

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });
  }

  create() {
    const C = window.ERA_POP_CONFIG;
    this.C = C;
    const cap = C.capsule;

    EraDraw.makeBubbleTextures(this);

    // Visible world area (capsule + portal), fitted into the screen rect UIScene gives us.
    this.view = { x: -40, y: -150, w: cap.width + 80, h: cap.height + 190 };

    // ---- Walls ----
    const t = cap.wallThickness;
    const wallOpts = { isStatic: true, friction: C.physics.friction, restitution: 0, label: 'wall' };
    const wallH = cap.height + 1200;
    this.matter.add.rectangle(-t / 2, cap.height - wallH / 2, t, wallH, wallOpts);
    this.matter.add.rectangle(cap.width + t / 2, cap.height - wallH / 2, t, wallH, wallOpts);
    this.matter.add.rectangle(cap.width / 2, cap.height + t / 2, cap.width + t * 2, t, wallOpts);
    this.matter.world.setGravity(0, C.physics.gravityY);

    // ---- Visuals ----
    this.backG = this.add.graphics();
    this.drawCapsuleBack(this.backG);
    this.aimG = this.add.graphics();
    this.bubbleLayer = this.add.container(0, 0);
    this.frontG = this.add.graphics();
    this.drawCapsuleFront(this.frontG);
    this.dangerG = this.add.graphics();
    this.portalG = this.add.graphics({ x: cap.width / 2, y: cap.dropY - 10 });
    this.portalG.setScale(1, 0.32);
    this.heldImg = this.add.image(0, cap.dropY, 'bubble0').setScale(1 / EraDraw.TEX_SCALE);

    // ---- State ----
    this.bubbles = [];
    this.mergeQueue = [];
    this.score = 0;
    this.best = EraStorage.loadBest();
    this.elapsed = 0;
    this.gameOver = false;
    this.aimX = cap.width / 2;
    this.currentTier = this.randomDropTier();
    this.nextTier = this.randomDropTier();
    this.canDrop = true;
    this.customers = new Array(C.customers.maxSlots).fill(null);
    this.spawnTimerMs = C.customers.firstCustomerDelayMs;
    this.dangerActive = false;

    this.matter.world.on('collisionstart', this.onCollide, this);
    this.matter.world.on('collisionactive', this.onCollide, this);

    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    else this.scene.get('UI').onGameRestart();
  }

  // ---------- Layout ----------
  // rect is in game pixels (screen). Fit the world view inside it.
  setScreenRect(rect) {
    const cam = this.cameras.main;
    const zoom = Math.min(rect.w / this.view.w, rect.h / this.view.h);
    cam.setViewport(Math.round(rect.x), Math.round(rect.y), Math.round(rect.w), Math.round(rect.h));
    cam.setZoom(zoom);
    cam.centerOn(this.view.x + this.view.w / 2, this.view.y + this.view.h / 2);
    this.worldZoom = zoom;
  }

  toWorld(px, py) {
    return this.cameras.main.getWorldPoint(px, py);
  }

  toScreen(wx, wy) {
    const cam = this.cameras.main;
    return {
      x: cam.x + (wx - cam.worldView.x) * cam.zoom,
      y: cam.y + (wy - cam.worldView.y) * cam.zoom,
    };
  }

  // ---------- Drawing ----------
  drawCapsuleBack(g) {
    const { width: W, height: H } = this.C.capsule;
    g.fillStyle(0x0f1630, 0.75).fillRoundedRect(-6, -14, W + 12, H + 20, 18);
    g.fillStyle(0x9fd8ff, 0.05).fillRect(0, 0, W, H);
  }

  drawCapsuleFront(g) {
    const { width: W, height: H } = this.C.capsule;
    // glass walls
    g.lineStyle(10, 0xbfe9ff, 0.85).strokeRoundedRect(-5, -20, W + 10, H + 25, 18);
    g.fillStyle(0x241b3d, 1).fillRect(-10, -30, W + 20, 18); // open top
    // rim
    g.fillStyle(0xcfd8e6, 1).fillRoundedRect(-22, -22, 34, 14, 6).fillRoundedRect(W - 12, -22, 34, 14, 6);
    // glass shine
    g.fillStyle(0xffffff, 0.08).fillRect(14, 20, 14, H - 60);
    g.fillStyle(0xffffff, 0.06).fillRect(36, 40, 6, H - 120);
  }

  drawPortal(time) {
    const g = this.portalG;
    const R = this.C.capsule.width * 0.5;
    g.clear();
    g.fillStyle(0x6a3fd0, 0.35).fillCircle(0, 0, R);
    g.fillStyle(0x22e3ff, 0.15).fillCircle(0, 0, R * 0.6);
    const spin = time * 0.002;
    const colors = [0x22e3ff, 0xff6fa5, 0xf2d27a, 0xb07ee0];
    for (let i = 0; i < 8; i++) {
      const r = R * (0.25 + i * 0.1);
      const a = spin * (1 + i * 0.12) + i * 0.8;
      g.lineStyle(10, colors[i % colors.length], 0.7);
      g.beginPath();
      g.arc(0, 0, r, a, a + 1.6, false);
      g.strokePath();
    }
  }

  drawAim() {
    const g = this.aimG;
    g.clear();
    if (!this.canDrop || this.gameOver) {
      this.heldImg.setVisible(false);
      return;
    }
    const cap = this.C.capsule;
    const r = this.C.bubbleRadius[this.currentTier];
    this.aimX = Phaser.Math.Clamp(this.aimX, r, cap.width - r);
    g.lineStyle(3, 0xffffff, 0.25);
    for (let y = cap.dropY + r; y < cap.height; y += 24) g.lineBetween(this.aimX, y, this.aimX, y + 12);
    this.heldImg.setTexture('bubble' + this.currentTier).setPosition(this.aimX, cap.dropY).setVisible(true);
  }

  drawDanger(time) {
    const g = this.dangerG;
    const W = this.C.capsule.width;
    const y = this.C.capsule.dangerLineY;
    g.clear();
    const flash = this.dangerActive && Math.floor(time / 200) % 2 === 0;
    g.lineStyle(flash ? 5 : 3, flash ? 0xff3355 : 0xff8899, flash ? 0.95 : 0.4);
    for (let x = 0; x < W; x += 28) g.lineBetween(x, y, Math.min(W, x + 16), y);
  }

  // ---------- Bubbles ----------
  randomDropTier() {
    const w = this.C.drop.spawnTierWeights;
    const total = w.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < w.length; i++) {
      r -= w[i];
      if (r < 0) return i;
    }
    return 0;
  }

  spawnBubble(tier, x, y, landed) {
    const P = this.C.physics;
    const r = this.C.bubbleRadius[tier];
    const opts = {
      restitution: P.restitution, friction: P.friction, frictionStatic: P.frictionStatic,
      frictionAir: P.frictionAir, density: P.density, label: 'bubble',
    };
    if (P.lockRotation) opts.inertia = Infinity;
    const body = this.matter.add.circle(x, y, r, opts);
    const img = this.add.image(x, y, 'bubble' + tier).setScale(1 / EraDraw.TEX_SCALE);
    this.bubbleLayer.add(img);
    const b = { tier, r, body, img, landed: !!landed, dead: false, dragging: false, aboveMs: 0 };
    body.bubble = b;
    this.bubbles.push(b);
    return b;
  }

  removeBubble(b) {
    if (b.removed) return;
    b.dead = true;
    b.removed = true;
    this.matter.world.remove(b.body);
    b.img.destroy();
    const i = this.bubbles.indexOf(b);
    if (i >= 0) this.bubbles.splice(i, 1);
  }

  bubbleAt(wx, wy) {
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      if (b.dead) continue;
      const p = b.body.position;
      if ((p.x - wx) ** 2 + (p.y - wy) ** 2 <= b.r * b.r) return b;
    }
    return null;
  }

  setAim(wx) {
    this.aimX = wx;
  }

  dropBubble() {
    if (!this.canDrop || this.gameOver) return;
    const cap = this.C.capsule;
    const r = this.C.bubbleRadius[this.currentTier];
    const x = Phaser.Math.Clamp(this.aimX, r, cap.width - r);
    this.spawnBubble(this.currentTier, x, cap.dropY, false);
    this.canDrop = false;
    this.time.delayedCall(this.C.drop.cooldownMs, () => {
      this.currentTier = this.nextTier;
      this.nextTier = this.randomDropTier();
      this.canDrop = true;
    });
  }

  onCollide(event) {
    for (const pair of event.pairs) {
      const a = pair.bodyA.bubble || (pair.bodyA.parent && pair.bodyA.parent.bubble);
      const b = pair.bodyB.bubble || (pair.bodyB.parent && pair.bodyB.parent.bubble);
      if (a) a.landed = true;
      if (b) b.landed = true;
      if (!a || !b || a.dead || b.dead || a.dragging || b.dragging) continue;
      if (a.tier !== b.tier) continue;
      a.dead = true;
      b.dead = true;
      this.mergeQueue.push([a, b]);
    }
  }

  processMerges() {
    if (!this.mergeQueue.length) return;
    const S = this.C.scoring;
    const queue = this.mergeQueue;
    this.mergeQueue = [];
    for (const [a, b] of queue) {
      const x = (a.body.position.x + b.body.position.x) / 2;
      const y = (a.body.position.y + b.body.position.y) / 2;
      const tier = a.tier;
      this.removeBubble(a);
      this.removeBubble(b);
      if (tier < this.C.bubbleRadius.length - 1) {
        const nb = this.spawnBubble(tier + 1, x, y, true);
        nb.img.setScale(0.7 / EraDraw.TEX_SCALE);
        this.tweens.add({ targets: nb.img, scale: 1 / EraDraw.TEX_SCALE, duration: 160, ease: 'Back.Out' });
        this.addScore(S.mergePoints[tier + 1]);
        this.popText(x, y, '+' + S.mergePoints[tier + 1], '#ffffff');
      } else {
        // Two Rockets merge and disappear.
        this.addScore(S.rocketPopPoints);
        this.popText(x, y, 'POP! +' + S.rocketPopPoints, '#ffe066', 1.6);
        this.burst(x, y);
      }
    }
  }

  popText(x, y, str, color, scale) {
    const s = scale || 1;
    const txt = this.add.text(x, y, str, {
      fontFamily: 'Arial Black, Arial, sans-serif', fontSize: Math.round(26 * s) + 'px', color,
      stroke: '#241b3d', strokeThickness: 6, resolution: 3,
    }).setOrigin(0.5);
    this.tweens.add({ targets: txt, y: y - 60, alpha: 0, duration: 900, ease: 'Cubic.Out', onComplete: () => txt.destroy() });
  }

  burst(x, y) {
    const g = this.add.graphics({ x, y });
    const colors = [0xffe066, 0xff6fa5, 0x22e3ff];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      g.fillStyle(colors[i % 3], 1).fillCircle(Math.cos(a) * 30, Math.sin(a) * 30, 8);
    }
    this.tweens.add({ targets: g, scale: 4, alpha: 0, duration: 600, onComplete: () => g.destroy() });
  }

  // ---------- Drag (the bubble's body stays put and static, so it never pushes others) ----------
  beginDrag(b) {
    if (b.dead) return false;
    b.dragging = true;
    this.matter.body.setStatic(b.body, true);
    b.img.setAlpha(0.3);
    return true;
  }

  endDrag(b) {
    if (b.removed) return;
    b.dragging = false;
    this.matter.body.setStatic(b.body, false);
    this.matter.body.setVelocity(b.body, { x: 0, y: 0 });
    b.img.setAlpha(1);
  }

  // ---------- Customers ----------
  rampValue(table, t) {
    let v = table[0];
    for (const row of table) if (t >= row.atSec) v = row;
    return v;
  }

  openSlots() {
    const CC = this.C.customers;
    return Math.min(CC.maxSlots, this.rampValue(CC.slotRamp, this.elapsed).slots);
  }

  spawnInterval() {
    const CC = this.C.customers;
    const k = Phaser.Math.Clamp(this.elapsed / CC.spawnIntervalRampSec, 0, 1);
    return CC.spawnIntervalStartMs + (CC.spawnIntervalEndMs - CC.spawnIntervalStartMs) * k;
  }

  spawnCustomer(slot) {
    const CC = this.C.customers;
    const ramp = this.rampValue(CC.orderTierRamp, this.elapsed);
    const job = Phaser.Math.Between(ramp.min, ramp.max);
    let look = job;
    if (Math.random() < CC.hybridChance) {
      look = Phaser.Math.Between(0, 5);
      if (look >= job) look += 1;
    }
    const total = CC.orderTimeBaseSec + CC.orderTimePerTierSec * job;
    this.customers[slot] = {
      look, job, tier: job, name: ERA_DATA.customerName(look, job),
      timeLeft: total, timeTotal: total, state: 'waiting', age: 0, leaveT: 0, result: null, points: 0,
    };
  }

  updateCustomers(dt) {
    const CC = this.C.customers;
    this.spawnTimerMs -= dt * 1000;
    if (this.spawnTimerMs <= 0) {
      const open = this.openSlots();
      let free = -1;
      for (let i = 0; i < open; i++) if (!this.customers[i]) { free = i; break; }
      if (free >= 0) {
        this.spawnCustomer(free);
        this.spawnTimerMs = this.spawnInterval();
      } else {
        this.spawnTimerMs = CC.retryWhenFullMs;
      }
    }
    for (let i = 0; i < this.customers.length; i++) {
      const c = this.customers[i];
      if (!c) continue;
      c.age += dt;
      if (c.state === 'waiting') {
        c.timeLeft -= dt;
        if (c.timeLeft <= 0) {
          c.timeLeft = 0;
          const pen = this.C.scoring.timeoutPenalty[c.tier];
          this.addScore(-pen);
          c.state = 'leaving';
          c.result = 'timeout';
          c.points = -pen;
        }
      } else if (c.state === 'leaving') {
        c.leaveT += dt;
        if (c.leaveT >= CC.leaveSec) this.customers[i] = null;
      }
    }
  }

  // Serve bubble b. slot === undefined: pick the waiting customer for that item with the least time left.
  // Returns { ok, slot, isNew } — isNew is true when a hybrid joins the Customer Book for the first time.
  serveBubble(b, slot) {
    if (b.removed || this.gameOver) return { ok: false };
    if (slot === undefined) {
      let best = -1;
      for (let i = 0; i < this.customers.length; i++) {
        const c = this.customers[i];
        if (c && c.state === 'waiting' && c.tier === b.tier && (best < 0 || c.timeLeft < this.customers[best].timeLeft)) best = i;
      }
      slot = best;
    }
    const c = slot >= 0 ? this.customers[slot] : null;
    if (!c || c.state !== 'waiting' || c.tier !== b.tier) return { ok: false };

    this.removeBubble(b); // remaining bubbles fall into the freed space
    const bonus = this.C.scoring.orderBonus[c.tier];
    this.addScore(bonus);
    c.state = 'leaving';
    c.result = 'served';
    c.points = bonus;
    let isNew = false;
    if (c.look !== c.job) isNew = EraStorage.addToBook(c.look, c.job);
    return { ok: true, slot, isNew, name: c.name };
  }

  addScore(n) {
    this.score = Math.max(this.C.scoring.scoreFloor, this.score + n);
  }

  // ---------- Lose ----------
  checkLose(deltaMs) {
    const line = this.C.capsule.dangerLineY;
    let danger = false;
    for (const b of this.bubbles) {
      if (b.dead || !b.landed) { b.aboveMs = 0; continue; }
      if (b.body.position.y - b.r < line) {
        b.aboveMs += deltaMs;
        danger = true;
        if (b.aboveMs >= this.C.lose.graceMs) {
          this.endGame();
          return;
        }
      } else {
        b.aboveMs = 0;
      }
    }
    this.dangerActive = danger;
  }

  endGame() {
    this.gameOver = true;
    this.dangerActive = true;
    this.matter.world.pause();
    if (this.score > this.best) {
      this.best = this.score;
      EraStorage.saveBest(this.best);
    }
  }

  restartGame() {
    this.scene.restart();
  }

  update(time, delta) {
    this.drawPortal(time);
    if (!this.gameOver) {
      const dt = Math.min(delta, 100) / 1000;
      this.elapsed += dt;
      this.processMerges();
      this.updateCustomers(dt);
      this.checkLose(delta);
    }
    for (const b of this.bubbles) {
      b.img.setPosition(b.body.position.x, b.body.position.y);
      if (!this.C.physics.lockRotation) b.img.setRotation(b.body.angle);
    }
    this.drawAim();
    this.drawDanger(time);
  }
}
