// Starts the app in the browser. The build renders <App /> into #root
// (tools/prerender.cjs), so the cover and every chapter arrive with the
// HTML; React takes that markup over in place (hydrateRoot) rather than
// drawing the page again. Kept apart from the components so the prerender
// can load them without starting anything.

(function boot() {
  const root = document.getElementById('root');
  if (root.firstElementChild) ReactDOM.hydrateRoot(root, <App />);
  else ReactDOM.createRoot(root).render(<App />);
})();
