// Placeholder art, drawn entirely in code with Phaser Graphics.

window.EraDraw = (function () {
  const D = window.ERA_DATA;
  const TEX_SCALE = 3; // bubble textures are drawn at 3x world size for crisp zooming

  // ---- Items (s = half-size of the icon box) ----
  function stoneWheel(g, x, y, r) {
    g.fillStyle(0x8a8580, 1).fillCircle(x, y, r);
    g.lineStyle(r * 0.16, 0x5f5a55, 1).strokeCircle(x, y, r * 0.92);
    g.fillStyle(0x3a2a1a, 1).fillCircle(x, y, r * 0.25);
  }

  function spokedWheel(g, x, y, r, rim, hub) {
    g.fillStyle(0x2a2420, 1).fillCircle(x, y, r);
    g.fillStyle(hub, 1).fillCircle(x, y, r * 0.62);
    g.lineStyle(r * 0.14, rim, 1);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 4;
      g.lineBetween(x - Math.cos(a) * r * 0.6, y - Math.sin(a) * r * 0.6,
        x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6);
    }
    g.fillStyle(rim, 1).fillCircle(x, y, r * 0.2);
  }

  function drawItem(g, tier, x, y, s) {
    switch (tier) {
      case 0: { // Wheel
        stoneWheel(g, x, y, s * 0.85);
        g.fillStyle(0xa9a39d, 1).fillCircle(x - s * 0.35, y - s * 0.3, s * 0.1);
        g.fillCircle(x + s * 0.3, y + s * 0.4, s * 0.08);
        break;
      }
      case 1: { // Cart
        g.lineStyle(s * 0.12, 0x6b4a26, 1).lineBetween(x + s * 0.5, y - s * 0.05, x + s * 0.95, y - s * 0.55);
        g.fillStyle(0xa0703c, 1).fillRect(x - s * 0.8, y - s * 0.45, s * 1.35, s * 0.6);
        g.lineStyle(s * 0.06, 0x6b4a26, 1);
        g.lineBetween(x - s * 0.8, y - s * 0.25, x + s * 0.55, y - s * 0.25);
        g.lineBetween(x - s * 0.8, y - s * 0.05, x + s * 0.55, y - s * 0.05);
        stoneWheel(g, x - s * 0.12, y + s * 0.38, s * 0.38);
        break;
      }
      case 2: { // Carriage
        g.fillStyle(0x7b2d8e, 1).fillRoundedRect(x - s * 0.8, y - s * 0.55, s * 1.6, s * 0.85, s * 0.22);
        g.fillStyle(0xe2b13c, 1).fillRect(x - s * 0.88, y - s * 0.68, s * 1.76, s * 0.15);
        g.fillStyle(0xcfe8ff, 1).fillRoundedRect(x - s * 0.32, y - s * 0.4, s * 0.64, s * 0.36, s * 0.08);
        g.fillStyle(0xe2b13c, 1).fillCircle(x, y - s * 0.82, s * 0.1);
        spokedWheel(g, x - s * 0.52, y + s * 0.45, s * 0.32, 0xe2b13c, 0x6b4a26);
        spokedWheel(g, x + s * 0.52, y + s * 0.45, s * 0.32, 0xe2b13c, 0x6b4a26);
        break;
      }
      case 3: { // Bicycle (penny-farthing)
        g.lineStyle(s * 0.1, 0x222222, 1).strokeCircle(x + s * 0.2, y + s * 0.12, s * 0.62);
        g.lineStyle(s * 0.04, 0x777777, 1);
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 6;
          g.lineBetween(x + s * 0.2 - Math.cos(a) * s * 0.58, y + s * 0.12 - Math.sin(a) * s * 0.58,
            x + s * 0.2 + Math.cos(a) * s * 0.58, y + s * 0.12 + Math.sin(a) * s * 0.58);
        }
        g.lineStyle(s * 0.08, 0x222222, 1).strokeCircle(x - s * 0.68, y + s * 0.56, s * 0.18);
        g.lineStyle(s * 0.1, 0xc0392b, 1);
        g.beginPath();
        g.moveTo(x - s * 0.68, y + s * 0.56);
        g.lineTo(x - s * 0.4, y - s * 0.2);
        g.lineTo(x + s * 0.1, y - s * 0.55);
        g.strokePath();
        g.lineBetween(x + s * 0.1, y - s * 0.55, x + s * 0.2, y + s * 0.12);
        g.fillStyle(0x3b2a1a, 1).fillEllipse(x - s * 0.05, y - s * 0.62, s * 0.36, s * 0.14);
        g.lineStyle(s * 0.08, 0x444444, 1).lineBetween(x + s * 0.12, y - s * 0.55, x + s * 0.45, y - s * 0.72);
        break;
      }
      case 4: { // Car (1950s)
        g.fillStyle(0x3cc8c0, 1).fillRoundedRect(x - s * 0.92, y - s * 0.12, s * 1.84, s * 0.5, s * 0.2);
        g.fillStyle(0x3cc8c0, 1).fillRoundedRect(x - s * 0.5, y - s * 0.5, s * 1.0, s * 0.5, s * 0.2);
        g.fillStyle(0xcfe8ff, 1).fillRoundedRect(x - s * 0.4, y - s * 0.42, s * 0.36, s * 0.3, s * 0.06);
        g.fillRoundedRect(x + s * 0.04, y - s * 0.42, s * 0.36, s * 0.3, s * 0.06);
        g.fillStyle(0xffffff, 1).fillRect(x - s * 0.9, y + s * 0.06, s * 1.8, s * 0.07);
        g.fillStyle(0xfff3a0, 1).fillCircle(x + s * 0.86, y + s * 0.0, s * 0.07);
        spokedWheel(g, x - s * 0.5, y + s * 0.42, s * 0.24, 0xdddddd, 0x888888);
        spokedWheel(g, x + s * 0.5, y + s * 0.42, s * 0.24, 0xdddddd, 0x888888);
        break;
      }
      case 5: { // Plane (biplane)
        g.fillStyle(0xf2c14e, 1).fillRoundedRect(x - s * 0.5, y - s * 0.5, s * 0.95, s * 0.14, s * 0.05);
        g.lineStyle(s * 0.05, 0x5a3a1a, 1);
        g.lineBetween(x - s * 0.35, y - s * 0.38, x - s * 0.35, y + s * 0.15);
        g.lineBetween(x + s * 0.25, y - s * 0.38, x + s * 0.25, y + s * 0.15);
        g.fillStyle(0xd94f2b, 1).fillEllipse(x, y - s * 0.05, s * 1.75, s * 0.42);
        g.fillTriangle(x - s * 0.75, y - s * 0.12, x - s * 0.95, y - s * 0.5, x - s * 0.55, y - s * 0.12);
        g.fillStyle(0x2a2a2a, 1).fillEllipse(x - s * 0.05, y - s * 0.22, s * 0.3, s * 0.16);
        g.fillStyle(0xf2c14e, 1).fillRoundedRect(x - s * 0.45, y + s * 0.1, s * 0.85, s * 0.12, s * 0.05);
        g.fillStyle(0x5a3a1a, 1).fillEllipse(x + s * 0.92, y - s * 0.05, s * 0.1, s * 0.75);
        g.fillStyle(0x333333, 1).fillCircle(x + s * 0.88, y - s * 0.05, s * 0.07);
        break;
      }
      case 6: { // Rocket
        g.fillStyle(0xffa62b, 1).fillTriangle(x - s * 0.2, y + s * 0.5, x + s * 0.2, y + s * 0.5, x, y + s * 0.95);
        g.fillStyle(0xfff1a8, 1).fillTriangle(x - s * 0.1, y + s * 0.5, x + s * 0.1, y + s * 0.5, x, y + s * 0.75);
        g.fillStyle(0xe03a3a, 1).fillTriangle(x - s * 0.3, y + s * 0.1, x - s * 0.55, y + s * 0.6, x - s * 0.3, y + s * 0.5);
        g.fillTriangle(x + s * 0.3, y + s * 0.1, x + s * 0.55, y + s * 0.6, x + s * 0.3, y + s * 0.5);
        g.fillStyle(0xf2f2f2, 1).fillRoundedRect(x - s * 0.3, y - s * 0.5, s * 0.6, s * 1.05, s * 0.2);
        g.fillStyle(0xe03a3a, 1).fillTriangle(x - s * 0.3, y - s * 0.42, x + s * 0.3, y - s * 0.42, x, y - s * 0.95);
        g.fillStyle(0x2b5fa8, 1).fillCircle(x, y - s * 0.12, s * 0.15);
        g.lineStyle(s * 0.05, 0x999999, 1).strokeCircle(x, y - s * 0.12, s * 0.15);
        break;
      }
    }
  }

  // ---- Bubbles ----
  function drawBubble(g, tier, x, y, r) {
    g.fillStyle(D.tierColors[tier], 0.38).fillCircle(x, y, r);
    g.fillStyle(0xffffff, 0.08).fillCircle(x, y, r * 0.8);
    drawItem(g, tier, x, y, r * 0.62);
    g.lineStyle(r * 0.07, 0xffffff, 0.85).strokeCircle(x, y, r * 0.96);
    g.fillStyle(0xffffff, 0.6).fillEllipse(x - r * 0.38, y - r * 0.52, r * 0.42, r * 0.2);
    g.fillStyle(0xffffff, 0.5).fillCircle(x + r * 0.5, y + r * 0.45, r * 0.06);
  }

  function makeBubbleTextures(scene) {
    const radii = window.ERA_POP_CONFIG.bubbleRadius;
    for (let t = 0; t < radii.length; t++) {
      const key = 'bubble' + t;
      if (scene.textures.exists(key)) continue;
      const r = radii[t] * TEX_SCALE;
      const size = Math.ceil(r * 2 + 4);
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      drawBubble(g, t, size / 2, size / 2, r);
      g.generateTexture(key, size, size);
      g.destroy();
    }
  }

  // ---- Customers ----
  // Look decides the art style (palette + pattern), Job decides the costume (and the order).
  function pattern(g, L, x, y, w, h) {
    const a = L.accent;
    switch (L.pattern) {
      case 'spots':
        g.fillStyle(a, 0.8);
        g.fillCircle(x - w * 0.25, y - h * 0.1, w * 0.07);
        g.fillCircle(x + w * 0.2, y + h * 0.15, w * 0.06);
        g.fillCircle(x + w * 0.02, y - h * 0.25, w * 0.05);
        break;
      case 'stripes':
        g.fillStyle(a, 0.9);
        g.fillRect(x - w / 2, y - h * 0.25, w, h * 0.14);
        g.fillRect(x - w / 2, y + h * 0.1, w, h * 0.14);
        break;
      case 'rivets':
        g.fillStyle(0xffffff, 0.8);
        for (let i = -2; i <= 2; i++) g.fillCircle(x + i * w * 0.18, y, w * 0.04);
        g.fillStyle(a, 0.9).fillRect(x - w * 0.08, y - h * 0.45, w * 0.16, h * 0.9);
        break;
      case 'check':
        g.lineStyle(Math.max(1, w * 0.04), a, 0.9);
        for (let i = -2; i <= 2; i++) g.lineBetween(x + i * w * 0.2, y - h * 0.45, x + i * w * 0.2, y + h * 0.45);
        g.lineBetween(x - w * 0.5, y, x + w * 0.5, y);
        break;
      case 'polka':
        g.fillStyle(0xffffff, 0.9);
        g.fillCircle(x - w * 0.25, y - h * 0.1, w * 0.05);
        g.fillCircle(x + w * 0.05, y + h * 0.15, w * 0.05);
        g.fillCircle(x + w * 0.28, y - h * 0.15, w * 0.05);
        break;
      case 'stitch':
        g.fillStyle(a, 1);
        for (let i = -3; i <= 3; i++) g.fillRect(x + i * w * 0.13 - w * 0.04, y - h * 0.04, w * 0.08, h * 0.08);
        break;
      case 'circuit':
        g.lineStyle(Math.max(1, w * 0.04), a, 1);
        g.lineBetween(x - w * 0.4, y, x + w * 0.1, y);
        g.lineBetween(x + w * 0.1, y, x + w * 0.25, y - h * 0.3);
        g.fillStyle(a, 1).fillCircle(x - w * 0.4, y, w * 0.05).fillCircle(x + w * 0.25, y - h * 0.3, w * 0.05);
        break;
    }
  }

  // s = radius of the portrait circle. silhouette = locked Customer Book entry.
  function drawAvatar(g, look, job, x, y, s, silhouette) {
    const L = D.eras[look];
    const main = silhouette ? 0x3a3550 : L.main;
    const accent = silhouette ? 0x3a3550 : L.accent;
    const skin = silhouette ? 0x3a3550 : 0xf1c7a0;
    g.fillStyle(silhouette ? 0x221d33 : L.bg, 1).fillCircle(x, y, s);

    // Shoulders / outfit
    g.fillStyle(main, 1).fillEllipse(x, y + s * 0.78, s * 1.45, s * 0.62);
    if (!silhouette) pattern(g, L, x, y + s * 0.78, s * 1.1, s * 0.45);

    // Neck + face
    g.fillStyle(skin, 1).fillRect(x - s * 0.12, y + s * 0.25, s * 0.24, s * 0.25);
    g.fillStyle(skin, 1).fillCircle(x, y + s * 0.05, s * 0.4);
    if (!silhouette) {
      g.fillStyle(0x2a2030, 1).fillCircle(x - s * 0.14, y + s * 0.02, s * 0.05).fillCircle(x + s * 0.14, y + s * 0.02, s * 0.05);
      g.lineStyle(Math.max(1, s * 0.05), 0x7a3b2e, 1);
      g.beginPath();
      g.arc(x, y + s * 0.12, s * 0.14, 0.25, Math.PI - 0.25, false);
      g.strokePath();
    }

    // Job costume, rendered in the Look's palette
    switch (job) {
      case 0: { // Caveman: wild hair
        g.fillStyle(main, 1);
        for (let i = 0; i < 7; i++) {
          const a = Math.PI + (i / 6) * Math.PI;
          g.fillCircle(x + Math.cos(a) * s * 0.38, y - s * 0.05 + Math.sin(a) * s * 0.38, s * 0.16);
        }
        if (!silhouette) pattern(g, L, x, y - s * 0.38, s * 0.6, s * 0.2);
        break;
      }
      case 1: { // Farmer: wide hat
        g.fillStyle(main, 1).fillEllipse(x, y - s * 0.28, s * 1.4, s * 0.24);
        g.fillStyle(main, 1).fillRoundedRect(x - s * 0.3, y - s * 0.62, s * 0.6, s * 0.36, s * 0.1);
        g.fillStyle(accent, 1).fillRect(x - s * 0.3, y - s * 0.38, s * 0.6, s * 0.08);
        if (!silhouette) pattern(g, L, x, y - s * 0.5, s * 0.5, s * 0.2);
        break;
      }
      case 2: { // Knight: open helmet with plume
        g.fillStyle(accent, 1).fillEllipse(x, y - s * 0.66, s * 0.18, s * 0.36);
        g.fillStyle(main, 1).fillEllipse(x, y - s * 0.22, s * 0.98, s * 0.6);
        g.fillRect(x - s * 0.49, y - s * 0.22, s * 0.16, s * 0.4);
        g.fillRect(x + s * 0.33, y - s * 0.22, s * 0.16, s * 0.4);
        if (!silhouette) pattern(g, L, x, y - s * 0.32, s * 0.7, s * 0.2);
        break;
      }
      case 3: { // Gentleman: top hat, moustache, monocle
        g.fillStyle(main, 1).fillRect(x - s * 0.5, y - s * 0.38, s * 1.0, s * 0.1);
        g.fillRect(x - s * 0.3, y - s * 0.86, s * 0.6, s * 0.5);
        g.fillStyle(accent, 1).fillRect(x - s * 0.3, y - s * 0.48, s * 0.6, s * 0.09);
        if (!silhouette) {
          pattern(g, L, x, y - s * 0.66, s * 0.5, s * 0.22);
          g.fillStyle(0x3b2a1a, 1).fillEllipse(x - s * 0.1, y + s * 0.12, s * 0.2, s * 0.08).fillEllipse(x + s * 0.1, y + s * 0.12, s * 0.2, s * 0.08);
          g.lineStyle(Math.max(1, s * 0.04), accent, 1).strokeCircle(x + s * 0.14, y + s * 0.02, s * 0.1);
        }
        break;
      }
      case 4: { // Greaser: pompadour + jacket collar
        g.fillStyle(main, 1).fillEllipse(x + s * 0.02, y - s * 0.3, s * 0.88, s * 0.36);
        g.fillEllipse(x + s * 0.2, y - s * 0.44, s * 0.55, s * 0.3);
        g.fillStyle(accent, 1).fillTriangle(x - s * 0.12, y + s * 0.5, x - s * 0.45, y + s * 0.5, x - s * 0.2, y + s * 0.85);
        g.fillTriangle(x + s * 0.12, y + s * 0.5, x + s * 0.45, y + s * 0.5, x + s * 0.2, y + s * 0.85);
        if (!silhouette) pattern(g, L, x + s * 0.05, y - s * 0.34, s * 0.6, s * 0.2);
        break;
      }
      case 5: { // Pilot: leather cap + goggles
        g.fillStyle(main, 1).fillEllipse(x, y - s * 0.16, s * 0.9, s * 0.56);
        g.fillEllipse(x - s * 0.4, y + s * 0.12, s * 0.16, s * 0.34).fillEllipse(x + s * 0.4, y + s * 0.12, s * 0.16, s * 0.34);
        if (!silhouette) pattern(g, L, x, y - s * 0.32, s * 0.6, s * 0.18);
        g.fillStyle(accent, 1).fillRect(x - s * 0.44, y - s * 0.24, s * 0.88, s * 0.06);
        g.fillStyle(silhouette ? accent : 0xcfe8ff, 1).fillCircle(x - s * 0.15, y - s * 0.21, s * 0.11).fillCircle(x + s * 0.15, y - s * 0.21, s * 0.11);
        g.lineStyle(Math.max(1, s * 0.04), accent, 1).strokeCircle(x - s * 0.15, y - s * 0.21, s * 0.11).strokeCircle(x + s * 0.15, y - s * 0.21, s * 0.11);
        break;
      }
      case 6: { // Astronaut: bubble helmet + antenna
        g.lineStyle(Math.max(1, s * 0.04), main, 1).lineBetween(x + s * 0.3, y - s * 0.5, x + s * 0.42, y - s * 0.82);
        g.fillStyle(accent, 1).fillCircle(x + s * 0.42, y - s * 0.84, s * 0.07);
        g.fillStyle(accent, silhouette ? 0.6 : 0.18).fillCircle(x, y, s * 0.6);
        g.lineStyle(Math.max(1, s * 0.1), main, 1).strokeCircle(x, y, s * 0.6);
        if (!silhouette) {
          pattern(g, L, x, y - s * 0.6, s * 0.5, s * 0.14);
          g.fillStyle(0xffffff, 0.55).fillEllipse(x - s * 0.28, y - s * 0.3, s * 0.2, s * 0.1);
        }
        break;
      }
    }
  }

  return { TEX_SCALE, drawItem, drawBubble, makeBubbleTextures, drawAvatar };
})();
