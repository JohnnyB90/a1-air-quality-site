const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

const BLOG_CONTENT_DIR = path.join(__dirname, 'blog-content');
const BLOG_OUTPUT_DIR = path.join(__dirname, 'blog');
const RESOURCES_HTML = path.join(__dirname, 'resources.html');
const SITEMAP_XML = path.join(__dirname, 'sitemap.xml');
const SITE_URL = 'https://a1airqualityconsultants.com';

// Exit cleanly if no blog-content directory or no markdown files
if (!fs.existsSync(BLOG_CONTENT_DIR)) {
  console.log('No blog-content/ directory. Nothing to build.');
  process.exit(0);
}

const mdFiles = fs.readdirSync(BLOG_CONTENT_DIR).filter(f => f.endsWith('.md'));
if (mdFiles.length === 0) {
  console.log('No markdown files in blog-content/. Nothing to build.');
  process.exit(0);
}

// Ensure output directory exists
if (!fs.existsSync(BLOG_OUTPUT_DIR)) {
  fs.mkdirSync(BLOG_OUTPUT_DIR, { recursive: true });
}

const posts = [];

for (const file of mdFiles) {
  const raw = fs.readFileSync(path.join(BLOG_CONTENT_DIR, file), 'utf8');
  const { data, content } = matter(raw);
  const slug = path.basename(file, '.md');
  const bodyHtml = marked(content);

  const dateObj = new Date(data.date);
  const dateFormatted = dateObj.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
  });
  const dateISO = dateObj.toISOString().split('T')[0];

  const post = { ...data, slug, bodyHtml, dateFormatted, dateISO };
  posts.push(post);

  const html = buildBlogPage(post);
  fs.writeFileSync(path.join(BLOG_OUTPUT_DIR, `${slug}.html`), html);
  console.log(`Built: blog/${slug}.html`);
}

// Sort newest first
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

updateResources(posts);
updateSitemap(posts);
console.log(`Done. ${posts.length} post(s) built.`);

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildBlogPage(p) {
  const url = `${SITE_URL}/blog/${p.slug}.html`;
  const imgUrl = p.image.startsWith('http') ? p.image : `${SITE_URL}${p.image}`;

  const articleLD = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.description,
    datePublished: p.dateISO,
    author: { "@type": "Organization", name: "A1 Air Quality Consultants" },
    publisher: {
      "@type": "Organization",
      name: "A1 Air Quality Consultants",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.svg` }
    },
    image: imgUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": url }
  });

  const breadcrumbLD = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Resources", item: `${SITE_URL}/resources.html` },
      { "@type": "ListItem", position: 3, name: p.title }
    ]
  });

  let faqLD = '';
  let faqSection = '';
  if (p.faqs && p.faqs.length > 0) {
    faqLD = `\n<script type="application/ld+json">\n${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: p.faqs.map(f => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer }
      }))
    })}\n</script>`;

    faqSection = `
<section class="faq-section section-pad">
  <div class="container">
    <div class="section-header"><div class="label">FAQ</div><h2>Frequently Asked Questions</h2></div>
    <div class="faq-list">
${p.faqs.map(f => `      <div class="faq-item"><button class="faq-question">${esc(f.question)}<span class="icon">+</span></button><div class="faq-answer"><div class="faq-answer-inner">${esc(f.answer)}</div></div></div>`).join('\n')}
    </div>
  </div>
</section>`;
  }

  let sourcesSection = '';
  if (p.sources && p.sources.length > 0) {
    sourcesSection = `
<div style="margin-top:2.5rem;padding:1.5rem 2rem;background:var(--gray-100);border-radius:10px;">
<h3 style="font-family:'DM Serif Display',serif;color:var(--navy-800);margin:0 0 1rem;font-size:1.2rem;">Sources &amp; References</h3>
<ul style="margin:0;padding-left:1.25rem;line-height:1.8;">
${p.sources.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`).join('\n')}
</ul>
</div>`;
  }

  const breadcrumbTitle = p.breadcrumbTitle || p.title;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(p.title)} | A1 AQC</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(p.title)} | A1 AQC">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="article">
<meta property="og:image" content="${imgUrl}">
<meta name="robots" content="index, follow">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
<script type="application/ld+json">
${articleLD}
</script>${faqLD}
<script type="application/ld+json">
${breadcrumbLD}
</script>
</head>
<body>
<header class="site-header" role="banner"><div class="container header-inner"><a href="/" class="logo" aria-label="A1 Air Quality Consultants — Home"><img src="/images/logo/logo.png" alt="A1 Air Quality Consultants" width="44" height="44"><div class="logo-text">A1 Air Quality<br>Consultants<span>Setting the Standard</span></div></a><nav class="main-nav" role="navigation" aria-label="Main navigation"><a href="/">Home</a><div class="nav-dropdown"><a href="/#services">Services</a><div class="dropdown-menu"><a href="/services/indoor-air-quality-testing.html">Air Quality Testing</a><a href="/services/asbestos-testing.html">Asbestos Testing</a><a href="/services/commercial-industrial-testing.html">Commercial Testing</a><a href="/services/lead-testing.html">Lead Testing</a><a href="/services/mold-testing.html">Mold Testing</a><a href="/services/radon-testing.html">Radon Testing</a></div></div><a href="/about.html">About</a><a href="/resources.html">Resources</a><a href="/contact.html">Contact</a></nav><div class="header-cta"><a href="tel:+18646192092" class="header-phone">(864) 619-2092</a><a href="/contact.html" class="btn btn-primary btn-sm">Free Consultation</a></div><button class="menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false">&#9776;</button></div></header>

<section class="page-hero">
  <div class="container">
    <div class="breadcrumb"><a href="/">Home</a><span>/</span><a href="/resources.html">Resources</a><span>/</span><span class="current">${esc(breadcrumbTitle)}</span></div>
    <h1>${esc(p.title)}</h1>
    <p>${esc(p.subtitle || p.description)}</p>
  </div>
</section>

<div class="no-conflict"><div class="container no-conflict-inner"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:28px;height:28px;color:#9BCB3B;flex-shrink:0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><p><strong>100% Independent Testing — Zero Conflict of Interest.</strong> We never sell remediation or removal services. Our results and recommendations are always honest and unbiased.</p></div></div>

<section class="content-section section-pad">
  <div class="container content-grid">
    <article class="content-main">
      <p style="font-size:.9rem;color:var(--gray-300);margin-bottom:2rem;">${p.dateFormatted} · By A1 Air Quality Consultants</p>
      <img src="${esc(p.image)}" alt="${esc(p.imageAlt || p.title)}" style="width:100%;border-radius:12px;margin-bottom:2rem;" loading="lazy">

      ${p.bodyHtml}

      <p style="margin-top:2.5rem;padding:1.5rem;background:var(--navy-800);border-radius:10px;color:#fff;text-align:center;"><strong>Need professional testing?</strong> <a href="/contact.html" style="color:var(--gold-400)">Contact A1 Air Quality Consultants</a> or call <a href="tel:+18646192092" style="color:var(--gold-400)">(864) 619-2092</a> for a free consultation.</p>
    </article>
    <aside>
      <div class="sidebar-card">
        <h3>More Articles</h3>
        <p>Browse all our air quality resources and guides.</p>
        <a href="/resources.html" class="card-link">View All Articles</a>
      </div>
      <div class="sidebar-card">
        <h3>Our Services</h3>
        <ul>
          <li><a href="/services/indoor-air-quality-testing.html">Air Quality Testing</a></li>
          <li><a href="/services/asbestos-testing.html">Asbestos Testing</a></li>
          <li><a href="/services/commercial-industrial-testing.html">Commercial Testing</a></li>
          <li><a href="/services/lead-testing.html">Lead Testing</a></li>
          <li><a href="/services/mold-testing.html">Mold Testing</a></li>
          <li><a href="/services/radon-testing.html">Radon Testing</a></li>
        </ul>
      </div>
      <div class="sidebar-card sidebar-cta">
        <h3>Schedule Your Inspection</h3>
        <p>Call for a free phone consultation.</p>
        <a href="tel:+18646192092" class="phone-big">(864) 619-2092</a>
        <a href="/contact.html" class="btn btn-primary" style="width:100%;justify-content:center">Request Consultation</a>
      </div>
      <div class="sidebar-card sidebar-form">
        <h3>Quick Quote</h3>
        <p>Get a fast response — fill out the form below.</p>
        <form>
          <div class="form-group"><input type="text" name="name" required placeholder="Full Name *"></div>
          <div class="form-group"><input type="tel" name="phone" placeholder="Phone Number"></div>
          <div class="form-group"><input type="email" name="email" required placeholder="Email Address *"></div>
          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">Get a Quote</button>
        </form>
      </div>
    </aside>
  </div>
</section>
${sourcesSection}
${faqSection}

<section class="cta-section"><div class="container"><h2>Have Questions About Your Air Quality?</h2><p>A1 Air Quality Consultants provides independent, NAVLAB-verified testing across North Carolina, South Carolina, and Georgia. Call today for a free phone consultation.</p><div class="cta-buttons"><a href="tel:+18646192092" class="btn btn-phone btn-lg">Call (864) 619-2092</a><a href="/contact.html" class="btn btn-gold btn-lg">Request Free Consultation</a></div></div></section>

<footer class="site-footer" role="contentinfo"><div class="container"><div class="footer-grid"><div class="footer-brand"><a href="/" class="logo"><img src="/images/logo/logo.png" alt="A1 Air Quality Consultants" width="36" height="36"><div class="logo-text">A1 Air Quality<br>Consultants<span>Setting the Standard</span></div></a><p>Leading independent air quality testing. SCDES &amp; NCDHHS licensed. NC, SC &amp; GA.</p></div><div class="footer-col"><h4>Services</h4><ul><li><a href="/services/indoor-air-quality-testing.html">Air Quality Testing</a></li><li><a href="/services/asbestos-testing.html">Asbestos Testing</a></li><li><a href="/services/commercial-industrial-testing.html">Commercial Testing</a></li><li><a href="/services/lead-testing.html">Lead Testing</a></li><li><a href="/services/mold-testing.html">Mold Testing</a></li><li><a href="/services/radon-testing.html">Radon Testing</a></li></ul></div><div class="footer-col"><h4>Contact</h4><div class="footer-contact-item"><a href="tel:+18646192092">(864) 619-2092</a></div><div class="footer-contact-item"><a href="mailto:inbox@a1airqualityconsultants.com">inbox@a1airqualityconsultants.com</a></div><div class="footer-contact-item"><span>206 Aspenwood Dr, Spartanburg, SC 29307</span></div><div class="footer-contact-item"><span>Mon\u2013Fri: 8 AM \u2013 5 PM</span></div></div></div><div class="footer-bottom"><span>&copy; 2026 A1 Air Quality Consultants. All Rights Reserved.</span><div class="footer-legal"><a href="/privacy-policy.html">Privacy Policy</a><a href="/terms-of-service.html">Terms of Service</a></div><div class="footer-social"><a href="https://www.facebook.com/a1airquality" target="_blank" rel="noopener" aria-label="Facebook"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a><a href="https://www.linkedin.com/in/dallas-gunn-21459923a" target="_blank" rel="noopener" aria-label="LinkedIn"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a><a href="https://www.instagram.com/a1airqualityconsultants/" target="_blank" rel="noopener" aria-label="Instagram"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a></div></div></div></footer>
<div class="mobile-sticky-footer" role="complementary" aria-label="Quick contact">
  <a href="tel:+18646192092" class="sticky-btn sticky-btn-call" aria-label="Call (864) 619-2092">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
    Call Now
  </a>
  <a href="/contact.html" class="sticky-btn sticky-btn-consult" aria-label="Request free consultation">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
    Free Consultation
  </a>
</div>
<script src="/js/main.js"></script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Update resources.html — inject CMS post cards between markers
// ---------------------------------------------------------------------------

function updateResources(posts) {
  if (posts.length === 0) return;

  let html = fs.readFileSync(RESOURCES_HTML, 'utf8');
  const startMarker = '<!-- CMS_POSTS_START -->';
  const endMarker = '<!-- CMS_POSTS_END -->';

  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1) {
    console.log('Warning: CMS markers not found in resources.html. Skipping resources update.');
    return;
  }

  const cards = posts.map(p => {
    const imgSrc = esc(p.image);
    const altText = esc(p.imageAlt || p.title);
    const href = `/blog/${p.slug}.html`;
    return `
<article class="service-card">
<img src="${imgSrc}" alt="${altText}" loading="lazy" style="width:calc(100% + 4rem);margin:-2rem -2rem 1.5rem;height:200px;object-fit:cover;">
<h3><a href="${href}">${esc(p.title)}</a></h3>
<p>${esc(p.description)}</p>
<span style="display:block;font-size:.78rem;color:var(--gray-300);margin-bottom:.75rem;">${p.dateFormatted}</span>
<a href="${href}" class="card-link">Read More</a>
</article>`;
  }).join('\n');

  html = html.substring(0, startIdx + startMarker.length)
    + cards + '\n'
    + html.substring(endIdx);

  fs.writeFileSync(RESOURCES_HTML, html);
  console.log(`Updated resources.html with ${posts.length} CMS post(s).`);
}

// ---------------------------------------------------------------------------
// Update sitemap.xml — append new blog post URLs
// ---------------------------------------------------------------------------

function updateSitemap(posts) {
  if (posts.length === 0) return;

  let xml = fs.readFileSync(SITEMAP_XML, 'utf8');
  const closingTag = '</urlset>';
  const idx = xml.lastIndexOf(closingTag);
  if (idx === -1) {
    console.log('Warning: </urlset> not found in sitemap.xml. Skipping sitemap update.');
    return;
  }

  const newEntries = posts.map(p => `  <url>
    <loc>${SITE_URL}/blog/${p.slug}.html</loc>
    <lastmod>${p.dateISO}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');

  xml = xml.substring(0, idx) + newEntries + '\n' + closingTag;
  fs.writeFileSync(SITEMAP_XML, xml);
  console.log(`Updated sitemap.xml with ${posts.length} new URL(s).`);
}
