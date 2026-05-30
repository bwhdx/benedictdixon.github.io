// Shared <html>/<head>/<body> shell. Build-time only — never sent to the browser.
// SEO-conscious: every page must pass title, description, canonical, OG meta.

const React = require('react');

const SITE = {
  name: 'Mikaela Ikenouye',                      // TODO: lock once brand name decided
  tagline: 'Home cooking, written down.',         // placeholder until Mikaela confirms
  origin: 'https://example.com',                  // TODO: replace with real domain
  twitter: '',                                    // optional
  themeColor: '#fffaf2',                          // placeholder warm cream
  author: 'Mikaela Ikenouye',
};

function Layout({
  title,
  description,
  canonicalPath,        // e.g. "/recipes/foo/"
  ogImage = '/assets/og-image.png',
  ogType = 'website',
  jsonLd = null,        // optional schema.org JSON-LD object (will be serialised)
  extraHead = null,     // optional <Fragment> of additional head tags
  children,
}) {
  const fullTitle = title.includes(SITE.name) ? title : `${title} — ${SITE.name}`;
  const url = SITE.origin + canonicalPath;

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="format-detection" content="telephone=no" />

        <meta name="description" content={description} />
        <meta name="author" content={SITE.author} />
        <link rel="canonical" href={url} />
        <title>{fullTitle}</title>

        <link rel="icon" type="image/svg+xml" href="/favicons/favicon.svg" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content={SITE.themeColor} />

        {/* Open Graph */}
        <meta property="og:type" content={ogType} />
        <meta property="og:locale" content="en_US" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={SITE.origin + ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content={SITE.name} />

        {/* Twitter / X */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={SITE.origin + ogImage} />

        <link rel="stylesheet" href="/site.css" />
        <link rel="alternate" type="application/atom+xml" title={SITE.name} href={SITE.origin + '/feed.xml'} />

        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd, null, 2) }}
          />
        )}

        {extraHead}
      </head>
      <body>
        <a className="skip-link" href="#main">Skip to main content</a>
        <SiteHeader />
        <main id="main">
          {children}
        </main>
        <SiteFooter />
        <script defer src="/client.js"></script>
      </body>
    </html>
  );
}

function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a href="/" className="site-header__brand" aria-label={`${SITE.name} — home`}>
          <span className="site-header__brand-name">{SITE.name}</span>
        </a>
        <nav className="site-header__nav" aria-label="Primary">
          <a href="/recipes/">Recipes</a>
          <a href="/about/">About</a>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p>© {new Date().getFullYear()} {SITE.name}</p>
        <p>
          <a href="/feed.xml">RSS</a>
          <span aria-hidden="true"> · </span>
          <a href="/about/">About</a>
        </p>
      </div>
    </footer>
  );
}

module.exports = { Layout, SiteHeader, SiteFooter, SITE };
