const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const config = require('../site.config.json');
const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const write = (file, text) => fs.writeFileSync(path.join(ROOT, file), text);
const services = ['Air Quality Testing', 'Asbestos Testing', 'Mold Testing', 'Commercial / Industrial Testing', 'Lead Testing', 'Radon Testing', 'Other / Not Sure'];
const serviceSlugs = {'indoor-air-quality-testing': services[0], 'asbestos-testing': services[1], 'mold-testing': services[2], 'commercial-industrial-testing': services[3], 'lead-testing': services[4], 'radon-testing': services[5]};
const publicFiles = require('./public-files');
const states = {sc: 'South Carolina', nc: 'North Carolina', ga: 'Georgia', tn: 'Tennessee'};
const locations = fs.readdirSync(path.join(ROOT, 'locations')).filter(f => f.endsWith('.html')).map(file => {
  const html = read(`locations/${file}`);
  const heading = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)[1].replace(/<[^>]*>/g, '');
  const city = heading.replace(/^.*?Testing in /, '').replace(/, (SC|NC|GA|TN)$/, '');
  return {file, city, state: file.match(/-(sc|nc|ga|tn)\.html$/)[1]};
}).sort((a, b) => a.city.localeCompare(b.city));

function contentPage(title, description, file, body, extraSchema = null) {
  let html = read('contact.html');
  html = html.replace(/<title>.*?<\/title>/s, `<title>${esc(title)} | A1 AQC</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(description)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${config.url}/${file}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(title)} | A1 AQC">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(description)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${config.url}/${file}">`)
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')
    .replace(/<main\b[^>]*>[\s\S]*?<\/main>/, `<main id="main-content" tabindex="-1">\n<section class="page-hero"><div class="container"><div class="breadcrumb"><a href="/">Home</a><span>/</span><span class="current">${esc(title)}</span></div><h1>${esc(title)}</h1><p>${esc(description)}</p></div></section>\n${body}\n</main>`);
  const schemas = [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: config.url + '/' }, { '@type': 'ListItem', position: 2, name: title, item: `${config.url}/${file}` }] }];
  if (extraSchema) schemas.push(extraSchema);
  return html.replace('</head>', schemas.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n') + '\n</head>');
}

const areaBody = `<section class="content-section section-pad"><div class="container">
<div class="reading-width"><h2>Find testing in your area</h2><p>A1 provides independent <a href="/services/asbestos-testing.html">asbestos testing</a>, <a href="/services/mold-testing.html">mold testing</a>, and <a href="/services/indoor-air-quality-testing.html">indoor air quality testing</a> for homes and businesses in the South Carolina, North Carolina, Georgia, and Tennessee communities listed below. Our team travels to the property. A city listing describes a service area, not a separate office.</p><p>Choose your city for local information, or call <a href="tel:+18646192092">(864) 619-2092</a> to confirm availability, travel arrangements, and the right testing scope for your property.</p></div>
<nav class="state-jump-links" aria-label="Choose a state">${Object.entries(states).map(([s, n]) => `<a class="btn btn-outline-dark" href="#${s}">${n}</a>`).join('')}</nav>
${Object.entries(states).map(([s, n]) => `<section class="area-state" id="${s}" aria-labelledby="${s}-heading"><h2 id="${s}-heading">${n} testing service areas</h2><ul class="city-directory">${locations.filter(l => l.state === s).map(l => `<li><a href="/locations/${l.file}">${esc(l.city)}, ${s.toUpperCase()}</a></li>`).join('')}</ul></section>`).join('\n')}
<div class="service-callout"><h2>Tell us what you need to learn</h2><p>For a useful quote, share your city or ZIP code, property type, the issue you are investigating, and any renovation or closing deadline. Testing scope and laboratory turnaround depend on the samples and analysis needed.</p><a class="btn btn-primary" href="/contact.html">Request a testing consultation</a></div>
</div></section>`;
write('service-areas.html', contentPage('Asbestos, Mold & Air Quality Testing Service Areas', 'Find independent environmental testing in South Carolina, North Carolina, Georgia, and Tennessee. Choose your city and request a consultation.', 'service-areas.html', areaBody, { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'A1 testing service areas', url: config.url + '/service-areas.html', mainEntity: { '@type': 'ItemList', itemListElement: locations.map((l, i) => ({ '@type': 'ListItem', position: i + 1, name: `${l.city}, ${l.state.toUpperCase()}`, url: `${config.url}/locations/${l.file}` })) } }));

const reportBody = `<section class="content-section section-pad"><div class="container reading-width">
<h2>Start with the question the inspection was designed to answer</h2><p>A testing report documents the property areas inspected, the samples collected, and the findings within the agreed scope. It is not a test for every possible contaminant or a medical diagnosis. Ask which questions the proposed inspection can answer before approving the work.</p>
<h2>What to look for in your report</h2><ol class="report-checklist"><li><strong>Property and inspection details.</strong> The date, inspected areas, relevant history, and conditions observed during the visit.</li><li><strong>Sample locations and identifiers.</strong> Each sample should be traceable to a documented location and to its laboratory result.</li><li><strong>Methods and results.</strong> The analysis method, units, reporting limits where applicable, and laboratory documentation for the work performed.</li><li><strong>Observations and limitations.</strong> Moisture readings, photographs where relevant, and areas or materials that were outside the inspection scope.</li><li><strong>Interpretation and next steps.</strong> A written explanation connecting the findings to the original concern, including whether further investigation or a specialist is appropriate.</li></ol>
<h2>Material testing and air testing answer different questions</h2><p>An <a href="/services/asbestos-testing.html">asbestos material sample</a> investigates a particular building material. Air monitoring evaluates airborne fibres under the conditions and method used. A negative air sample does not establish that every building material is asbestos-free.</p><p><a href="/services/mold-testing.html">Mold investigations</a> combine observations, moisture conditions, and sampling when it will help answer a defined question. An air sample is a snapshot; it does not by itself establish whether a building is safe for every person. EPA notes that there are no federal limits for mold or mold spores. <a href="https://www.epa.gov/mold/samplingtesting-mold-necessary" target="_blank" rel="noopener">Read EPA's explanation of mold sampling</a>.</p>
<h2>Preparing for your consultation</h2><p>Bring the property city or ZIP code, approximate building age, any known leaks or prior work, the rooms or materials of concern, and your project deadline. If a contractor, insurer, school, or permitting authority needs specific documentation, share those requirements before samples are taken.</p>
<h2>Independent testing and clear follow-up</h2><p>A1 provides testing and consultation and does not sell remediation or removal services. We can discuss the report and the limits of the testing performed. Medical questions belong with your healthcare professional, and project-specific regulatory requirements should be confirmed with the appropriate authority.</p><div class="service-callout"><h2>Discuss the report you need</h2><p>Ask us which inspection and documentation fit your property and project.</p><a class="btn btn-primary" href="/contact.html">Request a consultation</a> <a href="/service-areas.html">Find your service area</a></div>
</div></section>`;
write('understanding-your-testing-report.html', contentPage('Understanding Your Environmental Testing Report', 'Learn what to look for in asbestos, mold, and indoor air quality reports, what results can tell you, and what to ask before scheduling.', 'understanding-your-testing-report.html', reportBody));

function quickForm(service, source) {
  return `<form id="quick-quote-form" name="contact" data-form-category="quick-quote" method="POST" data-netlify="true" netlify-honeypot="bot-field" data-lead-form action="/thank-you.html">
<input type="hidden" name="form-name" value="contact"><input type="hidden" name="source-page" value="${esc(source)}"><p hidden><label>Leave this field empty <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
<div class="form-group"><label for="quote-name">Full name *</label><input id="quote-name" type="text" name="name" autocomplete="name" required></div>
<div class="form-group"><label for="quote-phone">Phone</label><input id="quote-phone" type="tel" name="phone" autocomplete="tel"></div>
<div class="form-group"><label for="quote-email">Email *</label><input id="quote-email" type="email" name="email" autocomplete="email" required></div>
<div class="form-group"><label for="quote-location">Property city or ZIP code</label><input id="quote-location" type="text" name="property-location" autocomplete="off" maxlength="120"></div>
<div class="form-group"><label for="quote-service">Service needed</label><select id="quote-service" name="service">${services.map(s => `<option${s === service ? ' selected' : ''}>${esc(s)}</option>`).join('')}</select></div>
<div class="form-group"><label for="quote-message">What would you like tested?</label><textarea id="quote-message" name="message" rows="3" maxlength="3000"></textarea></div>
<button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">Request a quote</button><p class="form-status" role="status" aria-live="polite" tabindex="-1"></p><p class="form-privacy">We use these details to respond to your inquiry. <a href="/privacy-policy.html">Privacy policy</a>.</p></form>`;
}

for (const file of publicFiles()) {
  let html = read(file);
  const source = file === 'index.html' ? '/' : '/' + file;
  // Regenerate shared enhancements after CMS builds without duplicating them.
  html = html.replace(/<nav class="main-nav"[\s\S]*?<\/nav>/, nav => nav.includes('href="/service-areas.html"') ? nav : nav.replace('<a href="/about.html">', '<a href="/service-areas.html">Service Areas</a><a href="/about.html">'));
  html = html.replace(/href="\/(?:#areas|#service-areas)"/g, 'href="/service-areas.html"').replace(/https:\/\/a1airqualityconsultants\.com\/#service-areas/g, config.url + '/service-areas.html');
  html = html.replace(/<div class="footer-legal">/, '<div class="footer-legal">');
  if (!html.includes('data-footer-directory')) html = html.replace('<div class="footer-legal">', '<div class="footer-legal"><a data-footer-directory href="/service-areas.html">Service Areas</a><a href="/understanding-your-testing-report.html">Testing Reports</a>');
  html = html.replace(/<form(?: id="quick-quote-form"[^>]*)?>([\s\S]*?)<\/form>/g, () => quickForm(serviceSlugs[path.basename(file, '.html')] || 'Other / Not Sure', source));
  if (/^locations\/[^/]+\/(asbestos|mold)-testing\.html$/.test(file)) {
    const city = html.match(/<h1[^>]*>[^<]*Testing in ([^<]*)<\/h1>/)[1];
    html = html.replace(/(<input id="quote-location"[^>]*)(>)/, `$1 value="${esc(city)}"$2`);
  }
  html = html.replace(/(48(?:\s+to\s+|[–-])72)\s+hours/g, '$1 business hours');
  html = html.replace(/(<div class="footer-brand">[\s\S]*?<p>)[\s\S]*?(<\/p>)/, '$1Independent environmental testing and consultation. Service areas in SC, NC, GA, and TN. See our directory for locations and scheduling.$2');
  if (file === 'index.html' || file === 'contact.html') {
    const name = file === 'index.html' ? 'homepage-inquiry' : 'contact';
    // Keep the established Netlify form and its email/Zapier delivery. The
    // analytics category distinguishes placements without changing integrations.
    html = html.replace(/<form\b[^>]*>/, tag => tag.replace(/\s(?:name|method|data-netlify|netlify-honeypot|action|data-form-category)="[^"]*"/g, '').replace(/\sdata-lead-form\b/g, '').replace(/>$/, ` name="contact" data-form-category="${name}" method="POST" data-netlify="true" netlify-honeypot="bot-field" data-lead-form action="/thank-you.html">`));
    html = html.replace(/<form\b[^>]*>[\s\S]*?<\/form>/, form => {
      form = form.replace(/<input[^>]*name="form-name"[^>]*>/g, '');
      form = form.replace(/(<form\b[^>]*>)/, '$1<input type="hidden" name="form-name" value="contact">');
      if (!form.includes('name="bot-field"')) form = form.replace(/(<form\b[^>]*>)/, '$1<p hidden><label>Leave this field empty <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>');
      if (!form.includes('name="source-page"')) form = form.replace(/(<form\b[^>]*>)/, `$1<input type="hidden" name="source-page" value="${source}">`);
      if (!form.includes('name="property-location"')) form = form.replace(/(<button type="submit"|<div class="form-group full"><button type="submit")/, `<div class="form-group"><label for="${name}-location">Property city or ZIP code</label><input id="${name}-location" name="property-location" type="text" maxlength="120" autocomplete="off"></div>$1`);
      form = form.replace(/<p class="form-(?:status|privacy)[^"]*"[^>]*>[\s\S]*?<\/p>/g, '');
      form = form.replace('</form>', '<p class="form-status full" role="status" aria-live="polite" tabindex="-1"></p><p class="form-privacy full">We use your details to respond to your inquiry. <a href="/privacy-policy.html">Privacy policy</a>.</p></form>');
      return form;
    });
  }
  if (!html.includes('src="/js/forms.js"')) html = html.replace('</body>', '<script src="/js/forms.js" defer></script>\n</body>');
  html = html.replace(/<script[^>]*src="\/js\/analytics\.js"[^>]*><\/script>\s*/g, '');
  if (/^G-[A-Z0-9]+$/.test(config.analyticsMeasurementId)) html = html.replace('</body>', `<script src="/js/analytics.js" data-measurement-id="${config.analyticsMeasurementId}" defer></script>\n</body>`);
  write(file, html);
}

const files = publicFiles();
const oldSitemap = read('sitemap.xml');
const lastmods = new Map([...oldSitemap.matchAll(/<url>\s*<loc>(.*?)<\/loc>([\s\S]*?)<\/url>/g)].map(m => [m[1], m[2].match(/<lastmod>(.*?)<\/lastmod>/)?.[1]]));
const updated = new Set(['index.html', 'about.html', 'contact.html', 'privacy-policy.html', 'resources.html', 'service-areas.html', 'understanding-your-testing-report.html', 'services/asbestos-testing.html', 'services/mold-testing.html', 'services/indoor-air-quality-testing.html', 'blog/do-i-need-asbestos-testing-before-renovation.html', 'blog/how-much-does-air-quality-testing-cost.html', 'blog/diy-vs-professional-air-quality-testing.html', ...files.filter(file => file.startsWith('locations/'))]);
const entries = files.filter(f => !/<meta name="robots" content="[^"]*noindex/.test(read(f))).map(f => {
  const url = config.url + (f === 'index.html' ? '/' : '/' + f);
  const date = updated.has(f) ? config.contentUpdated : lastmods.get(url);
  return `  <url><loc>${url}</loc>${date ? `<lastmod>${date}</lastmod>` : ''}</url>`;
});
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`);

const legacy = [['/blogs', '/resources.html'], ['/get-started-1', '/contact.html'], ['/anderson%2Fgreenville', '/locations/greenville-sc.html'], ['/blogs/f/when-should-radon-testing-be-performed', '/blog/do-i-need-radon-testing-before-buying-a-home.html'], ['/index.html', '/']];
const aliases = files.filter(f => f !== 'index.html').flatMap(f => [[`/${f.slice(0, -5)}`, `/${f}`], [`/${f.slice(0, -5)}/`, `/${f}`]]);
write('_redirects', '# Generated by scripts/build-site.js. Preserve established .html canonical URLs.\n' + [...legacy, ...aliases].map(([from, to]) => `${from} ${to} 301!`).join('\n') + '\n');
console.log(`Site enhancements built: ${locations.length} linked service areas, ${entries.length} sitemap entries, ${legacy.length + aliases.length} redirect rules.`);
