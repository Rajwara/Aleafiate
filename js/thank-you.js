/* =========================================================
   ALEAFIATE — thank-you page (thank-you.html)
   The booking forms and the eligibility quiz send visitors here after a
   successful submission: thank-you.html?form=booking, or
   thank-you.html?form=eligibility&result=eligible|review.
   The visitor's first name (and, after the quiz, their contact details for
   the booking form) come from sessionStorage, never from the address, so
   they don't end up in analytics or browser history.
   ========================================================= */
(() => {
  const $ = s => document.querySelector(s);
  const q = new URLSearchParams(location.search);
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem('aleafiateThanks') || '{}'); } catch (e) {}
  const form = q.get('form') || saved.form || 'booking', result = q.get('result') || saved.result;
  const name = (saved.name || '').trim().split(/\s+/)[0].replace(/^./, c => c.toUpperCase());
  const set = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; };
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const who = name ? `, ${esc(name)}` : '';
  const tel = '<a href="tel:+61734733396">07 3473 3396</a>';

  if (form === 'eligibility' && result === 'review') {
    set('[data-ty-tag]', 'Needs review'); $('[data-ty-tag]').dataset.tone = 'review';
    set('[data-ty-title]', `Thanks${who}. Let’s talk it through.`);
    set('[data-ty-lead]', `Based on your answers, we’ll need to check a few things with you first. Our team will call you within one business day, or you can call us now on ${tel}.`);
    set('[data-ty-step1]', 'Our team reviews your eligibility answers.');
  } else if (form === 'eligibility') {
    set('[data-ty-tag]', 'Likely eligible');
    set('[data-ty-title]', `Great news${who}! You may be eligible.`);
    set('[data-ty-lead]', 'With your eligibility check complete, your journey to wellness begins now. Our team will call you within one business day to arrange your free, no-obligation nurse call.');
    const quote = $('[data-ty-quote]');
    quote.textContent = 'This is your moment to rise, reclaim your strength, and move forward with purpose. Wellness isn’t just a destination. It’s the power within you, ready to unfold.';
    quote.hidden = false;
    set('[data-ty-step1]', 'Our team reviews your eligibility answers.');
  } else {
    set('[data-ty-tag]', 'Request received');
    set('[data-ty-title]', `Thank you${who}.`);
    set('[data-ty-lead]', `We’ve received your appointment request. Our team will call you within one business day to confirm a time. Prefer to talk now? Call ${tel}.`);
    set('[data-ty-step1]', 'Our team reviews your appointment request.');
  }

  // Google Tag Manager: the conversion event (form name and result only, never personal details)
  // only once per real submission: not on a reload, or when the page is opened directly
  window.dataLayer = window.dataLayer || [];
  if (saved.form && !saved.counted) {
    window.dataLayer.push({ event: 'form_submit_success', form_name: form, form_result: form === 'eligibility' ? (result || '') : '' });
    try { sessionStorage.setItem('aleafiateThanks', JSON.stringify({ ...saved, counted: true })); } catch (e) {}
  }

  // after the quiz: offer the booking form, filled in with what they already entered
  if (form === 'eligibility') {
    const book = $('[data-ty-book]'), home = $('[data-ty-home]');
    book.hidden = false; home.className = 'ty__btn ty__btn--ghost';
    book.addEventListener('click', () => window.aleafiateBook && window.aleafiateBook({ name: saved.name, email: saved.email, phone: saved.phone, enquiry: 'Book a free discovery call' }, book));
  }
})();
