// Candlestick portrait: a brightness grid (cols x rows of 0-255) redrawn as
// ochre candles on navy. The tone pipeline makes the face read; the candle
// halftone carries tone in each candle's body width, length and open or
// filled state; the layout fits the face to any box at a per-breakpoint pitch.

const PALETTE = {
  ink:   '#1c267a',  // royal navy
  paper: '#d0b57a',  // warm ochre paper
  inkSoft: '#2c3795',
  paperDark: '#b49c69',
};

// ──────────────────────────────────────────────────────────
// useGrid — fetch + parse the JSON brightness map once
// ──────────────────────────────────────────────────────────
function useGrid(src = 'assets/portrait_grid.json') {
  const [grid, setGrid] = React.useState(null);
  React.useEffect(() => {
    fetch(src).then(r => r.json()).then(setGrid);
  }, [src]);
  return grid;
}

// ──────────────────────────────────────────────────────────
// Tone pipeline (shared by the improved renderers)
//
// The grid is a brightness sample padded with black to 16:9. The pipeline
// crops the padding, lifts local contrast so eyes, nose and beard read,
// stretches the histogram, applies a gamma, and dissolves the crop edges
// so the face melts into the navy instead of ending on a hard line.
// Output: luminance in [0,1] plus a summed-area table, so any cell size
// can be sampled as an exact area mean in O(1).
// ──────────────────────────────────────────────────────────
const TONE_DEFAULTS = {
  pad: 8,            // grid values at or below this count as padding
  localRadius: 16,   // box-blur radius (grid cells) for local contrast; wide,
                     // so the shadowed eye band is lifted against itself
  localAmount: 1.8,  // unsharp strength; 0 disables
  lowPct: 0.03,      // histogram stretch percentiles
  highPct: 0.995,
  gamma: 1.1,        // just above 1 keeps skin in the mid-tones
  edge: 0.05,        // width of the dissolve, as a fraction of each side
  // Portrait vignette centred between the eyes and the nose: fades the
  // top of the beanie and the bright background corner, so the light
  // budget goes on the face. Radii and softness are fractions of the crop.
  vignette: { cx: 0.42, cy: 0.66, rx: 0.62, ry: 0.62, soft: 0.45 },
};

function summedArea(src, w, h) {
  const sat = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      row += src[y * w + x];
      sat[(y + 1) * (w + 1) + (x + 1)] = sat[y * (w + 1) + (x + 1)] + row;
    }
  }
  return sat;
}

// Mean of the source over the half-open rect [x0,x1) × [y0,y1), clamped.
function areaMean(sat, w, h, x0, y0, x1, y1) {
  x0 = Math.max(0, Math.min(w, Math.floor(x0)));
  y0 = Math.max(0, Math.min(h, Math.floor(y0)));
  x1 = Math.max(x0 + 1, Math.min(w, Math.ceil(x1)));
  y1 = Math.max(y0 + 1, Math.min(h, Math.ceil(y1)));
  if (x0 >= w || y0 >= h) return 0;
  const W = w + 1;
  const sum = sat[y1 * W + x1] - sat[y0 * W + x1] - sat[y1 * W + x0] + sat[y0 * W + x0];
  return sum / ((x1 - x0) * (y1 - y0));
}

const toneCache = new WeakMap();

function toneMap(grid, opts = TONE_DEFAULTS) {
  const cached = toneCache.get(grid);
  if (cached && cached.opts === opts) return cached;
  const o = { ...TONE_DEFAULTS, ...opts };
  const { cols, rows, data } = grid;

  // 1. Crop the black padding.
  let c0 = cols, c1 = -1;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (data[r][c] > o.pad) { c0 = Math.min(c0, c); c1 = Math.max(c1, c); break; }
    }
  }
  if (c1 < c0) { c0 = 0; c1 = cols - 1; }
  const w = c1 - c0 + 1, h = rows;
  const lum = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) lum[y * w + x] = data[y][c0 + x] / 255;

  // 2. Local contrast (unsharp mask against a box blur).
  if (o.localAmount > 0) {
    const sat = summedArea(lum, w, h);
    const R = o.localRadius;
    const out = new Float32Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const m = areaMean(sat, w, h, x - R, y - R, x + R + 1, y + R + 1);
        const v = lum[y * w + x];
        out[y * w + x] = v + o.localAmount * (v - m);
      }
    lum.set(out);
  }

  // 3. Percentile stretch, 4. gamma.
  const sorted = Float32Array.from(lum).sort();
  const lo = sorted[Math.floor(o.lowPct * (sorted.length - 1))];
  const hi = sorted[Math.floor(o.highPct * (sorted.length - 1))];
  const span = Math.max(1e-6, hi - lo);
  for (let i = 0; i < lum.length; i++) {
    const t = Math.max(0, Math.min(1, (lum[i] - lo) / span));
    lum[i] = Math.pow(t, o.gamma);
  }

  // 5. Dissolve the edges.
  if (o.edge > 0) {
    const ex = Math.max(1, o.edge * w), ey = Math.max(1, o.edge * h);
    const ramp = (d, e) => { const t = Math.min(1, d / e); return t * t * (3 - 2 * t); };
    for (let y = 0; y < h; y++) {
      const fy = Math.min(ramp(y + 0.5, ey), ramp(h - y - 0.5, ey));
      for (let x = 0; x < w; x++) {
        lum[y * w + x] *= Math.min(fy, ramp(x + 0.5, ex), ramp(w - x - 0.5, ex));
      }
    }
  }

  // 6. Vignette.
  if (o.vignette) {
    const { cx, cy, rx, ry, soft } = o.vignette;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const d = Math.hypot(((x + 0.5) / w - cx) / rx, ((y + 0.5) / h - cy) / ry);
        const t = Math.max(0, Math.min(1, (1 - d) / soft));
        lum[y * w + x] *= t * t * (3 - 2 * t);
      }
    }
  }

  const result = { opts, w, h, lum, sat: summedArea(lum, w, h), aspect: w / h, crop: [c0, c1] };
  toneCache.set(grid, result);
  return result;
}

// Size the backing store for the device pixel ratio and return a context
// in CSS pixels.
function prepareCanvas(canvas, width, height) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const bw = Math.round(width * dpr), bh = Math.round(height * dpr);
  if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, dpr };
}

// ──────────────────────────────────────────────────────────
// Candle halftone — each cell is a real candle: a wick, and a body whose
// width, length and open or filled state carry the tone. Highlights are
// wide filled bodies, mid-tones open bodies, deep shadow a bare wick or
// nothing. Rows stay on a fixed grid, so it reads as a halftone, not a chart.
//
// layout: { fit: 'cover'|'contain', align: [ax, ay] in 0..1, focus: [fx, fy]
//           in 0..1 of the face, pitch: column pitch in CSS px }
// settle: animate candles into place on first paint (skipped under
//         prefers-reduced-motion).
// Renders LAYERS transparent canvases (see below), each cropped to the
// candles' bounds; the caller positions them inside a relative box.
// ──────────────────────────────────────────────────────────
function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function layoutCandles(tm, width, height, layout) {
  const { fit = 'contain', align = [0.5, 0.5], focus = [0.5, 0.5], pitch = 4, aspect = 1.6 } = layout;
  // Fit the face box (in CSS px) into the canvas.
  const boxAspect = width / height;
  let fw, fh;
  if ((fit === 'cover') === (boxAspect > tm.aspect)) { fw = width; fh = width / tm.aspect; }
  else { fh = height; fw = height * tm.aspect; }
  // Position: contain aligns the face in the free space; cover keeps the
  // focus point (eyes) as close to the alignment point as the crop allows.
  let fx, fy;
  if (fit === 'cover') {
    fx = Math.min(0, Math.max(width - fw, width * align[0] - fw * focus[0]));
    fy = Math.min(0, Math.max(height - fh, height * align[1] - fh * focus[1]));
  } else {
    fx = (width - fw) * align[0];
    fy = (height - fh) * align[1];
  }
  const cellW = pitch, cellH = pitch * aspect;
  const nc = Math.ceil(fw / cellW), nr = Math.ceil(fh / cellH);
  const sx = tm.w / fw, sy = tm.h / fh;   // CSS px → grid cells
  const cells = [];
  for (let r = 0; r < nr; r++) {
    const y = fy + r * cellH;
    if (y + cellH < 0 || y > height) continue;
    for (let c = 0; c < nc; c++) {
      const x = fx + c * cellW;
      if (x + cellW < 0 || x > width) continue;
      const gx0 = c * cellW * sx, gx1 = (c + 1) * cellW * sx;
      const gy0 = r * cellH * sy, gy1 = (r + 1) * cellH * sy, gym = (gy0 + gy1) / 2;
      const top = areaMean(tm.sat, tm.w, tm.h, gx0, gy0, gx1, gym);
      const bot = areaMean(tm.sat, tm.w, tm.h, gx0, gym, gx1, gy1);
      const L = (top + bot) / 2;
      if (L < 0.12) continue;
      // tilt: -1 when the light sits in the top half, +1 in the bottom. The
      // body slides toward the light, so a candle carries detail finer than
      // its cell, the way a real candle's body sits between open and close.
      const tilt = (bot - top) / Math.max(0.05, top + bot);
      // k: an independent hash that picks the cell's layer.
      cells.push({ x, y, L, tilt, j: hash2(c, r), k: hash2(c + 7919, r + 104729), c: c / nc });
    }
  }
  return { cells, cellW, cellH };
}

// The candles are split into LAYERS interleaved sets, one canvas each, by a
// hash independent of the settle timing. Each set is an even sample of the
// whole face, so fading the sets out one after another thins the portrait
// rather than wiping it: the cover's scroll response is then opacity on
// composited layers, with no redraw while the page scrolls.
const LAYERS = 3;
const layerOf = (cell) => Math.min(LAYERS - 1, Math.floor(cell.k * LAYERS));

// The box the candles actually occupy, in CSS px, so each canvas covers the
// face and not the empty navy around it (about half the pixels on desktop).
function candleBounds(lay, width, height) {
  const { cells, cellW, cellH } = lay;
  if (!cells.length) return { x: 0, y: 0, w: 0, h: 0 };
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < cells.length; i++) {
    const { x, y } = cells[i];
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x + cellW > x1) x1 = x + cellW;
    if (y + cellH > y1) y1 = y + cellH;
  }
  x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0));
  x1 = Math.min(width, Math.ceil(x1)); y1 = Math.min(height, Math.ceil(y1));
  return { x: x0, y: y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) };
}

// Draws one layer's candles, offset so the layer's canvas origin is the
// bounds' corner. The canvas is transparent: the cover's navy shows through.
function drawCandles(ctx, lay, bounds, layer, palette, dpr, progress) {
  const { cells, cellW, cellH } = lay;
  ctx.clearRect(0, 0, bounds.w, bounds.h);
  const hair = Math.max(1 / dpr, cellW * 0.1);
  const stroke = Math.max(1 / dpr, cellW * 0.12);
  const fills = new Path2D(), opens = new Path2D();
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    if (layerOf(cell) !== layer) continue;
    const { L, tilt, j, c } = cell;
    const x = cell.x - bounds.x, y = cell.y - bounds.y;
    // Per-candle animation: columns sweep left to right with a little jitter.
    let k = 1;
    if (progress < 1) {
      const start = c * 0.45 + j * 0.25;
      k = Math.max(0, Math.min(1, (progress - start) / 0.3));
      k = 1 - Math.pow(1 - k, 3);
      if (k <= 0) continue;
    }
    const cx = x + cellW / 2;
    // Wick: grows with light, centred in the cell.
    const wl = cellH * (0.6 + 0.4 * L) * k;
    fills.rect(cx - hair / 2, y + (cellH - wl) / 2, hair, wl);
    if (L < 0.2) continue;
    // Body: width and length carry tone; its position along the wick
    // follows where the light sits in the cell.
    // Coverage tracks L: about 0.25 for an open body at L 0.35, 0.47 filled
    // at 0.5, 0.85 at full light.
    const bw = cellW * (0.45 + 0.5 * L);
    const bl = cellH * (0.45 + 0.45 * L) * k;
    const by = y + (cellH - bl) / 2 + Math.max(-1, Math.min(1, tilt)) * (cellH - bl) / 2;
    if (L >= 0.42) fills.rect(cx - bw / 2, by, bw, bl);
    else opens.rect(cx - bw / 2 + stroke / 2, by + stroke / 2, bw - stroke, Math.max(0, bl - stroke));
  }
  ctx.fillStyle = palette.paper;
  ctx.fill(fills);
  ctx.strokeStyle = palette.paper;
  ctx.lineWidth = stroke;
  ctx.stroke(opens);
}

function prefersReducedMotion() {
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

// Size a layer's backing store for the device pixel ratio, place it over
// the bounds, and return a context in CSS pixels.
function prepareLayer(canvas, bounds) {
  const { ctx, dpr } = prepareCanvas(canvas, bounds.w, bounds.h);
  canvas.style.left = bounds.x + 'px';
  canvas.style.top = bounds.y + 'px';
  return { ctx, dpr };
}

function CandleHalftonePortrait({ grid, width, height, layout, palette = PALETTE, settle = false, onStats }) {
  const refs = React.useRef([]);
  const onStatsRef = React.useRef(onStats);
  onStatsRef.current = onStats;
  const settledRef = React.useRef(false);   // animate once, never on resize
  // A layout effect, so the layers are sized and placed before the browser
  // paints them: an unsized canvas painted for one frame is a layout shift.
  React.useLayoutEffect(() => {
    const canvases = refs.current;
    if (!grid || canvases.length !== LAYERS || canvases.some((cv) => !cv) || width <= 0 || height <= 0) return undefined;
    const t0 = performance.now();
    const lay = layoutCandles(toneMap(grid), width, height, layout);
    const bounds = candleBounds(lay, width, height);
    const layers = canvases.map((cv) => prepareLayer(cv, bounds));
    const drawAll = (p) => layers.forEach(({ ctx, dpr }, i) => drawCandles(ctx, lay, bounds, i, palette, dpr, p));
    const report = (ms) => onStatsRef.current && onStatsRef.current({ candles: lay.cells.length, ms });

    if (!settle || settledRef.current || prefersReducedMotion()) {
      drawAll(1);
      settledRef.current = true;
      report(performance.now() - t0);
      return undefined;
    }
    const DURATION = 1400;
    let raf = 0, start = 0, worst = 0;
    const tick = (now) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / DURATION);
      const f0 = performance.now();
      drawAll(p);
      worst = Math.max(worst, performance.now() - f0);
      if (p < 1) raf = requestAnimationFrame(tick);
      else { settledRef.current = true; report(worst); }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      // An interrupted settle (resize mid-way) finishes as a static frame.
      settledRef.current = true;
    };
  }, [grid, width, height, layout, palette, settle]);
  return (
    <React.Fragment>
      {Array.from({ length: LAYERS }, (_, i) => (
        <canvas key={i} ref={(el) => { refs.current[i] = el; }} className="portrait-layer" data-layer={i + 1} aria-hidden="true" />
      ))}
    </React.Fragment>
  );
}

Object.assign(window, {
  CandleHalftonePortrait,
  toneMap,
  useGrid,
  PORTRAIT_PALETTE: PALETTE,
});
