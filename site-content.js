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
    window.addEventListener('scroll', onScroll, {
      passive: true
    });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return /*#__PURE__*/React.createElement("header", {
    className: `runner ${hidden ? 'hidden' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mark"
  }, "B"), /*#__PURE__*/React.createElement("span", null, "Benedict W. H. Dixon \xB7 An Almanack \xB7 MMXXVI")), /*#__PURE__*/React.createElement("nav", null, [['about', 'About'], ['morph', 'Career'], ['projects', 'Projects'], ['services', 'Services'], ['writing', 'Writing'], ['contact', 'Contact']].map(([id, label]) => /*#__PURE__*/React.createElement("a", {
    key: id,
    href: `#${id}`,
    className: active === id ? 'active' : ''
  }, label))));
}

// ─────────────────────────────────────────────────────────
// Hero — full-bleed candlestick portrait + masthead
// ─────────────────────────────────────────────────────────
function Hero() {
  const grid = useGrid('assets/beanie_hero_16x9_navySides.json');
  const wrapRef = React.useRef(null);
  const [size, setSize] = React.useState({
    w: 0,
    h: 0
  });
  React.useEffect(() => {
    function measure() {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setSize({
        w: r.width,
        h: r.height
      });
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  return /*#__PURE__*/React.createElement("section", {
    id: "hero",
    className: "hero-section",
    "data-screen-label": "01 Hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero-portrait",
    ref: wrapRef
  }, grid && size.w > 0 && /*#__PURE__*/React.createElement(CandlestickPortrait, {
    grid: grid,
    width: size.w,
    height: size.h
  })), /*#__PURE__*/React.createElement("div", {
    className: "hero-top-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap hero-top-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "meta meta-strong"
  }, "An Almanack for Finance, Operations & Code"), /*#__PURE__*/React.createElement("div", {
    className: "meta"
  }, "Vol. I \xB7 MMXXVI \xB7 Edition 01"))), /*#__PURE__*/React.createElement("div", {
    className: "hero-band"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero-band-top"
  }, /*#__PURE__*/React.createElement("div", {
    className: "meta"
  }, "\xA7 Cover"), /*#__PURE__*/React.createElement("div", {
    className: "meta"
  }, "Portrait rendered in 14,560 candles")), /*#__PURE__*/React.createElement("h1", {
    className: "display hero-title"
  }, "Benedict W. H. ", /*#__PURE__*/React.createElement("em", null, "Dixon.")), /*#__PURE__*/React.createElement("div", {
    className: "hero-band-bottom"
  }, /*#__PURE__*/React.createElement("p", {
    className: "hero-tagline-text"
  }, "An operator at the intersection of", /*#__PURE__*/React.createElement("em", null, " finance, blockchain & AI.")), /*#__PURE__*/React.createElement("a", {
    className: "hero-scroll",
    href: "#about"
  }, /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "Read on"), /*#__PURE__*/React.createElement("span", {
    className: "arrow"
  }, "\u2193"))))));
}

// ─────────────────────────────────────────────────────────
// Ticker tape — between sections, a marquee of career stats
// ─────────────────────────────────────────────────────────
function Ticker() {
  const items = ['$150M ECOSYSTEM', 'KASH · COO & INTERIM CTO', '45K USERS', 'JPMORGAN PATENT', '94% COST REDUCTION', '50+ COUNTRIES', 'VOI NETWORK', '12,000mi LONDON → MONGOLIA', 'POUND TOKEN', 'DD VENTURES', 'AMEX R&D', '6 MONTHS SOLO BUILD', 'BATH · COMPUTER SCIENCE'];
  const line = items.join('   ·   ');
  return /*#__PURE__*/React.createElement("div", {
    className: "ticker"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ticker-track"
  }, /*#__PURE__*/React.createElement("span", null, line, "   \xB7   ", line)));
}

// ─────────────────────────────────────────────────────────
// About
// ─────────────────────────────────────────────────────────
function About() {
  return /*#__PURE__*/React.createElement("section", {
    id: "about",
    className: "about-section",
    "data-screen-label": "02 About"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "num"
  }, "\xA7 02 \xB7 About"), /*#__PURE__*/React.createElement("h2", {
    className: "ttl"
  }, /*#__PURE__*/React.createElement("em", null, "From co-inventing"), /*#__PURE__*/React.createElement("br", null), "payment systems to running them.")), /*#__PURE__*/React.createElement("div", {
    className: "right"
  }, "Edition 01 \xB7 pp. 12\u201314")), /*#__PURE__*/React.createElement("div", {
    className: "about-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "body about-lede drop"
  }, /*#__PURE__*/React.createElement("p", null, "A decade-plus running and building companies in financial technology. Operator, COO, CTO. Deep across product, technology, operations and ecosystems. The throughline is finance, top to bottom."), /*#__PURE__*/React.createElement("p", null, "JPMorgan to Kash. A patented B2B payment system. A $150M L1 ecosystem with 45K+ users. A stablecoin steered through acquisition. An enterprise-grade microservice platform shipped solo. The breadth is the point. Always the backdrop, never the cage.")), /*#__PURE__*/React.createElement("aside", {
    className: "margin-note about-margin"
  }, /*#__PURE__*/React.createElement("p", null, "Read also \u2014"), /*#__PURE__*/React.createElement("p", null, "\xA7 03 The career, in candles", /*#__PURE__*/React.createElement("br", null), "\xA7 04 Featured projects", /*#__PURE__*/React.createElement("br", null), "\xA7 05 Services on offer"), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 16
    }
  }, "Contact \u2014 ", /*#__PURE__*/React.createElement("br", null), "me@benedictdixon.com"))), /*#__PURE__*/React.createElement("hr", {
    className: "hairline",
    style: {
      margin: '64px 0'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "three-cards"
  }, /*#__PURE__*/React.createElement("article", null, /*#__PURE__*/React.createElement("div", {
    className: "kicker"
  }, "\xA7 02.a \xB7 Operational"), /*#__PURE__*/React.createElement("h3", {
    className: "subhead"
  }, "Operational ", /*#__PURE__*/React.createElement("em", null, "Leadership")), /*#__PURE__*/React.createElement("p", null, "Companies and divisions, run from the ground up. Organisational structure, financial controls, operational processes. Built to scale. Full-picture ownership.")), /*#__PURE__*/React.createElement("article", null, /*#__PURE__*/React.createElement("div", {
    className: "kicker"
  }, "\xA7 02.b \xB7 Product & Technology"), /*#__PURE__*/React.createElement("h3", {
    className: "subhead"
  }, "Product & ", /*#__PURE__*/React.createElement("em", null, "Technology")), /*#__PURE__*/React.createElement("p", null, "Distributed systems, event-driven architectures, financial transaction infrastructure. Product strategy, roadmaps and the calls that turn architecture into a business. Designed, built and shipped end-to-end, handling real money in production.")), /*#__PURE__*/React.createElement("article", null, /*#__PURE__*/React.createElement("div", {
    className: "kicker"
  }, "\xA7 02.c \xB7 Commercial"), /*#__PURE__*/React.createElement("h3", {
    className: "subhead"
  }, "Growth & ", /*#__PURE__*/React.createElement("em", null, "Go-to-Market")), /*#__PURE__*/React.createElement("p", null, "Engines that take products to market: ecosystem partnerships, community growth, sales strategy and stakeholder management. Zero to 45K+ users and $150M+ in value."))), /*#__PURE__*/React.createElement("hr", {
    className: "hairline",
    style: {
      margin: '64px 0 32px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "achievements"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kicker"
  }, "Key achievements"), /*#__PURE__*/React.createElement("ol", {
    className: "achievement-list"
  }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "ach-num"
  }, "i."), /*#__PURE__*/React.createElement("span", null, "Built and scaled a blockchain ecosystem from concept to ", /*#__PURE__*/React.createElement("em", null, "$150M+"), " with 45K+ users.")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "ach-num"
  }, "ii."), /*#__PURE__*/React.createElement("span", null, "Co-invented a ", /*#__PURE__*/React.createElement("em", null, "patented"), " real-time B2B payment system at JPMorgan.")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "ach-num"
  }, "iii."), /*#__PURE__*/React.createElement("span", null, "Navigated a successful acquisition, preserving ", /*#__PURE__*/React.createElement("em", null, "millions in assets"), " during transition.")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("span", {
    className: "ach-num"
  }, "iv."), /*#__PURE__*/React.createElement("span", null, "Built an enterprise-grade 50+ microservice platform from scratch as sole engineer in ", /*#__PURE__*/React.createElement("em", null, "six months.")))))));
}

// ─────────────────────────────────────────────────────────
// Projects
// ─────────────────────────────────────────────────────────
const PROJECTS = [{
  num: '04.i',
  name: 'Kash',
  role: 'COO & Interim CTO',
  period: '2025 –',
  body: 'COO and CTO from inception. Full ownership across product, technology, operations, finance and partnerships. Built the entire 50+ microservice platform as sole engineer in six months, then shipped the company around it.',
  pills: ['Operations', 'Product', 'Technology', 'Finance', 'Partnerships']
}, {
  num: '04.ii',
  name: 'Voi Network',
  role: 'Chief Ecosystem Officer',
  period: '2024 – 2025',
  body: 'Led vision and development of an L1 from concept to $150M ecosystem. Built and mentored teams across departments. Integrated 25+ projects into the ecosystem. 45K+ users with strong token retention.',
  pills: ['Ecosystem Growth', 'Team Leadership', 'Strategic Vision']
}, {
  num: '04.iii',
  name: 'Pound Token',
  role: 'Chief Technology Officer',
  period: '2023 – 2024',
  body: 'Led technical strategy through a successful acquisition. Executed zero-downtime migration reducing operating costs by 94%. Preserved millions in assets during the transition.',
  pills: ['Technical Strategy', 'Migration', 'Team Retention']
}, {
  num: '04.iv',
  name: 'Nettle',
  role: 'Chief Product & Technology Officer',
  period: '2022 – 2023',
  body: 'Led product and technology for an innovative fintech payments and loyalty platform. Architected a multi-currency payment system. Accelerated time-to-market through customer-driven development.',
  pills: ['Product Strategy', 'Payment Systems', 'Team Building']
}];
function Projects() {
  return /*#__PURE__*/React.createElement("section", {
    id: "projects",
    className: "projects-section",
    "data-screen-label": "04 Projects"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "num"
  }, "\xA7 04 \xB7 Featured projects"), /*#__PURE__*/React.createElement("h2", {
    className: "ttl"
  }, "Four ", /*#__PURE__*/React.createElement("em", null, "case studies."))), /*#__PURE__*/React.createElement("div", {
    className: "right"
  }, "pp. 32\u201348")), /*#__PURE__*/React.createElement("div", {
    className: "list-divided"
  }, PROJECTS.map((p, i) => /*#__PURE__*/React.createElement("article", {
    key: i,
    className: "project"
  }, /*#__PURE__*/React.createElement("div", {
    className: "project-meta"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kicker"
  }, "\xA7 ", p.num), /*#__PURE__*/React.createElement("div", {
    className: "meta"
  }, p.period)), /*#__PURE__*/React.createElement("div", {
    className: "project-body"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "subhead"
  }, p.name, /*#__PURE__*/React.createElement("span", {
    className: "project-role"
  }, " \xB7 ", p.role)), /*#__PURE__*/React.createElement("p", null, p.body), /*#__PURE__*/React.createElement("div", {
    className: "project-pills"
  }, p.pills.map((t, j) => /*#__PURE__*/React.createElement("span", {
    key: j,
    className: "pill"
  }, t)))))))));
}

// ─────────────────────────────────────────────────────────
// Services
// ─────────────────────────────────────────────────────────
function Services() {
  return /*#__PURE__*/React.createElement("section", {
    id: "services",
    className: "services-section",
    "data-screen-label": "05 Services"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "num"
  }, "\xA7 05 \xB7 Services"), /*#__PURE__*/React.createElement("h2", {
    className: "ttl"
  }, "For founders, ", /*#__PURE__*/React.createElement("em", null, "operators"), " & boards.")), /*#__PURE__*/React.createElement("div", {
    className: "right"
  }, "Available via DD Ventures")), /*#__PURE__*/React.createElement("div", {
    className: "services-grid"
  }, /*#__PURE__*/React.createElement("article", null, /*#__PURE__*/React.createElement("div", {
    className: "kicker"
  }, "\xA7 05.a"), /*#__PURE__*/React.createElement("h3", {
    className: "subhead"
  }, "Executive & ", /*#__PURE__*/React.createElement("em", null, "Operational"), /*#__PURE__*/React.createElement("br", null), "Advisory"), /*#__PURE__*/React.createElement("ul", {
    className: "bare-list"
  }, /*#__PURE__*/React.createElement("li", null, "Organisational design & scaling"), /*#__PURE__*/React.createElement("li", null, "Operational process architecture"), /*#__PURE__*/React.createElement("li", null, "Financial controls & governance"), /*#__PURE__*/React.createElement("li", null, "Executive leadership coaching"))), /*#__PURE__*/React.createElement("article", null, /*#__PURE__*/React.createElement("div", {
    className: "kicker"
  }, "\xA7 05.b"), /*#__PURE__*/React.createElement("h3", {
    className: "subhead"
  }, "Product & ", /*#__PURE__*/React.createElement("em", null, "Technology"), /*#__PURE__*/React.createElement("br", null), "Strategy"), /*#__PURE__*/React.createElement("ul", {
    className: "bare-list"
  }, /*#__PURE__*/React.createElement("li", null, "Product-market fit analysis"), /*#__PURE__*/React.createElement("li", null, "Technical architecture review"), /*#__PURE__*/React.createElement("li", null, "AI, blockchain & payments strategy"), /*#__PURE__*/React.createElement("li", null, "Scalability & infrastructure planning"))), /*#__PURE__*/React.createElement("article", null, /*#__PURE__*/React.createElement("div", {
    className: "kicker"
  }, "\xA7 05.c"), /*#__PURE__*/React.createElement("h3", {
    className: "subhead"
  }, "Growth & ", /*#__PURE__*/React.createElement("em", null, "Go-to-Market")), /*#__PURE__*/React.createElement("ul", {
    className: "bare-list"
  }, /*#__PURE__*/React.createElement("li", null, "Ecosystem & community growth"), /*#__PURE__*/React.createElement("li", null, "Partnership & BD strategy"), /*#__PURE__*/React.createElement("li", null, "Stakeholder & investor management"), /*#__PURE__*/React.createElement("li", null, "Team building & culture")))), /*#__PURE__*/React.createElement("div", {
    className: "dd-callout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kicker"
  }, "\xA7 05 \xB7 A note"), /*#__PURE__*/React.createElement("h3", {
    className: "subhead"
  }, "DD Ventures \u2014 ", /*#__PURE__*/React.createElement("em", null, "entrepreneurship"), " advisory"), /*#__PURE__*/React.createElement("p", null, "Specialised advisory leveraging deep entrepreneurship experience to help founders successfully launch, run and scale companies and products."), /*#__PURE__*/React.createElement("a", {
    className: "link-arrow",
    href: "https://dd.ventures",
    target: "_blank",
    rel: "noreferrer"
  }, "dd.ventures \u2192"))));
}

// ─────────────────────────────────────────────────────────
// Writing & Speaking
// ─────────────────────────────────────────────────────────
const ARTICLES = [{
  date: 'Dec 2024',
  title: 'Autonomous AI Agents: A Platform for Trustless Business Interactions',
  excerpt: 'How autonomous AI agents could revolutionise business interactions by creating trustless systems for commerce and collaboration.',
  url: 'https://bwhdx.medium.com/autonomous-ai-agents-a-platform-for-trustless-business-interactions-75bdfbc3cbfb'
}, {
  date: 'Dec 2024',
  title: 'The Holy Trinity: Blockchain, AI &amp; IoT',
  excerpt: 'Three powerful tools coming together in ways that make each of them more useful than they are alone.',
  url: 'https://bwhdx.medium.com/the-holy-trinity-the-natural-partnership-of-blockchain-ai-and-iot-730786253400'
}, {
  date: 'Nov 2024',
  title: 'The Democratic Myth of DAOs: The Road to Autocracy',
  excerpt: 'How DAOs, despite their promise of radical decentralisation, are not immune to an inadvertent slide toward autocracy.',
  url: 'https://bwhdx.medium.com/the-democratic-myth-of-daos-the-road-to-autocracy-52d03e4e1f8e'
}];
const SPEAKING = [{
  event: 'Zebu Live',
  topic: 'Tokenomics Design &amp; Strategy'
}, {
  event: 'Algorand at Tate Modern',
  topic: 'Tokenomics Design &amp; Strategy'
}];
function Writing() {
  return /*#__PURE__*/React.createElement("section", {
    id: "writing",
    className: "writing-section",
    "data-screen-label": "06 Writing"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "num"
  }, "\xA7 06 \xB7 Writing & speaking"), /*#__PURE__*/React.createElement("h2", {
    className: "ttl"
  }, "In ", /*#__PURE__*/React.createElement("em", null, "print"), " and at the lectern.")), /*#__PURE__*/React.createElement("div", {
    className: "right"
  }, "Latest, three of many")), /*#__PURE__*/React.createElement("div", {
    className: "writing-grid"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "kicker",
    style: {
      marginBottom: 24
    }
  }, "Recent articles"), /*#__PURE__*/React.createElement("div", {
    className: "list-divided"
  }, ARTICLES.map((a, i) => /*#__PURE__*/React.createElement("a", {
    key: i,
    className: "article-link",
    href: a.url,
    target: "_blank",
    rel: "noreferrer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "meta"
  }, a.date), /*#__PURE__*/React.createElement("h3", {
    className: "subhead",
    dangerouslySetInnerHTML: {
      __html: a.title
    }
  }), /*#__PURE__*/React.createElement("p", {
    dangerouslySetInnerHTML: {
      __html: a.excerpt
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "link-arrow"
  }, "Read on Medium \u2192")))), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement("a", {
    className: "link-arrow",
    href: "https://bwhdx.medium.com",
    target: "_blank",
    rel: "noreferrer"
  }, "All writing on Medium \u2192"))), /*#__PURE__*/React.createElement("aside", {
    className: "speaking"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kicker",
    style: {
      marginBottom: 24
    }
  }, "Conference speaking"), SPEAKING.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "speaking-item"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "subhead",
    style: {
      fontSize: '24px'
    }
  }, s.event), /*#__PURE__*/React.createElement("div", {
    className: "meta",
    dangerouslySetInnerHTML: {
      __html: s.topic
    }
  }))), /*#__PURE__*/React.createElement("hr", {
    className: "hairline",
    style: {
      margin: '40px 0'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "kicker",
    style: {
      marginBottom: 16
    }
  }, "Open to \u2014"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: '20px'
    }
  }, "Keynotes & panels on fintech, blockchain, AI, distributed systems and the operator's lens on technical leadership.")))));
}

// ─────────────────────────────────────────────────────────
// Contact
// ─────────────────────────────────────────────────────────
function Contact() {
  return /*#__PURE__*/React.createElement("section", {
    id: "contact",
    className: "contact-section",
    "data-screen-label": "08 Contact"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "num"
  }, "\xA7 08 \xB7 Get in touch"), /*#__PURE__*/React.createElement("h2", {
    className: "ttl"
  }, "Operations, ", /*#__PURE__*/React.createElement("em", null, "strategy,"), /*#__PURE__*/React.createElement("br", null), "architecture.")), /*#__PURE__*/React.createElement("div", {
    className: "right"
  }, "Available now")), /*#__PURE__*/React.createElement("div", {
    className: "contact-grid"
  }, /*#__PURE__*/React.createElement("p", {
    className: "lede",
    style: {
      maxWidth: 720
    }
  }, "For executive leadership, company operations or strategic advisory across fintech, blockchain and AI. Open to conversations with founders and operators building real things."), /*#__PURE__*/React.createElement("div", {
    className: "contact-links"
  }, /*#__PURE__*/React.createElement("a", {
    href: "mailto:me@benedictdixon.com"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kicker"
  }, "Email"), /*#__PURE__*/React.createElement("div", {
    className: "contact-value"
  }, "me@benedictdixon.com")), /*#__PURE__*/React.createElement("a", {
    href: "https://www.linkedin.com/in/benedict-dixon/",
    target: "_blank",
    rel: "noreferrer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kicker"
  }, "LinkedIn"), /*#__PURE__*/React.createElement("div", {
    className: "contact-value"
  }, "/in/benedict-dixon")), /*#__PURE__*/React.createElement("a", {
    href: "https://x.com/bwhdx",
    target: "_blank",
    rel: "noreferrer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kicker"
  }, "Twitter"), /*#__PURE__*/React.createElement("div", {
    className: "contact-value"
  }, "@bwhdx")), /*#__PURE__*/React.createElement("a", {
    href: "https://github.com/bwhdx",
    target: "_blank",
    rel: "noreferrer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kicker"
  }, "GitHub"), /*#__PURE__*/React.createElement("div", {
    className: "contact-value"
  }, "@bwhdx")), /*#__PURE__*/React.createElement("a", {
    href: "https://dd.ventures",
    target: "_blank",
    rel: "noreferrer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kicker"
  }, "Advisory"), /*#__PURE__*/React.createElement("div", {
    className: "contact-value"
  }, "dd.ventures"))))), /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("footer", {
    className: "colophon"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Colophon"), "Set in Fraunces, Inter & JetBrains Mono. Hero portrait rendered from a brightness sample of a photograph, redrawn in candlesticks. Royal navy on warm cream."), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Edition"), "Vol. I \xB7 MMXXVI", /*#__PURE__*/React.createElement("br", null), "An Almanack for Finance, Operations & Code"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "Words"), "Approx. 1,400.", /*#__PURE__*/React.createElement("br", null), "Reading time: ~6 minutes."), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, "\xA9 2026"), "Benedict W. H. Dixon.", /*#__PURE__*/React.createElement("br", null), "All rights observed."))));
}
Object.assign(window, {
  Runner,
  Hero,
  Ticker,
  About,
  Projects,
  Services,
  Writing,
  Contact
});