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
<div class="reading-width"><h2>Find testing in your area</h2><p>Choose from ${locations.length} listed communities across South Carolina, North Carolina, Georgia, and Tennessee. Each city page connects you with local information for asbestos, mold, indoor air quality, lead, radon, and commercial testing.</p><p>A1 travels to homes, rental properties, and business sites. A city listing describes a service area, not a separate office. Call <a href="tel:+18646192092">(864) 619-2092</a> to confirm availability, travel arrangements, and the testing scope for your property.</p><p>Start with your state below, or <a href="#choose-testing">compare the testing services</a> if you are unsure which one fits your concern.</p></div>
<nav class="state-jump-links" aria-label="Choose a state">${Object.entries(states).map(([s, n]) => `<a class="btn btn-outline-dark" href="#${s}">${n}</a>`).join('')}</nav>
${Object.entries(states).map(([s, n]) => `<section class="area-state" id="${s}" aria-labelledby="${s}-heading"><h2 id="${s}-heading">${n} testing service areas</h2><p>${locations.filter(l => l.state === s).length} listed communities. Select your city for testing options and a local inquiry.</p><ul class="city-directory">${locations.filter(l => l.state === s).map(l => `<li><a href="/locations/${l.file}">${esc(l.city)}, ${s.toUpperCase()}</a></li>`).join('')}</ul></section>`).join('\n')}
<section class="area-state" id="choose-testing" aria-labelledby="choose-testing-heading"><h2 id="choose-testing-heading">Choose testing for your property concern</h2><p>You can start with the service itself if you already know what you need. A1 confirms the scope before booking.</p><div class="services-grid">
<article class="service-card"><h3><a href="/services/asbestos-testing.html">Asbestos testing and inspection</a></h3><p>Planning flooring, ceiling, or other material work? Discuss inspection and sampling of suspect materials before they are disturbed. Air monitoring for abatement work requires a separate project scope.</p><a class="card-link" href="/services/asbestos-testing.html">Explore asbestos testing</a></article>
<article class="service-card"><h3><a href="/services/mold-testing.html">Mold testing and inspection</a></h3><p>Investigate a musty odor, leak history, or conditions after cleanup. A1 combines inspection observations with targeted sampling when it will answer a useful question.</p><a class="card-link" href="/services/mold-testing.html">Explore mold testing</a></article>
<article class="service-card"><h3><a href="/services/indoor-air-quality-testing.html">Indoor air quality testing</a></h3><p>Discuss a recurring odor or indoor-air concern at home or work. The investigation and selected measurements depend on the rooms, conditions, and question involved.</p><a class="card-link" href="/services/indoor-air-quality-testing.html">Explore air quality testing</a></article>
<article class="service-card"><h3><a href="/services/lead-testing.html">Lead testing</a></h3><p>Ask about testing a painted component, settled dust, or a water outlet. These involve different samples; describe the concern so the appropriate service can be confirmed.</p><a class="card-link" href="/services/lead-testing.html">Explore lead testing</a></article>
<article class="service-card"><h3><a href="/services/radon-testing.html">Radon testing</a></h3><p>Arrange a measurement for a home or business property, with an agreed testing period and conditions. Allow time for placement, monitoring, completion, and reporting.</p><a class="card-link" href="/services/radon-testing.html">Explore radon testing</a></article>
<article class="service-card"><h3><a href="/services/commercial-industrial-testing.html">Commercial and industrial testing</a></h3><p>Coordinate testing for offices, rental properties, or renovation projects. Discuss occupied areas, access, operating hours, and any required documentation before scheduling.</p><a class="card-link" href="/services/commercial-industrial-testing.html">Explore commercial testing</a></article>
</div></section>
<div class="reading-width"><h2>Nearby community not listed?</h2><p>Contact A1 with the exact city or ZIP code and the service needed. We can confirm whether the property can be scheduled and discuss any travel arrangements. A nearby city page does not automatically establish availability for every surrounding address.</p><h2>Plan the visit and reporting time</h2><p>Tell us the property type, affected rooms or materials, and any renovation or closing deadline. Identify who will arrange access, especially for a rental or business property. Confirm the complete testing and reporting schedule for the selected service before relying on a deadline. Radon testing also requires its agreed monitoring period.</p></div>
<div class="service-callout"><h2>Request testing at your property</h2><p>You do not need to choose a sampling package before calling. Share the concern and location so A1 can discuss an appropriate scope, availability, and quote. We provide independent testing and consultation, separate from removal or remediation.</p><a class="btn btn-primary" href="/contact.html">Request a testing consultation</a><a href="tel:+18646192092">Call (864) 619-2092</a></div>
</div></section>`;
write('service-areas.html', contentPage('Asbestos, Mold & Air Quality Testing Service Areas', 'Find independent environmental testing in South Carolina, North Carolina, Georgia, and Tennessee. Choose your city and request a consultation.', 'service-areas.html', areaBody, { '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'A1 testing service areas', url: config.url + '/service-areas.html', mainEntity: { '@type': 'ItemList', itemListElement: locations.map((l, i) => ({ '@type': 'ListItem', position: i + 1, name: `${l.city}, ${l.state.toUpperCase()}`, url: `${config.url}/locations/${l.file}` })) } }));

// Keep the AI-readable directory aligned with the same published city inventory.
let llms = read('llms.txt');
llms = llms.replace(/All \d+ city pages grouped by state\./, `All ${locations.length} city pages grouped by state.`)
  .replace(/## Service Areas\s+[\s\S]*?(?=## Location Pages)/, '## Service Areas\nA1 serves the listed communities in South Carolina, North Carolina, Georgia, and Tennessee. Confirm availability, travel arrangements, and the testing scope for your property. City pages describe service areas, not separate offices.\n\n')
  .replace(/## Location Pages\s+[\s\S]*?(?=## Resources & Blog Articles)/, `## Location Pages\n${locations.map(l => `- [${l.city}, ${l.state.toUpperCase()}](${config.url}/locations/${l.file})`).join('\n')}\n\n`);
write('llms.txt', llms);

const reportBody = `<section class="content-section section-pad"><div class="container reading-width">
<h2>Start with the question the inspection was designed to answer</h2><p>A testing report documents the property areas inspected, the samples collected, and the findings within the agreed scope. It is not a test for every possible contaminant or a medical diagnosis. Ask which questions the proposed inspection can answer before approving the work.</p>
<h2>What to look for in your report</h2><ol class="report-checklist"><li><strong>Property and inspection details.</strong> The date, inspected areas, relevant history, and conditions observed during the visit.</li><li><strong>Sample locations and identifiers.</strong> Each sample should be traceable to a documented location and to its laboratory result.</li><li><strong>Methods and results.</strong> The analysis method, units, reporting limits where applicable, and laboratory documentation for the work performed.</li><li><strong>Observations and limitations.</strong> Moisture readings, photographs where relevant, and areas or materials that were outside the inspection scope.</li><li><strong>Interpretation and next steps.</strong> A written explanation connecting the findings to the original concern, including whether further investigation or a specialist is appropriate.</li></ol>
<h2>Material testing and air testing answer different questions</h2><p>An <a href="/services/asbestos-testing.html">asbestos material sample</a> investigates a particular building material. Air monitoring evaluates airborne fibres under the conditions and method used. A negative air sample does not establish that every building material is asbestos-free.</p><p><a href="/services/mold-testing.html">Mold investigations</a> combine observations, moisture conditions, and sampling when it will help answer a defined question. An air sample is a snapshot; it does not by itself establish whether a building is safe for every person. EPA notes that there are no federal limits for mold or mold spores. <a href="https://www.epa.gov/mold/samplingtesting-mold-necessary" target="_blank" rel="noopener">Read EPA's explanation of mold sampling</a>.</p>
<h2>Read particle and PM2.5 results in context</h2><p>PM2.5 describes fine airborne particles generally 2.5 micrometers or smaller. A particle reading describes a size category, not the identity of every material in the air. It is not, by itself, an asbestos or mold identification result.</p><ul><li><strong>Check what was measured.</strong> Look for the particle size range, method and units. Mass concentration, commonly reported in micrograms per cubic meter (µg/m³), is not the same as a particle count.</li><li><strong>Check the time window.</strong> Distinguish a brief reading from an average over hours or days. A short indoor measurement cannot be treated as the same result as a longer outdoor monitoring average.</li><li><strong>Check the conditions.</strong> Note location, activities, ventilation and humidity. Sensor placement and environmental conditions can affect readings; compare measurements only with their methods and limitations in view.</li></ul><p>A consumer monitor’s color or score is not a whole-building health certificate. It detects only what its sensors are designed to measure. Ask why any comparison value was chosen and whether it fits the pollutant, setting and averaging period.</p><p><strong>Traffic or nearby construction:</strong> Outdoor particles can enter a home, but cooking and other indoor activities can also contribute. Record when outdoor work or heavy traffic occurs, along with open windows, ventilation use and indoor activities. Discuss whether measurements at comparable times and relevant indoor/outdoor locations would help address the question. A higher indoor reading alone does not establish which source caused it. See <a href="https://www.epa.gov/indoor-air-quality-iaq/indoor-particulate-matter" target="_blank" rel="noopener">EPA’s indoor PM guidance</a>.</p><p><strong>Dust, allergens and material identity:</strong> A PM reading describes a particle size fraction, not a named allergen or the composition of every particle. If identification is the question, ask what specific substance a proposed sample and analysis can detect and which results it cannot provide. Do not treat an environmental result as an allergy diagnosis; discuss symptoms with a healthcare professional.</p><p><strong>A room sample is not your complete exposure history.</strong> It describes the sampled place and period within the method’s limits. A person’s exposure also depends on where they spend time and for how long. Ask whether the location, duration and activities represented by the sample fit the question being asked. <a href="https://www.epa.gov/expobox/exposure-assessment-tools-routes-inhalation" target="_blank" rel="noopener">EPA’s exposure-assessment guidance</a> explains these distinctions; a brief room reading cannot reconstruct months of personal exposure.</p><p>Further reading: <a href="https://www.epa.gov/pm-pollution/particulate-matter-pm-basics" target="_blank" rel="noopener">EPA particle pollution basics</a>, <a href="https://www.epa.gov/air-sensor-toolbox/how-use-air-sensors-air-sensor-guidebook" target="_blank" rel="noopener">EPA’s air-sensor guidebook</a> and <a href="https://www.epa.gov/indoor-air-quality-iaq/low-cost-air-pollution-monitors-and-indoor-air-quality" target="_blank" rel="noopener">indoor monitor limitations</a>.</p>
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
  if (/^locations\/[^/]+\/[^/]+\.html$/.test(file) && serviceSlugs[path.basename(file, '.html')]) {
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
const updated = new Set(['index.html', 'about.html', 'contact.html', 'privacy-policy.html', 'resources.html', 'service-areas.html', 'understanding-your-testing-report.html', ...Object.keys(serviceSlugs).map(slug => `services/${slug}.html`), 'blog/do-i-need-asbestos-testing-before-renovation.html', 'blog/how-much-does-air-quality-testing-cost.html', 'blog/diy-vs-professional-air-quality-testing.html', ...files.filter(file => file.startsWith('locations/'))]);
const entries = files.filter(f => !/<meta name="robots" content="[^"]*noindex/.test(read(f))).map(f => {
  const url = config.url + (f === 'index.html' ? '/' : '/' + f);
  const revisedArticle = f.startsWith('blog/') && require('../data/service-articles')[path.basename(f, '.html')];
  const date = revisedArticle?.updated || config.pageUpdated?.[f] || (updated.has(f) || revisedArticle ? config.contentUpdated : lastmods.get(url));
  return `  <url><loc>${url}</loc>${date ? `<lastmod>${date}</lastmod>` : ''}</url>`;
});
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`);

const legacy = [['/blogs', '/resources.html'], ['/get-started-1', '/contact.html'], ['/anderson%2Fgreenville', '/locations/greenville-sc.html'], ['/blogs/f/when-should-radon-testing-be-performed', '/blog/do-i-need-radon-testing-before-buying-a-home.html'], ['/index.html', '/']];
// Directory backlinks still use an encoded slash in this former Wix URL.
// Netlify treats it separately from /spartanburg/upstate in netlify.toml.
for (const encodedSlash of ['%2F', '%2f']) {
  for (const suffix of ['', '/']) {
    legacy.push([`/spartanburg${encodedSlash}upstate${suffix}`, '/locations/spartanburg-sc.html']);
  }
}
const aliases = files.filter(f => f !== 'index.html').flatMap(f => [[`/${f.slice(0, -5)}`, `/${f}`], [`/${f.slice(0, -5)}/`, `/${f}`]]);
write('_redirects', '# Generated by scripts/build-site.js. Preserve established .html canonical URLs.\n' + [...legacy, ...aliases].map(([from, to]) => `${from} ${to} 301!`).join('\n') + '\n');
console.log(`Site enhancements built: ${locations.length} linked service areas, ${entries.length} sitemap entries, ${legacy.length + aliases.length} redirect rules.`);
