// ─────────────────────────────────────────────────────────
// MorphStage — the scroll-driven centerpiece.
// Particles sit in a fixed pool; their positions interpolate
// between three states:
//   0. Portrait (Benedict's face in candles)
//   1. Career  (a candlestick timeline of every role)
//   2. World   (a constellation map of countries visited)
// Then back to portrait.
// ─────────────────────────────────────────────────────────

const INK = '#1c267a';
const PAPER = '#d6c585';

// Career timeline, 11 roles in chronological order. Each becomes
// a single candle in the timeline state. High/low are visual only.
const CAREER = [
  { yr: '2014', co: 'Bath',          role: 'Computer Science',           hi: 0.35, lo: 0.65, w: 0.6 },
  { yr: '2015', co: 'JPMorgan',      role: 'Patented B2B payments',      hi: 0.18, lo: 0.55, w: 0.9 },
  { yr: '2018', co: 'Amex',          role: 'R&D, customer acquisition',  hi: 0.30, lo: 0.62, w: 0.7 },
  { yr: '2019', co: 'MAIA / Fulcrum',role: 'Hedge fund, back to front',  hi: 0.28, lo: 0.58, w: 0.7 },
  { yr: '2021', co: 'Icon',          role: 'Real-time payments',         hi: 0.20, lo: 0.52, w: 0.8 },
  { yr: '2022', co: 'Nettle',        role: 'CPTO · payments & loyalty',  hi: 0.25, lo: 0.58, w: 0.8 },
  { yr: '2023', co: 'Pound Token',   role: 'CTO · UK stablecoin',        hi: 0.15, lo: 0.50, w: 0.9 },
  { yr: '2024', co: 'Voi Network',   role: 'Chief Ecosystem Officer',    hi: 0.08, lo: 0.55, w: 1.0 },
  { yr: '2024', co: 'Brdge',         role: 'Head of Blockchain',         hi: 0.20, lo: 0.50, w: 0.7 },
  { yr: '2025', co: 'Kash',          role: 'COO & CTO · predictions',    hi: 0.05, lo: 0.55, w: 1.1 },
  { yr: '2025', co: 'DD Ventures',   role: 'Founding Partner',           hi: 0.22, lo: 0.48, w: 0.7 },
];

// Three expeditions — drawn as candlestick sequences traversing the canvas.
// Each route is a horizontal run of candle particles; longer real-world
// journeys get more candles + a longer x-range.
const ROUTES = [
  { name: 'London → Mongolia',   x0: 0.46, x1: 0.96, y: 0.28, n: 540 },
  { name: 'Cross-India',         x0: 0.50, x1: 0.86, y: 0.46, n: 340 },
  { name: 'Sahara → Atlantic',   x0: 0.54, x1: 0.78, y: 0.64, n: 220 },
];

function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(t) { return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ─────────────────────────────────────────────────────────
// Build particle pool from TWO brightness grids:
//   • portraitGrid drives the face state
//   • mapGrid drives the world map state
// Same weighted-sampling recipe for both — particles cluster where the
// grid is darkest.
// ─────────────────────────────────────────────────────────
function buildParticles(portraitGrid) {
  const particles = [];
  const TARGET = 1100;

  // ── PORTRAIT — column-aligned candles in the right half of canvas ──
  const PX0 = 0.40, PX1 = 1.00, PY0 = 0.12, PY1 = 0.88;
  const NCOL = 84;
  const { cols: pCols, rows: pRows, data: pData } = portraitGrid;
  const colDarkness = new Array(NCOL).fill(0);
  const colProfile = [];
  for (let c = 0; c < NCOL; c++) {
    const gridC = Math.floor((c + 0.5) / NCOL * pCols);
    const prof = [];
    let total = 0;
    for (let r = 0; r < pRows; r++) {
      const v = pData[r][gridC];
      const t = (v - 60) / 150;
      const dark = 1 - clamp(t, 0, 1);
      if (dark > 0.08) {
        prof.push({ yFrac: r / pRows, dark });
        total += dark;
      }
    }
    colProfile.push(prof);
    colDarkness[c] = total;
  }
  const totalCD = colDarkness.reduce((a, b) => a + b, 0);

  const portraitParticles = [];
  for (let c = 0; c < NCOL; c++) {
    if (colDarkness[c] < 0.5) continue;
    const nPart = Math.round(TARGET * colDarkness[c] / totalCD);
    if (nPart < 1) continue;
    const colX = PX0 + (c + 0.5) / NCOL * (PX1 - PX0);
    const prof = colProfile[c];
    let acc = 0;
    const cdf = prof.map(p => acc += p.dark);
    for (let i = 0; i < nPart; i++) {
      const t = Math.random() * acc;
      let pick = prof[0];
      for (let j = 0; j < prof.length; j++) {
        if (cdf[j] >= t) { pick = prof[j]; break; }
      }
      const yJitter = (Math.random() - 0.5) * 0.004;
      const colY = PY0 + pick.yFrac * (PY1 - PY0) + yJitter;
      portraitParticles.push({
        px: colX,
        py: colY,
        pw: 0.0028,
        ph: 0.018 + Math.random() * 0.010,
      });
    }
  }
  while (portraitParticles.length < TARGET) {
    portraitParticles.push({ ...portraitParticles[portraitParticles.length - 1] });
  }
  while (portraitParticles.length > TARGET) portraitParticles.pop();
  for (let i = portraitParticles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [portraitParticles[i], portraitParticles[j]] = [portraitParticles[j], portraitParticles[i]];
  }

  // ── TIMELINE — candles in the right half ──
  const TX0 = 0.42, TX1 = 0.98, TYTOP = 0.10, TYBOT = 0.74;
  const span = CAREER.length;
  const perCandle = Math.floor(TARGET / span);
  const timelinePositions = [];
  for (let i = 0; i < span; i++) {
    const career = CAREER[i];
    const cxNorm = TX0 + (i + 0.5) / span * (TX1 - TX0);
    const candleW = (TX1 - TX0) / span * 0.22 * career.w;
    const yHi = TYTOP + career.hi * (TYBOT - TYTOP);
    const yLo = TYTOP + career.lo * (TYBOT - TYTOP);
    for (let j = 0; j < perCandle; j++) {
      const t = j / Math.max(1, perCandle - 1);
      const y = yHi + t * (yLo - yHi);
      const segH = (yLo - yHi) / perCandle * 1.6;
      const xJitter = (Math.random() - 0.5) * candleW * 0.7;
      timelinePositions.push({
        tx: cxNorm + xJitter,
        ty: y,
        tw: candleW * 0.22,
        th: Math.max(0.006, segH),
      });
    }
  }
  while (timelinePositions.length < TARGET) {
    timelinePositions.push({ ...timelinePositions[timelinePositions.length - 1] });
  }
  while (timelinePositions.length > TARGET) timelinePositions.pop();

  // ── MAP — three expedition routes drawn as candle sequences ──
  // Each route is a horizontal run of candle particles. Length proportional
  // to the journey's real-world span. Slight vertical jitter for organic feel.
  const mapPositions = [];
  for (const route of ROUTES) {
    for (let i = 0; i < route.n; i++) {
      const t = i / Math.max(1, route.n - 1);
      // Even distribution + small horizontal jitter so candles don't sit on
      // a perfect grid
      const xJitter = (Math.random() - 0.5) * 0.004;
      const yJitter = (Math.random() - 0.5) * 0.018;
      // Random candle "body" height — like a real OHLC chart of varying days
      const h = 0.008 + Math.pow(Math.random(), 1.6) * 0.024;
      mapPositions.push({
        mx: route.x0 + t * (route.x1 - route.x0) + xJitter,
        my: route.y + yJitter,
        mw: 0.0028,
        mh: h,
      });
    }
  }
  // Pad to TARGET by duplicating along routes
  while (mapPositions.length < TARGET) {
    const src = mapPositions[Math.floor(Math.random() * mapPositions.length)];
    mapPositions.push({ ...src });
  }
  while (mapPositions.length > TARGET) mapPositions.pop();

  // Combine
  for (let i = 0; i < TARGET; i++) {
    particles.push({
      ...portraitParticles[i],
      ...timelinePositions[i],
      ...mapPositions[i],
      stagger: Math.random() * 0.25,
    });
  }
  return particles;
}

// ─────────────────────────────────────────────────────────
// Render loop
// ─────────────────────────────────────────────────────────

// Progress map:
//   0.00 - 0.06  hold portrait
//   0.06 - 0.30  morph portrait → timeline
//   0.30 - 0.42  hold timeline
//   0.42 - 0.62  morph timeline → map
//   0.62 - 0.78  hold map
//   0.78 - 0.96  morph map → portrait
//   0.96 - 1.00  hold portrait

function segment(p) {
  // Returns { from: 'P'|'T'|'M', to: same, t: 0..1 }
  if (p < 0.06) return { from: 'P', to: 'P', t: 0 };
  if (p < 0.30) return { from: 'P', to: 'T', t: (p - 0.06) / 0.24 };
  if (p < 0.42) return { from: 'T', to: 'T', t: 0 };
  if (p < 0.62) return { from: 'T', to: 'M', t: (p - 0.42) / 0.20 };
  if (p < 0.78) return { from: 'M', to: 'M', t: 0 };
  if (p < 0.96) return { from: 'M', to: 'P', t: (p - 0.78) / 0.18 };
  return { from: 'P', to: 'P', t: 0 };
}

// Portrait fit: face area is the RIGHT half on wide canvases; on narrow
// (mobile) canvases the face moves to the TOP half so text can stack below.
const FACE_ASPECT = 100 / 79;   // matches beanie_morph_grid (wider than tall)

function getPortraitArea(W, H) {
  if (W >= H) {
    // wide / desktop: face on the right
    return { x0: 0.40, x1: 1.00, y0: 0.12, y1: 0.88 };
  }
  // tall / mobile: face on the top, full width.
  // Portrait band sits lower than the timeline/map band because the
  // beanie/hair candles cluster at the top of the face, making the
  // visual edge denser and more prone to overlapping the chapter label.
  return { x0: 0.05, x1: 0.95, y0: 0.35, y1: 0.69 };
}

function fitPortrait(px, py, W, H) {
  const PA = getPortraitArea(W, H);
  const areaW_px = (PA.x1 - PA.x0) * W;
  const areaH_px = (PA.y1 - PA.y0) * H;
  const areaAspect = areaW_px / areaH_px;
  const lx = (px - 0.40) / 0.60;   // original buildParticles px in [0.40, 1.00]
  const ly = (py - 0.12) / 0.76;   // original py in [0.12, 0.88]
  let fx = lx, fy = ly;
  if (areaAspect > FACE_ASPECT) {
    const faceW_frac = FACE_ASPECT / areaAspect;
    const offset = (1 - faceW_frac) / 2;
    fx = offset + lx * faceW_frac;
  } else {
    const faceH_frac = areaAspect / FACE_ASPECT;
    const offset = (1 - faceH_frac) / 2;
    fy = offset + ly * faceH_frac;
  }
  return {
    x: PA.x0 + fx * (PA.x1 - PA.x0),
    y: PA.y0 + fy * (PA.y1 - PA.y0),
  };
}

function getState(particle, key, W, H) {
  let s;
  if (key === 'P') {
    const fit = fitPortrait(particle.px, particle.py, W, H);
    s = { x: fit.x, y: fit.y, w: particle.pw, h: particle.ph };
  } else if (key === 'T') {
    s = { x: particle.tx, y: particle.ty, w: particle.tw, h: particle.th };
  } else {
    s = { x: particle.mx, y: particle.my, w: particle.mw, h: particle.mh };
  }
  // Mobile: shift right-half particles to upper portion of canvas, leaving the
  // lower portion for the text card. y0 matches the portrait mobile band (0.28)
  // so candles sit below the chapter/meta labels, not behind them.
  if (W < H && key !== 'P') {  // P is already handled inside fitPortrait
    s = {
      x: (s.x - 0.40) / 0.60,    // expand [0.40, 1.00] horizontally to [0, 1]
      y: 0.28 + s.y * 0.34,      // compress vertically to band [0.28, 0.62]
      w: s.w * 0.95,
      h: s.h * 0.55,             // shorter candles when squeezed
    };
  }
  return s;
}

function drawFrame(canvas, particles, progress, W, H) {
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
    canvas.width = W * dpr;
    canvas.height = H * dpr;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const seg = segment(progress);
  ctx.fillStyle = INK;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const stagger = p.stagger;
    const t = clamp((seg.t - stagger) / (1 - stagger), 0, 1);
    const e = smooth(t);

    const a = getState(p, seg.from, W, H);
    const b = getState(p, seg.to, W, H);

    const x = lerp(a.x, b.x, e) * W;
    const y = lerp(a.y, b.y, e) * H;
    const w = lerp(a.w, b.w, e) * W;
    const h = lerp(a.h, b.h, e) * H;

    const motion = Math.hypot(b.x - a.x, b.y - a.y);
    const alpha = 1 - Math.min(0.25, motion * 0.5 * (1 - Math.abs(0.5 - t) * 2));
    ctx.globalAlpha = alpha;

    ctx.fillRect(x - w/2, y - h/2, Math.max(0.7, w), Math.max(0.7, h));
  }
  ctx.globalAlpha = 1;
}

// ─────────────────────────────────────────────────────────
// MorphStage component
// ─────────────────────────────────────────────────────────
function MorphStage() {
  const stageRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const particlesRef = React.useRef(null);
  const progressRef = React.useRef(0);
  const [phase, setPhase] = React.useState('portrait');
  const portraitGrid = useGrid('assets/beanie_morph_grid.json');

  // Build particles when grid arrives, then draw immediately.
  React.useEffect(() => {
    if (!portraitGrid) return;
    particlesRef.current = buildParticles(portraitGrid);
    drawNow();
  }, [portraitGrid]);

  // Draw function — pulls progress + size + particles each time it's called.
  const drawNow = React.useCallback(() => {
    const c = canvasRef.current;
    const parts = particlesRef.current;
    if (!c || !parts) return;
    const rect = c.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    if (W <= 0 || H <= 0) return;
    drawFrame(c, parts, progressRef.current, W, H);
  }, []);

  // Scroll: compute progress, update phase, redraw. No RAF — fires on every
  // scroll event (passive listener) and on resize. Bypasses the iframe-hidden
  // RAF throttling that pauses background tabs entirely.
  React.useEffect(() => {
    function onScroll() {
      const stage = stageRef.current;
      if (!stage) return;
      const r = stage.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = r.height - vh;
      const p = clamp(-r.top / total, 0, 1);
      progressRef.current = p;

      const next =
        p < 0.18 ? 'portrait' :
        p < 0.36 ? 'toCareer' :
        p < 0.48 ? 'career' :
        p < 0.66 ? 'toMap' :
        p < 0.82 ? 'map' :
        p < 0.96 ? 'back' :
                   'final';
      setPhase(prev => prev === next ? prev : next);
      drawNow();
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // Also redraw on visibility change in case the preview was hidden
    // when the user scrolled.
    document.addEventListener('visibilitychange', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('visibilitychange', onScroll);
    };
  }, [drawNow]);

  return (
    <section className="morph-stage" ref={stageRef} data-screen-label="03 Career Morph">
      <div className="morph-sticky">
        <canvas ref={canvasRef} className="morph-canvas" />
        <MorphOverlay phase={phase} progress={progressRef} />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// Text overlay — fades different cards in/out per phase
// ─────────────────────────────────────────────────────────
function MorphOverlay({ phase }) {
  return (
    <div className="morph-overlay">
      {/* Top-left meta — always present */}
      <div className="morph-meta-tl">
        <div className="meta meta-strong">§ 03 · The Almanack, in three acts</div>
        <div className="meta">Scroll to advance</div>
      </div>

      {/* Phase badge top-right */}
      <div className="morph-phase">
        <div className="meta meta-strong">CHAPTER</div>
        <div className="morph-phase-name">
          {phase === 'portrait' ? 'Portrait' :
           phase === 'toCareer' ? 'Portrait → Career' :
           phase === 'career'   ? 'Career' :
           phase === 'toMap'    ? 'Career → World' :
           phase === 'map'      ? 'World' :
           phase === 'back'     ? 'Returning to portrait' :
                                  'Outro'}
        </div>
      </div>

      {/* Phase content blocks */}
      <PortraitCard visible={phase === 'portrait'} />
      <CareerCard   visible={phase === 'career' || phase === 'toCareer' || phase === 'toMap'} fading={phase === 'toMap'} />
      <MapCard      visible={phase === 'map' || phase === 'toMap' || phase === 'back'} fading={phase === 'back'} />
      <OutroCard    visible={phase === 'final'} />
    </div>
  );
}

function PortraitCard({ visible }) {
  return (
    <div className={`morph-card portrait-card ${visible ? 'in' : 'out'}`}>
      <div className="meta">§ 03 · Introduction</div>
      <h2 className="heading"><em>Hey,</em><br/>I'm Benedict.</h2>
      <p className="lede">
        A decade-plus building companies across fintech, blockchain and AI.
        The career and the life are the same shape: pick the audacious route,
        trust the process, get through it.
      </p>
    </div>
  );
}

function CareerCard({ visible, fading }) {
  return (
    <div className={`morph-card career-card ${visible ? 'in' : 'out'} ${fading ? 'fading' : ''}`}>
      <div className="meta">§ 03.1 · Career</div>
      <h2 className="heading">A decade-plus,<br/><em>in candles.</em></h2>
      <ol className="career-legend">
        {CAREER.map((c, i) => (
          <li key={i}>
            <span className="yr">{c.yr}</span>
            <span className="co">{c.co}</span>
            <span className="rl">{c.role}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function OutroCard({ visible }) {
  return (
    <div className={`morph-card portrait-card ${visible ? 'in' : 'out'}`}>
      <div className="meta">§ 03.3 · Outro</div>
      <h2 className="heading">The only way<br/><em>is through.</em></h2>
      <p className="lede">
        Pick the audacious route. Trust the process. Get through it.
      </p>
    </div>
  );
}

function MapCard({ visible, fading }) {
  return (
    <div className={`morph-card map-card ${visible ? 'in' : 'out'} ${fading ? 'fading' : ''}`}>
      <div className="meta">§ 03.2 · World</div>
      <h2 className="heading">The same shape,<br/><em>off the chart.</em></h2>
      <p className="lede">
        The career picks the audacious route in candlesticks. The life
        picks it in continents. London to Mongolia, via Iran, by car.
        The length of India by tuk-tuk. Sahara to Atlantic across Morocco.
        Fifty-plus countries, mostly the long way round.
      </p>
      <dl className="map-stats">
        <div><dt>50+</dt><dd>Countries</dd></div>
        <div><dt>3</dt><dd>Expeditions</dd></div>
        <div><dt>12,000mi</dt><dd>London → Mongolia, via Iran</dd></div>
        <div><dt>2,000mi</dt><dd>Cross-India, tuk-tuk</dd></div>
      </dl>
    </div>
  );
}

window.MorphStage = MorphStage;
window.CAREER = CAREER;
