// Offline deployment gate: broken local references or malformed page metadata fail the build.
const fs = require('node:fs');
const path = require('node:path');
const publicFiles = require('./public-files');
const config = require('../site.config.json');
const ROOT = path.resolve(__dirname, '..');
const files = publicFiles();
const errors = [];
const pages = new Map();
const titles = new Map();
const descriptions = new Map();
let references = 0;
let schemas = 0;
let forms = 0;
const decode = value => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(m => [m[1].toLowerCase(), decode(m[2] ?? m[3])]));
const fail = (file, message) => errors.push(`${file}: ${message}`);
const canonical = file => config.url + (file === 'index.html' ? '/' : '/' + file);

for (const file of files) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const tags = [...html.matchAll(/<(?:a|link|img|script|source|form|input|select|textarea|meta|html)\b[^>]*>/gi)].map(m => ({tag: m[0].match(/^<(\w+)/)[1].toLowerCase(), raw: m[0], a: attrs(m[0])}));
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  const noindex = tags.some(t => t.tag === 'meta' && t.a.name === 'robots' && /noindex/.test(t.a.content));
  const title = [...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)];
  const description = tags.filter(t => t.tag === 'meta' && t.a.name === 'description');
  const canonicals = tags.filter(t => t.tag === 'link' && t.a.rel === 'canonical');
  if (title.length !== 1 || !title[0][1].trim()) fail(file, 'expected one nonempty title');
  if ((html.match(/<h1\b/gi) || []).length !== 1) fail(file, 'expected one H1');
  if (ids.length !== new Set(ids).size) fail(file, 'duplicate element id');
  if (!noindex) {
    if (description.length !== 1 || !description[0].a.content) fail(file, 'expected one meta description');
    if (canonicals.length !== 1 || canonicals[0].a.href !== canonical(file)) fail(file, 'wrong canonical URL');
    for (const [value, map, label] of [[title[0]?.[1], titles, 'title'], [description[0]?.a.content, descriptions, 'description']]) {
      if (map.has(value)) fail(file, `duplicate ${label} with ${map.get(value)}`);
      else map.set(value, file);
    }
  }
  if (!tags.some(t => t.tag === 'html' && t.a.lang)) fail(file, 'missing document language');
  for (const image of tags.filter(t => t.tag === 'img')) {
    if (!('alt' in image.a) || !image.a.width || !image.a.height) fail(file, `missing image alt/dimensions: ${image.a.src}`);
  }
  for (const m of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); schemas++; } catch (_) { fail(file, 'invalid JSON-LD'); }
  }
  for (const m of html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)) {
    forms++;
    const opening = m[0].match(/^<form\b[^>]*>/)[0];
    const a = attrs(opening);
    if (a.name !== 'contact' || a.method?.toLowerCase() !== 'post' || a.action !== '/thank-you.html' || a['data-netlify'] !== 'true' || !/\bdata-lead-form\b/.test(opening)) fail(file, 'unexpected lead form configuration');
    for (const name of ['form-name','source-page','bot-field','name','phone','email','service','message','property-location']) {
      if ((m[0].match(new RegExp(`\\bname="${name}"`, 'g')) || []).length !== 1) fail(file, `missing/duplicate form field: ${name}`);
    }
    if (!/class="[^"]*\bform-status\b[^"]*"/.test(m[0])) fail(file, 'missing form submission status');
  }
  pages.set(file, {html, tags, ids: new Set(ids), noindex});
}

const redirects = new Map();
for (const line of fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8').split(/\r?\n/)) {
  const parts = line.trim().split(/\s+/);
  if (parts[0].startsWith('/') && parts.length >= 3) redirects.set(parts[0], parts[1]);
}
function checkReference(file, ref) {
  if (!ref || ref === '#') return fail(file, 'empty link or asset reference');
  const url = new URL(ref, canonical(file));
  if (url.origin !== config.url && url.origin !== config.url.replace('https://', 'https://www.')) return;
  references++;
  let pathname = url.pathname;
  const seen = new Set();
  while (redirects.has(pathname)) {
    if (seen.has(pathname)) return fail(file, `redirect loop: ${ref}`);
    seen.add(pathname);
    pathname = new URL(redirects.get(pathname), config.url).pathname;
  }
  let relative = decodeURIComponent(pathname).replace(/^\//, '') || 'index.html';
  if (relative.endsWith('/')) relative += 'index.html';
  const target = path.resolve(ROOT, relative);
  if (!target.startsWith(ROOT + path.sep) || !fs.existsSync(target) || !fs.statSync(target).isFile()) return fail(file, `missing local target: ${ref}`);
  if (url.hash && pages.has(relative) && !pages.get(relative).ids.has(decodeURIComponent(url.hash.slice(1)))) fail(file, `missing fragment: ${ref}`);
}
for (const [file, page] of pages) {
  for (const {a} of page.tags) {
    for (const key of ['href', 'src', 'action', 'poster']) if (key in a) checkReference(file, a[key]);
    if (a.srcset) for (const source of a.srcset.split(',')) checkReference(file, source.trim().split(/\s+/)[0]);
  }
}
// Every published city must be reachable from the directory and offer the current service pages.
const cityFiles = files.filter(file => /^locations\/[^/]+-(sc|nc|ga|tn)\.html$/.test(file));
const serviceFiles = files.filter(file => /^services\/[^/]+\.html$/.test(file));
const directoryLinks = new Set(pages.get('service-areas.html').tags.filter(t => t.tag === 'a').map(t => t.a.href));
const badge = pages.get('index.html').html.match(/<div class="hero-badge">([\s\S]*?)<\/div>/)?.[1] || '';
const stateNames = {sc: 'South Carolina', nc: 'North Carolina', ga: 'Georgia', tn: 'Tennessee'};
for (const city of cityFiles) {
  if (!directoryLinks.has('/' + city)) fail(city, 'missing from service-area directory');
  const state = city.match(/-([a-z]{2})\.html$/)[1];
  if (!new RegExp(`\\b${state.toUpperCase()}\\b`).test(badge) && !badge.includes(stateNames[state])) fail('index.html', `coverage badge omits ${state.toUpperCase()}`);
  const cityLinks = new Set(pages.get(city).tags.filter(t => t.tag === 'a').map(t => t.a.href));
  for (const service of serviceFiles) {
    const target = city.replace(/\.html$/, '') + '/' + path.basename(service);
    if (!pages.has(target) || !cityLinks.has('/' + target)) fail(city, `missing linked service page: ${target}`);
  }
}
for (const m of fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8').matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)) checkReference('index.html', m[1]);
const sitemap = [...fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map(m => decode(m[1]));
const indexable = new Set([...pages].filter(([,p]) => !p.noindex).map(([file]) => canonical(file)));
if (sitemap.length !== new Set(sitemap).size) fail('sitemap.xml', 'duplicate URL');
for (const url of sitemap) if (!indexable.has(url)) fail('sitemap.xml', `unexpected URL: ${url}`);
for (const url of indexable) if (!sitemap.includes(url)) fail('sitemap.xml', `missing URL: ${url}`);
if (errors.length) throw new Error(`Site QA failed (${errors.length}):\n${errors.slice(0, 30).join('\n')}`);
console.log(`Site QA passed: ${files.length} pages, ${references} local references, ${forms} forms, ${schemas} JSON-LD blocks, ${sitemap.length} sitemap URLs.`);
