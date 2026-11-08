// Top-level composition of the portfolio page: the cover, the contents,
// five chapters and the colophon. The cover reports how many candles it
// drew, and the colophon prints that true figure. Once the book is in the
// DOM, the scroll motion is started over it (scroll-motion.js). The page
// is rendered to HTML at build (tools/prerender.cjs) and boot.jsx takes it
// over in the browser.

function App() {
  const [stats, setStats] = React.useState(null);
  React.useEffect(() => window.ScrollMotion.init(), []);
  return (
    <React.Fragment>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Runner />
      {/* The skip link moves focus to <main> itself (tabIndex -1), so the
          next Tab continues from the first chapter, not the head. */}
      <main id="main-content" tabIndex={-1}>
        <Hero onStats={setStats} />
        <Contents />
        <About />
        <Career />
        <Projects />
        <Writing />
        <Contact />
      </main>
      <Colophon candles={stats ? stats.candles : null} />
      <Insignia />
    </React.Fragment>
  );
}

window.App = App;
