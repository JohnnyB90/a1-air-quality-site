const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const config = require('../site.config.json');
const plans = require('../data/location-plans');
const additions = require('../data/new-locations');
const editorial = require('../data/location-editorial');
const additional = require('../data/additional-service-editorial');
const landingCopy = require('../data/location-landing-copy');
const guides = require('../data/service-guides');
const priorityCopy = require('../data/priority-service-copy');
const states = {sc: 'South Carolina', nc: 'North Carolina', ga: 'Georgia', tn: 'Tennessee'};
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const write = (file, html) => {
  fs.mkdirSync(path.dirname(path.join(ROOT, file)), {recursive: true});
  fs.writeFileSync(path.join(ROOT, file), html);
};
const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const shell = read('contact.html');
const overviewPath = slug => `/locations/${slug}.html`;
const servicePath = (slug, type) => `/locations/${slug}/${type}-testing.html`;
const labels = {asbestos: 'Asbestos Testing', mold: 'Mold Testing', 'indoor-air-quality': 'Indoor Air Quality Testing', lead: 'Lead Testing', radon: 'Radon Testing', 'commercial-industrial': 'Commercial & Industrial Testing'};
const benefits = {
  asbestos: ['Before you disturb existing materials', 'Planning a renovation or removal project? A1 can inspect suspect materials and arrange sampling to help establish whether asbestos is present within the agreed scope. Discuss testing before work disturbs the materials.'],
  mold: ['Get answers about mold and moisture', 'A musty odor, visible concern, or past leak can leave you unsure what to do next. A1 can assess accessible conditions, discuss whether sampling will answer your question, and explain the findings independently of remediation services.'],
  'indoor-air-quality': ['Understand the concern in your indoor space', 'An unexplained odor or a change in an occupied room needs an investigation suited to the concern. A1 can review the building history and discuss useful observations, measurements, or samples for the question you need answered.'],
  lead: ['Know more before changing painted surfaces', 'Older finishes, settled dust, and drinking water raise different lead questions. A1 can discuss the materials or locations involved and arrange testing for the agreed samples, helping you understand the findings before a repair or property decision.'],
  radon: ['Measure the property you need answers about', 'Whether you are buying a home or bringing a lower room into regular use, radon measurement provides information about the tested space and period. A1 can discuss the layout, monitoring schedule, and reporting needed for your decision.'],
  'commercial-industrial': ['Environmental testing for your business property', 'Renovation materials, recurring moisture, and indoor-air concerns can affect project decisions in an operating business. A1 can discuss a defined testing assignment, coordinate property access, and explain the findings for the agreed work area.']
};
const cardCopy = {
  asbestos: 'Investigate suspect building materials before renovation or removal.',
  mold: 'Understand a moisture concern, musty odor, or possible mold growth.',
  'indoor-air-quality': 'Discuss odors and indoor conditions with testing selected for the concern.',
  lead: 'Discuss testing of paint, dust, or water for a defined lead question.',
  radon: 'Arrange measurement for a purchase, an occupied room, or another property decision.',
  'commercial-industrial': 'Coordinate environmental testing for business properties and facility projects.'
};
const turnaround = 'Results are typically available within 48–72 business hours. Confirm the expected timing for your sample types, laboratory analysis, and project deadline before scheduling.';
const tdecUrl = 'https://dataviewers.tdec.tn.gov/dataviewers/f?p=35001:640::::::';
const regionalContacts = [
  {name: 'Piedmont', address: '142 Sir Lancelot Drive, Piedmont, SC', cities: ['anderson-sc', 'clemson-sc', 'easley-sc', 'greenville-sc', 'greer-sc', 'mauldin-sc', 'piedmont-sc', 'simpsonville-sc', 'taylors-sc', 'greenwood-sc']},
  {name: 'Summerville', address: '439 Fox Sparrow Ct, Summerville, SC 29486', cities: ['beaufort-sc', 'bluffton-sc', 'charleston-sc', 'conway-sc', 'goose-creek-sc', 'hanahan-sc', 'hilton-head-sc', 'mount-pleasant-sc', 'myrtle-beach-sc', 'north-charleston-sc', 'summerville-sc']}
];

function managed(html, key, body, insert) {
  const block = `<!-- A1 ${key} -->\n${body}\n<!-- /A1 ${key} -->`;
  const pattern = new RegExp(`<!-- A1 ${key} -->[\\s\\S]*?<!-- /A1 ${key} -->`);
  if (pattern.test(html)) return html.replace(pattern, () => block);
  if (!html.includes(insert)) throw new Error(`Cannot place ${key}: missing ${insert}`);
  return html.replace(insert, () => block + '\n' + insert);
}

function credential(state) {
  if (state !== 'tn') return '';
  return `<section class="service-callout"><h2>Tennessee asbestos inspector information</h2><p>The Tennessee Department of Environment and Conservation registry lists <strong>Dallas Gunn</strong> as an <strong>Active asbestos inspector</strong>, with an expiration date of <strong>January 20, 2027</strong>. Registry entry checked October 12, 2026.</p><p><a href="${esc(tdecUrl)}" target="_blank" rel="noopener">Check the TDEC asbestos inspector registry</a> and search for Dallas Gunn. This entry describes the individual inspector’s discipline and status. Discuss the credentials and project requirements applicable to your work before scheduling.</p></section>`;
}

function office(slug) {
  const contact = regionalContacts.find(item => item.cities.includes(slug));
  if (!contact) return '';
  return `<section class="sidebar-card"><h3>${contact.name} regional contact</h3><p>${esc(contact.address)}</p><p>Call <a href="tel:+18646192092">(864) 619-2092</a> to arrange testing at your property. Please confirm arrangements before travelling to a contact address.</p></section>`;
}

function faqMarkup(faqs) {
  return `<section class="faq-section section-pad"><div class="container"><div class="section-header"><h2>Frequently asked questions</h2></div><div class="faq-list">${faqs.map(([question, answer]) => `<div class="faq-item"><button class="faq-question">${esc(question)}<span class="icon">+</span></button><div class="faq-answer"><div class="faq-answer-inner">${esc(answer)}</div></div></div>`).join('\n')}</div></div></section>`;
}

function page({title, description, file, city, slug, service, body, faqs}) {
  const url = config.url + '/' + file;
  const state = slug.slice(-2);
  const crumb = [{name: 'Home', item: config.url + '/'}, {name: 'Service Areas', item: config.url + '/service-areas.html'}, {name: `${city}, ${state.toUpperCase()}`, item: config.url + overviewPath(slug)}];
  if (service) crumb.push({name: labels[service], item: url});
  const schemas = [
    {'@context': 'https://schema.org', '@type': 'Service', '@id': url + '#service', name: title, url, description, serviceType: service ? labels[service] : Object.values(labels), provider: {'@id': config.url + '/#business', '@type': 'ProfessionalService', name: 'A1 Air Quality Consultants', url: config.url + '/'}, areaServed: {'@type': 'Place', name: city, containedInPlace: {'@type': 'State', name: states[state]}}},
    {'@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumb.map((item, index) => ({'@type': 'ListItem', position: index + 1, ...item}))},
    {'@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([name, text]) => ({'@type': 'Question', name, acceptedAnswer: {'@type': 'Answer', text}}))}
  ];
  let html = shell
    .replace(/<!-- A1 critical CSS:[\s\S]*?<!-- \/A1 critical CSS -->/, '<link rel="stylesheet" href="/css/style.css">')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')
    .replace(/<title>.*?<\/title>/s, `<title>${esc(title)} | A1</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(description)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(title)} | A1">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(description)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  const breadcrumbs = crumb.map((item, i) => i === crumb.length - 1 ? `<span class="current">${esc(item.name)}</span>` : `<a href="${item.item.replace(config.url, '')}">${esc(item.name)}</a>`).join('<span>/</span>');
  const main = `<main id="main-content" tabindex="-1"><section class="page-hero"><div class="container"><div class="breadcrumb">${breadcrumbs}</div><h1>${esc(title)}</h1><p>${esc(description)}</p><div class="location-actions"><a href="${service ? '#request-testing' : '/contact.html'}" class="btn btn-primary">Request a testing quote</a><a href="tel:+18646192092" class="btn location-call">Call (864) 619-2092</a></div></div></section>
${body}
${faqMarkup(faqs)}
<section class="cta-section"><div class="container"><h2>Discuss your ${esc(city)} property</h2><p>Call for a free phone consultation, current availability, and a testing scope suited to your project.</p><div class="cta-buttons"><a href="tel:+18646192092" class="btn btn-phone btn-lg">Call (864) 619-2092</a><a href="${service ? '#request-testing' : '/contact.html'}" class="btn btn-gold btn-lg">Request a consultation</a></div></div></section></main>`;
  html = html.replace(/<main\b[^>]*>[\s\S]*?<\/main>/, () => main);
  return html.replace('</head>', schemas.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n') + '\n</head>');
}

// Customer landing pages lead with services and a quote. Detailed project
// preparation belongs below the offer on the dedicated service pages.
const locations = Object.keys(plans).map(slug => {
  const added = additions.find(l => l.slug === slug);
  const existing = read(`locations/${slug}.html`);
  const city = added?.city || existing.match(/<h1[^>]*>[^<]*Testing in (.*?), (?:SC|NC|GA|TN)<\/h1>/)?.[1];
  const main = existing.match(/<main\b[^>]*>[\s\S]*?<\/main>/)?.[0] || '';
  const nearby = added?.nearby || [...new Set([...main.matchAll(/href="\/locations\/([^/"#]+)\.html"/g)].map(m => m[1]))].filter(s => s !== slug).slice(0,4);
  if (!city || !editorial[slug] || !landingCopy[slug] || !additional[slug]) throw new Error(`Missing city or editorial content: ${slug}`);
  return {slug, city, state: slug.slice(-2), nearby};
}).sort((a,b) => a.city.localeCompare(b.city));
if (Object.keys(editorial).length !== locations.length || Object.keys(landingCopy).length !== locations.length) throw new Error('Editorial inventory differs from location inventory');

function localContext(entry, city) {
  return `<section aria-label="Local project context"><h2>Local planning context for ${esc(city)}</h2><p>${esc(entry.local)}</p><p><a href="${esc(entry.source[1])}" target="_blank" rel="noopener">${esc(entry.source[0])}</a></p></section>`;
}

function serviceLinks(slug, current) {
  return Object.entries(labels).filter(([type]) => type !== current).map(([type, label]) => `<li><a href="${servicePath(slug, type)}">${esc(label)}</a></li>`).join('');
}

function nearbyLinks(location) {
  return `<nav aria-label="Nearby service areas"><h2>Nearby service areas</h2><ul>${location.nearby.map(slug => {
    const other = locations.find(l => l.slug === slug);
    if (!other) throw new Error(`Unknown nearby city ${slug} on ${location.slug}`);
    return `<li><a href="${overviewPath(slug)}">${esc(other.city)}, ${other.state.toUpperCase()}</a></li>`;
  }).join('')}</ul><p><a href="/service-areas.html">Browse all service areas</a></p></nav>`;
}

for (const location of locations) {
  const {slug, city, state} = location;
  const entry = editorial[slug];
  for (const key of ['asbestos','mold']) {
    const section = entry[key];
    if (!Array.isArray(section) || section.length !== 4 || section[1].length !== 3 || section.some(v => !v)) throw new Error(`Incomplete ${slug} ${key} editorial brief`);
  }
  if (!entry.local || !entry.air || !/^https:\/\//.test(entry.source?.[1])) throw new Error(`Incomplete local source for ${slug}`);
  const title = `Asbestos, Mold & Air Quality Testing in ${city}, ${state.toUpperCase()}`;
  const description = `Independent testing for ${city}, ${state.toUpperCase()} homes and businesses. Asbestos, mold, indoor air, lead, radon, and commercial services. Call A1 for a quote.`;
  const body = `<section class="section-pad location-intro"><div class="container"><div class="reading-width"><h2>Answers for your ${esc(city)} property</h2><p>${esc(landingCopy[slug])}</p></div>
<div class="section-header location-services-heading"><h2>Choose the testing you need</h2><p>Explore a service or call us if you are unsure where to start.</p></div>
<div class="services-grid location-services">${Object.entries(labels).map(([type, label]) => `<article class="service-card"><h3>${esc(label)}</h3><p>${esc(cardCopy[type])}</p><a class="card-link" href="${servicePath(slug, type)}">${esc(label)} in ${esc(city)}</a></article>`).join('\n')}</div></div></section>
<section class="content-section section-pad section-alt"><div class="container content-grid"><div class="content-main">
${(priorityCopy[`${slug}/overview`]?.sections || []).map(([heading, content]) => `<h2>${esc(heading)}</h2>${content}\n`).join('')}<h2>Independent testing. Clear next steps.</h2><p>A1 provides testing and consultation without selling removal or remediation. We explain the findings for your inspection so you can decide what comes next.</p>
<ol class="location-process"><li><strong>Tell us what is happening.</strong> Start with your concern, location, and timing.</li><li><strong>Arrange the property visit.</strong> We confirm the testing scope, quote, access, and appointment.</li><li><strong>Understand the findings.</strong> Review the results and discuss any recommended follow-up.</li></ol>
<h2>When will I have results?</h2><p>Laboratory results are typically available within 48–72 business hours. Confirm the schedule for your samples and project. Radon testing also needs its agreed monitoring period before reporting.</p>
<details class="location-detail"><summary>Local resources for a ${esc(city)} property project</summary>${localContext(entry, city)}</details>
${nearbyLinks(location)}
</div><aside><section class="sidebar-card sidebar-cta"><h2>Talk with A1</h2><p>Free phone consultation. Discuss the concern and get a quote for testing at your property.</p><a class="phone-big" href="tel:+18646192092">(864) 619-2092</a><a class="btn btn-primary" href="/contact.html">Request a consultation</a></section>${office(slug)}<section class="sidebar-card"><h2>Testing at your property</h2><p>We travel to listed service areas. Call to confirm availability and travel arrangements. This page describes service in ${esc(city)}; it is not a separate office listing.</p></section></aside></div></section>`;
  const overviewFaqs = [
    [`How do I choose testing for my ${city} property?`, 'Start with what you have noticed or the work you are planning. A1 can discuss whether material testing, a moisture investigation, radon measurement, or another indoor-air service fits the question. You do not need to choose every test to request a consultation.'],
    [`How much does testing in ${city} cost?`, 'The quote depends on the property, inspection scope, number and type of samples, analysis, and travel arrangements. Call or send a consultation request so A1 can discuss those details and confirm pricing before booking.']
  ];
  const overviewFile = `locations/${slug}.html`;
  write(overviewFile, page({title, description, file: overviewFile, city, slug, body, faqs: overviewFaqs}));

  for (const type of Object.keys(labels)) {
    const isAsbestos = type === 'asbestos';
    const original = type === 'asbestos' || type === 'mold';
    const section = original ? {heading: entry[type][0], brief: plans[slug][isAsbestos ? 0 : 1], preparation: entry[type][1], faq: entry[type].slice(2)} : additional[slug][type];
    const file = servicePath(slug,type).slice(1);
    const title = `${labels[type]} in ${city}, ${state.toUpperCase()}`;
    const focused = priorityCopy[`${slug}/${type}`];
    const description = focused?.description || `${labels[type]} in ${city}, ${state.toUpperCase()}. Independent testing and consultation for your property or project. Call A1 to discuss options and a quote.`;
    const timing = original ? turnaround : guides[type].timing;
    const limitation = original ? (isAsbestos ? 'Leave suspect materials undisturbed while arranging professional evaluation. A sample result describes its documented material and scope.' : 'A mold investigation considers moisture history and accessible conditions. Sampling is selected for a defined question; an air sample alone does not describe an entire building.') : guides[type].limitation;
    const body = `<section class="content-section section-pad"><div class="container content-grid"><div class="content-main">
<h2>${esc(focused?.heading || benefits[type][0])}</h2><p>${esc(focused?.intro || benefits[type][1])}</p>
${focused ? focused.sections.map(([heading, content]) => `<h2>${esc(heading)}</h2>${content}`).join('\n') : `<h2>${esc(section.heading)}</h2><p>${esc(section.brief)}</p>`}
<p><a class="btn btn-primary" href="#request-testing">Discuss your ${esc(city)} property</a></p>
<details class="location-detail"><summary>What helps us quote this project?</summary><ul>${section.preparation.map(item => `<li>${esc(item)}</li>`).join('')}</ul></details>
${original ? `<details class="location-detail"><summary>Local property project resources</summary>${localContext(entry, city)}</details>` : ''}
<h2>What the testing covers</h2><p>${esc(limitation)}</p><p><a href="/services/${type}-testing.html">Explore the ${esc(labels[type].toLowerCase())} service and common questions</a>.</p>
<h2>Results and follow-up</h2><p>${esc(timing)}</p><p>A1 provides testing and consultation independently of removal or remediation. <a href="/understanding-your-testing-report.html">Understanding your testing report</a>.</p>
<nav class="service-callout" aria-label="Related testing information"><h2>More services in ${esc(city)}</h2><ul><li><a href="${overviewPath(slug)}">All testing services in ${esc(city)}</a></li>${serviceLinks(slug, type)}<li><a href="/service-areas.html">All service areas</a></li></ul></nav>
</div><aside><section class="sidebar-card sidebar-form" id="request-testing"><h2>Request ${esc(labels[type].toLowerCase())}</h2><p>Tell us about your ${esc(city)} property. We will confirm the quote, scope, access, and scheduling.</p><form></form></section>${office(slug)}${isAsbestos && state==='tn' ? `<section class="sidebar-card"><h2>Tennessee inspector information</h2><p>TDEC lists Dallas Gunn as an Active asbestos inspector through January 20, 2027. Entry checked October 12, 2026.</p><a href="${esc(tdecUrl)}" target="_blank" rel="noopener">Verify Dallas Gunn in the TDEC registry</a></section>` : ''}<section class="sidebar-card sidebar-cta"><h2>Prefer to call?</h2><a class="phone-big" href="tel:+18646192092">(864) 619-2092</a><p>Free phone consultation. Testing is arranged at your property.</p></section></aside></div></section>`;
    write(file, page({title, description, file, city, slug, service: type, body, faqs:[...(focused?.faqs || []), section.faq]}));
  }
}

for (const type of Object.keys(labels)) {
  const file = `services/${type}-testing.html`;
  let html = read(file);
  const heading = labels[type].replace(' Testing', '');
  const cities = `<section class="service-callout"><h2>Where we offer ${esc(heading.toLowerCase())} testing</h2><p>Choose your city to explore the service and request a quote. Call to confirm property access, travel arrangements, and availability.</p>${Object.entries(states).map(([state, name]) => `<details class="area-service-group"${state === 'sc' ? ' open' : ''}><summary>${name} (${locations.filter(l => l.state === state).length} service areas)</summary><ul class="city-directory">${locations.filter(l => l.state === state).map(l => `<li><a href="${servicePath(l.slug, type)}">${esc(l.city)}, ${state.toUpperCase()}</a></li>`).join('')}</ul></details>`).join('\n')}<p><a href="/service-areas.html">Explore the complete service-area directory</a>.</p></section>`;
  const block = `<!-- A1 service city directory -->\n${cities}\n<!-- /A1 service city directory -->`;
  if (/<h2[^>]*>Where We Offer/.test(html)) {
    html = html.replace(/<!-- A1 service city directory -->[\s\S]*?<!-- \/A1 service city directory -->\s*/, '');
    const headingStart = html.search(/<h2[^>]*>Where We Offer/);
    const start = html.lastIndexOf('<div', headingStart);
    const end = html.slice(headingStart).match(/<p[^>]*>and surrounding areas<\/p>\s*<\/div>/);
    if (start < 0 || !end) throw new Error(`Cannot replace legacy city links in ${file}`);
    html = html.slice(0, start) + block + html.slice(headingStart + end.index + end[0].length);
  } else if (/<!-- A1 service city directory -->/.test(html)) {
    html = html.replace(/<!-- A1 service city directory -->[\s\S]*?<!-- \/A1 service city directory -->/, () => block);
  } else throw new Error(`Missing service city directory in ${file}`);
  if (type === 'asbestos') {
    html = html.replace(/<!-- A1 Tennessee credential -->[\s\S]*?<!-- \/A1 Tennessee credential -->\s*/, '');
    html = managed(html, 'Tennessee credential', credential('tn'), '<!-- A1 service city directory -->');
  }
  write(file, html);
}

let contact = read('contact.html').replace('We serve all of NC, SC, and parts of GA from this location.', 'Call to arrange testing at properties in our listed service areas across SC, NC, GA, and TN.');
const contacts = regionalContacts.map(c => `<div class="sidebar-card"><h3>${c.name} regional contact address</h3><p>${esc(c.address)}</p><p>Call to arrange property testing and confirm any visit to this address.</p></div>`).join('\n');
contact = managed(contact, 'regional addresses', contacts, '</aside>');
write('contact.html', contact);
console.log(`Location pages built: ${locations.length} customer landing pages; ${locations.length * Object.keys(labels).length} focused service pages across six services (${additions.length} new cities).`);
