// Render the home page to HTML at build, so the cover, the contents and
// every chapter arrive with the first response: no blank or fallback page
// before the script runs, and crawlers and readers without JavaScript get
// the real page. In the browser, boot.jsx takes this markup over with
// hydrateRoot; only the portrait's canvas and the motion need the script.
//
// The components are the same compiled files bundle.js carries, run here
// with React's server renderer (the same React version as vendor/) and the
// same window.SITE. Effects never run on the server, so nothing measures
// the screen or starts motion here. The output replaces everything between
// the prerender markers in index.html. Run by `npm run build`, after
// tools/bundle.cjs.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const React = require('react');
const { renderToString } = require('react-dom/server');
const { APP } = require('./bundle.cjs');
const { siteGlobals } = require('./site-globals.cjs');

const ROOT = path.join(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
const START = '<!-- prerender:start -->';
const END = '<!-- prerender:end -->';

// The vendor copy and the server renderer must be the same React, or the
// markup and the app that takes it over could disagree.
const vendor = fs.readdirSync(path.join(ROOT, 'vendor')).find((f) => /^react@[\d.]+\.min\.js$/.test(f));
if (!vendor || vendor !== `react@${React.version}.min.js`) {
  throw new Error(`vendor/${vendor} does not match the build's React ${React.version}`);
}

function render() {
  const window = { SITE: siteGlobals(), React };
  window.window = window;
  const context = vm.createContext(window);
  // Only the components: scroll-motion.js touches the document as it loads
  // and boot.js starts the app, and neither belongs on the server.
  for (const file of APP.filter((f) => f !== 'scroll-motion.js')) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
  }
  return renderToString(React.createElement(window.App));
}

function main() {
  const html = fs.readFileSync(INDEX, 'utf8');
  const a = html.indexOf(START);
  const b = html.indexOf(END);
  if (a < 0 || b < a) throw new Error(`index.html has no ${START} … ${END} block`);
  const markup = `${START}\n  <div id="root">${render()}</div>\n  ${END}`;
  fs.writeFileSync(INDEX, html.slice(0, a) + markup + html.slice(b + END.length));
  console.log(`Prerendered index.html (${(markup.length / 1024).toFixed(1)} KB of markup)`);
}

main();
