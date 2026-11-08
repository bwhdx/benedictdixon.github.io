// The headless browser the build tools render with (share cards, the
// prerender check): CHROMIUM_PATH if set, else the newest Playwright
// Chromium headless shell in the Playwright cache. Install one with
// `npx playwright-core install chromium-headless-shell`.
//
// launch() starts it and stops it again if the process is interrupted, so
// a cancelled build never leaves a browser running.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright-core');

function cacheDir() {
  if (process.env.PLAYWRIGHT_BROWSERS_PATH) return process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (process.platform === 'darwin') return path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright');
  if (process.platform === 'win32') return path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  return path.join(os.homedir(), '.cache', 'ms-playwright');
}

function executablePath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const dir = cacheDir();
  const shells = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((d) => /^chromium_headless_shell-\d+$/.test(d))
      .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))
    : [];
  for (const d of shells) {
    for (const sub of fs.readdirSync(path.join(dir, d))) {
      const bin = path.join(dir, d, sub, process.platform === 'win32' ? 'chrome-headless-shell.exe' : 'chrome-headless-shell');
      if (fs.existsSync(bin)) return bin;
    }
  }
  throw new Error(`No Playwright Chromium headless shell in ${dir}. Install one with `
    + '`npx playwright-core install chromium-headless-shell`, or set CHROMIUM_PATH.');
}

async function launch() {
  const browser = await chromium.launch({ executablePath: executablePath() });
  const stop = () => { browser.close().catch(() => {}).finally(() => process.exit(130)); };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  return browser;
}

module.exports = { executablePath, launch };
