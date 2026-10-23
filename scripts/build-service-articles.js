const fs = require('node:fs');
const path = require('node:path');
const config = require('../site.config.json');
const articles = require('../data/service-articles');
const guides = require('../data/service-guides');
const ROOT = path.join(__dirname, '..');
const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

for (const [slug, article] of Object.entries(articles)) {
  const file = path.join(ROOT, 'blog', `${slug}.html`);
  let html = fs.readFileSync(file, 'utf8');
  const oldBody = html.match(/<article class="content-main">([\s\S]*?)<\/article>/);
  if (!oldBody) throw new Error(`Missing article body: ${slug}`);
  const picture = oldBody[1].match(/<img\b[^>]*>/)?.[0] || '';
  const sources = `<section class="service-callout"><h2>Primary resources</h2><ul>${article.sources.map(([label, url]) => `<li><a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a></li>`).join('')}</ul></section>`;
  const updated = article.updated || config.contentUpdated;
  const updatedLabel = new Date(`${updated}T12:00:00Z`).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'});
  const download = article.download ? `<section class="service-callout" id="printable-checklist" aria-labelledby="download-title"><h2 id="download-title">A checklist to take with you</h2><p>${esc(article.download.description)}</p><p><a class="btn btn-primary" href="${esc(article.download.href)}" download>${esc(article.download.label)}</a></p></section>` : '';
  const body = `<article class="content-main"><p class="article-byline">By A1 Air Quality Consultants · Updated ${updatedLabel}</p>${picture}<p class="article-answer"><strong>${esc(article.answer)}</strong></p>${download}${article.sections.map(([heading, content]) => `<h2>${esc(heading)}</h2>${content}`).join('\n')}${sources}</article>`;
  html = html.replace(oldBody[0], () => body);
  // References now sit beside the revised article; remove the older detached list.
  html = html.replace(/<div\b[^>]*>\s*<h3\b[^>]*>Sources &amp; References<\/h3>[\s\S]*?<\/div>/, '');
  html = html.replace(/(<section class="page-hero">[\s\S]*?<h1[^>]*>[\s\S]*?<\/h1>\s*)<p>[\s\S]*?<\/p>/, `$1<p>${esc(article.description)}</p>`);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(article.description)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(article.description)}">`);
  const faq = `<section class="faq-section section-pad"><div class="container"><div class="section-header"><h2>Frequently asked questions</h2></div><div class="faq-list">${article.faqs.map(([q, a]) => `<div class="faq-item"><button class="faq-question">${esc(q)}<span class="icon">+</span></button><div class="faq-answer"><div class="faq-answer-inner">${esc(a)}</div></div></div>`).join('')}</div></div></section>`;
  html = html.replace(/<section class="faq-section section-pad">[\s\S]*?<\/section>/, () => faq);
  const cta = article.cta || {description: `Call A1 for independent ${guides[article.service].label.toLowerCase()} and consultation. Confirm the scope, availability, and quote for your project.`, href: `/services/${article.service}-testing.html`, label: 'Explore the service'};
  html = html.replace(/<section class="cta-section">[\s\S]*?<\/section>/, `<section class="cta-section"><div class="container"><h2>Discuss testing for your property</h2><p>${esc(cta.description)}</p><div class="cta-buttons"><a href="tel:+18646192092" class="btn btn-phone btn-lg">Call (864) 619-2092</a><a href="${esc(cta.href)}" class="btn btn-gold btn-lg">${esc(cta.label)}</a></div></div></section>`);
  // Replace visible and structured FAQ answers together, preserving publication dates.
  html = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (tag, raw) => {
    const schema = JSON.parse(raw);
    if (schema['@type'] === 'Article') {
      schema.description = article.description;
      schema.dateModified = updated;
    }
    if (schema['@type'] === 'FAQPage') schema.mainEntity = article.faqs.map(([name, text]) => ({'@type': 'Question', name, acceptedAnswer: {'@type': 'Answer', text}}));
    return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
  });
  // The inherited image illustrates the article; it does not establish A1 equipment.
  if (article.service === 'lead') html = html.replace(/alt="Professional lead paint testing using an XRF analyzer on a home surface"/, 'alt="Illustration of painted-surface testing"');
  fs.writeFileSync(file, html);
}
console.log(`Updated ${Object.keys(articles).length} supporting service articles and their FAQ metadata.`);
