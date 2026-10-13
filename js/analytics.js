/* Optional GA4 measurement: consent first, no form values, and no URL query strings. */
(() => {
  'use strict';
  const script = document.currentScript;
  const measurementId = script && script.dataset.measurementId;
  if (!/^G-[A-Z0-9]+$/.test(measurementId || '')) return;
  if (!['a1airqualityconsultants.com', 'www.a1airqualityconsultants.com'].includes(location.hostname)) return;
  const key = 'a1_analytics_consent';
  let choice;
  try { choice = localStorage.getItem(key); } catch (_) {}
  let started = false;
  let banner;
  const cleanLocation = location.origin + location.pathname;
  let cleanReferrer = '';
  try { const ref = new URL(document.referrer); cleanReferrer = ref.origin + ref.pathname; } catch (_) {}
  const serviceForPage = () => {
    const p = location.pathname;
    if (/\/(?:services|locations\/[^/]+)\/asbestos-testing(?:\.html)?\/?$/.test(p)) return 'asbestos';
    if (/\/(?:services|locations\/[^/]+)\/mold-testing(?:\.html)?\/?$/.test(p)) return 'mold';
    if (p.includes('/services/indoor-air-quality-testing')) return 'air_quality';
    return 'unspecified';
  };
  function gtag() { window.dataLayer.push(arguments); }
  function event(name, data = {}) {
    if (choice !== 'granted' || !started) return;
    gtag('event', name, {send_to: measurementId, transport_type: 'beacon', ...data});
  }
  function consumeLead() {
    if (!/\/thank-you(?:\.html)?\/?$/.test(location.pathname)) return;
    try {
      const raw = sessionStorage.getItem('a1_pending_lead');
      if (!raw) return;
      const lead = JSON.parse(raw);
      if (Date.now() - lead.created_at > 10 * 60 * 1000) {
        sessionStorage.removeItem('a1_pending_lead'); return;
      }
      if (choice !== 'granted') return;
      sessionStorage.removeItem('a1_pending_lead');
      const forms = ['contact', 'homepage-inquiry', 'quick-quote'];
      const services = ['asbestos', 'mold', 'air_quality', 'commercial', 'lead', 'radon', 'unsure'];
      if (forms.includes(lead.form_name) && services.includes(lead.service_type)) {
        event('generate_lead', {form_name: lead.form_name, service_type: lead.service_type, lead_source: 'website_form'});
      }
    } catch (_) {}
  }
  function start() {
    if (started || choice !== 'granted') return;
    started = true;
    window.dataLayer = window.dataLayer || [];
    gtag('js', new Date());
    const params = {
      send_page_view: false,
      page_location: cleanLocation,
      page_referrer: cleanReferrer,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    };
    // Only our four known profile campaigns are passed to Analytics.
    const query = new URLSearchParams(location.search);
    const profile = query.get('utm_content');
    if (query.get('utm_source') === 'google' && query.get('utm_medium') === 'organic' && query.get('utm_campaign') === 'gbp' && ['spartanburg', 'piedmont', 'summerville', 'charlotte'].includes(profile)) {
      Object.assign(params, {campaign_source: 'google', campaign_medium: 'organic', campaign_name: 'gbp', campaign_content: profile});
    }
    gtag('config', measurementId, params);
    event('page_view', {page_location: cleanLocation, page_referrer: cleanReferrer, page_title: document.title});
    const external = document.createElement('script');
    external.async = true;
    external.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(external);
    consumeLead();
  }
  function setChoice(value) {
    choice = value;
    try { localStorage.setItem(key, value); } catch (_) {}
    if (banner) banner.remove();
    if (value === 'granted') {
      window[`ga-disable-${measurementId}`] = false;
      start();
    } else {
      window[`ga-disable-${measurementId}`] = true;
      // Remove our Analytics cookies when visitors withdraw consent.
      document.cookie.split(';').map(c => c.split('=')[0].trim()).filter(n => n === '_ga' || n.startsWith('_ga_')).forEach(n => {
        [location.hostname, '.' + location.hostname, '.a1airqualityconsultants.com'].forEach(domain => {
          document.cookie = `${n}=; Max-Age=0; Path=/; Domain=${domain}; SameSite=Lax; Secure`;
        });
        document.cookie = `${n}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
      });
    }
  }
  function preferences() {
    if (banner && banner.isConnected) return;
    banner = document.createElement('section');
    banner.className = 'analytics-choice';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Optional website analytics');
    banner.innerHTML = '<div><strong>Optional website analytics</strong><p>May we use Google Analytics to understand which pages help visitors? Your inquiry details are not sent to Analytics. <a href="/privacy-policy.html">Privacy policy</a></p></div><div class="analytics-choice-actions"><button type="button" class="btn btn-primary" data-choice="granted">Allow analytics</button><button type="button" class="btn btn-outline-dark" data-choice="denied">Decline</button></div>';
    banner.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => setChoice(button.dataset.choice)));
    document.body.appendChild(banner);
  }
  const footer = document.querySelector('.footer-legal');
  if (footer) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'privacy-preferences'; button.textContent = 'Analytics preferences';
    button.addEventListener('click', preferences); footer.appendChild(button);
  }
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (href.startsWith('tel:')) event('phone_click', {service_type: serviceForPage(), link_placement: link.closest('header') ? 'header' : link.closest('.mobile-sticky-footer') ? 'mobile_footer' : 'content'});
    if (href.startsWith('mailto:')) event('email_click', {service_type: serviceForPage()});
  });
  if (choice === 'granted') start();
  else if (choice !== 'denied' && !navigator.globalPrivacyControl && navigator.doNotTrack !== '1') preferences();
})();
