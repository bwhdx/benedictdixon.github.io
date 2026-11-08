// window.SITE: the slice of tools/site-data.cjs the home page needs, written
// into bundle.js and given to the prerender, so the HTML and the app that
// takes it over start from exactly the same facts.

const { COVER_LINE, CHAPTERS, ELSEWHERE, essays, privacyNote, printed } = require('./site-data.cjs');

function siteGlobals() {
  const byPath = {};
  for (const e of essays()) {
    byPath[e.path] = {
      date: printed(e.datePublished).short,
      minutes: e.minutes,
      // The cover's base path; tools/build-covers.sh writes its sizes and formats.
      cover: e.cover ? `/${e.cover.replace(/\.jpg$/, '')}` : null,
    };
  }
  // Month precision: the ledger's current roles are measured in months, and
  // a daily date would change the built page every day.
  const builtAt = new Date().toISOString().slice(0, 7);
  return { coverLine: COVER_LINE, privacyNote: privacyNote(), builtAt, chapters: CHAPTERS, elsewhere: ELSEWHERE, essays: byPath };
}

module.exports = { siteGlobals };
