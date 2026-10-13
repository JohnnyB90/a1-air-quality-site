const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const config = require('../site.config.json');
const plans = require('../data/location-plans');
const additions = require('../data/new-locations');
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
const labels = {asbestos: 'Asbestos Testing', mold: 'Mold Testing'};
const turnaround = 'Results are typically available within 48–72 business hours. Confirm the expected timing for your sample types, laboratory analysis, and project deadline before scheduling.';
const tdecUrl = 'https://dataviewers.tdec.tn.gov/dataviewers/f?p=35001:640::::::';
const thinPages = new Set(['hilton-head-sc', 'myrtle-beach-sc', 'piedmont-sc', 'raleigh-nc', 'rock-hill-sc', 'savannah-ga', 'spartanburg-sc', 'summerville-sc']);
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

function choose(city, slug) {
  return `<section class="service-callout" aria-label="Testing options in ${esc(city)}"><h2>Choose testing for your ${esc(city)} property</h2><ul><li><a href="${servicePath(slug, 'asbestos')}">Asbestos testing in ${esc(city)}</a> — inspect suspect materials before planned disturbance.</li><li><a href="${servicePath(slug, 'mold')}">Mold testing in ${esc(city)}</a> — investigate moisture concerns and discuss when sampling helps.</li><li><a href="/services/indoor-air-quality-testing.html">Indoor air quality testing</a> — define a testing scope for an indoor air concern.</li></ul></section>`;
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
    {'@context': 'https://schema.org', '@type': 'Service', '@id': url + '#service', name: title, url, description, serviceType: service ? labels[service] : ['Asbestos Testing', 'Mold Testing', 'Indoor Air Quality Testing'], provider: {'@id': config.url + '/#business', '@type': 'ProfessionalService', name: 'A1 Air Quality Consultants', url: config.url + '/'}, areaServed: {'@type': 'Place', name: city, containedInPlace: {'@type': 'State', name: states[state]}}},
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
  const main = `<main id="main-content" tabindex="-1"><section class="page-hero"><div class="container"><div class="breadcrumb">${breadcrumbs}</div><h1>${esc(title)}</h1><p>${esc(description)}</p>${service ? '<a href="#request-testing" class="btn btn-primary">Request a testing quote</a>' : ''}</div></section>
${body}
${faqMarkup(faqs)}
<section class="cta-section"><div class="container"><h2>Discuss your ${esc(city)} property</h2><p>Call for a free phone consultation, current availability, and a testing scope suited to your project.</p><div class="cta-buttons"><a href="tel:+18646192092" class="btn btn-phone btn-lg">Call (864) 619-2092</a><a href="${service ? '#request-testing' : '/contact.html'}" class="btn btn-gold btn-lg">Request a consultation</a></div></div></section></main>`;
  html = html.replace(/<main\b[^>]*>[\s\S]*?<\/main>/, () => main);
  return html.replace('</head>', schemas.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n') + '\n</head>');
}

// Generate only the newly commissioned overview pages. Existing editorial pages
// remain editable; their small shared blocks are refreshed separately below.
for (const location of additions) {
  const {city, slug, context, resource, nearby} = location;
  const state = slug.slice(-2);
  if (!plans[slug]) throw new Error(`Missing editorial plan for ${slug}`);
  const title = `Asbestos, Mold & Air Quality Testing in ${city}, ${state.toUpperCase()}`;
  const description = `Independent asbestos, mold, and indoor air quality testing in ${city}, ${state.toUpperCase()}. Discuss your property, project scope, and scheduling with A1.`;
  const body = `<section class="content-section section-pad"><div class="container content-grid"><div class="content-main">
<h2>Plan testing at your ${esc(city)} property</h2><p>${esc(context)}</p>${resource ? `<p><a href="${esc(resource[1])}" target="_blank" rel="noopener">${esc(resource[0])}</a></p>` : ''}
<h2>Asbestos testing before planned disturbance</h2><p>${esc(plans[slug][0])}</p><p><a href="${servicePath(slug, 'asbestos')}">Plan asbestos testing in ${esc(city)}</a>.</p>
<h2>Mold and moisture investigations</h2><p>${esc(plans[slug][1])}</p><p><a href="${servicePath(slug, 'mold')}">Discuss mold testing in ${esc(city)}</a>.</p>
<h2>Indoor air quality testing</h2><p>Describe the odor, concern, or change you have noticed, where it occurs, and when it started. Include recent renovations, product use, ventilation changes, and water incidents. We can discuss an <a href="/services/indoor-air-quality-testing.html">indoor air quality assessment</a> that addresses a defined question. No single sample identifies every possible indoor contaminant.</p>
<h2>Independent testing and a clear report</h2><p>A1 provides testing and consultation and does not sell remediation or removal services. The agreed scope, inspected areas, observations, sample locations, and laboratory findings help explain what the work establishes and where limitations remain. Read <a href="/understanding-your-testing-report.html">our guide to understanding your testing report</a>.</p>
<h2>Results and scheduling</h2><p>${esc(turnaround)}</p><p>Testing takes place at the property. This service-area page does not represent a separate ${esc(city)} office. Call <a href="tel:+18646192092">(864) 619-2092</a> to discuss access, travel arrangements, and availability.</p>
${credential(state)}
<h2>Other nearby service areas</h2><ul>${nearby.map(sl => `<li><a href="${overviewPath(sl)}">${esc(additions.find(l => l.slug === sl)?.city || read(`locations/${sl}.html`).match(/<h1[^>]*>[^<]*Testing in (.*?), (?:SC|NC|GA)<\/h1>/)[1])}, ${sl.slice(-2).toUpperCase()}</a></li>`).join('')}</ul><p><a href="/service-areas.html">Browse every service area</a>.</p>
</div><aside>${office(slug)}<div class="sidebar-card sidebar-cta"><h3>Talk through your testing needs</h3><p>Share the property address, concern, and project deadline.</p><a class="phone-big" href="tel:+18646192092">(864) 619-2092</a><a class="btn btn-primary" href="/contact.html">Request a consultation</a></div></aside></div></section>`;
  const faqs = [
    [`Which testing services are available in ${city}?`, `Contact A1 about asbestos testing, mold and moisture investigations, and indoor air quality testing at your ${city} property. We agree the scope and confirm scheduling before the visit.`],
    ['How long do results typically take?', turnaround],
    [`Is this a separate A1 office in ${city}?`, 'This is a service-area page. Testing takes place at your property, with scheduling and travel arrangements confirmed by phone.'],
    ['Does A1 also sell remediation or removal?', 'No. A1 provides testing and consultation independently of remediation or removal services.']
  ];
  write(`locations/${slug}.html`, page({title, description, file: `locations/${slug}.html`, city, slug, body, faqs}));
}

const locations = fs.readdirSync(path.join(ROOT, 'locations')).filter(file => /-(sc|nc|ga|tn)\.html$/.test(file)).map(file => {
  const slug = path.basename(file, '.html');
  const city = read(`locations/${file}`).match(/<h1[^>]*>[^<]*Testing in (.*?), (?:SC|NC|GA|TN)<\/h1>/)?.[1];
  if (!city || !plans[slug]) throw new Error(`Missing location content for ${file}`);
  return {slug, city, state: slug.slice(-2)};
}).sort((a, b) => a.city.localeCompare(b.city));
if (Object.keys(plans).length !== locations.length) throw new Error('Location editorial data and overview inventory differ');

for (const {slug, city, state} of locations) {
  const overview = `locations/${slug}.html`;
  let html = read(overview);
  if (thinPages.has(slug)) {
    const local = `<h2>Planning a ${esc(city)} renovation</h2><p>${esc(plans[slug][0])}</p><h2>Investigating moisture in ${esc(city)}</h2><p>${esc(plans[slug][1])}</p><p>For an indoor odor or other concern, explain where and when it occurs and what has changed at the property. We can discuss whether a mold assessment, asbestos inspection, or another <a href="/services/indoor-air-quality-testing.html">indoor air quality testing scope</a> fits the question. Location alone does not establish the presence of a contaminant.</p>\n`;
    html = html.replace(/(<div class="content-main">)[\s\S]*?(?=<h2>Services Available)/, '$1\n' + local);
  }
  html = managed(html, 'city testing links', choose(city, slug), '</div><aside>');
  if (office(slug) && !additions.some(l => l.slug === slug)) html = managed(html, 'regional contact', office(slug), '</aside>');
  html = html.replace(/(<h2>Confirm Your Report Turnaround<\/h2>\s*)<p>[\s\S]*?<\/p>/, `$1<p>${esc(turnaround)}</p>`);
  const oldTiming = 'Turnaround depends on the sample types and laboratory analysis. We can discuss the expected timing and your project deadline before scheduling.';
  html = html.split(oldTiming).join(turnaround);
  write(overview, html);

  for (const type of ['asbestos', 'mold']) {
    const isAsbestos = type === 'asbestos';
    const label = labels[type];
    const file = servicePath(slug, type).slice(1);
    const title = `${label} in ${city}, ${state.toUpperCase()}`;
    const description = isAsbestos ? `Plan independent asbestos testing in ${city}, ${state.toUpperCase()}. Discuss suspect materials, renovation scope, laboratory reporting, and a quote with A1.` : `Discuss independent mold testing in ${city}, ${state.toUpperCase()}. Start with moisture history, inspection needs, and targeted sampling when useful.`;
    const planning = plans[slug][isAsbestos ? 0 : 1];
    const context = additions.find(l => l.slug === slug);
    const method = isAsbestos ? `<h2>Match the inspection to the work</h2><p>Tell us which materials will be cut, sanded, removed, or otherwise disturbed. An inspection of a damaged floor tile, a renovation survey, and a request for air monitoring have different scopes. Share any written requirements from your contractor, property manager, or project authority before approving the work.</p><h2>What the testing process involves</h2><ol><li><strong>Review the project.</strong> Confirm the property, work boundaries, access, and available previous reports.</li><li><strong>Inspect suspect materials.</strong> A qualified inspector determines the sampling approach for the agreed scope. Avoid disturbing suspect materials yourself.</li><li><strong>Document samples and analysis.</strong> Sample identifiers and locations connect collected materials to laboratory findings.</li><li><strong>Discuss the report.</strong> Review the findings, limitations, and any areas or materials that need further assessment.</li></ol><h2>What a result can tell you</h2><p>A material result applies to the sampled material and documented scope. It is not a guarantee about every concealed layer in the building. Material testing and air monitoring answer different questions; a negative air sample does not establish that all building materials are asbestos-free.</p><p><a href="https://www.epa.gov/asbestos/protect-your-family-exposures-asbestos" target="_blank" rel="noopener">EPA guidance on asbestos in homes</a> explains why suspect material should be evaluated by appropriately trained professionals. Project-specific requirements should be confirmed with the relevant authority.</p>` : `<h2>Start with the moisture question</h2><p>Tell us about leaks, visible growth, musty odors, or repairs and where they occurred. An inspection can consider the building history, accessible conditions, and moisture observations. Sampling is selected when it can answer a defined question; it is not automatically needed for every visible mold problem.</p><h2>What the investigation involves</h2><ol><li><strong>Collect the history.</strong> Identify affected rooms, water events, maintenance, and the decision you need to make.</li><li><strong>Review accessible conditions.</strong> Agree the inspection boundaries, access permissions, and any limitations involving concealed spaces.</li><li><strong>Choose useful samples.</strong> Discuss whether air or surface samples will add information to the inspection findings.</li><li><strong>Explain the results.</strong> Relate laboratory findings to observations and explain what remains uncertain.</li></ol><h2>Interpreting mold results</h2><p>An air sample describes conditions at a location and time. Its interpretation depends on the inspection context, and it does not certify that a building is safe for every person. EPA does not set federal limits for airborne mold or mold spores. A mold result is not a medical diagnosis.</p><p><a href="https://www.epa.gov/mold/samplingtesting-mold-necessary" target="_blank" rel="noopener">EPA’s explanation of when mold sampling is useful</a> notes that visible mold often does not require sampling. The moisture source still needs attention, regardless of whether samples are collected.</p>`;
    const other = isAsbestos ? 'mold' : 'asbestos';
    const body = `<section class="content-section section-pad"><div class="container content-grid"><div class="content-main">
<h2>${isAsbestos ? 'Planning a project' : 'Defining your investigation'} in ${esc(city)}</h2><p>${esc(planning)}</p>
${context?.resource ? `<p>Local project resource: <a href="${esc(context.resource[1])}" target="_blank" rel="noopener">${esc(context.resource[0])}</a>. Municipal approvals and environmental testing serve different purposes.</p>` : ''}
${method}
<h2>What to send for a useful quote</h2><ul><li>The full ${esc(city)} property address and whether the building is residential, commercial, or used for another purpose.</li><li>${isAsbestos ? 'The planned work areas, materials to be disturbed, drawings, and any previous asbestos reports.' : 'The affected rooms, dates of leaks or repairs, photos, and any previous inspection or laboratory reports.'}</li><li>Access permissions, occupied areas, and your renovation, closing, or other project deadline.</li></ul><p>Inspection scope, access, sample selection, and laboratory analysis affect the quote. We confirm these before scheduling rather than assign one price to every property.</p>
<h2>Reporting and turnaround</h2><p>${esc(turnaround)}</p><p>The report should connect observations and sample locations with the laboratory findings and state the inspection limitations. See <a href="/understanding-your-testing-report.html">how to read your environmental testing report</a>.</p>
${isAsbestos ? credential(state) : ''}
<h2>Independent testing at your property</h2><p>A1 provides testing and consultation and does not sell remediation or removal services. Call to confirm availability and travel arrangements for ${esc(city)}. This page describes a service area, not a separate city office.</p>
<nav class="service-callout" aria-label="Related testing information"><h2>Related ${esc(city)} testing information</h2><ul><li><a href="${overviewPath(slug)}">${esc(city)} asbestos, mold, and air quality overview</a></li><li><a href="${servicePath(slug, other)}">${labels[other]} in ${esc(city)}</a></li><li><a href="/services/${type}-testing.html">Complete ${label.toLowerCase()} service guide</a></li><li><a href="/services/indoor-air-quality-testing.html">Indoor air quality testing</a></li><li><a href="/service-areas.html">All service areas</a></li></ul></nav>
</div><aside><section class="sidebar-card" id="request-testing"><h2>Request ${label.toLowerCase()}</h2><p>Tell us about your ${esc(city)} property and project. We will respond to discuss scope and availability.</p><form></form></section>${office(slug)}<section class="sidebar-card sidebar-cta"><h3>Prefer to call?</h3><a class="phone-big" href="tel:+18646192092">(864) 619-2092</a><p>Free phone consultation.</p></section></aside></div></section>`;
    const faqs = [
      [`How do I arrange ${label.toLowerCase()} in ${city}?`, `Call (864) 619-2092 or use the form on this page. Share the ${city} property address, the concern or proposed work, and your deadline so A1 can confirm scope, access, and scheduling.`],
      [isAsbestos ? 'Can an air test tell me whether a floor or ceiling contains asbestos?' : 'Is a mold sample necessary whenever I see mold?', isAsbestos ? 'No. Air monitoring and material analysis answer different questions. Discuss professional evaluation of the particular suspect material before planned disturbance.' : 'Not always. EPA notes that visible mold often does not need sampling. Inspection history and moisture observations help determine whether a sample would answer an additional question.'],
      ['How long do results typically take?', turnaround],
      ['Does A1 provide removal or remediation?', 'No. A1 provides testing and consultation independently of remediation or removal services.']
    ];
    write(file, page({title, description, file, city, slug, service: type, body, faqs}));
  }
}

for (const type of ['asbestos', 'mold', 'indoor-air-quality']) {
  const file = `services/${type}-testing.html`;
  let html = read(file);
  const heading = type === 'indoor-air-quality' ? 'Air Quality' : labels[type].replace(' Testing', '');
  const cities = `<section class="service-callout"><h2>Where we offer ${heading.toLowerCase()} testing</h2><p>Choose a city to see ${type === 'indoor-air-quality' ? 'local testing information' : `the ${heading.toLowerCase()} testing process and request a quote`}. Call to confirm property access, travel arrangements, and availability.</p>${Object.entries(states).map(([state, name]) => `<details class="area-service-group"${state === 'sc' ? ' open' : ''}><summary>${name} (${locations.filter(l => l.state === state).length} service areas)</summary><ul class="city-directory">${locations.filter(l => l.state === state).map(l => `<li><a href="${type === 'indoor-air-quality' ? overviewPath(l.slug) : servicePath(l.slug, type)}">${esc(l.city)}, ${state.toUpperCase()}</a></li>`).join('')}</ul></details>`).join('\n')}<p><a href="/service-areas.html">Explore the complete service-area directory</a>.</p></section>`;
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
console.log(`Location pages built: ${additions.length} new overviews; ${locations.length * 2} focused service pages; ${thinPages.size} expanded existing introductions.`);
