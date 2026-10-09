/* Netlify inquiry handling. Never send contact details or message text to analytics. */
(() => {
  'use strict';
  const serviceNames = {
    'Air Quality Testing': 'air_quality', 'Asbestos Testing': 'asbestos',
    'Mold Testing': 'mold', 'Commercial / Industrial Testing': 'commercial',
    'Lead Testing': 'lead', 'Radon Testing': 'radon', 'Other / Not Sure': 'unsure'
  };
  const formNames = new Set(['contact', 'homepage-inquiry', 'quick-quote']);
  document.querySelectorAll('form[data-lead-form]').forEach(form => {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (form.dataset.submitting === 'true' || !form.reportValidity()) return;
      const status = form.querySelector('.form-status');
      const button = form.querySelector('[type="submit"]');
      const label = button.textContent;
      form.dataset.submitting = 'true';
      button.disabled = true;
      button.textContent = 'Sending…';
      status.textContent = 'Sending your inquiry…';
      try {
        const data = new FormData(form);
        const response = await fetch('/', {
          method: 'POST',
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
          body: new URLSearchParams(data).toString()
        });
        if (!response.ok) throw new Error('Submission failed');
        // Only a successful server response creates a pending conversion.
        // The thank-you page consumes this once; refreshing it cannot create another lead.
        if (!data.get('bot-field')) {
          const formName = form.dataset.formCategory || form.getAttribute('name');
          const lead = {
            form_name: formNames.has(formName) ? formName : 'contact',
            service_type: serviceNames[data.get('service')] || 'unsure',
            created_at: Date.now()
          };
          try { sessionStorage.setItem('a1_pending_lead', JSON.stringify(lead)); } catch (_) {}
        }
        window.location.assign('/thank-you.html');
      } catch (_) {
        status.textContent = 'Your message could not be sent. Please try again or call (864) 619-2092.';
        status.focus();
        button.disabled = false;
        button.textContent = label;
        form.dataset.submitting = 'false';
      }
    });
  });
})();
