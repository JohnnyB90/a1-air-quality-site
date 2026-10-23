const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const config = require('../site.config.json');
const guides = require('../data/service-guides');
const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const shell = read('contact.html');
const serviceMenu = [
  ['indoor-air-quality', 'Indoor Air Quality Testing'], ['asbestos', 'Asbestos Testing'],
  ['mold', 'Mold Testing'], ['lead', 'Lead Testing'], ['radon', 'Radon Testing'],
  ['commercial-industrial', 'Commercial & Industrial Testing']
];

for (const [key, guide] of Object.entries(guides)) {
  const file = `services/${key}-testing.html`;
  const url = `${config.url}/${file}`;
  const articles = guide.articles.map(slug => {
    const article = read(`blog/${slug}.html`);
    const title = article.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1].replace(/<[^>]*>/g, '');
    return `<li><a href="/blog/${slug}.html">${title}</a></li>`;
  }).join('');
  const body = `<main id="main-content" tabindex="-1">
<section class="page-hero"><div class="container"><div class="breadcrumb"><a href="/">Home</a><span>/</span><a href="/#services">Services</a><span>/</span><span class="current">${esc(guide.label)}</span></div><h1>${esc(guide.title)}</h1><p>${esc(guide.description)}</p><a class="btn btn-primary" href="#request-testing">Request a testing quote</a></div></section>
<section class="content-section section-pad"><div class="container content-grid"><div class="content-main">
<h2>${esc(guide.scopeTitle)}</h2><p>${esc(guide.intro)}</p>
${guide.sections.map(([heading, html]) => `<h2>${esc(heading)}</h2>${html}`).join('\n')}
<h2>Confirm the scope before booking</h2><p>${esc(guide.limitation)}</p>
<h2>Testing and reporting schedule</h2><p>${esc(guide.timing)}</p>
<p>A1 provides independent testing and consultation. <a href="/understanding-your-testing-report.html">Read what to look for in your environmental testing report</a>.</p>
<nav class="service-callout" aria-label="Related reading"><h2>Related questions and guides</h2><ul>${articles}</ul></nav>
<!-- A1 service city directory -->
<section class="service-callout"><h2>Find local testing information</h2><p><a href="/service-areas.html">Browse the service-area directory</a>.</p></section>
<!-- /A1 service city directory -->
</div><aside><section class="sidebar-card sidebar-form" id="request-testing"><h2>Discuss ${esc(guide.label.toLowerCase())}</h2><p>Share the property, project, and deadline so scope and availability can be confirmed.</p><form></form></section><nav class="sidebar-card" aria-label="Testing services"><h2>Testing services</h2><ul>${serviceMenu.map(([slug, label]) => `<li><a href="/services/${slug}-testing.html"${slug === key ? ' aria-current="page"' : ''}>${esc(label)}</a></li>`).join('')}</ul></nav><section class="sidebar-card sidebar-cta"><h2>Prefer to call?</h2><a class="phone-big" href="tel:+18646192092">(864) 619-2092</a><p>Free phone consultation. Confirm the right testing scope for your property.</p></section></aside></div></section>
<section class="faq-section section-pad"><div class="container"><div class="section-header"><h2>Frequently asked questions</h2></div><div class="faq-list">${guide.faqs.map(([q, a]) => `<div class="faq-item"><button class="faq-question">${esc(q)}<span class="icon">+</span></button><div class="faq-answer"><div class="faq-answer-inner">${esc(a)}</div></div></div>`).join('\n')}</div></div></section>
<section class="cta-section"><div class="container"><h2>Discuss your property and testing needs</h2><p>Call with your location, project, and the question you need answered.</p><div class="cta-buttons"><a href="tel:+18646192092" class="btn btn-phone btn-lg">Call (864) 619-2092</a><a href="#request-testing" class="btn btn-gold btn-lg">Request a consultation</a></div></div></section></main>`;
  const schemas = [
    {'@context': 'https://schema.org', '@type': 'Service', '@id': url + '#service', name: guide.title, serviceType: guide.label, description: guide.description, url, provider: {'@type': 'ProfessionalService', '@id': config.url + '/#business', name: 'A1 Air Quality Consultants', url: config.url + '/'}, areaServed: ['South Carolina', 'North Carolina', 'Georgia', 'Tennessee'].map(name => ({'@type': 'State', name}))},
    {'@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{name: 'Home', item: config.url + '/'}, {name: 'Services', item: config.url + '/#services'}, {name: guide.label, item: url}].map((item, i) => ({'@type': 'ListItem', position: i + 1, ...item}))},
    {'@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: guide.faqs.map(([name, text]) => ({'@type': 'Question', name, acceptedAnswer: {'@type': 'Answer', text}}))}
  ];
  let html = shell
    .replace(/<!-- A1 critical CSS:[\s\S]*?<!-- \/A1 critical CSS -->/, '<link rel="stylesheet" href="/css/style.css">')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')
    .replace(/<title>.*?<\/title>/s, `<title>${esc(guide.title)} | A1</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(guide.description)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(guide.title)} | A1">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(guide.description)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`)
    .replace(/<main\b[^>]*>[\s\S]*?<\/main>/, () => body)
    .replace('</head>', schemas.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n') + '\n</head>');
  fs.writeFileSync(path.join(ROOT, file), html);
}
console.log('Rebuilt the lead, radon, indoor-air-quality, and commercial service guides.');
