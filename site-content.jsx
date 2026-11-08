// Section components for the portfolio site.
// All static markup — JSX is just for componentisation.

// ─────────────────────────────────────────────────────────
// The word mark: five candles spelling bwhdx, bwhdx in small mono beneath.
// Each candle closes at its letter's place in the alphabet (a at the foot,
// z at the top) and opens where the one before closed; falling candles are
// filled, rising ones hollow. The article pages inline the same SVG, and
// favicons/favicon.svg draws the candles alone. Drawn in currentColor, so
// CSS sets the ink.
// ─────────────────────────────────────────────────────────
// Typographer's quotes: straight quotes and apostrophes in the copy become
// curly ones (’ for apostrophes and closing quotes, ‘ “ after a space or at
// the start). Applied to prose strings at render time.
function curly(str) {
  return str
    .replace(/(^|[\s(\[{—–-])'/g, '$1\u2018')
    .replace(/'/g, '\u2019')
    .replace(/(^|[\s(\[{—–-])"/g, '$1\u201C')
    .replace(/"/g, '\u201D');
}
const tq = curly;

const CIPHER_CANDLES = [
  // [x, wick top, wick bottom, body top, body height, filled]
  [10, 25.0, 53.6, 30.0, 18.6, true],
  [30, 8.1, 53.6, 13.1, 35.5, false],
  [50, 8.1, 43.5, 13.1, 25.4, true],
  [70, 33.5, 50.2, 38.5, 6.7, true],
  [90, 6.4, 50.2, 11.4, 33.8, false],
];

// Each letter is its own text, centred on its candle, so it never depends
// on the font's advance. Generated from visuals.cipher_svg (letters=True).
const CIPHER_LETTERS = [
  [10, 'b'],
  [30, 'w'],
  [50, 'h'],
  [70, 'd'],
  [90, 'x'],
];

// With a label it is an image with that name; without one, decoration.
function Cipher({ label }) {
  return (
    <svg className="cipher" viewBox="0 0 100 82" fill="none" stroke="currentColor"
      strokeLinecap="butt" strokeLinejoin="miter" focusable="false"
      role={label ? 'img' : undefined} aria-label={label}
      aria-hidden={label ? undefined : true}>
      {CIPHER_CANDLES.map(([x, top, bottom, bodyTop, bodyH, filled]) => (
        <g key={x}>
          <line x1={x} x2={x} y1={top} y2={bottom} strokeWidth="2.4" />
          <rect x={x - 4.5} y={bodyTop} width="9" height={bodyH} strokeWidth="2.4"
            fill={filled ? 'currentColor' : 'none'} />
        </g>
      ))}
      {CIPHER_LETTERS.map(([x, ch]) => (
        <text key={ch} x={x} y="76" textAnchor="middle" stroke="none" fill="currentColor"
          fontFamily="JetBrains Mono" fontSize="15" fontWeight="500">{ch}</text>
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────
// Insignia: the word mark fixed in the bottom-left corner, linking back to
// the top. It hides where ink would not read or would get in the way, and
// while the footer's own mark is on screen. Two IntersectionObservers, no
// scroll handler:
//  - one watches the surfaces below through a root narrowed to the
//    insignia's own corner, so it hides only while one is actually under it;
//  - one watches the footer against the whole viewport.
// The corner is measured from the element and re-measured on resize.
// ─────────────────────────────────────────────────────────
// Surfaces the mark must not sit on: the navy cover.
const INSIGNIA_AVOID = '#hero';
const INSIGNIA_FOOTER = '.colophon';
const INSIGNIA_SLACK = 12; // px around the mark that also counts as under it

function Insignia() {
  const ref = React.useRef(null);
  const [hidden, setHidden] = React.useState(true);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setHidden(false); return undefined; }

    const under = new Set();
    let footerInView = false;
    const update = () => setHidden(under.size > 0 || footerInView);

    const footer = document.querySelector(INSIGNIA_FOOTER);
    const footerObserver = new IntersectionObserver(([entry]) => {
      footerInView = entry.isIntersecting;
      update();
    });
    if (footer) footerObserver.observe(footer);

    let cornerObserver = null;
    function observeCorner() {
      if (cornerObserver) cornerObserver.disconnect();
      under.clear();
      // offset* ignores the hide transform, so this is the resting box.
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      const s = INSIGNIA_SLACK;
      const top = Math.max(0, el.offsetTop - s);
      const left = Math.max(0, el.offsetLeft - s);
      const right = Math.max(0, vw - (el.offsetLeft + el.offsetWidth + s));
      const bottom = Math.max(0, vh - (el.offsetTop + el.offsetHeight + s));
      cornerObserver = new IntersectionObserver((entries) => {
        entries.forEach((e) => (e.isIntersecting ? under.add(e.target) : under.delete(e.target)));
        update();
      }, { rootMargin: `-${top}px -${right}px -${bottom}px -${left}px` });
      document.querySelectorAll(INSIGNIA_AVOID).forEach((n) => cornerObserver.observe(n));
    }
    observeCorner();

    let frame = 0;
    function onResize() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(observeCorner);
    }
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frame);
      footerObserver.disconnect();
      if (cornerObserver) cornerObserver.disconnect();
    };
  }, []);

  return (
    <a ref={ref} className="insignia" href="#hero" aria-label="bwhdx, back to the top"
      data-hidden={hidden ? 'true' : 'false'}>
      <Cipher />
    </a>
  );
}

// ─────────────────────────────────────────────────────────
// The book's structure. One list drives the contents page, the contents
// sheet, the running head and the chapter plates, so the titles can never
// drift apart. Chapters are numbered, never paged: the site has no pages,
// so the contents leads each title to a plain label of what is in it.
// ─────────────────────────────────────────────────────────
const CHAPTERS = [
  { id: 'about',    n: 'I',   title: 'Beyond the terminal',         label: 'About' },
  { id: 'career',   n: 'II',  title: 'A decade-plus, by the year',  label: 'Career' },
  { id: 'projects', n: 'III', title: 'Selected work',               label: 'Work' },
  { id: 'writing',  n: 'IV',  title: 'In print and at the lectern', label: 'Writing and talks' },
  { id: 'contact',  n: 'V',   title: 'Compare notes',               label: 'Contact' },
];

// The ornament: five candles of one height, hollow and filled in turn,
// between two hairlines. Equal heights on purpose: rhythm, never a trend.
function CandleRule({ className = '' }) {
  const xs = [46, 53, 60, 67, 74];
  return (
    <svg className={`candle-rule ${className}`.trim()} viewBox="0 0 120 20" aria-hidden="true" focusable="false"
      fill="none" stroke="currentColor" strokeWidth="1.2" shapeRendering="crispEdges">
      <line x1="0" x2="38" y1="10" y2="10" />
      <line x1="82" x2="120" y1="10" y2="10" />
      {xs.map((x, i) => (
        <g key={x}>
          <line x1={x} x2={x} y1="3" y2="17" />
          <rect x={x - 2} y="6" width="4" height="8" fill={i % 2 ? 'currentColor' : 'var(--paper)'} />
        </g>
      ))}
    </svg>
  );
}

// Which part of the book is under the running head. One observer over
// every [data-chapter] element, with the root narrowed to a band just
// below the header: the last part in document order inside the band wins.
function useCurrentPart() {
  const [part, setPart] = React.useState('cover');
  React.useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    const els = Array.from(document.querySelectorAll('[data-chapter]'));
    const inBand = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? inBand.add(e.target) : inBand.delete(e.target)));
      const hit = els.filter((el) => inBand.has(el)).pop();
      if (hit) setPart(hit.dataset.chapter);
    }, { rootMargin: '-74px 0px -80% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return part;
}

function ContentsList({ current, onPick }) {
  return (
    <ol className="toc">
      {CHAPTERS.map((c) => (
        <li key={c.id}>
          <a href={`#${c.id}`} onClick={onPick} aria-current={current === c.id ? 'location' : undefined}>
            <span className="toc-n">{c.n}</span>
            <span className="toc-t">{c.title}</span>
            <span className="toc-dots" aria-hidden="true" />
            <span className="toc-f">{c.label}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

// The contents sheet: a native modal dialog, so focus is trapped and
// restored by the browser and Escape closes it. A click on the backdrop
// (the dialog element itself, outside its panel) closes it too.
function ContentsSheet({ current }) {
  const ref = React.useRef(null);
  const close = React.useCallback(() => { if (ref.current && ref.current.open) ref.current.close(); }, []);
  return (
    <React.Fragment>
      <button type="button" className="contents-btn" aria-haspopup="dialog"
        onClick={() => ref.current && ref.current.showModal()}>
        <CandleGlyph />Contents
      </button>
      <dialog ref={ref} className="contents-sheet" aria-labelledby="contents-sheet-title"
        onClick={(e) => { if (e.target === ref.current) close(); }}>
        <div className="sheet-panel">
          <div className="sheet-head">
            <h2 id="contents-sheet-title">Contents</h2>
            <button type="button" className="sheet-close" onClick={close}>Close</button>
          </div>
          <ContentsList current={current} onPick={close} />
          <p className="sheet-more"><a href="/writing/">All writing</a><a href="/ai/">How I work with AI</a></p>
        </div>
      </dialog>
    </React.Fragment>
  );
}

function CandleGlyph() {
  return (
    <svg className="candle-glyph" viewBox="0 0 12 14" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.2">
      <line x1="3" x2="3" y1="1" y2="13" /><rect x="1.5" y="4" width="3" height="6" />
      <line x1="9" x2="9" y1="1" y2="13" /><rect x="7.5" y="4" width="3" height="6" fill="currentColor" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────
// Reading progress as a small candlestick chart of the page along the top
// of the head, one candle per chapter, filled once read. scroll-motion.js
// draws the candles into this empty row (the writing pages inline the same
// markup), so React renders it once with no children and never touches them.
// ─────────────────────────────────────────────────────────
function CandleProgress() {
  return <nav className="candle-progress" aria-label="Sections of this page" />;
}

// ─────────────────────────────────────────────────────────
// The running head: the author and the contents sheet, with the candle
// progress strip along its top edge. The book's title is on the cover's
// top line, not repeated here. On phones the mark stands in for the name.
// The current part still marks the contents sheet's entry.
// ─────────────────────────────────────────────────────────
function Runner() {
  const part = useCurrentPart();
  return (
    <header className="runner" data-part={part}>
      <CandleProgress />
      <a className="runner-verso" href="#hero" aria-label="Benedict W. H. Dixon, back to the cover">
        <span className="runner-mark"><Cipher /></span>
        <span className="runner-name">Benedict W. H. Dixon</span>
      </a>
      <ContentsSheet current={part} />
    </header>
  );
}

// The chapter plate turns in like a page as it arrives (scroll-motion.js
// and site.css, section Motion); the five candles of the mark rise in turn.
function ChapterPlate({ chapter, lede }) {
  return (
    <header className="plate" data-reveal="plate">
      <Cipher />
      <p className="plate-n">Chapter {chapter.n}</p>
      <h2 className="plate-t" id={`${chapter.id}-title`}>{chapter.title}</h2>
      {lede && <p className="plate-lede">{lede}</p>}
    </header>
  );
}

function ChapterFoot() {
  return (
    <div className="chapter-foot">
      <CandleRule />
    </div>
  );
}

const chapter = (id) => CHAPTERS.find((c) => c.id === id);
const HERO_LINE = <React.Fragment>Building and running companies, <em>end to end.</em></React.Fragment>;


// ─────────────────────────────────────────────────────────
// Hero: the candle portrait on the navy cover, then the name band.
// The portrait box is the space between the top strip and the band, inset
// to the frame's inner rule (site.css), so the renderer's coordinate space
// is the frame and the face can never be laid out across it. The face is
// always contained at its true aspect: set right on wide screens to
// balance the name, centred on phones, where the box takes the face's own
// aspect (--face-aspect) so the whole face fills the frame's width. Pitch
// scales with the face, about 170 columns at any size. The caption
// reports the number of candles actually drawn.
// ─────────────────────────────────────────────────────────
function heroLayout(w, h, aspect, phone) {
  const faceW = Math.min(w, h * aspect);
  return {
    fit: 'contain',
    align: phone ? [0.5, 0.5] : [0.86, 0.5],
    focus: [0.5, 0.52],
    pitch: Math.max(3, faceW / 170),
  };
}

function useBoxSize(ref) {
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const set = (w, h) => setSize(prev => (prev.w === w && prev.h === h ? prev : { w, h }));
    const r = el.getBoundingClientRect();
    set(Math.round(r.width), Math.round(r.height));
    if (!('ResizeObserver' in window)) return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      set(Math.round(box.width), Math.round(box.height));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

function useMedia(query) {
  const get = () => !!(window.matchMedia && window.matchMedia(query).matches);
  const [match, setMatch] = React.useState(get);
  React.useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

function HeroPortrait({ onStats }) {
  const grid = useGrid('assets/beanie_hero_16x9_navySides.json');
  const wrapRef = React.useRef(null);
  const size = useBoxSize(wrapRef);
  const aspect = grid ? toneMap(grid).aspect : null;
  // The phone breakpoint is read from the same media query as site.css,
  // not from the box width, which is now the frame's inner width.
  const phone = useMedia('(max-width: 700px)');
  const layout = React.useMemo(
    () => (aspect && size.w > 0 && size.h > 0 ? heroLayout(size.w, size.h, aspect, phone) : null),
    [aspect, size.w, size.h, phone]
  );
  return (
    <div className="hero-portrait" ref={wrapRef} style={aspect ? { '--face-aspect': aspect.toFixed(4) } : undefined}>
      <div className="hero-drift">
        {layout && (
          <CandleHalftonePortrait grid={grid} width={size.w} height={size.h}
            layout={layout} settle onStats={onStats} />
        )}
      </div>
    </div>
  );
}

function candleCaption(stats) {
  return stats ? `Portrait in ${stats.candles.toLocaleString('en-GB')} candles` : 'Portrait in candles';
}

function Hero({ onStats }) {
  const [stats, setStats] = React.useState(null);
  const report = React.useCallback((st) => { setStats(st); if (onStats) onStats(st); }, [onStats]);
  return (
    <section id="hero" className="hero-section" data-chapter="cover" data-screen-label="01 Hero"
      data-candles={stats ? stats.candles : undefined}>
      <div className="hero-top-bar">
        <div className="wrap hero-top-grid">
          <p className="meta meta-strong">An Almanack<span className="wide-only">, building, leading and learning</span></p>
          <p className="meta">Volume I<span className="wide-only">, MMXXVI</span></p>
        </div>
      </div>

      <HeroPortrait onStats={report} />
      <div className="wrap hero-caption">
        <p className="hero-count" data-ready={stats ? 'true' : 'false'}>{candleCaption(stats)}</p>
      </div>

      <div className="hero-band">
        <div className="wrap">
          <h1 className="display hero-title">
            {'Benedict W.\u00A0H. '}<em>Dixon.</em>
          </h1>
          <div className="hero-band-bottom">
            <div className="hero-lines">
              <p className="hero-tagline-text">{HERO_LINE}</p>
            </div>
            <div className="hero-actions">
              <a className="hero-cta hero-cta--primary" href="#writing">Read the essays</a>
              <a className="hero-link" href="mailto:me@benedictdixon.com?subject=Compare%20notes">Compare notes</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// Contents: the page after the cover, and the home page's navigation.
// ─────────────────────────────────────────────────────────
function Contents() {
  return (
    <section id="contents" className="contents-page" data-chapter="contents" aria-labelledby="contents-title">
      <div className="wrap contents-grid">
        <div className="contents-side">
          <h2 id="contents-title" className="contents-title">Contents</h2>
          <p className="contents-note">Volume I, MMXXVI. Five chapters, read in order or turn straight to one.</p>
        </div>
        <div>
          <ContentsList />
          <p className="contents-more-label">Elsewhere in the almanack</p>
          <ul className="toc toc-more">
            <li><a href="/writing/"><span className="toc-t">All writing, in full</span><span className="toc-dots" aria-hidden="true" /><span className="toc-f">/writing</span></a></li>
            <li><a href="/ai/"><span className="toc-t">How I work with AI</span><span className="toc-dots" aria-hidden="true" /><span className="toc-f">/ai</span></a></li>
            <li><a href="/hosts/"><span className="toc-t">For podcast hosts</span><span className="toc-dots" aria-hidden="true" /><span className="toc-f">/hosts</span></a></li>
          </ul>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// I. About. His LinkedIn About, verbatim. The margin notes are dated
// facts from the career list, not new claims.
// ─────────────────────────────────────────────────────────
const ABOUT = [
  { text: "I started out as an engineer, building payment systems at JPMorgan, then on the R&D team for Amex's referral campaigns. That's where I first got to see beyond the terminal. We went into those design, user interview and research centres, behind the double glass, and got some exposure to the positioning and the marketing side as well. After that came a hedge fund, fintech, and founding my own startups.",
    note: 'Engineering, 2015 to 2022: JPMorgan, Amex, MAIA, Icon' },
  { text: "Then I made a very conscious and intentional move from writing code to running companies and teams. When AI tooling arrived, I went back to building. Three of us built kash's whole product. Mine was the fat middle, from the hooks the frontend calls down to indexing on-chain events.",
    note: 'Running companies, from 2021: Nettle, Pound Token, Voi Network, kash' },
  { text: 'I build end-to-end, full solutions, and I run and operate products and businesses completely end to end.' },
];

function About() {
  const c = chapter('about');
  return (
    <section id="about" className="chapter" data-chapter="about" aria-labelledby="about-title">
      <div className="wrap">
        <ChapterPlate chapter={c} />
        <div className="page prose">
          {ABOUT.map((p, i) => (
            <React.Fragment key={i}>
              {p.note && <p className="margin-note">{p.note}</p>}
              <p className={i === 0 ? 'opener' : undefined}>{tq(p.text)}</p>
            </React.Fragment>
          ))}
        </div>
        <ChapterFoot />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// II. The career, as a ledger. Each role is one row; its candle lies on a
// shared 2014 to 2027 axis, the body running from the start of the role to
// its end (today, for current roles): filled for roles he founded or
// co-founded, hollow otherwise. Lying flat, the candles cannot rise or fall,
// so they never read as a price chart. As the reader reaches a row the
// wick rules across, the body grows to the tenure and the year and role
// settle beside it (scroll-motion.js and site.css, section Motion).
// ─────────────────────────────────────────────────────────
const LEDGER = [
  { yr: '2014', co: 'University of Bath', role: 'BSc Computer Science' },
  { yr: '2015', co: 'JPMorgan', role: 'Software engineer, patented B2B payments', from: 2015, to: 2018 },
  { yr: '2018', co: 'American Express', role: 'Engineer, R&D customer acquisition', from: 2018, to: 2019 },
  { yr: '2019', co: 'MAIA / Fulcrum', role: 'Engineer, hedge fund, back to front', from: 2019, to: 2021 },
  { yr: '2021', co: 'Icon Solutions', role: 'Senior engineer, real-time payments', from: 2021, to: 2022 },
  { yr: '2021', co: 'Nettle', role: 'Chief Product & Technology Officer, co-founder', from: 2021 + 4 / 12, to: 2023 + 7 / 12, founder: true },
  { yr: '2023', co: 'Pound Token', role: 'Chief Technology Officer', from: 2023 + 7 / 12, to: 2024 + 7 / 12 },
  { yr: '2024', co: 'Voi Network', role: 'Co-founder, Chief Ecosystem Officer, L1', from: 2024, to: 2025, founder: true },
  { yr: '2025', co: 'Brdge', role: 'Head of Blockchain', from: 2025 + 1 / 12 },
  { yr: '2025', co: 'DD Ventures', role: 'Founding Partner', from: 2025 + 3 / 12, founder: true },
  { yr: '2025', co: 'kash', role: 'Co-founder, COO & Interim CTO', from: 2025 + 4 / 12, founder: true },
];
const AXIS = { from: 2014, to: 2027 };
const AXIS_SPAN = AXIS.to - AXIS.from;

function yearNow() {
  const d = new Date();
  return d.getFullYear() + d.getMonth() / 12;
}
function spanOf(r) {
  if (r.from == null) return null;
  const to = r.to == null ? yearNow() : r.to;
  return { from: r.from, to, years: to - r.from, current: r.to == null };
}
const axisPct = (y) => `${(((y - AXIS.from) / AXIS_SPAN) * 100).toFixed(3)}%`;

// One role's candle. The wick is the row's axis; the body is an outer box
// that clips (its left edge is the open, always drawn) and an inner box,
// the body itself, that slides out of it. Every moving part is a transform,
// so the drawing runs on the compositor.
function LedgerCandle({ row }) {
  const s = spanOf(row);
  return (
    <span className="lc" aria-hidden="true">
      <span className="lc-wick" />
      {s ? (
        <span className={row.founder ? 'lc-body is-filled' : 'lc-body'}
          style={{ left: axisPct(s.from), width: `max(6px, ${axisPct(AXIS.from + s.years)})` }}>
          <span className="lc-fill" />
        </span>
      ) : (
        <span className="lc-mark" />
      )}
    </span>
  );
}

function LedgerAxis() {
  const years = [];
  for (let y = AXIS.from + 2; y < AXIS.to; y += 2) years.push(y);
  return (
    <div className="ledger-head" aria-hidden="true">
      <span className="lh-yr">Year</span>
      <span className="lh-co">Company</span>
      <span className="lh-role">Role</span>
      <span className="lh-axis">
        {years.map((y) => <span key={y} style={{ left: axisPct(y) }}>{`’${String(y).slice(2)}`}</span>)}
      </span>
      <span className="lh-years">Years</span>
    </div>
  );
}

const EXPEDITIONS = [
  { route: 'London to Mongolia, via Iran', how: 'By car', dist: '12,000 mi' },
  { route: 'Cross-India', how: 'By tuk-tuk', dist: '2,000 mi' },
  { route: 'Sahara to Atlantic', how: 'Across Morocco' },
];

function Career() {
  const c = chapter('career');
  return (
    <section id="career" className="chapter" data-chapter="career" aria-labelledby="career-title">
      <div className="wrap">
        <ChapterPlate chapter={c}
          lede="A decade-plus building companies across AI, fintech and blockchain. Operator, COO, CTO." />
        <div className="ledger">
          <p className="ledger-intro">Engineer at JPMorgan in 2015; co-founder, COO and interim CTO of kash today. Each role is one line, and its candle is the time spent in it.</p>
          <LedgerAxis />
          <ol className="ledger-rows">
            {LEDGER.map((r) => {
              const s = spanOf(r);
              return (
                <li key={`${r.yr}-${r.co}`} className={r.founder ? 'ledger-row is-founder' : 'ledger-row'} data-reveal="row">
                  <span className="lr-yr">{r.yr}</span>
                  <span className="lr-co">{r.co}</span>
                  <span className="lr-role">{r.role}</span>
                  <LedgerCandle row={r} />
                  <span className="lr-years">
                    {s ? (
                      <React.Fragment>
                        {s.years.toFixed(1)}<span className="sr-only"> years</span>
                        {s.current && <span className="lr-to-date"> to date</span>}
                      </React.Fragment>
                    ) : 'Degree'}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="ledger-key">
            <span className="key-item"><span className="key-candle" aria-hidden="true" />Employed</span>
            <span className="key-item"><span className="key-candle is-filled" aria-hidden="true" />Founder or co-founder</span>
            <span className="key-item">Axis 2014 to 2026; current roles run to today.</span>
          </p>
        </div>

        <h3 className="part-title page-col" data-reveal="opener">The long way round</h3>
        <div className="page prose">
          <p>Three expeditions. Fifty-plus countries. London to Mongolia, via Iran, by car. India by tuk-tuk. Sahara to Atlantic, across Morocco.</p>
        </div>
        <ul className="toc toc-routes page-col">
          {EXPEDITIONS.map((e) => (
            <li key={e.route}>
              <span className="toc-t">{e.route}</span>
              <span className="toc-dots" aria-hidden="true" />
              <span className="toc-v">{e.dist ? `${e.how}, ${e.dist}` : e.how}</span>
            </li>
          ))}
        </ul>
        <p className="coda page-col">The only way is through. Pick the audacious route. Trust the process. Get through it.</p>
        <ChapterFoot />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// III. Projects
// ─────────────────────────────────────────────────────────
const PROJECTS = [
  {
    name: 'kash',
    role: 'Co-founder, COO & Interim CTO',
    period: 'May 2025 to present',
    body: "Three of us built kash's whole product. Mine was the fat middle, from the hooks the frontend calls down to indexing on-chain events.",
    tags: ['Operations', 'Product', 'Technology', 'AI', 'Finance', 'Partnerships'],
    url: 'https://kash.bot/',
  },
  {
    name: 'Voi Network',
    role: 'Co-founder, Chief Ecosystem Officer',
    period: '2024 to 2025',
    body: 'Led vision and development of an L1 from concept to $150M ecosystem. Built and mentored teams across departments. Integrated 25+ projects into the ecosystem. 45K+ users with strong token retention. Exited the role in 2025.',
    tags: ['Ecosystem growth', 'Team leadership', 'Strategic vision'],
    url: 'https://voi.network/',
    figures: [['$150M', 'ecosystem, from concept'], ['25+', 'projects integrated'], ['45K+', 'users']],
  },
  {
    name: 'Pound Token',
    role: 'Chief Technology Officer',
    period: 'Aug 2023 to Aug 2024',
    body: 'Led technical strategy through a successful acquisition. Executed zero-downtime migration reducing operating costs by 94%. Preserved millions in assets during the transition.',
    tags: ['Technical strategy', 'Migration', 'Team retention'],
    figures: [['94%', 'lower operating costs'], ['Zero', 'downtime in the migration']],
  },
  {
    name: 'Nettle',
    role: 'Chief Product & Technology Officer, Co-Founder',
    period: 'May 2021 to Aug 2023',
    body: 'Led product and technology for an innovative fintech payments and loyalty platform. Architected a multi-currency payment system. Accelerated time-to-market through customer-driven development. The company later ceased operations.',
    tags: ['Product strategy', 'Payment systems', 'Team building'],
  },
];

function Projects() {
  const c = chapter('projects');
  return (
    <section id="projects" className="chapter" data-chapter="projects" aria-labelledby="projects-title">
      <div className="wrap">
        <ChapterPlate chapter={c} />
        <ol className="entries">
          {PROJECTS.map((p, i) => (
            <li key={p.name} className="page entry">
              <p className="margin-note">
                <span className="sc">{c.n}.{i + 1}</span>
                <span>{p.period}</span>
              </p>
              <div className="entry-body">
                <h3 className="entry-name">{p.name}</h3>
                <p className="entry-role">{p.role}</p>
                {p.figures && (
                  <ul className="entry-figures" aria-label="Outcomes">
                    {p.figures.map(([n, t]) => (
                      <li key={t} className="ef"><span className="ef-n">{n}</span> <span className="ef-t">{t}</span></li>
                    ))}
                  </ul>
                )}
                <p>{tq(p.body)}</p>
                {p.url && (
                  <p className="entry-link">
                    <a className="text-link" href={p.url} target="_blank" rel="noreferrer">
                      {p.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </p>
                )}
                <p className="index-line"><span className="sr-only">Areas: </span>{p.tags.join(' · ')}</p>
              </div>
            </li>
          ))}
        </ol>
        <ChapterFoot />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// IV. Writing and speaking
// ─────────────────────────────────────────────────────────
const ARTICLES = [
  {
    date: '3 Nov 2026',
    title: "The agent can't be its own checker",
    excerpt: "Why an AI agent's 'done' can't close its own work in a company that moves real money, and what does instead.",
    url: '/writing/the-agent-cant-be-its-own-checker/',
    read: '5 min read',
    cover: 'assets/covers/the-agent-cant-be-its-own-checker',
  },
  {
    date: '24 Jun 2026',
    title: 'AI collapsed the build, not the operation',
    excerpt: "One person with AI can build what used to take fifty. But running it safely, and answering at 3am when money's on the line, still takes people.",
    url: '/writing/ai-collapsed-the-build/',
    read: '4 min read',
    cover: 'assets/covers/ai-collapsed-the-build',
  },
  {
    date: '20 Jun 2026',
    title: 'The unit of production has changed',
    excerpt: "Three of us built kash, and mine is kind of the fat middle. AI deleted the coordination overhead, not just the typing. The cap that's left is judgement.",
    url: '/writing/the-unit-of-production-has-changed/',
    read: '3 min read',
    cover: 'assets/covers/the-unit-of-production-has-changed',
  },
  {
    date: '15 Feb 2026',
    title: 'In Clawd we trust',
    excerpt: 'A year of intensive Claude Code, distilled. The mental model, environment, phased workflow and quality practices that turn it into a 100x force multiplier.',
    url: '/writing/in-clawd-we-trust/',
    read: '20 min read',
    cover: 'assets/covers/in-clawd-we-trust',
  },
];

const SPEAKING = [
  { event: 'Zebu Live', topic: 'Tokenomics design and strategy' },
  { event: 'Algorand at Tate Modern', topic: 'Tokenomics design and strategy' },
];

// The essays index: the newest essay leads with its cover
// and the rest follow as a list, each with its reading time (as stated in
// the essay's own header) and a small crop of its cover. The covers are
// decorative here (the title beside them names the essay), so alt is empty.
function EssayIndex() {
  const [lead, ...rest] = ARTICLES;
  return (
    <ol className="essays essays--index">
      <li className="page essay-lead">
        <p className="margin-note"><time>{lead.date}</time><span className="essay-read">{lead.read}</span></p>
        <a className="essay-link" href={lead.url}>
          <span className="essay-cover">
            <img src={`${lead.cover}.jpg`} srcSet={`${lead.cover}-480.jpg 480w, ${lead.cover}.jpg 1400w`}
              sizes="(max-width: 700px) 100vw, 640px" alt="" width="1400" height="787" loading="lazy" decoding="async" />
          </span>
          <span className="essay-title">{tq(lead.title)}</span>
          <span className="essay-excerpt">{tq(lead.excerpt)}</span>
          <span className="cue">Read the essay</span>
        </a>
      </li>
      {rest.map((a) => (
        <li key={a.url} className="page essay-row">
          <p className="margin-note"><time>{a.date}</time><span className="essay-read">{a.read}</span></p>
          <a className="essay-link" href={a.url}>
            <span className="essay-thumb"><img src={`${a.cover}-480.jpg`} alt="" width="480" height="270" loading="lazy" decoding="async" /></span>
            <span className="essay-title">{tq(a.title)}</span>
            <span className="essay-excerpt">{tq(a.excerpt)}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

function Writing() {
  const c = chapter('writing');
  return (
    <section id="writing" className="chapter" data-chapter="writing" aria-labelledby="writing-title">
      <div className="wrap">
        <ChapterPlate chapter={c} />
        <h3 className="part-title page-col" data-reveal="opener">Recent essays</h3>
        <EssayIndex />
        <p className="page-col more-links">
          <a className="text-link" href="/writing/">All writing</a>
          <a className="text-link" href="/ai/">How I work with AI</a>
        </p>

        <h3 className="part-title page-col" data-reveal="opener">At the lectern</h3>
        <ul className="lectern">
          {SPEAKING.map((s) => (
            <li key={s.event} className="page">
              <p className="margin-note">Conference talk</p>
              <p className="lectern-item"><span className="lectern-event">{s.event}</span><span className="lectern-topic">{s.topic}</span></p>
            </li>
          ))}
        </ul>
        <div className="page prose">
          <p className="margin-note">Open to</p>
          <p>Keynotes and panels on AI, fintech, distributed systems, blockchain and the operator's lens on technical leadership. <a className="text-link" href="/hosts/">For podcast hosts</a></p>
          <p className="margin-note">Follow</p>
          <p className="follow">
            <a className="text-link" href="https://x.com/bwhdx" target="_blank" rel="me noreferrer">X, @bwhdx</a>
            <a className="text-link" href="https://www.linkedin.com/in/benedict-dixon/" target="_blank" rel="me noreferrer">LinkedIn</a>
          </p>
        </div>
        <ChapterFoot />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// V. Contact, then the colophon
// ─────────────────────────────────────────────────────────
const CONTACTS = [
  { label: 'Email', value: 'me@benedictdixon.com', href: 'mailto:me@benedictdixon.com', rel: 'me' },
  { label: 'Book a call', value: 'Find a time', href: 'https://calendar.app.google/TkGwibhqQHXMRX5QA', ext: true },
  { label: 'LinkedIn', value: '/in/benedict-dixon', href: 'https://www.linkedin.com/in/benedict-dixon/', ext: true, rel: 'me' },
  { label: 'X', value: '@bwhdx', href: 'https://x.com/bwhdx', ext: true, rel: 'me' },
  { label: 'GitHub', value: '@bwhdx', href: 'https://github.com/bwhdx', ext: true, rel: 'me' },
  { label: 'Advisory', value: 'dd.ventures', href: 'https://dd.ventures', ext: true },
];

// Working together: the three ways in that the site already
// names (advisory, speaking, build work through DD Ventures), each in the
// site's own words with one plain next step, then the address set large.
const WAYS = [
  { label: 'Advisory', text: 'Strategy, product and technology for early-stage startups and founders.',
    action: 'Book a call', href: 'https://calendar.app.google/TkGwibhqQHXMRX5QA', ext: true },
  { label: 'Speaking', text: "Keynotes and panels on AI, fintech, distributed systems, blockchain and the operator's lens on technical leadership.",
    action: 'For podcast hosts', href: '/hosts/' },
  { label: 'Building', text: 'Through DD Ventures: AI systems for family offices, and advisory and build work for founders.',
    action: 'dd.ventures', href: 'https://dd.ventures', ext: true },
];

function WorkTogether() {
  return (
    <React.Fragment>
      <div className="page ways">
        {WAYS.map((w) => (
          <React.Fragment key={w.label}>
            <p className="margin-note">{w.label}</p>
            <p className="way">
              <span className="way-text">{tq(w.text)}</span>
              <a className="text-link" href={w.href} target={w.ext ? '_blank' : undefined} rel={w.ext ? 'noreferrer' : undefined}>
                {w.action}{w.ext && <span className="sr-only"> (opens in a new tab)</span>}
              </a>
            </p>
          </React.Fragment>
        ))}
      </div>
      <div className="page write-to">
        <p className="margin-note">Write to</p>
        <p><a className="write-to-addr" href="mailto:me@benedictdixon.com">me@benedictdixon.com</a></p>
      </div>
    </React.Fragment>
  );
}

function Contact() {
  const c = chapter('contact');
  return (
    <section id="contact" className="chapter" data-chapter="contact" aria-labelledby="contact-title">
      <div className="wrap">
        <ChapterPlate chapter={c} />
        <div className="page prose">
          <p className="lede">I'm also a strategic, product and technology advisor to early-stage startups and founders. Always interested to compare notes with people doing the work.</p>
        </div>
        <WorkTogether />
        <ul className="toc toc-contact page-col">
          {CONTACTS.map((k) => (
            <li key={k.label}>
              <a href={k.href} target={k.ext ? '_blank' : undefined}
                rel={[k.rel, k.ext ? 'noreferrer' : ''].filter(Boolean).join(' ') || undefined}>
                <span className="toc-t">{k.label}</span>
                <span className="toc-dots" aria-hidden="true" />
                <span className="toc-v">{k.value}</span>
              </a>
            </li>
          ))}
        </ul>
        <ChapterFoot />
      </div>
    </section>
  );
}

function Colophon({ candles }) {
  return (
    <footer className="colophon" data-chapter="colophon">
      <div className="wrap colophon-inner">
        <Cipher label="bwhdx, the word mark of Benedict W. H. Dixon" />
        <h2 className="colophon-title">Colophon</h2>
        <p>
          This edition of <cite>An Almanack</cite> is set in Fraunces, with Inter and JetBrains Mono,
          in royal navy ink on warm ochre paper. The portrait on the cover is a brightness sample of a
          photograph, redrawn as candles: hollow for the mid-tones, filled for the highlights
          {candles ? <React.Fragment>, {candles.toLocaleString('en-GB')} of them on this screen.</React.Fragment> : '.'}
        </p>
        <p className="colophon-edition">Volume I, MMXXVI. Edition 01.</p>
        <p className="colophon-rights">© 2026 Benedict W. H. Dixon · benedictdixon.com</p>
      </div>
    </footer>
  );
}

Object.assign(window, { Cipher, CIPHER_CANDLES, CIPHER_LETTERS, CandleRule, CandleProgress, HeroPortrait, candleCaption, useBoxSize, HERO_LINE, CHAPTERS, Insignia, Runner, Hero, Contents, About, Career, Projects, Writing, Contact, Colophon });
