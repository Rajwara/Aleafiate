/* =========================================================
   ALEAFIATE — floating "Book appointment" button + pop-up form
   Self-contained: injects its own markup, so a page only needs
     <link rel="stylesheet" href="css/booking.css">
     <script src="js/booking.js"></script>   (before main.js)
   Load it before main.js so main.js upgrades the dropdowns and
   button hover effects. Any element with [data-book] opens the form.
   Requests go to the ActiveCampaign form in ACTIVECAMPAIGN (list, tag,
   custom fields and the admin notification automation are set up there).
   With ACTIVECAMPAIGN set to null, a request opens the visitor's email app
   addressed to BOOKING_EMAIL instead.
   ========================================================= */
(() => {
  const BOOKING_EMAIL = 'admin@aleafiate.com.au';
  // ActiveCampaign "Website – Book appointment" form (ID 16). Values come from its Full Embed code:
  // the hidden inputs, and the field[n] names of the custom fields.
  const ACTIVECAMPAIGN = {
    url: 'https://aleafiate.activehosted.com/proc.php',
    id: '16',
    hidden: { u: '16', f: '16', s: '', c: '0', m: '0', act: 'sub', v: '2', or: '434a74a4-1a20-44ca-b8eb-d25408133419' }, // 'or' changes whenever the form is edited in ActiveCampaign
    fields: { name: 'fullname', phone: 'phone', email: 'email', enquiry: 'field[7]', appointment: 'field[8]', time: 'field[9]', practitioner: 'field[10]', message: 'field[11]' },
    consent: { name: 'field[12][]', value: 'I agree to be contacted and have read the Privacy Policy' },
    // the form has no date field yet: while this is null the preferred date is added to "Anything we should know?"
    // (once a date field is added to the ActiveCampaign form, put its name here, e.g. 'field[19]')
    dateField: null
  };
  const PRIVACY_URL = document.body.dataset.privacyUrl || 'privacy-policy.html'; // a page can link the consent box elsewhere: <body data-privacy-url="…">

  const ARROW = '<svg class="btn__arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 12L12 4M5 4h7v7"/></svg>';
  const CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M9 15l2 2 4-4"/></svg>';
  const X = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3l10 10M13 3L3 13"/></svg>';
  const options = list => list.map(o => `<option value="${o}">${o.replace(' — ', ', ')}</option>`).join(''); // values match ActiveCampaign's options; labels avoid the long dash
  const input = (p, n, label, type, err, ac) =>
    `<div class="field"><input id="${p}-${n}" name="${n}" type="${type}" placeholder=" " required autocomplete="${ac}"><label for="${p}-${n}">${label} *</label><span class="field__bar"></span><span class="field__err">${err}</span></div>`;
  const select = (p, n, label, list) =>
    `<div class="field field--static"><select id="${p}-${n}" name="${n}">${options(list)}</select><label for="${p}-${n}">${label}</label><span class="field__bar"></span></div>`;
  // the booking form + its thank-you state; p = id prefix so the pop-up and an inline copy can share a page
  const formHTML = (p, doneButton) => `
        <form class="bk__form" novalidate>
          ${input(p, 'name', 'Full name', 'text', 'Please enter your name', 'name')}
          <div class="bk__row">
            ${input(p, 'phone', 'Phone', 'tel', 'Enter a valid phone', 'tel')}
            ${input(p, 'email', 'Email', 'email', 'Enter a valid email', 'email')}
          </div>
          ${select(p, 'enquiry', 'How can we help?', ['Book a free discovery call', 'Book an initial consultation', 'Book a follow-up', 'Question about fees', 'Script or pharmacy enquiry', 'Something else'])}
          <div class="bk__row">
            ${select(p, 'appointment', 'Appointment type', ['Not sure yet', 'Telehealth', 'In clinic — Logan Central'])}
            ${select(p, 'time', 'Best time to call', ['Any time', 'Morning (9am – 12pm)', 'Afternoon (12pm – 5pm)'])}
          </div>
          <div class="bk__row">
            ${select(p, 'practitioner', 'Practitioner', ['No preference', 'Dr Frank Guerrera', 'Jeremy Chou (Nurse Practitioner)'])}
            <div class="field field--static field--date"><input id="${p}-date" name="date" type="date" data-date><label for="${p}-date">Preferred date</label><span class="field__bar"></span><span class="field__err">Please choose a weekday from today on</span></div>
          </div>
          <div class="field"><textarea id="${p}-message" name="message" placeholder=" " rows="2"></textarea><label for="${p}-message">Anything we should know?</label><span class="field__bar"></span></div>
          <label class="check"><input type="checkbox" name="consent" value="yes" required><span>I agree to be contacted and have read the <a href="${PRIVACY_URL}"${PRIVACY_URL.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>Privacy Policy</a>. *</span></label>
          <div class="form-error" data-form-error role="alert" hidden></div>
          <div class="captcha"><div data-captcha></div><p class="captcha__err" hidden>Please tick “I’m not a robot”.</p></div>
          <button type="submit" class="btn" data-roll><span class="btn__fill"></span><span class="btn__label">Request appointment</span>${ARROW}</button>
          <p class="bk__alt">Prefer to talk? Call <a href="tel:+61734733396">07 3473 3396</a> · Mon – Fri, 9am – 5pm</p>
        </form>
        <div class="bk__done" hidden aria-live="polite">
          <svg viewBox="0 0 84 84" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="42" cy="42" r="40"/><path d="M27 43l10 10 20-22"/></svg>
          <h3>Thank you.</h3>
          <p data-bk-note>We’ve received your request and will call you within one business day.</p>
          ${doneButton}
        </div>`;

  document.body.insertAdjacentHTML('beforeend', `
  <button class="bk-fab" type="button" data-book aria-haspopup="dialog" aria-controls="bk-dialog">
    <span class="bk-fab__icon" aria-hidden="true">${CAL}</span><span class="bk-fab__label">Book appointment</span>
  </button>
  <div class="bk" data-bk aria-hidden="true">
    <div class="bk__backdrop" data-bk-close></div>
    <div class="bk__panel" id="bk-dialog" role="dialog" aria-modal="true" aria-labelledby="bk-title" data-lenis-prevent>
      <button class="bk__close" type="button" data-bk-close aria-label="Close booking form">${X}</button>
      <div class="bk__head">
        <span class="bk__orb" aria-hidden="true"></span>
        <span class="eyebrow">Free · no obligation</span>
        <h2 id="bk-title">Book an appointment</h2>
        <p>Leave your details and our team will call you back within one business day to confirm a time.</p>
      </div>
      <div class="bk__body">
        ${formHTML('bk', '<button type="button" class="btn btn--ghost" data-bk-close>Close</button>')}
      </div>
    </div>
  </div>`);

  // inline copies of the form: <div data-booking-inline></div> (e.g. the homepage's closing section)
  document.querySelectorAll('[data-booking-inline]').forEach((el, i) => {
    el.classList.add('bk-inline');
    el.innerHTML = formHTML(`bki${i}`, '<button type="button" class="btn btn--ghost" data-bk-again>Send another request</button>');
  });

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const bk = $('[data-bk]'), panel = $('.bk__panel', bk), form = $('.bk__form', bk), done = $('.bk__done', bk), fab = $('.bk-fab');
  const root = document.documentElement;
  let from = null;

  /* ---------- open / close ---------- */
  const open = trigger => {
    from = trigger || document.activeElement;
    bk.classList.add('is-open'); bk.setAttribute('aria-hidden', 'false');
    root.classList.add('bk-open'); window.__lenis && window.__lenis.stop();
    panel.scrollTop = 0;
    setTimeout(() => $('#bk-name').focus({ preventScroll: true }), 350);
  };
  const close = () => {
    if (!bk.classList.contains('is-open')) return;
    bk.classList.remove('is-open'); bk.setAttribute('aria-hidden', 'true');
    root.classList.remove('bk-open'); window.__lenis && window.__lenis.start();
    $$('.dd.is-open', bk).forEach(d => d.classList.remove('is-open'));
    from && from.focus && from.focus({ preventScroll: true });
    if (!done.hidden) setTimeout(() => { form.reset(); form.hidden = false; done.hidden = true; bk.classList.remove('is-done'); $$('select', form).forEach(s => s.dispatchEvent(new Event('change'))); }, 500);
  };
  // other scripts can open the form with some fields pre-filled: aleafiateBook({ enquiry, practitioner, message }, triggerEl)
  window.aleafiateBook = (values = {}, trigger) => {
    Object.entries(values).forEach(([name, v]) => {
      const el = form.elements[name]; if (!el || v == null) return;
      if (el.tagName === 'SELECT') { const o = [...el.options].find(o => o.value === v || o.text === v); if (o) { el.value = o.value; el.dispatchEvent(new Event('change')); } }
      else el.value = v;
    });
    open(trigger);
  };
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-book]');
    if (t) { e.preventDefault(); t.dataset.bookEnquiry ? window.aleafiateBook({ enquiry: t.dataset.bookEnquiry }, t) : open(t); return; } // data-book-enquiry pre-selects 'How can we help?'
    if (e.target.closest('[data-bk-close]')) close();
  });
  addEventListener('keydown', e => {
    if (!bk.classList.contains('is-open')) return;
    if (e.key === 'Escape' && !$('.dd.is-open', bk)) close();
    if (e.key === 'Tab') { // keep focus inside the dialog
      const f = $$('a[href],button:not([tabindex="-1"]),input,textarea', panel).filter(el => el.offsetParent);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- floating button appears once the visitor scrolls ---------- */
  const toggleFab = () => root.classList.toggle('bk-fab-on', fab.classList.toggle('is-visible', scrollY > innerHeight * .6));
  addEventListener('scroll', toggleFab, { passive: true }); toggleFab();
  // the floating button is redundant (and would cover fields) while an inline copy of the form is on screen
  if ('IntersectionObserver' in window) {
    const seen = new Set();
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => en.isIntersecting ? seen.add(en.target) : seen.delete(en.target));
      root.classList.toggle('bk-inline-on', seen.size > 0);
    });
    $$('.bk-inline').forEach(el => io.observe(el));
  }

  /* ---------- reCAPTCHA ----------
     ActiveCampaign's key (from the forms' Full Embed code): ActiveCampaign checks the token when the form
     arrives, so a bot can't skip the box by posting to ActiveCampaign directly. Shared by every form on
     the site through window.aleafiateCaptcha: mount(box), token(box), reset(box), check(box). */
  const RECAPTCHA_SITEKEY = '6LcwIw8TAAAAACP1ysM08EhCgzd6q5JAOUR1a0Go';
  const captcha = (() => {
    const queue = []; let ready = false;
    window.aleafiateRecaptchaReady = () => { ready = true; queue.splice(0).forEach(f => f()); };
    const load = () => {
      if (document.querySelector('script[data-recaptcha]')) return;
      const t = document.createElement('script');
      t.src = 'https://www.google.com/recaptcha/api.js?onload=aleafiateRecaptchaReady&render=explicit';
      t.async = true; t.defer = true; t.dataset.recaptcha = '';
      document.head.appendChild(t);
    };
    const err = el => el.closest('.captcha') && el.closest('.captcha').querySelector('.captcha__err');
    const mount = el => {
      if (!el || el.dataset.widget !== undefined || el.dataset.mounting) return;
      el.dataset.mounting = '1'; load();
      const go = () => {
        el.dataset.widget = window.grecaptcha.render(el, {
          sitekey: RECAPTCHA_SITEKEY, size: el.clientWidth && el.clientWidth < 304 ? 'compact' : 'normal',
          callback: () => { const e = err(el); if (e) e.hidden = true; }
        });
      };
      ready ? go() : queue.push(go);
    };
    const token = el => (el && window.grecaptcha && el.dataset.widget !== undefined) ? window.grecaptcha.getResponse(+el.dataset.widget) : '';
    const reset = el => { if (el && window.grecaptcha && el.dataset.widget !== undefined) window.grecaptcha.reset(+el.dataset.widget); };
    const check = el => { const ok = !!token(el), e = err(el); if (e) e.hidden = ok; return ok; };
    return { mount, token, reset, check };
  })();
  window.aleafiateCaptcha = captcha;

  /* ---------- validation + submit (the pop-up and every inline copy) ---------- */
  const rules = { email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), tel: v => v.replace(/\D/g, '').length >= 7 };
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const dateOk = v => { if (!v) return true; const day = new Date(v + 'T00:00:00').getDay(); return v >= iso(new Date()) && day > 0 && day < 6; }; // optional; weekdays from today
  const niceDate = v => new Date(v + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const check = el => {
    if (el.type === 'date') { const ok = dateOk(el.value); el.closest('.field').classList.toggle('is-error', !ok); return ok; }
    const v = el.value.trim(), ok = el.type === 'checkbox' ? el.checked : !!v && (!rules[el.type] || rules[el.type](v));
    (el.closest('.field') || el.closest('.check')).classList.toggle('is-error', !ok);
    return ok;
  };
  const setup = (form, done, box, scroller) => {
    const req = [...$$('[required]', form), ...$$('[data-date]', form)], cap = $('[data-captcha]', form);
    captcha.mount(cap);
    $$('[data-date]', form).forEach(d => { d.min = iso(new Date()); d.addEventListener('change', () => check(d)); });
    req.forEach(el => el.addEventListener(el.type === 'checkbox' ? 'change' : 'blur', () => check(el)));
    req.forEach(el => el.addEventListener('input', () => el.closest('.is-error') && check(el)));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const bad = req.filter(el => !check(el));
      if (!captcha.check(cap)) bad.push(cap);
      if (bad.length) {
        bad[0].focus && bad[0].focus();
        bad.forEach(el => { const w = el.closest('.field, .check, .captcha'); w.classList.remove('bk-shake'); void w.offsetWidth; w.classList.add('bk-shake'); });
        return;
      }
      const data = new FormData(form);
      if (ACTIVECAMPAIGN) {
        const btn = $('button[type="submit"]', form);
        btn.disabled = true; btn.classList.add('is-sending');
        hideError($('[data-form-error]', form));
        try { await sendToActiveCampaign(data, captcha.token(cap)); }
        catch (err) {
          btn.disabled = false; btn.classList.remove('is-sending'); captcha.reset(cap);
          showError($('[data-form-error]', form), err);
          return;
        }
        btn.disabled = false; btn.classList.remove('is-sending');
      } else {
        const lines = []; data.forEach((v, k) => v && lines.push(`${k}: ${v}`));
        location.href = `mailto:${BOOKING_EMAIL}?subject=${encodeURIComponent('Appointment request')}&body=${encodeURIComponent(lines.join('\n'))}`;
        $('[data-bk-note]', done).textContent = 'Your email app should now open with your request filled in. Just press send.';
      }
      captcha.reset(cap); // a token works once
      // sent: empty every field, then swap the form for the thank-you message
      form.reset();
      $$('.is-error', form).forEach(x => x.classList.remove('is-error'));
      $$('select', form).forEach(x => x.dispatchEvent(new Event('change'))); // custom dropdowns show the reset value
      if (ACTIVECAMPAIGN) { // sent: show the thank-you page (first name kept in this tab only, not in the address)
        try { sessionStorage.setItem('aleafiateThanks', JSON.stringify({ form: 'booking', name: (data.get('name') || '').toString() })); } catch (e) {}
        location.href = 'thank-you.html?form=booking';
        return;
      }
      form.hidden = true; done.hidden = false; box.classList.add('is-done');
      if (scroller) scroller.scrollTop = 0;
      else if (box.getBoundingClientRect().top < 80) { const top = box.closest('.cta__card') || box; window.__lenis ? window.__lenis.scrollTo(top, { offset: -120, duration: .9 }) : top.scrollIntoView({ behavior: 'smooth' }); }
    });
  };
  setup(form, done, bk, panel);
  $$('.bk-inline').forEach(box => {
    const f = $('.bk__form', box), d = $('.bk__done', box);
    setup(f, d, box);
    $('[data-bk-again]', box).addEventListener('click', () => {
      f.reset(); f.hidden = false; d.hidden = true; box.classList.remove('is-done');
      $$('.is-error', f).forEach(x => x.classList.remove('is-error'));
      $$('select', f).forEach(x => x.dispatchEvent(new Event('change')));
    });
  });

  /* ---------- ActiveCampaign ----------
     Sent the way ActiveCampaign's own embed code sends it: a GET to proc.php with jsonp=true, loaded as
     a script. The reply is JavaScript that calls window._show_thank_you / _show_error with the form ID. */
  const auPhone = v => { // ActiveCampaign expects international format (its own form sends +61 …)
    const d = v.replace(/[^\d+]/g, '');
    if (d.startsWith('+')) return d;
    if (d.startsWith('61')) return '+' + d;
    if (d.startsWith('0')) return '+61' + d.slice(1);
    return '+61' + d;
  };
  // generic sender: ac = { url, id, hidden }, pairs = [[ActiveCampaign field name, value], …]
  const acSubmit = (ac, pairs) => new Promise((resolve, reject) => {
    const q = new URLSearchParams(ac.hidden);
    pairs.forEach(([k, v]) => q.append(k, v));
    q.append('jsonp', 'true');
    let settled = false, script;
    const finish = (ok, reason) => {
      if (settled) return; settled = true;
      clearTimeout(timer); script && script.remove();
      const why = (reason || 'Your request was not accepted.').trim();
      ok ? resolve() : reject(new Error(/[.!?]$/.test(why) ? why : why + '.'));
    };
    const text = html => { const d = document.createElement('div'); d.innerHTML = html || ''; return d.textContent.replace(/\s+/g, ' ').trim(); };
    const isOurs = id => String(id) === String(ac.id);
    // replies from proc.php call these globals (the names come from ActiveCampaign's embed code)
    const prev = { ty: window._show_thank_you, err: window._show_error, ferr: window._show_field_error };
    window._show_thank_you = function (id) { isOurs(id) ? finish(true) : prev.ty && prev.ty.apply(this, arguments); };
    // ActiveCampaign's own wording is passed on, e.g. "Please verify your request." or a blocked email domain
    window._show_error = function (id, message, html) { isOurs(id) ? finish(false, [text(message), text(html)].filter(Boolean).join(' ')) : prev.err && prev.err.apply(this, arguments); };
    window._show_field_error = function (id, field, message) { isOurs(id) ? finish(false, text(message)) : prev.ferr && prev.ferr.apply(this, arguments); };
    window._load_script = window._load_script || (url => { const t = document.createElement('script'); t.src = url; document.head.appendChild(t); }); // site-tracking follow-up
    if (navigator.onLine === false) { settled = true; reject(new Error('You appear to be offline. Please check your internet connection.')); return; }
    const timer = setTimeout(() => finish(false, 'Our booking system took too long to respond (timed out after 20 seconds).'), 20000);
    script = document.createElement('script');
    script.src = `${ac.url}?${q.toString().replace(/%0A/g, '%5Cn')}`; // ActiveCampaign wants line breaks as \n
    script.onerror = () => finish(false, 'We couldn’t reach our booking system. Please check your internet connection, or turn off any ad or tracker blocker for this site.');
    document.head.appendChild(script);
  });
  // shows the exact reason a submission failed, inside the form (box = a [data-form-error] element)
  const showError = (box, err) => {
    if (!box) return alert(err && err.message);
    box.innerHTML = '';
    const b = document.createElement('b'); b.textContent = 'Your request couldn’t be sent. ';
    const m = document.createElement('span'); m.textContent = (err && err.message) || 'Something went wrong.';
    const c = document.createElement('span'); c.innerHTML = ' Please try again, or call us on <a href="tel:+61734733396">07 3473 3396</a>.';
    box.append(b, m, c); box.hidden = false;
    box.scrollIntoView && box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };
  const hideError = box => { if (box) { box.hidden = true; box.innerHTML = ''; } };
  // other forms on the site (e.g. the eligibility quiz) send through the same code
  window.aleafiateAC = { submit: acSubmit, phone: auPhone, showError, hideError };

  const sendToActiveCampaign = (data, token) => {
    const ac = ACTIVECAMPAIGN, pairs = [];
    Object.entries(ac.fields).forEach(([ours, theirs]) => {
      let v = (data.get(ours) || '').toString().trim();
      if (ours === 'phone' && v) v = auPhone(v);
      pairs.push([theirs, v]);
    });
    const date = (data.get('date') || '').toString();
    if (date && ac.dateField) pairs.push([ac.dateField, date]); // ActiveCampaign date fields take YYYY-MM-DD
    else if (date) {
      const msg = pairs.find(([k]) => k === ac.fields.message), line = `Preferred date: ${niceDate(date)}`;
      msg[1] = msg[1] ? `${line}\n${msg[1]}` : line;
    }
    pairs.push([ac.consent.name, '~|']); // ActiveCampaign's checkbox fields always send this placeholder first
    if (data.get('consent')) pairs.push([ac.consent.name, ac.consent.value]);
    if (token) pairs.push(['g-recaptcha-response', token]);
    return acSubmit(ac, pairs);
  };
})();
