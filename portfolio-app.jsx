// Top-level composition of the portfolio page.

function App() {
  return (
    <React.Fragment>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Runner />
      <main id="main-content">
        <Hero />
        <Ticker items={TICKER_TAGLINE} label="tagline ticker" />
        <About />
        <div id="morph"><MorphStage /></div>
        <Ticker items={TICKER_ESSAYS} label="essay ticker" />
        <Projects />
        <Writing />
        <Contact />
      </main>
      <CursorTrail />
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
