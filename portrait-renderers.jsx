// Portrait renderers — each takes a brightness grid (cols×rows of 0-255)
// and renders it using a different visual primitive. Navy on cream throughout.

const PALETTE = {
  ink:   '#1c267a',  // royal navy
  paper: '#d6c585',  // warm cream
  inkSoft: '#2c3795',
  paperDark: '#b9a86a',
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

// Helper: brightness → [0,1] cream coverage, with mid-grey clamped
function coverage(v, lo = 70, hi = 230) {
  const t = (v - lo) / (hi - lo);
  return Math.max(0, Math.min(1, t));
}

// ──────────────────────────────────────────────────────────
// A. Candlesticks — Munger-faithful.
// Cream paper bg.  Per column: thin NAVY wick spanning full height.
// Per cell where the face is bright, draw a thicker CREAM body
// covering the wick, simulating an OHLC body sitting on the wick.
// The face emerges where cream bodies cluster.
// ──────────────────────────────────────────────────────────
function CandlestickPortrait({ grid, width, height, palette = PALETTE, density = 1 }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!grid || !ref.current) return;
    const canvas = ref.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    ctx.fillStyle = palette.paper;
    ctx.fillRect(0, 0, width, height);

    const cols = grid.cols, rows = grid.rows;
    const colW = width / cols;
    const rowH = height / rows;
    const wickW = Math.max(0.8, colW * 0.13);
    // Bodies fully fill the column at max darkness — no thin cream gap left
    // between adjacent saturated cells.
    const bodyW = colW;

    // 1. Full-height navy wicks in every column (continuous candle field)
    ctx.fillStyle = palette.ink;
    for (let c = 0; c < cols; c++) {
      const x = c * colW + (colW - wickW) / 2;
      ctx.fillRect(x, 0, wickW, height);
    }

    // 2. Linear body fill with a slight gamma curve so dark cells snap toward
    //    full width faster (closes the stripe pattern in shadowy areas while
    //    keeping the candle character in mid-tones).
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cov = 1 - coverage(grid.data[r][c], 50, 200);
        if (cov > 0.05) {
          const filled = Math.pow(cov, 0.65);
          const w = wickW + (bodyW - wickW) * filled;
          const x = c * colW + (colW - w) / 2;
          ctx.fillRect(x, r * rowH, w + 0.4, rowH + 0.5);   // +0.4 hairline overlap
        }
      }
    }
  }, [grid, width, height, palette, density]);

  return <canvas ref={ref} />;
}

// ──────────────────────────────────────────────────────────
// B. Bar Histogram — vertical bars from top + bottom meeting
// at a column-brightness midline.  Looks like trading volume.
// ──────────────────────────────────────────────────────────
function HistogramPortrait({ grid, width, height, palette = PALETTE }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!grid || !ref.current) return;
    const canvas = ref.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    ctx.fillStyle = palette.paper;
    ctx.fillRect(0, 0, width, height);

    const cols = grid.cols, rows = grid.rows;
    const colW = width / cols;
    const rowH = height / rows;
    const gap = Math.max(0.5, colW * 0.18);
    const barW = colW - gap;

    ctx.fillStyle = palette.ink;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v = grid.data[r][c];
        const dark = 1 - coverage(v, 60, 210);
        if (dark > 0.08) {
          const h = rowH * (0.4 + dark * 0.6);
          const x = c * colW + gap / 2;
          const y = r * rowH + (rowH - h) / 2;
          ctx.fillRect(x, y, barW, h);
        }
      }
    }
  }, [grid, width, height, palette]);

  return <canvas ref={ref} />;
}

// ──────────────────────────────────────────────────────────
// C. Blockchain blocks — square tiles in a chain.
// Each tile filled navy with cream gaps; brightness controls
// tile size (smaller in bright face → more cream paper showing).
// ──────────────────────────────────────────────────────────
function BlockchainPortrait({ grid, width, height, palette = PALETTE }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!grid || !ref.current) return;
    const canvas = ref.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    ctx.fillStyle = palette.paper;
    ctx.fillRect(0, 0, width, height);

    const cols = grid.cols, rows = grid.rows;
    // Coarser grid so blocks read as discrete tiles, not lines.
    const N_COLS = Math.floor(cols / 1.7);
    const N_ROWS = Math.floor(rows / 1.7);
    const cw = width / N_COLS;
    const rh = height / N_ROWS;
    const cell = Math.min(cw, rh);

    ctx.fillStyle = palette.ink;
    for (let r = 0; r < N_ROWS; r++) {
      for (let c = 0; c < N_COLS; c++) {
        const r0 = Math.floor(r * rows / N_ROWS);
        const r1 = Math.floor((r+1) * rows / N_ROWS);
        const c0 = Math.floor(c * cols / N_COLS);
        const c1 = Math.floor((c+1) * cols / N_COLS);
        let sum = 0, n = 0;
        for (let rr = r0; rr < r1; rr++) {
          for (let cc = c0; cc < c1; cc++) {
            sum += grid.data[rr][cc]; n++;
          }
        }
        const v = sum / n;
        const dark = 1 - coverage(v, 60, 210);
        if (dark < 0.08) continue;
        // Tile size scales with darkness but never fills the cell.
        const tile = cell * (0.18 + dark * 0.62);
        const rr = Math.min(tile * 0.18, tile/2);
        const x = c * cw + (cw - tile) / 2;
        const y = r * rh + (rh - tile) / 2;
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.lineTo(x + tile - rr, y);
        ctx.quadraticCurveTo(x + tile, y, x + tile, y + rr);
        ctx.lineTo(x + tile, y + tile - rr);
        ctx.quadraticCurveTo(x + tile, y + tile, x + tile - rr, y + tile);
        ctx.lineTo(x + rr, y + tile);
        ctx.quadraticCurveTo(x, y + tile, x, y + tile - rr);
        ctx.lineTo(x, y + rr);
        ctx.quadraticCurveTo(x, y, x + rr, y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }, [grid, width, height, palette]);

  return <canvas ref={ref} />;
}

// ──────────────────────────────────────────────────────────
// D. ASCII — characters at each cell, density encodes brightness.
// Terminal/cipher feel.
// ──────────────────────────────────────────────────────────
function AsciiPortrait({ grid, width, height, palette = PALETTE }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!grid || !ref.current) return;
    const canvas = ref.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    ctx.fillStyle = palette.paper;
    ctx.fillRect(0, 0, width, height);

    const cols = grid.cols, rows = grid.rows;
    // Coarser cells, larger characters — has to read as TEXT not pixels.
    const N_COLS = Math.floor(cols / 1.6);
    const N_ROWS = Math.floor(rows / 1.9);
    const cw = width / N_COLS;
    const rh = height / N_ROWS;
    const fontSize = Math.min(cw * 1.9, rh * 1.15);

    ctx.font = `${fontSize}px "JetBrains Mono", "Courier New", monospace`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = palette.ink;

    // Density ramp — denser → lighter. Block chars at the very dense end
    // give us solid shadow coverage; real characters do the mid-tones; spaces
    // at the bright end open up the face highlights.
    const ramp = '█▓▒$£%#&=+:·.  ';
    for (let r = 0; r < N_ROWS; r++) {
      for (let c = 0; c < N_COLS; c++) {
        const r0 = Math.floor(r * rows / N_ROWS);
        const r1 = Math.floor((r+1) * rows / N_ROWS);
        const c0 = Math.floor(c * cols / N_COLS);
        const c1 = Math.floor((c+1) * cols / N_COLS);
        let sum = 0, n = 0;
        for (let rr = r0; rr < r1; rr++)
          for (let cc = c0; cc < c1; cc++) { sum += grid.data[rr][cc]; n++; }
        const v = sum / n;
        const dark = 1 - coverage(v, 50, 215);
        // Index 0 (densest) at high dark, last (space) at low dark.
        const idx = Math.floor((1 - dark) * (ramp.length - 1));
        const ch = ramp[idx];
        if (ch && ch !== ' ') {
          ctx.fillText(ch, c * cw + cw/2, r * rh + rh/2);
        }
      }
    }
  }, [grid, width, height, palette]);

  return <canvas ref={ref} />;
}

// ──────────────────────────────────────────────────────────
// E. Horizontal ticker — each row is a horizontal navy line
// of varying segments.  Currency symbols sprinkled.
// ──────────────────────────────────────────────────────────
function TickerPortrait({ grid, width, height, palette = PALETTE }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!grid || !ref.current) return;
    const canvas = ref.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    ctx.fillStyle = palette.paper;
    ctx.fillRect(0, 0, width, height);

    const cols = grid.cols, rows = grid.rows;
    // Use more rows by oversampling
    const N_ROWS = Math.floor(rows * 1.0);
    const rowH = height / N_ROWS;
    const colW = width / cols;
    const lineH = Math.max(1.5, rowH * 0.55);

    ctx.fillStyle = palette.ink;
    for (let r = 0; r < N_ROWS; r++) {
      const gr = Math.min(rows - 1, Math.floor(r * rows / N_ROWS));
      for (let c = 0; c < cols; c++) {
        const v = grid.data[gr][c];
        const dark = 1 - coverage(v, 60, 210);
        if (dark > 0.08) {
          const w = colW * (0.35 + dark * 0.6);
          const x = c * colW + (colW - w) / 2;
          const y = r * rowH + (rowH - lineH) / 2;
          ctx.fillRect(x, y, w, lineH);
        }
      }
    }
  }, [grid, width, height, palette]);

  return <canvas ref={ref} />;
}

// ──────────────────────────────────────────────────────────
// F. Pixel dots — circles of varying radius.  Almost halftone.
// ──────────────────────────────────────────────────────────
function DotPortrait({ grid, width, height, palette = PALETTE }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!grid || !ref.current) return;
    const canvas = ref.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    ctx.fillStyle = palette.paper;
    ctx.fillRect(0, 0, width, height);

    const cols = grid.cols, rows = grid.rows;
    const N_COLS = Math.floor(cols / 1.2);
    const N_ROWS = Math.floor(rows / 1.2);
    const cw = width / N_COLS;
    const rh = height / N_ROWS;
    const maxR = Math.min(cw, rh) * 0.6;

    ctx.fillStyle = palette.ink;
    for (let r = 0; r < N_ROWS; r++) {
      for (let c = 0; c < N_COLS; c++) {
        const r0 = Math.floor(r * rows / N_ROWS);
        const r1 = Math.floor((r+1) * rows / N_ROWS);
        const c0 = Math.floor(c * cols / N_COLS);
        const c1 = Math.floor((c+1) * cols / N_COLS);
        let sum = 0, n = 0;
        for (let rr = r0; rr < r1; rr++)
          for (let cc = c0; cc < c1; cc++) { sum += grid.data[rr][cc]; n++; }
        const v = sum / n;
        const dark = 1 - coverage(v, 60, 210);
        const radius = maxR * dark;
        if (radius > 0.3) {
          ctx.beginPath();
          ctx.arc(c * cw + cw/2, r * rh + rh/2, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }, [grid, width, height, palette]);

  return <canvas ref={ref} />;
}

Object.assign(window, {
  CandlestickPortrait,
  HistogramPortrait,
  BlockchainPortrait,
  AsciiPortrait,
  TickerPortrait,
  DotPortrait,
  useGrid,
  PORTRAIT_PALETTE: PALETTE,
});
