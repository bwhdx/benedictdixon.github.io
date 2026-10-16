// Section components for the portfolio site.
// All static markup — JSX is just for componentisation.

// ─────────────────────────────────────────────────────────
// Header (fixed running banner)
// ─────────────────────────────────────────────────────────
function Runner() {
  const [hidden, setHidden] = React.useState(false);
  const [active, setActive] = React.useState('hero');
  const lastY = React.useRef(0);

  React.useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      setHidden(y > lastY.current && y > 240);
      lastY.current = y;
      // Find current section
      const sections = ['hero', 'about', 'morph', 'projects', 'writing', 'reading', 'contact'];
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.getBoundingClientRect().top < 100) {
          setActive(sections[i]);
          break;
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`runner ${hidden ? 'hidden' : ''}`}>
      <div className="brand">
        <div className="mark">B</div>
        <span>Benedict W. H. Dixon<span className="brand-long"> · An Almanack · MMXXVI</span></span>
      </div>
      <nav aria-label="Sections">
        {[
          ['about', 'About', true],
          ['morph', 'Career', true],
          ['projects', 'Projects', true],
          ['writing', 'Writing', false],
          ['contact', 'Contact', false],
        ].map(([id, label, wideOnly]) => (
          <a
            key={id}
            href={`#${id}`}
            className={[active === id ? 'active' : '', wideOnly ? 'nav-wide' : ''].join(' ').trim() || undefined}
            aria-current={active === id ? 'location' : undefined}
          >{label}</a>
        ))}
      </nav>
    </header>
  );
}

const HERO_LINE = <React.Fragment>Building and running companies, <em>end to end.</em></React.Fragment>;

const MASTHEAD = 'An Almanack · Building, leading & learning';

// ─────────────────────────────────────────────────────────
// Hero — full-bleed candlestick portrait + masthead
// ─────────────────────────────────────────────────────────
function Hero() {
  const grid = useGrid('assets/beanie_hero_16x9_navySides.json');
  const wrapRef = React.useRef(null);
  const [size, setSize] = React.useState({ w: 0, h: 0 });

  React.useEffect(() => {
    function measure() {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <section id="hero" className="hero-section" data-screen-label="01 Hero">
      <div className="hero-portrait" ref={wrapRef}>
        {grid && size.w > 0 && (
          <CandlestickPortrait grid={grid} width={size.w} height={size.h} />
        )}
      </div>

      {/* Top meta strip */}
      <div className="hero-top-bar">
        <div className="wrap hero-top-grid">
          <div className="meta meta-strong">{MASTHEAD}</div>
          <div className="meta">Vol. I · MMXXVI · Edition 01</div>
        </div>
      </div>

      {/* Bottom navy band — title + tagline */}
      <div className="hero-band">
        <div className="wrap">
          <div className="hero-band-top">
            <div className="meta">§ Cover</div>
            <div className="meta">Portrait rendered in 14,560 candles</div>
          </div>
          <h1 className="display hero-title">
            Benedict W. H. <em>Dixon.</em>
          </h1>
          <div className="hero-band-bottom">
            <div className="hero-lines">
              <p className="hero-tagline-text">{HERO_LINE}</p>
              <p className="hero-subline">Building, leading &amp; learning</p>
            </div>
            <div className="hero-actions">
              <a className="hero-cta" href="mailto:me@benedictdixon.com?subject=Compare%20notes">Compare notes</a>
              <a className="hero-scroll" href="#about">
                <span className="meta">Read on</span>
                <span className="arrow" aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// Ticker tape — between sections. A design element, not a stat wall:
// his tagline, or his essay titles. Decorative, so hidden from screen
// readers; a visible Pause control stops it (WCAG 2.2.2), and under
// prefers-reduced-motion it doesn't move at all (see site.css).
// ─────────────────────────────────────────────────────────
const TICKER_TAGLINE = [
  'BUILDING', 'LEADING', 'LEARNING', 'AN ALMANACK · VOL. I · MMXXVI',
  'BUILDING', 'LEADING', 'LEARNING', 'BENEDICT W. H. DIXON',
];
const TICKER_ESSAYS = [
  'AI COLLAPSED THE BUILD, NOT THE OPERATION',
  'THE UNIT OF PRODUCTION HAS CHANGED',
  'IN CLAWD WE TRUST',
  'THE ASSISTANT THAT KNOWS YOU',
  'THE ASSISTANT THAT\'S ALWAYS ON',
  'BUILDING A SECOND BRAIN THAT DOESN\'T DIE',
];

function Ticker({ items = TICKER_TAGLINE, label = 'ticker' }) {
  const [paused, setPaused] = React.useState(false);
  const line = items.join('   ·   ');
  return (
    <div className={`ticker ${paused ? 'is-paused' : ''}`}>
      <div className="ticker-track" aria-hidden="true">
        <span>{line}   ·   {line}</span>
      </div>
      <button
        type="button"
        className="ticker-toggle"
        aria-pressed={paused}
        aria-label={`${paused ? 'Play' : 'Pause'} the ${label}`}
        onClick={() => setPaused(p => !p)}
      >
        <span aria-hidden="true" className="ticker-toggle-glyph">{paused ? '▶' : '❚❚'}</span>
        {paused ? 'Play' : 'Pause'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// About
// ─────────────────────────────────────────────────────────
// About — both options are his LinkedIn About, verbatim, except A's last
// line, which is his own Q13 wording joined into one sentence.
const ABOUT_P1 = "I started out as an engineer, building payment systems at JPMorgan, then on the R&D team for Amex's referral campaigns. That's where I first got to see beyond the terminal. We went into those design, user interview and research centres, behind the double glass, and got some exposure to the positioning and the marketing side as well. After that came a hedge fund, fintech, and founding my own startups.";
const ABOUT_P2 = "Then I made a very conscious and intentional move from writing code to running companies and teams. When AI tooling arrived, I went back to building. Three of us built kash's whole product. Mine was the fat middle, from the hooks the frontend calls down to indexing on-chain events.";
const ABOUT = [ABOUT_P1, ABOUT_P2,
      "I build end-to-end, full solutions, and I run and operate products and businesses completely end to end."];

function About() {
  const paras = ABOUT;
  return (
    <section id="about" className="about-section" data-screen-label="02 About">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="num">§ 02 · About</p>
            <h2 className="ttl">Beyond <em>the terminal.</em></h2>
          </div>
          <div className="right">Edition 01 · pp. 12–14</div>
        </div>

        <div className="about-grid">
          <div className="body about-lede drop">
            {paras.map((p, i) => <p key={i}>{p}</p>)}
          </div>

          <aside className="margin-note about-margin">
            <p>Read also —</p>
            <p>§ 03 An operator's almanack<br/>§ 04 Featured projects<br/>§ 06 Writing &amp; speaking</p>
            <p style={{marginTop: 16}}>Contact — <br/>me@benedictdixon.com</p>
          </aside>
        </div>

      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// Projects
// ─────────────────────────────────────────────────────────
const PROJECTS = [
  {
    num: '04.i',
    name: 'kash',
    role: 'Co-founder, COO & Interim CTO',
    period: 'May 2025 – Present',
    body: "Co-founder, COO & Interim CTO at kash. Three of us built kash's whole product. Mine was the fat middle, from the hooks the frontend calls down to indexing on-chain events.",
    pills: ['Operations', 'Product', 'Technology', 'AI', 'Finance', 'Partnerships'],
    url: 'https://kash.bot/',
  },
  {
    num: '04.ii',
    name: 'Voi Network',
    role: 'Chief Ecosystem Officer',
    period: '2024 – 2025',
    body: 'Led vision and development of an L1 from concept to $150M ecosystem. Built and mentored teams across departments. Integrated 25+ projects into the ecosystem. 45K+ users with strong token retention. Exited the role in 2025.',
    pills: ['Ecosystem Growth', 'Team Leadership', 'Strategic Vision'],
    url: 'https://voi.network/',
  },
  {
    num: '04.iii',
    name: 'Pound Token',
    role: 'Chief Technology Officer',
    period: 'Aug 2023 – Aug 2024',
    body: 'Led technical strategy through a successful acquisition. Executed zero-downtime migration reducing operating costs by 94%. Preserved millions in assets during the transition.',
    pills: ['Technical Strategy', 'Migration', 'Team Retention'],
  },
  {
    num: '04.iv',
    name: 'Nettle',
    role: 'Chief Product & Technology Officer, Co-Founder',
    period: 'May 2021 – Aug 2023',
    body: 'Led product and technology for an innovative fintech payments and loyalty platform. Architected a multi-currency payment system. Accelerated time-to-market through customer-driven development. The company later ceased operations.',
    pills: ['Product Strategy', 'Payment Systems', 'Team Building'],
  },
];

function Projects() {
  return (
    <section id="projects" className="projects-section" data-screen-label="04 Projects">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="num">§ 04 · Featured projects</p>
            <h2 className="ttl">Selected <em>work.</em></h2>
          </div>
          <div className="right">pp. 32–48</div>
        </div>

        <div className="list-divided">
          {PROJECTS.map((p, i) => (
            <article key={i} className="project">
              <div className="project-meta">
                <div className="kicker">§ {p.num}</div>
                <div className="meta">{p.period}</div>
              </div>
              <div className="project-body">
                <h3 className="subhead">{p.name}<span className="project-role"> · {p.role}</span></h3>
                <p>{p.body}</p>
                {p.url && (
                  <p style={{marginTop: 16}}>
                    <a className="link-arrow" href={p.url} target="_blank" rel="noreferrer">
                      {p.url.replace(/^https?:\/\//, '').replace(/\/$/, '')} →
                    </a>
                  </p>
                )}
                <div className="project-pills">
                  {p.pills.map((t, j) => <span key={j} className="pill">{t}</span>)}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// Writing & Speaking
// ─────────────────────────────────────────────────────────
const ARTICLES = [
  {
    date: 'Jun 2026',
    title: 'AI Collapsed the Build, Not the Operation',
    excerpt: 'One person with AI can build what used to take fifty. But running it safely, and answering at 3am when money\'s on the line, still takes people.',
    url: '/writing/ai-collapsed-the-build/',
  },
  {
    date: 'Jun 2026',
    title: 'The Unit of Production Has Changed',
    excerpt: 'Three of us built kash, and mine is kind of the fat middle. AI deleted the coordination overhead, not just the typing. The cap that\'s left is judgement.',
    url: '/writing/the-unit-of-production-has-changed/',
  },
  {
    date: 'May 2026',
    title: 'Building a Second Brain That Doesn\'t Die',
    excerpt: 'The opinionated PKM template, open-sourced under MIT. Populated by a Claude Code setup wizard.',
    url: '/writing/building-a-second-brain/',
  },
  {
    date: 'Feb 2026',
    title: 'In Clawd We Trust',
    excerpt: 'A year of intensive Claude Code, distilled. The mental model, environment, phased workflow and quality practices that turn it into a 100x force multiplier.',
    url: '/writing/in-clawd-we-trust/',
  },
];

const SPEAKING = [
  { event: 'Zebu Live',                 topic: 'Tokenomics Design &amp; Strategy' },
  { event: 'Algorand at Tate Modern',   topic: 'Tokenomics Design &amp; Strategy' },
];

function Writing() {
  return (
    <section id="writing" className="writing-section" data-screen-label="06 Writing">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="num">§ 06 · Writing &amp; speaking</p>
            <h2 className="ttl">In <em>print</em> and at the lectern.</h2>
          </div>
          <div className="right">Selected four · technology</div>
        </div>

        <div className="writing-grid">
          <div>
            <div className="kicker" style={{marginBottom: 24}}>Recent articles</div>
            <div className="list-divided">
              {ARTICLES.map((a, i) => (
                <a key={i} className="article-link" href={a.url}>
                  <div className="meta">{a.date}</div>
                  <h3 className="subhead" dangerouslySetInnerHTML={{__html: a.title}} />
                  <p dangerouslySetInnerHTML={{__html: a.excerpt}} />
                  <span className="link-arrow">Read →</span>
                </a>
              ))}
            </div>
            <p style={{marginTop: 32}}><a className="link-arrow" href="/writing/">All writing →</a>&nbsp;&nbsp;<a className="link-arrow" href="/ai/">How I work with AI →</a></p>
          </div>

          <aside className="speaking">
            <div className="kicker" style={{marginBottom: 24}}>Conference speaking</div>
            {SPEAKING.map((s, i) => (
              <div key={i} className="speaking-item">
                <h4 className="subhead" style={{fontSize: '24px'}}>{s.event}</h4>
                <div className="meta" dangerouslySetInnerHTML={{__html: s.topic}} />
              </div>
            ))}
            <hr className="hairline" style={{margin: '40px 0'}}/>
            <div className="kicker" style={{marginBottom: 16}}>Open to —</div>
            <p style={{fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '20px'}}>
              Keynotes &amp; panels on AI, fintech, distributed systems, blockchain and the operator's lens on technical leadership.
            </p>
            <p style={{marginTop: 24}}><a className="link-arrow" href="/hosts/">For podcast hosts →</a></p>
          </aside>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// Contact
// ─────────────────────────────────────────────────────────
function Contact() {
  return (
    <section id="contact" className="contact-section" data-screen-label="08 Contact">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="num">§ 08 · Get in touch</p>
            <h2 className="ttl">Compare <em>notes.</em></h2>
          </div>
        </div>

        <div className="contact-grid">
          <p className="lede" style={{maxWidth: 720}}>
            I'm also a strategic, product and technology advisor to early-stage
            startups and founders. Always interested to compare notes with people
            doing the work.
          </p>

          <div className="contact-links">
            <a href="mailto:me@benedictdixon.com" rel="me">
              <div className="kicker">Email</div>
              <div className="contact-value">me@benedictdixon.com</div>
            </a>
            <a href="https://calendar.app.google/TkGwibhqQHXMRX5QA" target="_blank" rel="noreferrer">
              <div className="kicker">Book a call</div>
              <div className="contact-value">Find a time</div>
            </a>
            <a href="https://www.linkedin.com/in/benedict-dixon/" target="_blank" rel="me noreferrer">
              <div className="kicker">LinkedIn</div>
              <div className="contact-value">/in/benedict-dixon</div>
            </a>
            <a href="https://x.com/bwhdx" target="_blank" rel="me noreferrer">
              <div className="kicker">Twitter</div>
              <div className="contact-value">@bwhdx</div>
            </a>
            <a href="https://github.com/bwhdx" target="_blank" rel="me noreferrer">
              <div className="kicker">GitHub</div>
              <div className="contact-value">@bwhdx</div>
            </a>
            <a href="https://dd.ventures" target="_blank" rel="noreferrer">
              <div className="kicker">Advisory</div>
              <div className="contact-value">dd.ventures</div>
            </a>
          </div>

          {/* PREVIEW ONLY — visual email capture. No provider is chosen yet,
              so the form posts nowhere: submit is swallowed client-side.
              Wire `action` to the provider before this ships. */}
          <form
            className="edition-signup"
            data-provider="none"
            onSubmit={(e) => e.preventDefault()}
            aria-labelledby="edition-signup-label"
          >
            <p className="kicker" id="edition-signup-label">Next edition</p>
            <p className="edition-signup-line">The next edition lands when there's something worth reading.</p>
            <div className="edition-signup-row">
              <label className="sr-only" htmlFor="edition-email">Email address</label>
              <input id="edition-email" type="email" name="email" autoComplete="email" placeholder="you@example.com" required />
              <button type="submit">Subscribe</button>
            </div>
          </form>
        </div>
      </div>

      <div className="wrap">
        <footer className="colophon">
          <div>
            <strong>Colophon</strong>
            Set in Fraunces, Inter &amp; JetBrains Mono. Hero portrait rendered from a brightness sample of a photograph, redrawn in candlesticks. Royal navy on warm cream.
          </div>
          <div>
            <strong>Edition</strong>
            Vol. I · MMXXVI<br/>
            {MASTHEAD}
          </div>
          <div>
            <strong>Words</strong>
            Approx. 1,400.<br/>
            Reading time: ~6 minutes.
          </div>
          <div>
            <strong>© 2026</strong>
            Benedict W. H. Dixon.<br/>
            All rights observed.
          </div>
        </footer>
      </div>
    </section>
  );
}

Object.assign(window, { HERO_LINE, MASTHEAD, TICKER_TAGLINE, TICKER_ESSAYS, Runner, Hero, Ticker, About, Projects, Writing, Contact });
