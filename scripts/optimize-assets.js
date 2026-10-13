const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');
const BeastiesModule = require('beasties');
const Beasties = BeastiesModule.default || BeastiesModule;

const ROOT = path.join(__dirname, '..');
const START = '<!-- A1 critical CSS: generated from css/style.css -->';
const END = '<!-- /A1 critical CSS -->';
const GENERATED = /<!-- A1 critical CSS: generated from css\/style\.css -->[\s\S]*?<!-- \/A1 critical CSS -->/g;
const STYLESHEET = /<link\b(?=[^>]*\brel="stylesheet")(?=[^>]*\bhref="\/?css\/style\.css")[^>]*>/g;
const MAIN_SCRIPT = /<script\b[^>]*\bsrc="\/?js\/main\.js"[^>]*><\/script>/g;
const stylesheetLink = '<link rel="stylesheet" href="/css/style.css">';

// Font families are referenced through CSS variables. Extract their declarations
// explicitly because selector-based extraction cannot resolve those variables.
const fonts = [];
postcss.parse(fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8'))
  .walkAtRules('font-face', rule => fonts.push(rule.toString()));

const optimizer = new Beasties({
  path: ROOT,
  publicPath: '/',
  preload: 'media',
  fonts: false,
  pruneSource: false,
  logLevel: 'warn',
  // Keep states and elements created by main.js and analytics.js, even before
  // the shared stylesheet finishes loading. Preserve responsive rules too.
  allowRules: [/\.open\b/, /\.analytics-choice/, /\.privacy-preferences/, /\.btn\b/, /^strong\b/]
});

async function main() {
  const files = [
    ...fs.readdirSync(ROOT).filter(file => file.endsWith('.html')),
    ...['services', 'locations', 'blog'].flatMap(dir =>
      fs.readdirSync(path.join(ROOT, dir)).filter(file => file.endsWith('.html'))
        .map(file => `${dir}/${file}`))
  ];

  for (const file of files) {
    const filename = path.join(ROOT, file);
    // Regenerate from the source stylesheet, including when a generated page
    // has been copied from another page by build-site.js. This is idempotent.
    let html = fs.readFileSync(filename, 'utf8').replace(GENERATED, stylesheetLink);
    if ((html.match(STYLESHEET) || []).length !== 1 || (html.match(MAIN_SCRIPT) || []).length !== 1) {
      throw new Error(`Expected one shared stylesheet and main script in ${file}`);
    }

    const extractionInput = html.replace(/<head\b[^>]*>[\s\S]*?<\/head>/i, `<head>${stylesheetLink}</head>`);
    const optimized = await optimizer.process(extractionInput);
    const critical = optimized.match(/<head\b[^>]*>[\s\S]*?<style\b[^>]*>([\s\S]*?)<\/style>/i)?.[1];
    if (!critical) throw new Error(`No critical styles extracted for ${file}`);

    // Keep the original HTML, forms, metadata and structured data intact; only
    // insert extracted CSS and defer the main script. The source CSS stays
    // complete and cacheable. With JavaScript disabled, noscript loads it normally.
    const loadingMarkup = [
      START,
      `<style data-critical-css>${fonts.join('')}\n${critical}</style>`,
      '<link rel="stylesheet" href="/css/style.css" media="print" onload="this.media=\'all\';this.onload=null">',
      `<noscript>${stylesheetLink}</noscript>`,
      END
    ].join('\n');
    html = html.replace(STYLESHEET, () => loadingMarkup)
      .replace(MAIN_SCRIPT, '<script src="/js/main.js" defer></script>');
    fs.writeFileSync(filename, html);
  }
  console.log(`Optimized CSS delivery and deferred main.js on ${files.length} public pages.`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
