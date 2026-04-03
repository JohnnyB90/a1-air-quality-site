/* ============================================================
   A1 Air Quality Consultants — Main JS
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* --- Mobile Menu --- */
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', nav.classList.contains('open'));
      toggle.innerHTML = nav.classList.contains('open') ? '✕' : '☰';
    });
  }

  /* --- Mobile dropdowns --- */
  document.querySelectorAll('.nav-dropdown > a').forEach(link => {
    link.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        e.stopImmediatePropagation();
        link.parentElement.classList.toggle('open');
      }
    });
  });

  /* --- Mobile mega-menu state toggles --- */
  document.querySelectorAll('.mega-col h5').forEach(heading => {
    heading.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        heading.parentElement.classList.toggle('open');
      }
    });
  });

  /* --- FAQ Accordion --- */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const answer = item.querySelector('.faq-answer');
      const isOpen = item.classList.contains('open');

      // Close all others
      document.querySelectorAll('.faq-item.open').forEach(openItem => {
        if (openItem !== item) {
          openItem.classList.remove('open');
          openItem.querySelector('.faq-answer').style.maxHeight = '0';
        }
      });

      if (isOpen) {
        item.classList.remove('open');
        answer.style.maxHeight = '0';
      } else {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  /* --- Sticky header background on scroll --- */
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 60) {
        header.style.background = 'rgba(17,17,17,.98)';
      } else {
        header.style.background = 'rgba(17,17,17,.95)';
      }
    });
  }

  /* --- Smooth scroll for anchor links --- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* --- Form handler helper (mailto fallback) --- */
  function handleFormSubmit(form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = data.get('name') || '';
      const email = data.get('email') || '';
      const phone = data.get('phone') || '';
      const service = data.get('service') || '';
      const message = data.get('message') || '';
      const subject = encodeURIComponent('New Inquiry from ' + name);
      const body = encodeURIComponent(
        'Name: ' + name + '\n' +
        'Email: ' + email + '\n' +
        'Phone: ' + phone + '\n' +
        (service ? 'Service: ' + service + '\n\n' : '\n') +
        (message ? 'Message:\n' + message : '')
      );
      window.location.href = 'mailto:inbox@a1airqualityconsultants.com?subject=' + subject + '&body=' + body;
      form.innerHTML = '<div style="text-align:center;padding:2rem;"><h3 style="color:#9BCB3B;">Thank You!</h3><p>Your email client should open momentarily. If not, please call us at <a href="tel:+18646192092">(864) 619-2092</a>.</p></div>';
    });
  }

  /* --- Contact page form --- */
  const inquiryForm = document.querySelector('#inquiry-form');
  if (inquiryForm) handleFormSubmit(inquiryForm);

  /* --- Homepage CTA form --- */
  const homepageForm = document.querySelector('#homepage-form');
  if (homepageForm) handleFormSubmit(homepageForm);

  /* --- Sidebar quick-quote forms --- */
  document.querySelectorAll('.sidebar-form form').forEach(form => handleFormSubmit(form));

});
