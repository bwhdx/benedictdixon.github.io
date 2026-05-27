// Top-level composition of the portfolio page.

function App() {
  return (
    <React.Fragment>
      <Runner />
      <Hero />
      <Ticker />
      <About />
      <div id="morph"><MorphStage /></div>
      <Ticker />
      <Projects />
      <Services />
      <Writing />
      <Contact />
      <CursorTrail />
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
