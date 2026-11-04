// Game scene: the time capsule, bubble physics, merging, customers, scoring.
// All UI (HUD, customer cards, overlays) and pointer input live in UIScene.

class GameScene extends Phaser.Scene {
  constructor() {
    // The logo loads first (scene pack) so the loading screen can show it.
    super({ key: 'Game', active: true, pack: { files: [{ type: 'image', key: 'ui_logo_src', url: 'assets/ui/logo.jpg' }] } });
  }

  preload() {
    EraArt.buildLogo(this);
    EraArt.preload(this);
    EraAudio.preload(this);
    if (this.load.list.size > 0) this.showLoadingBar(); // nothing queued on restart
  }

  // Logo, progress bar and percentage on plain black while the art sheets download (camera is still full-screen here).
  showLoadingBar() {
    const W = this.scale.width, H = this.scale.height;
    const black = this.add.rectangle(0, 0, W, H, 0x000000, 1).setOrigin(0, 0);
    const bw = Math.min(W * 0.6, 600), bh = Math.max(10, Math.min(W, H) * 0.025);
    const x = (W - bw) / 2, y = H * 0.62;
    const title = this.textures.exists('ui_logo')
      ? this.add.image(W / 2, y - bh * 3, 'ui_logo').setOrigin(0.5, 1)
      : this.add.text(W / 2, y - bh * 3, 'ERA POP', {
        fontFamily: ERA_FONTS.title, fontStyle: '900', fontSize: Math.round(Math.min(W, H) * 0.08) + 'px',
        color: '#ffe066', stroke: '#241b3d', strokeThickness: 6,
      }).setOrigin(0.5, 1);
    if (title.type === 'Image') title.setScale(Math.min((W * 0.7) / title.width, (H * 0.4) / title.height));
    const g = this.add.graphics();
    const pct = this.add.text(W / 2, y + bh * 2.2, '0%', {
      fontFamily: ERA_FONTS.title, fontStyle: '900', fontSize: Math.round(Math.max(14, Math.min(W, H) * 0.035)) + 'px',
      color: '#ffffff',
    }).setOrigin(0.5, 0);
    const draw = (p) => {
      g.clear();
      g.fillStyle(0xffffff, 0.15).fillRoundedRect(x, y, bw, bh, bh / 2);
      g.fillStyle(0x22e3ff, 1).fillRoundedRect(x, y, Math.max(bh, bw * p), bh, bh / 2);
      pct.setText(Math.round(p * 100) + '%');
    };
    draw(0);
    this.load.on('progress', draw);
    this.load.once('complete', () => {
      this.load.off('progress', draw);
      g.destroy();
      pct.destroy();
      title.destroy();
      black.destroy();
    });
  }

  create() {
    const C = window.ERA_POP_CONFIG;
    this.C = C;
    const cap = C.capsule;

    EraArt.build(this);
    EraAudio.init(this);
    EraAudio.startMusic();

    // Capsule frame art: scale it so its inner opening matches the capsule interior.
    const F = EraArt.frame;
    if (F && this.textures.exists('ui_frame')) {
      const sx = cap.width / (F.r - F.l), sy = (cap.height + 14) / (F.b - F.t);
      this.frameBox = { x: -F.l * sx, y: -14 - F.t * sy, sx, sy, w: F.w * sx, h: F.h * sy };
    } else {
      this.frameBox = null;
    }

    // Visible world area (capsule + frame + held bubble), fitted into the screen rect UIScene gives us.
    const fb = this.frameBox;
    const left = Math.min(-40, fb ? fb.x - 6 : 0), right = Math.max(cap.width + 40, fb ? fb.x + fb.w + 6 : 0);
    const bottom = Math.max(cap.height + 40, fb ? fb.y + fb.h + 6 : 0);
    const top = Math.min(cap.dropY - Math.max(...C.bubbleRadius.slice(0, 3)) - 10, fb ? fb.y - 6 : 0);
    this.view = { x: left, y: top, w: right - left, h: bottom - top };

    // ---- Walls ----
    const t = cap.wallThickness;
    const wallOpts = { isStatic: true, friction: C.physics.friction, restitution: 0, label: 'wall' };
    const wallH = cap.height + 1200;
    this.matter.add.rectangle(-t / 2, cap.height - wallH / 2, t, wallH, wallOpts);
    this.matter.add.rectangle(cap.width + t / 2, cap.height - wallH / 2, t, wallH, wallOpts);
    this.matter.add.rectangle(cap.width / 2, cap.height + t / 2, cap.width + t * 2, t, wallOpts);
    this.matter.world.setGravity(0, C.physics.gravityY);

    // ---- Visuals ----
    this.skin = { glass: 0xbfe9ff, frameTint: 0xffffff }; // capsule glass and frame colours
    this.backG = this.add.graphics();
    this.aimG = this.add.graphics();
    this.glowG = this.add.graphics(); // match glow, behind the bubbles
    this.bubbleLayer = this.add.container(0, 0);
    this.frontG = this.add.graphics();
    this.frameImg = fb ? this.add.image(fb.x, fb.y, 'ui_frame').setOrigin(0, 0).setScale(fb.sx, fb.sy) : null;
    this.drawCapsule();
    this.dangerG = this.add.graphics();
    this.heldImg = this.add.image(0, cap.dropY, 'bubble0').setScale(1 / EraDraw.TEX_SCALE);

    // ---- State ----
    this.bubbles = [];
    this.mergeQueue = [];
    this.score = 0;
    this.best = EraStorage.loadBest();
    this.elapsed = 0;
    this.gameOver = false;
    this.aimX = cap.width / 2;
    // First run: a mandatory tutorial (drop → merge → serve → danger line) before the real game starts.
    this.tutorial = EraStorage.tutorialDone() ? null : { step: 'drop' };
    this.currentTier = this.randomDropTier();
    this.nextTier = this.randomDropTier();
    this.canDrop = true;
    this.pendingDrop = false;
    this.customers = new Array(C.customers.maxSlots).fill(null);
    this.customersSpawned = 0;
    this.spawnTimerMs = C.customers.firstCustomerDelayMs;
    this.dangerActive = false;
    this.combo = 0;
    this.lastMergeAt = -1e9;
    this.storm = null;
    this.nextStormAt = C.storms.firstAtSec;
    this.revivesUsed = 0;
    this.ordersServed = 0;
    this.tickAt = 0;

    this.matter.world.on('collisionstart', this.onCollide, this);
    this.matter.world.on('collisionactive', this.onCollide, this);
    this.matter.world.on('collisionstart', this.onHitSpin, this);

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
  // Capsule glass.
  drawCapsule() {
    const { width: W, height: H } = this.C.capsule;
    const back = this.backG.clear();
    back.fillStyle(0x0f1630, 0.75).fillRoundedRect(-6, -14, W + 12, H + 20, 18);
    back.fillStyle(this.skin.glass, 0.06).fillRect(0, 0, W, H);

    const g = this.frontG.clear();
    if (this.frameImg) {
      // Frame art replaces the drawn walls and rim; keep thin glass edges.
      this.frameImg.setTint(this.skin.frameTint);
      g.lineStyle(4, this.skin.glass, 0.5).lineBetween(0, 0, 0, H).lineBetween(W, 0, W, H);
    } else {
      // glass walls
      g.lineStyle(10, this.skin.glass, 0.85).strokeRoundedRect(-5, -20, W + 10, H + 25, 18);
      g.fillStyle(0x241b3d, 1).fillRect(-10, -30, W + 20, 18); // open top
      // rim
      g.fillStyle(0xcfd8e6, 1).fillRoundedRect(-22, -22, 34, 14, 6).fillRoundedRect(W - 12, -22, 34, 14, 6);
    }
    // glass shine
    g.fillStyle(0xffffff, 0.08).fillRect(14, 20, 14, H - 60);
    g.fillStyle(0xffffff, 0.06).fillRect(36, 40, 6, H - 120);
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
    const show = this.dangerActive || (this.tutorial && this.tutorial.step === 'line');
    const flash = show && Math.floor(time / 200) % 2 === 0;
    g.lineStyle(flash ? 5 : 3, flash ? 0xff3355 : 0xff8899, flash ? 0.95 : 0.4);
    for (let x = 0; x < W; x += 28) g.lineBetween(x, y, Math.min(W, x + 16), y);
  }

  // Pulsing ring around every bubble that a waiting customer ordered.
  drawGlow(time) {
    const g = this.glowG.clear();
    if (this.gameOver) return;
    const wanted = new Set();
    for (const c of this.customers) if (c && c.state === 'waiting') wanted.add(c.tier);
    if (!wanted.size) return;
    const a = 0.45 + 0.35 * Math.sin(time * 0.008);
    for (const b of this.bubbles) {
      if (b.dead || b.dragging || !b.landed || !wanted.has(b.tier)) continue;
      const p = b.body.position;
      g.lineStyle(7, 0xffe066, a).strokeCircle(p.x, p.y, b.r + 4);
    }
  }

  // ---------- Bubbles ----------
  randomDropTier() {
    if (this.tutorial) return 0; // only Wheels in the tutorial, so the first merge is easy
    const w = this.rampValue(this.C.drop.spawnWeightRamp, this.elapsed || 0).weights;
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
    const b = { tier, r, body, img, landed: !!landed, dead: false, dragging: false, aboveMs: 0, angle: 0, spin: 0 };
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
    if (this.gameOver) return;
    const T = this.tutorial;
    if (T && T.step !== 'drop' && T.step !== 'merge') return; // later tutorial steps don't drop
    if (!this.canDrop) {
      this.pendingDrop = true; // tap during the cooldown: drop as soon as the next bubble is ready
      return;
    }
    const cap = this.C.capsule;
    const r = this.C.bubbleRadius[this.currentTier];
    const x = Phaser.Math.Clamp(this.aimX, r, cap.width - r);
    this.spawnBubble(this.currentTier, x, cap.dropY, false);
    EraAudio.play('drop');
    if (T && T.step === 'drop') T.step = 'merge';
    this.canDrop = false;
    this.time.delayedCall(this.C.drop.cooldownMs, () => {
      this.currentTier = this.nextTier;
      this.nextTier = this.randomDropTier();
      this.canDrop = true;
      if (this.pendingDrop) {
        this.pendingDrop = false;
        this.dropBubble();
      }
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

  // Spin kick on impact: the sideways part of the relative velocity at the contact sets each
  // bubble spinning (in opposite directions, like gears); bigger bubbles spin slower.
  onHitSpin(event) {
    const SP = this.C.physics.spin;
    for (const pair of event.pairs) {
      const a = pair.bodyA.bubble, b = pair.bodyB.bubble;
      if (!a && !b) continue;
      const n = pair.collision.normal;
      const va = pair.bodyA.velocity, vb = pair.bodyB.velocity;
      const cross = n.x * (va.y - vb.y) - n.y * (va.x - vb.x);
      if (a && !a.dragging) a.spin = Phaser.Math.Clamp(a.spin + (SP.hitKick * cross) / a.r * 4, -SP.maxSpin, SP.maxSpin);
      if (b && !b.dragging) b.spin = Phaser.Math.Clamp(b.spin - (SP.hitKick * cross) / b.r * 4, -SP.maxSpin, SP.maxSpin);
    }
  }

  // Each frame: spin eases toward rolling with the sideways speed, so kicks fade and resting bubbles stop.
  updateSpin(delta) {
    const SP = this.C.physics.spin, k = delta / 16.67;
    for (const b of this.bubbles) {
      if (b.dragging) continue;
      const roll = b.body.velocity.x / b.r;
      b.spin += (roll - b.spin) * Math.min(1, SP.rollFollow * k);
      b.angle += b.spin * k;
      b.img.setRotation(b.angle);
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

      // Combo: merges close together in time multiply their points.
      this.combo = this.elapsed - this.lastMergeAt <= S.combo.windowMs / 1000 ? this.combo + 1 : 1;
      this.lastMergeAt = this.elapsed;
      let mult = Math.min(S.combo.maxMultiplier, 1 + S.combo.stepMultiplier * (this.combo - 1));
      if (this.storm && this.storm.type === 'merge') mult *= this.C.storms.mergeMultiplier;
      const comboTag = this.combo > 1 ? '  COMBO x' + this.combo : '';

      if (tier < this.C.bubbleRadius.length - 1) {
        const nb = this.spawnBubble(tier + 1, x, y, true);
        nb.img.setScale(0.7 / EraDraw.TEX_SCALE);
        this.tweens.add({ targets: nb.img, scale: 1 / EraDraw.TEX_SCALE, duration: 160, ease: 'Back.Out' });
        const A = this.C.audio;
        EraAudio.play('merge', { rate: (A.mergePitchBase + A.mergePitchPerTier * tier) * (1 + A.comboPitchStep * (this.combo - 1)) });
        const pts = Math.round(S.mergePoints[tier + 1] * mult);
        this.addScore(pts);
        this.popText(x, y, '+' + pts + comboTag, this.combo > 1 ? '#ffe066' : '#ffffff', this.combo > 1 ? 1.2 : 1);
        const size = this.C.bubbleRadius[tier + 1] * 2.6;
        this.fx('fx_pop', x, y, size, 450);
        if (this.combo > 1) this.fx('fx_stars', x, y, size * 1.2, 700);
      } else {
        // Two Rockets merge and disappear.
        EraAudio.play('rocket');
        const pts = Math.round(S.rocketPopPoints * mult);
        this.addScore(pts);
        this.popText(x, y, 'POP! +' + pts + comboTag, '#ffe066', 1.6);
        this.burst(x, y);
      }
    }
    // Tutorial: after the first merge, a customer walks in wanting what was just made.
    if (this.tutorial && this.tutorial.step === 'merge') this.time.delayedCall(500, () => this.tutorialCustomer());
  }

  // ---------- First-run tutorial ----------
  tutorialCustomer() {
    const T = this.tutorial;
    if (!T || T.step !== 'merge') return;
    T.step = 'serve';
    this.tutorialRetarget();
  }

  // The tutorial customer always orders an item that is in the capsule (the biggest one).
  // Called again if that bubble merges away before it's served.
  tutorialRetarget() {
    let tier = 0;
    for (const b of this.bubbles) if (!b.dead) tier = Math.max(tier, b.tier);
    const c = this.customers[0];
    if (c && c.state === 'waiting' && c.tier === tier) return;
    const total = 30; // the tutorial order never runs out (its timer is frozen)
    this.customers[0] = {
      look: tier, job: tier, tier, name: ERA_DATA.customerName(tier, tier), mult: 1, gentle: true,
      line: ERA_DATA.orderLine(tier, tier),
      timeLeft: total, timeTotal: total, state: 'waiting', age: c ? c.age : 0, leaveT: 0, result: null, points: 0, tip: 0,
    };
  }

  finishTutorial() {
    if (!this.tutorial) return;
    this.tutorial = null;
    EraStorage.setTutorialDone();
    this.elapsed = 0;
    this.lastMergeAt = -1e9;
    this.score = 0;          // the real run starts from zero
    this.ordersServed = 0;
    this.spawnTimerMs = this.C.customers.firstCustomerDelayMs;
    this.nextTier = this.randomDropTier();
  }

  popText(x, y, str, color, scale) {
    const s = scale || 1;
    const txt = this.add.text(x, y, str, {
      fontFamily: ERA_FONTS.title, fontStyle: '900', fontSize: Math.round(26 * s) + 'px', color,
      stroke: '#241b3d', strokeThickness: 6, resolution: 3,
    }).setOrigin(0.5);
    this.tweens.add({ targets: txt, y: y - 60, alpha: 0, duration: 900, ease: 'Cubic.Out', onComplete: () => txt.destroy() });
  }

  // One-shot effect from the effects sheet, blended additively; grows and fades out.
  fx(key, x, y, size, duration) {
    if (!this.textures.exists(key)) return false;
    const img = this.add.image(x, y, key).setBlendMode(Phaser.BlendModes.ADD);
    img.setScale((size * 0.6) / Math.max(img.width, img.height));
    this.tweens.add({
      targets: img, scale: (size * 1.3) / Math.max(img.width, img.height), alpha: 0,
      duration, ease: 'Cubic.Out', onComplete: () => img.destroy(),
    });
    return true;
  }

  burst(x, y) {
    if (this.fx('fx_stars', x, y, 420, 900)) {
      this.fx('fx_pop', x, y, 300, 600);
      return;
    }
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

  // A Rocket order is only fair when a Rocket exists or enough Planes to make one.
  rocketReachable() {
    let planes = 0;
    for (const b of this.bubbles) {
      if (b.dead) continue;
      if (b.tier === 6) return true;
      if (b.tier === 5) planes++;
    }
    return planes >= this.C.customers.rocketOrders.minPlanes;
  }

  pickCustomer() {
    const CC = this.C.customers;
    const ramp = this.rampValue(CC.orderTierRamp, this.elapsed);
    let job = Phaser.Math.Between(ramp.min, ramp.max);
    // Prefer an item that isn't already in the capsule (allowing one size up), so every order is something to build.
    const have = new Set(this.bubbles.filter((b) => !b.dead).map((b) => b.tier));
    if (have.has(job)) {
      const options = [];
      for (let t = ramp.min; t <= Math.min(6, ramp.max + 1); t++) if (!have.has(t)) options.push(t);
      if (options.length) job = Phaser.Utils.Array.GetRandom(options);
    }
    if (job === 6 && !this.rocketReachable()) job = Phaser.Math.Between(Math.min(ramp.min, 5), 5);
    let look = job;
    // Prefer a customer for this order (original or hybrid) that isn't in the Customer Book yet, so the player keeps meeting new faces.
    const locked = [];
    for (let l = 0; l < 7; l++) if (!EraStorage.hasInBook(l, job)) locked.push(l);
    if (this.storm && this.storm.type === 'era') look = this.storm.look;
    else if (locked.length) look = Phaser.Utils.Array.GetRandom(locked);
    else if (Math.random() < CC.hybridChance) {
      look = Phaser.Math.Between(0, 5);
      if (look >= job) look += 1;
    }
    return { look, job };
  }

  spawnCustomer(slot) {
    const CC = this.C.customers;
    // Never show the same customer twice at once.
    let pick = this.pickCustomer();
    for (let tries = 0; tries < 12 && this.customers.some((c) => c && c.look === pick.look && c.job === pick.job); tries++) {
      pick = this.pickCustomer();
    }
    const { look, job } = pick;
    let total = CC.orderTimeBaseSec + CC.orderTimePerTierSec * job;
    if (job === 6) total += CC.rocketOrders.extraTimeSec;
    const ST = this.C.storms;
    const mult = !this.storm ? 1 : this.storm.type === 'era' ? ST.eraOrderMultiplier : this.storm.type === 'rush' ? ST.rushOrderMultiplier : 1;
    this.customersSpawned++;
    this.customers[slot] = {
      look, job, tier: job, name: ERA_DATA.customerName(look, job), mult, line: ERA_DATA.orderLine(look, job),
      gentle: this.customersSpawned <= CC.gentleCustomers,
      timeLeft: total, timeTotal: total, state: 'waiting', age: 0, leaveT: 0, result: null, points: 0, tip: 0,
    };
  }

  // ---------- Time storms ----------
  updateStorm() {
    const ST = this.C.storms;
    if (this.storm) {
      if (this.elapsed >= this.storm.endsAt) {
        this.storm = null;
        this.nextStormAt = this.elapsed + ST.everySec;
      }
      return;
    }
    if (this.elapsed < this.nextStormAt) return;
    const type = Phaser.Utils.Array.GetRandom(['era', 'merge', 'rush']);
    const look = Phaser.Math.Between(0, 6);
    const label = type === 'era' ? ERA_DATA.eras[look].short + ' invasion! Orders x' + ST.eraOrderMultiplier
      : type === 'merge' ? 'Merge frenzy! Merges x' + ST.mergeMultiplier
      : 'Rush hour! Orders x' + ST.rushOrderMultiplier;
    this.storm = { type, look, label, endsAt: this.elapsed + ST.durationSec };
    EraAudio.play('storm');
    if (type === 'rush') this.spawnTimerMs = Math.min(this.spawnTimerMs, 500);
  }

  updateCustomers(dt) {
    const CC = this.C.customers;
    const tut = !!this.tutorial; // tutorial: no arrivals and no order timers
    if (!tut) this.spawnTimerMs -= dt * 1000;
    if (!tut && this.spawnTimerMs <= 0) {
      const open = this.openSlots();
      let free = -1;
      for (let i = 0; i < open; i++) if (!this.customers[i]) { free = i; break; }
      if (free >= 0) {
        this.spawnCustomer(free);
        this.spawnTimerMs = CC.retryWhenFullMs;
      } else {
        this.spawnTimerMs = CC.retryWhenFullMs;
      }
    }
    for (let i = 0; i < this.customers.length; i++) {
      const c = this.customers[i];
      if (!c) continue;
      c.age += dt;
      if (c.state === 'waiting') {
        if (tut) continue;
        c.timeLeft -= dt;
        if (c.timeLeft <= 0) {
          c.timeLeft = 0;
          const pen = c.gentle ? 0 : this.C.scoring.timeoutPenalty[c.tier];
          this.addScore(-pen);
          c.state = 'leaving';
          c.result = 'timeout';
          c.line = ERA_DATA.reactLine(c.look, false);
          c.points = -pen;
          EraAudio.play('timeout');
        }
      } else if (c.state === 'leaving') {
        c.leaveT += dt;
        if (c.leaveT >= CC.leaveSec) {
          this.customers[i] = null;
          // Short break before the next customer walks in (shorter during a rush hour).
          const rush = this.storm && this.storm.type === 'rush' ? this.C.storms.rushSpawnFactor : 1;
          this.spawnTimerMs = CC.betweenOrdersMs * rush;
        }
      }
    }
  }

  // Serve bubble b. slot === undefined: pick the waiting customer for that item with the least time left.
  // Returns { ok, slot, isNew } — isNew is true when a customer joins the Customer Book for the first time.
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
    const S = this.C.scoring;
    const bonus = Math.round(S.orderBonus[c.tier] * c.mult * this.orderMultiplier());
    const tip = c.timeLeft >= c.timeTotal * (1 - S.tip.windowFraction) ? Math.round(bonus * S.tip.rate) : 0;
    this.addScore(bonus + tip);
    c.state = 'leaving';
    c.result = 'served';
    c.line = ERA_DATA.reactLine(c.look, true);
    this.ordersServed++;
    c.points = bonus + tip;
    c.tip = tip;
    EraAudio.play('serve');
    const isNew = EraStorage.addToBook(c.look, c.job);
    if (this.tutorial && this.tutorial.step === 'serve') this.tutorial.step = 'line';
    return { ok: true, slot, isNew, name: c.name };
  }

  // Order bonuses grow with every order served this run.
  orderMultiplier() {
    const OG = this.C.scoring.orderGrowth;
    return Math.min(OG.max, 1 + OG.perOrder * this.ordersServed);
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
    if (danger && this.elapsed * 1000 >= this.tickAt) {
      this.tickAt = this.elapsed * 1000 + this.C.audio.dangerTickMs;
      EraAudio.play('tick');
    }
  }

  endGame() {
    this.gameOver = true;
    this.dangerActive = true;
    this.matter.world.pause();
    EraAudio.pauseMusic();
    EraAudio.play('gameover');
    if (this.score > this.best) {
      this.best = this.score;
      EraStorage.saveBest(this.best);
    }
  }

  restartGame() {
    this.scene.restart();
  }

  // Leaving a run early (Restart in the pause menu) still keeps a new best score.
  quitRun() {
    if (this.score > this.best) {
      this.best = this.score;
      EraStorage.saveBest(this.best);
    }
  }

  // ---------- Rewarded ad results ----------
  canRevive() {
    return this.gameOver && this.revivesUsed < this.C.ads.revivesPerRun;
  }

  // Clear the top of the capsule and carry on.
  revive() {
    if (!this.canRevive()) return;
    this.revivesUsed++;
    const limit = this.C.capsule.dangerLineY + this.C.ads.reviveClearDepth;
    for (const b of this.bubbles.slice()) {
      if (b.body.position.y - b.r < limit) {
        this.fx('fx_puff', b.body.position.x, b.body.position.y, b.r * 2.6, 500);
        this.removeBubble(b);
      }
    }
    for (const b of this.bubbles) b.aboveMs = 0;
    this.mergeQueue = this.mergeQueue.filter(([a, b]) => !a.removed && !b.removed);
    this.gameOver = false;
    this.dangerActive = false;
    this.canDrop = true;
    this.pendingDrop = false;
    this.matter.world.resume();
    EraAudio.startMusic();
  }

  update(time, delta) {
    if (this.tutorial) {
      // Storms, customer arrivals and the lose check wait until the tutorial is done; the clock restarts after it.
      const dt = Math.min(delta, 100) / 1000;
      this.elapsed += dt;
      this.processMerges();
      this.updateCustomers(dt);
      if (this.tutorial.step === 'serve') this.tutorialRetarget();
    } else if (!this.gameOver) {
      const dt = Math.min(delta, 100) / 1000;
      this.elapsed += dt;
      this.updateStorm();
      this.processMerges();
      this.updateCustomers(dt);
      this.checkLose(delta);
    }
    for (const b of this.bubbles) {
      b.img.setPosition(b.body.position.x, b.body.position.y);
    }
    if (!this.gameOver) this.updateSpin(delta);
    this.drawGlow(time);
    this.drawAim();
    this.drawDanger(time);
  }
}
