// Real art: slices the character/item sheets in assets/sheets into textures at load time.
// Each sheet is a white-background grid. Background connected to the edges is removed, then
// figures are found by row/column gaps and read left-to-right, top-to-bottom.
//
// Era sheet order: the era's original customer first, then the 6 hybrids by job tier.
// Items sheet order: empty bubble, then the 7 items by tier.
// If a sheet is missing or doesn't slice into the right count, the code-drawn art is used instead.
//
// Textures produced: cust_<look>_<job>, custlock_<look>_<job> (silhouette), bubble<tier>.

window.EraArt = (function () {
  const PORTRAIT = 320;

  function preload(scene) {
    if (scene.textures.exists('cust_0_0')) return;
    for (let i = 0; i < 7; i++) scene.load.image('sheet_era' + i, 'assets/sheets/era' + i + '.jpg');
    scene.load.image('sheet_items', 'assets/sheets/items.jpg');
  }

  // Index of the smallest value of arr within [lo, hi].
  function argmin(arr, lo, hi) {
    let best = lo;
    for (let i = Math.max(0, lo); i <= Math.min(arr.length - 1, hi); i++) if (arr[i] < arr[best]) best = i;
    return best;
  }

  const isLight = (px, p) => {
    const mn = Math.min(px[p], px[p + 1], px[p + 2]), mx = Math.max(px[p], px[p + 1], px[p + 2]);
    return mn >= 215 && mx - mn <= 30;
  };

  // Cuts one cell out of the sheet: background flood-filled from the cell border, then only the main
  // shape (and any sizeable pieces) kept, so stray lines and specks drop out. Returns a transparent canvas.
  function extractCell(px, W, x0, y0, x1, y1) {
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1, N = cw * ch;
    const at = (i) => ((y0 + ((i / cw) | 0)) * W + x0 + (i % cw)) * 4;
    const bg = new Uint8Array(N);
    const stack = new Int32Array(N);
    let sp = 0;
    const push = (i) => { if (!bg[i] && isLight(px, at(i))) { bg[i] = 1; stack[sp++] = i; } };
    for (let x = 0; x < cw; x++) { push(x); push((ch - 1) * cw + x); }
    for (let y = 0; y < ch; y++) { push(y * cw); push(y * cw + cw - 1); }
    const flood = (pushFn) => {
      while (sp) {
        const i = stack[--sp], x = i % cw;
        if (x > 0) pushFn(i - 1);
        if (x < cw - 1) pushFn(i + 1);
        if (i >= cw) pushFn(i - cw);
        if (i < N - cw) pushFn(i + cw);
      }
    };
    flood(push);

    // Label the remaining shapes; keep the ones at least 3% the size of the largest.
    const label = new Int32Array(N);
    const sizes = [0];
    for (let s = 0; s < N; s++) {
      if (bg[s] || label[s]) continue;
      const id = sizes.length;
      let n = 1;
      label[s] = id; stack[sp++] = s;
      flood((i) => { if (!bg[i] && !label[i]) { label[i] = id; stack[sp++] = i; n++; } });
      sizes.push(n);
    }
    const maxSize = Math.max(...sizes);
    if (!maxSize) return null;
    const keep = sizes.map((n) => n >= maxSize * 0.03);

    let bx0 = cw, by0 = ch, bx1 = -1, by1 = -1;
    for (let i = 0; i < N; i++) {
      if (!keep[label[i]] || !label[i]) continue;
      const x = i % cw, y = (i / cw) | 0;
      if (x < bx0) bx0 = x; if (x > bx1) bx1 = x;
      if (y < by0) by0 = y; if (y > by1) by1 = y;
    }
    const ow = bx1 - bx0 + 1, oh = by1 - by0 + 1;
    const out = document.createElement('canvas');
    out.width = ow; out.height = oh;
    const octx = out.getContext('2d');
    const od = octx.createImageData(ow, oh);
    for (let y = 0; y < oh; y++) {
      for (let x = 0; x < ow; x++) {
        const i = (y + by0) * cw + (x + bx0), p = at(i), q = (y * ow + x) * 4;
        od.data[q] = px[p]; od.data[q + 1] = px[p + 1]; od.data[q + 2] = px[p + 2];
        let a = label[i] && keep[label[i]] ? 255 : 0;
        if (a) {
          // Soften the light JPEG fringe next to the removed background.
          const cx = i % cw;
          const edge = (cx > 0 && bg[i - 1]) || (cx < cw - 1 && bg[i + 1]) || (i >= cw && bg[i - cw]) || (i < N - cw && bg[i + cw]);
          const mn = Math.min(px[p], px[p + 1], px[p + 2]);
          if (edge && mn > 170) a = Math.round(255 * (255 - mn) / 85);
        }
        od.data[q + 3] = a;
      }
    }
    octx.putImageData(od, 0, 0);
    return out;
  }

  // Splits a 2-row sheet (layout = figures per row, e.g. [4, 3]) into transparent canvases in reading order.
  // Row and column cuts go through the emptiest line near where the grid predicts them, so figures that
  // touch their neighbours are still separated.
  function segment(img, layout) {
    const W = img.naturalWidth || img.width, H = img.naturalHeight || img.height;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const px = ctx.getImageData(0, 0, W, H).data;

    const rowCount = new Int32Array(H);
    for (let y = 0; y < H; y++) {
      let n = 0;
      for (let x = 0, p = y * W * 4; x < W; x++, p += 4) if (!isLight(px, p)) n++;
      rowCount[y] = n;
    }
    const split = argmin(rowCount, Math.round(H * 0.38), Math.round(H * 0.62));
    const bands = [[0, split], [split + 1, H - 1]];

    const parts = [];
    bands.forEach(([y0, y1], r) => {
      const n = layout[r];
      const colCount = new Int32Array(W);
      for (let y = y0; y <= y1; y++) for (let x = 0, p = y * W * 4; x < W; x++, p += 4) if (!isLight(px, p)) colCount[x]++;
      const cuts = [0];
      for (let k = 1; k < n; k++) {
        const guess = Math.round((W * k) / n);
        cuts.push(argmin(colCount, guess - Math.round(W * 0.09), guess + Math.round(W * 0.09)));
      }
      cuts.push(W);
      for (let k = 0; k < n; k++) parts.push(extractCell(px, W, cuts[k], y0, cuts[k + 1] - 1, y1));
    });
    return parts.every(Boolean) ? parts : null;
  }

  function sheetParts(scene, key, layout) {
    if (!scene.textures.exists(key)) return null;
    try {
      const parts = segment(scene.textures.get(key).getSourceImage(), layout);
      if (parts) return parts;
      console.warn('[EraArt] ' + key + ': a cell was empty; using drawn art');
    } catch (e) {
      console.warn('[EraArt] ' + key + ' failed', e);
    }
    return null;
  }

  const hex = (n) => '#' + n.toString(16).padStart(6, '0');

  function makePortrait(scene, look, job, part, locked) {
    const key = (locked ? 'custlock_' : 'cust_') + look + '_' + job;
    if (scene.textures.exists(key)) return;
    const P = PORTRAIT;
    if (!part) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      EraDraw.drawAvatar(g, look, job, P / 2, P / 2, P / 2, locked);
      g.generateTexture(key, P, P);
      g.destroy();
      return;
    }
    const c = document.createElement('canvas');
    c.width = P; c.height = P;
    const ctx = c.getContext('2d');
    ctx.beginPath();
    ctx.arc(P / 2, P / 2, P / 2, 0, Math.PI * 2);
    ctx.fillStyle = locked ? '#221d33' : hex(ERA_DATA.eras[look].bg);
    ctx.fill();
    ctx.clip();
    const s = Math.min((P * 0.9) / part.height, (P * 0.94) / part.width);
    const dw = part.width * s, dh = part.height * s;
    const dx = (P - dw) / 2, dy = P - dh + P * 0.02;
    if (locked) {
      const t = document.createElement('canvas');
      t.width = P; t.height = P;
      const tctx = t.getContext('2d');
      tctx.drawImage(part, dx, dy, dw, dh);
      tctx.globalCompositeOperation = 'source-in';
      tctx.fillStyle = '#3a3550';
      tctx.fillRect(0, 0, P, P);
      ctx.drawImage(t, 0, 0);
    } else {
      ctx.drawImage(part, dx, dy, dw, dh);
    }
    scene.textures.addCanvas(key, c);
  }

  function makeBubble(scene, tier, bubble, item) {
    const key = 'bubble' + tier;
    if (scene.textures.exists(key)) return;
    const r = window.ERA_POP_CONFIG.bubbleRadius[tier] * EraDraw.TEX_SCALE;
    const size = Math.ceil(r * 2 + 4);
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const cx = size / 2;
    ctx.drawImage(bubble, cx - r, cx - r, r * 2, r * 2);
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(cx, cx, r * 0.88, 0, Math.PI * 2);
    ctx.fillStyle = hex(ERA_DATA.tierColors[tier]);
    ctx.fill();
    ctx.globalAlpha = 1;
    const box = r * 1.3;
    const s = Math.min(box / item.width, box / item.height);
    ctx.drawImage(item, cx - (item.width * s) / 2, cx - (item.height * s) / 2, item.width * s, item.height * s);
    scene.textures.addCanvas(key, c);
  }

  // Builds every customer and bubble texture; anything without art falls back to code-drawn placeholders.
  function build(scene) {
    if (scene.textures.exists('cust_0_0')) return;
    for (let look = 0; look < 7; look++) {
      const parts = sheetParts(scene, 'sheet_era' + look, [4, 3]);
      const jobs = [look];
      for (let j = 0; j < 7; j++) if (j !== look) jobs.push(j);
      jobs.forEach((job, k) => {
        makePortrait(scene, look, job, parts && parts[k], false);
        makePortrait(scene, look, job, parts && parts[k], true);
      });
    }
    const items = sheetParts(scene, 'sheet_items', [4, 4]);
    if (items) for (let t = 0; t < 7; t++) makeBubble(scene, t, items[0], items[t + 1]);
    EraDraw.makeBubbleTextures(scene); // fills in any tier still missing
  }

  return { preload, build };
})();
