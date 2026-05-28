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
      const sections = ['hero', 'about', 'morph', 'projects', 'services', 'writing', 'reading', 'contact'];
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
        <span>Benedict W. H. Dixon · An Almanack · MMXXVI</span>
      </div>
      <nav>
        {[
          ['about', 'About'],
          ['morph', 'Career'],
          ['projects', 'Projects'],
          ['services', 'Services'],
          ['writing', 'Writing'],
          ['contact', 'Contact'],
        ].map(([id, label]) => (
          <a key={id} href={`#${id}`} className={active === id ? 'active' : ''}>{label}</a>
        ))}
      </nav>
    </header>
  );
}

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
          <div className="meta meta-strong">An Almanack for Finance, Operations &amp; Code</div>
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
            <p className="hero-tagline-text">
              An operator at the intersection of
              <em> finance, blockchain &amp; AI.</em>
            </p>
            <a className="hero-scroll" href="#about">
              <span className="meta">Read on</span>
              <span className="arrow">↓</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// Ticker tape — between sections, a marquee of career stats
// ─────────────────────────────────────────────────────────
function Ticker() {
  const items = [
    '$150M ECOSYSTEM',  'KASH · COO & INTERIM CTO',  '45K USERS',
    'JPMORGAN PATENT',  '94% COST REDUCTION',  '50+ COUNTRIES',
    'VOI NETWORK',  '12,000mi LONDON → MONGOLIA',  'POUND TOKEN',
    'DD VENTURES',  'AMEX R&D',  '6 MONTHS SOLO BUILD',
    'BATH · COMPUTER SCIENCE',
  ];
  const line = items.join('   ·   ');
  return (
    <div className="ticker">
      <div className="ticker-track">
        <span>{line}   ·   {line}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// About
// ─────────────────────────────────────────────────────────
function About() {
  return (
    <section id="about" className="about-section" data-screen-label="02 About">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="num">§ 02 · About</p>
            <h2 className="ttl"><em>From co-inventing</em><br/>payment systems to running them.</h2>
          </div>
          <div className="right">Edition 01 · pp. 12–14</div>
        </div>

        <div className="about-grid">
          <div className="body about-lede drop">
            <p>A decade-plus running and building companies in financial technology. Operator, COO, CTO. Deep across product, technology, operations and ecosystems. The throughline is finance, top to bottom.</p>
            <p>JPMorgan to Kash. A patented B2B payment system. A $150M L1 ecosystem with 45K+ users. A stablecoin steered through acquisition. An enterprise-grade microservice platform shipped solo. The breadth is the point. Always the backdrop, never the cage.</p>
          </div>

          <aside className="margin-note about-margin">
            <p>Read also —</p>
            <p>§ 03 The career, in candles<br/>§ 04 Featured projects<br/>§ 05 Services on offer</p>
            <p style={{marginTop: 16}}>Contact — <br/>me@benedictdixon.com</p>
          </aside>
        </div>

        <hr className="hairline" style={{margin: '64px 0'}} />

        <div className="three-cards">
          <article>
            <div className="kicker">§ 02.a · Operational</div>
            <h3 className="subhead">Operational <em>Leadership</em></h3>
            <p>Companies and divisions, run from the ground up. Organisational structure, financial controls, operational processes. Built to scale. Full-picture ownership.</p>
          </article>
          <article>
            <div className="kicker">§ 02.b · Product &amp; Technology</div>
            <h3 className="subhead">Product &amp; <em>Technology</em></h3>
            <p>Distributed systems, event-driven architectures, financial transaction infrastructure. Product strategy, roadmaps and the calls that turn architecture into a business. Designed, built and shipped end-to-end, handling real money in production.</p>
          </article>
          <article>
            <div className="kicker">§ 02.c · Commercial</div>
            <h3 className="subhead">Growth &amp; <em>Go-to-Market</em></h3>
            <p>Engines that take products to market: ecosystem partnerships, community growth, sales strategy and stakeholder management. Zero to 45K+ users and $150M+ in value.</p>
          </article>
        </div>

        <hr className="hairline" style={{margin: '64px 0 32px'}} />

        <div className="achievements">
          <div className="kicker">Key achievements</div>
          <ol className="achievement-list">
            <li><span className="ach-num">i.</span><span>Built and scaled a blockchain ecosystem from concept to <em>$150M+</em> with 45K+ users.</span></li>
            <li><span className="ach-num">ii.</span><span>Co-invented a <em>patented</em> real-time B2B payment system at JPMorgan.</span></li>
            <li><span className="ach-num">iii.</span><span>Navigated a successful acquisition, preserving <em>millions in assets</em> during transition.</span></li>
            <li><span className="ach-num">iv.</span><span>Built an enterprise-grade 50+ microservice platform from scratch as sole engineer in <em>six months.</em></span></li>
          </ol>
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
    name: 'Kash',
    role: 'COO & Interim CTO',
    period: '2025 –',
    body: 'COO and CTO from inception. Full ownership across product, technology, operations, finance and partnerships. Built the entire 50+ microservice platform as sole engineer in six months, then shipped the company around it.',
    pills: ['Operations', 'Product', 'Technology', 'Finance', 'Partnerships'],
  },
  {
    num: '04.ii',
    name: 'Voi Network',
    role: 'Chief Ecosystem Officer',
    period: '2024 – 2025',
    body: 'Led vision and development of an L1 from concept to $150M ecosystem. Built and mentored teams across departments. Integrated 25+ projects into the ecosystem. 45K+ users with strong token retention.',
    pills: ['Ecosystem Growth', 'Team Leadership', 'Strategic Vision'],
  },
  {
    num: '04.iii',
    name: 'Pound Token',
    role: 'Chief Technology Officer',
    period: '2023 – 2024',
    body: 'Led technical strategy through a successful acquisition. Executed zero-downtime migration reducing operating costs by 94%. Preserved millions in assets during the transition.',
    pills: ['Technical Strategy', 'Migration', 'Team Retention'],
  },
  {
    num: '04.iv',
    name: 'Nettle',
    role: 'Chief Product & Technology Officer',
    period: '2022 – 2023',
    body: 'Led product and technology for an innovative fintech payments and loyalty platform. Architected a multi-currency payment system. Accelerated time-to-market through customer-driven development.',
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
            <h2 className="ttl">Four <em>case studies.</em></h2>
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
// Services
// ─────────────────────────────────────────────────────────
function Services() {
  return (
    <section id="services" className="services-section" data-screen-label="05 Services">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="num">§ 05 · Services</p>
            <h2 className="ttl">For founders, <em>operators</em> &amp; boards.</h2>
          </div>
          <div className="right">Available via DD Ventures</div>
        </div>

        <div className="services-grid">
          <article>
            <div className="kicker">§ 05.a</div>
            <h3 className="subhead">Executive &amp; <em>Operational</em><br/>Advisory</h3>
            <ul className="bare-list">
              <li>Organisational design &amp; scaling</li>
              <li>Operational process architecture</li>
              <li>Financial controls &amp; governance</li>
              <li>Executive leadership coaching</li>
            </ul>
          </article>
          <article>
            <div className="kicker">§ 05.b</div>
            <h3 className="subhead">Product &amp; <em>Technology</em><br/>Strategy</h3>
            <ul className="bare-list">
              <li>Product-market fit analysis</li>
              <li>Technical architecture review</li>
              <li>AI, blockchain &amp; payments strategy</li>
              <li>Scalability &amp; infrastructure planning</li>
            </ul>
          </article>
          <article>
            <div className="kicker">§ 05.c</div>
            <h3 className="subhead">Growth &amp; <em>Go-to-Market</em></h3>
            <ul className="bare-list">
              <li>Ecosystem &amp; community growth</li>
              <li>Partnership &amp; BD strategy</li>
              <li>Stakeholder &amp; investor management</li>
              <li>Team building &amp; culture</li>
            </ul>
          </article>
        </div>

        <div className="dd-callout">
          <div className="kicker">§ 05 · A note</div>
          <h3 className="subhead">DD Ventures — <em>entrepreneurship</em> advisory</h3>
          <p>Specialised advisory leveraging deep entrepreneurship experience to help founders successfully launch, run and scale companies and products.</p>
          <a className="link-arrow" href="https://dd.ventures" target="_blank" rel="noreferrer">dd.ventures →</a>
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
    date: 'Dec 2024',
    title: 'Autonomous AI Agents: A Platform for Trustless Business Interactions',
    excerpt: 'How autonomous AI agents could revolutionise business interactions by creating trustless systems for commerce and collaboration.',
    url: 'https://bwhdx.medium.com/autonomous-ai-agents-a-platform-for-trustless-business-interactions-75bdfbc3cbfb',
  },
  {
    date: 'Dec 2024',
    title: 'The Holy Trinity: Blockchain, AI &amp; IoT',
    excerpt: 'Three powerful tools coming together in ways that make each of them more useful than they are alone.',
    url: 'https://bwhdx.medium.com/the-holy-trinity-the-natural-partnership-of-blockchain-ai-and-iot-730786253400',
  },
  {
    date: 'Nov 2024',
    title: 'The Democratic Myth of DAOs: The Road to Autocracy',
    excerpt: 'How DAOs, despite their promise of radical decentralisation, are not immune to an inadvertent slide toward autocracy.',
    url: 'https://bwhdx.medium.com/the-democratic-myth-of-daos-the-road-to-autocracy-52d03e4e1f8e',
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
          <div className="right">Latest, three of many</div>
        </div>

        <div className="writing-grid">
          <div>
            <div className="kicker" style={{marginBottom: 24}}>Recent articles</div>
            <div className="list-divided">
              {ARTICLES.map((a, i) => (
                <a key={i} className="article-link" href={a.url} target="_blank" rel="noreferrer">
                  <div className="meta">{a.date}</div>
                  <h3 className="subhead" dangerouslySetInnerHTML={{__html: a.title}} />
                  <p dangerouslySetInnerHTML={{__html: a.excerpt}} />
                  <span className="link-arrow">Read on Medium →</span>
                </a>
              ))}
            </div>
            <p style={{marginTop: 32}}><a className="link-arrow" href="https://bwhdx.medium.com" target="_blank" rel="noreferrer">All writing on Medium →</a></p>
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
              Keynotes &amp; panels on fintech, blockchain, AI, distributed systems and the operator's lens on technical leadership.
            </p>
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
            <h2 className="ttl">Operations, <em>strategy,</em><br/>architecture.</h2>
          </div>
          <div className="right">Available now</div>
        </div>

        <div className="contact-grid">
          <p className="lede" style={{maxWidth: 720}}>
            For executive leadership, company operations or strategic advisory across
            fintech, blockchain and AI. Open to conversations with founders
            and operators building real things.
          </p>

          <div className="contact-links">
            <a href="mailto:me@benedictdixon.com">
              <div className="kicker">Email</div>
              <div className="contact-value">me@benedictdixon.com</div>
            </a>
            <a href="https://www.linkedin.com/in/benedict-dixon/" target="_blank" rel="noreferrer">
              <div className="kicker">LinkedIn</div>
              <div className="contact-value">/in/benedict-dixon</div>
            </a>
            <a href="https://x.com/bwhdx" target="_blank" rel="noreferrer">
              <div className="kicker">Twitter</div>
              <div className="contact-value">@bwhdx</div>
            </a>
            <a href="https://github.com/bwhdx" target="_blank" rel="noreferrer">
              <div className="kicker">GitHub</div>
              <div className="contact-value">@bwhdx</div>
            </a>
            <a href="https://dd.ventures" target="_blank" rel="noreferrer">
              <div className="kicker">Advisory</div>
              <div className="contact-value">dd.ventures</div>
            </a>
          </div>
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
            An Almanack for Finance, Operations &amp; Code
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

Object.assign(window, { Runner, Hero, Ticker, About, Projects, Services, Writing, Contact });
