/* =========================================================
   ALEAFIATE — "Check eligibility" quiz (check-eligibility.html)
   Builds the quiz into [data-quiz] from STEPS, one question per
   screen, then sends every answer to ActiveCampaign through
   window.aleafiateAC (js/booking.js, which must load first).
   ========================================================= */
(() => {
  const root = document.querySelector('[data-quiz]');
  if (!root) return;

  // ActiveCampaign "Website – Eligibility check" form. Fill in from its Full Embed code: the hidden
  // inputs, and the field[n] name of each custom field. While it is null, answers are not sent anywhere.
  const ACTIVECAMPAIGN = null;
  /* e.g.
  const ACTIVECAMPAIGN = {
    url: 'https://aleafiate.activehosted.com/proc.php', id: '17',
    hidden: { u: '17', f: '17', s: '', c: '0', m: '0', act: 'sub', v: '2', or: '…' },
    fields: { name: 'fullname', email: 'email', phone: 'phone', existing: 'field[13]', condition: 'field[14]',
              treated: 'field[15]', pregnant: 'field[16]', psychosis: 'field[17]', result: 'field[18]' },
    consent: { name: 'field[19][]', value: 'I agree to be contacted and have read the Privacy Policy' }
  }; */

  const PHONE = '07 3473 3396', TEL = 'tel:+61734733396';
  const STEPS = [
    { key: 'existing', q: 'Are you an existing patient?', options: ['Yes', 'No'],
      notes: { Yes: { kind: 'existing', text: '<b>Welcome back!</b> As an existing patient, you can book your next appointment straight away.' } } },
    { key: 'condition', q: 'Firstly, do you have a medical condition that has been causing you distress for 3+ months?',
      hint: 'You must have a medical condition for 3+ months to qualify for treatment through our clinic. Some examples include chronic pain, anxiety, depression, insomnia, migraine.',
      options: ['Yes', 'No'],
      notes: { No: { kind: 'stop', final: true, text: `<b>You are not eligible.</b> Call us for more details on <a href="${TEL}">${PHONE}</a>.` } } },
    { key: 'treated', q: 'Great, and how have you tried treating your condition?',
      hint: 'Under TGA guidelines you must have tried other treatments before alternative options can be considered.',
      options: ['Prescription medication', 'Alternative therapies including (but not limited to) physiotherapy, psychological therapy, chiropractor, naturopath and osteopaths', 'I have not treated my condition'],
      notes: { 'I have not treated my condition': { kind: 'soft', text: `<b>You may not be eligible.</b> Please contact our clinic on <a href="${TEL}">${PHONE}</a> — or continue and we’ll talk it through with you.` } } },
    { key: 'pregnant', q: 'And to check, are you pregnant?', options: ['Yes', 'No'],
      notes: { Yes: { kind: 'stop', final: true, text: `<b>You are not eligible.</b> Call us for more details on <a href="${TEL}">${PHONE}</a>.` } } },
    { key: 'psychosis', q: 'Do you have a history of schizophrenia, bipolar type 1 and 2 disorder or have experienced psychosis?',
      hint: 'Psychosis – a severe mental disorder in which thought and emotions are so impaired that contact is lost with external reality.',
      options: ['Yes', 'No'],
      notes: { Yes: { kind: 'stop', final: true, text: `<b>You are not eligible.</b> Call us for more details on <a href="${TEL}">${PHONE}</a>.` } } },
    { key: 'details', type: 'details', q: 'Last step — where can we reach you?', hint: 'Our team will call you within one business day to talk through your result.' }
  ];
  const RESULT = { eligible: 'Likely eligible', review: 'Needs review', no: 'Not eligible' };

  const $ = (s, c = root) => c.querySelector(s);
  const $$ = (s, c = root) => [...c.querySelectorAll(s)];
  const esc = t => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const CHECK = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 10.5l3.2 3.2L15 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ARROW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
  const BACK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M13 8H3M7 4L3 8l4 4"/></svg>';
  const privacy = document.body.dataset.privacyUrl || 'privacy-policy.html';

  /* ---------- markup ---------- */
  const choiceStep = (s, i) => `
    <fieldset class="qz__step" data-step="${i}" hidden>
      <legend class="qz__q" tabindex="-1">${esc(s.q)}</legend>
      ${s.hint ? `<p class="qz__hint">${esc(s.hint)}</p>` : ''}
      <div class="qz__opts" role="radiogroup">
        ${s.options.map((o, j) => `<label class="qz__opt${o.length > 40 ? ' qz__opt--long' : ''}" style="--i:${j}">
          <input type="radio" name="${s.key}" value="${esc(o)}">
          <span class="qz__key" aria-hidden="true">${String.fromCharCode(65 + j)}</span>
          <span class="qz__label">${esc(o)}</span>
          <span class="qz__tick">${CHECK}</span>
        </label>`).join('')}
      </div>
      ${s.notes ? `<div class="qz__note" hidden role="alert"><p data-qz-note></p><div class="qz__note-actions" data-qz-actions></div></div>` : ''}
    </fieldset>`;
  const field = (n, label, type, ac, err) => `<label class="qz__field"><span>${label} *</span>
      <input name="${n}" type="${type}" autocomplete="${ac}" required${type === 'tel' ? ' inputmode="tel"' : ''}>
      <em class="qz__err">${err}</em></label>`;
  const detailsStep = (s, i) => `
    <fieldset class="qz__step" data-step="${i}" hidden>
      <legend class="qz__q" tabindex="-1">${esc(s.q)}</legend>
      <p class="qz__hint">${esc(s.hint)}</p>
      <div class="qz__fields">
        ${field('name', 'Full name', 'text', 'name', 'Please enter your name')}
        ${field('email', 'Email', 'email', 'email', 'Please enter a valid email')}
        ${field('phone', 'Phone', 'tel', 'tel', 'Please enter a valid phone number')}
      </div>
      <label class="qz__consent"><input type="checkbox" name="consent" required><span>I agree to be contacted and have read the <a href="${privacy}"${privacy.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>Privacy Policy</a>. *</span></label>
    </fieldset>`;

  root.innerHTML = `
    <form class="qz" novalidate>
      <div class="qz__top">
        <button type="button" class="qz__back" data-qz-back aria-label="Previous question">${BACK}<span>Back</span></button>
        <p class="qz__count" aria-live="polite">Step <b data-qz-n>1</b> of ${STEPS.length}</p>
      </div>
      <div class="qz__bar" aria-hidden="true"><span data-qz-bar></span></div>
      <div class="qz__stage">${STEPS.map((s, i) => s.type === 'details' ? detailsStep(s, i) : choiceStep(s, i)).join('')}</div>
      <div class="qz__foot">
        <button type="button" class="qz__btn qz__btn--solid qz__next" data-qz-next><span>Next</span>${ARROW}</button>
        <p class="qz__fine">Free · confidential · takes about 2 minutes</p>
      </div>
    </form>
    <div class="qz-result" hidden aria-live="polite" tabindex="-1"></div>`;

  const form = $('.qz'), steps = $$('.qz__step'), next = $('[data-qz-next]'), back = $('[data-qz-back]');
  const result = $('.qz-result');
  let at = 0, busy = false;

  /* ---------- navigation ---------- */
  const answered = i => STEPS[i].type === 'details' || !!form.elements[STEPS[i].key].value;
  const noteFor = i => STEPS[i].notes && STEPS[i].notes[form.elements[STEPS[i].key].value];
  const stopped = i => !!noteFor(i) && !steps[i].dataset.continue; // a note is showing: the visitor chooses what to do
  const paint = () => {
    $('[data-qz-n]').textContent = at + 1;
    $('[data-qz-bar]').style.width = `${((at + 1) / STEPS.length) * 100}%`;
    back.disabled = at === 0;
    const last = at === STEPS.length - 1;
    next.querySelector('span').textContent = last ? 'See my result' : 'Next';
    next.hidden = !last && (stopped(at) || !answered(at)); // choice steps move on by themselves once answered
    form.classList.toggle('is-last', last);
  };
  const show = (to, dir = 1) => {
    if (busy || to === at || to < 0 || to >= STEPS.length) return;
    busy = true;
    const from = steps[at], into = steps[to];
    from.classList.add(dir > 0 ? 'is-out' : 'is-out-back');
    setTimeout(() => {
      from.hidden = true; from.classList.remove('is-out', 'is-out-back');
      into.hidden = false; into.classList.add(dir > 0 ? 'is-in' : 'is-in-back');
      at = to; paint();
      $('.qz__q', into).focus({ preventScroll: true });
      const top = root.getBoundingClientRect().top;
      if (top < 0) (window.__lenis ? window.__lenis.scrollTo(root, { offset: -110, duration: .8 }) : root.scrollIntoView({ behavior: 'smooth' }));
      setTimeout(() => { into.classList.remove('is-in', 'is-in-back'); busy = false; }, 520);
    }, 280);
  };
  const btn = (cls, attrs, label) => `<${attrs.startsWith('href') ? 'a' : 'button type="button"'} class="qz__btn ${cls}" ${attrs}>${label}</${attrs.startsWith('href') ? 'a' : 'button'}>`;
  steps.forEach((step, i) => {
    const s = STEPS[i]; if (s.type === 'details') return;
    const box = $('.qz__note', step);
    $$('input[type="radio"]', step).forEach(r => r.addEventListener('change', () => {
      delete step.dataset.continue;
      const n = s.notes && s.notes[r.value];
      if (box) {
        box.hidden = !n;
        if (n) {
          box.className = `qz__note qz__note--${n.kind}`;
          $('[data-qz-note]', box).innerHTML = n.text;
          $('[data-qz-actions]', box).innerHTML =
            n.kind === 'existing' ? btn('qz__btn--solid', 'data-qz-book', `Book an appointment ${ARROW}`) + btn('qz__btn--ghost', 'data-qz-continue', 'Continue the check')
            : (n.kind === 'soft' ? '' : btn('qz__btn--solid', `href="${TEL}"`, `Call ${PHONE}`)) + (n.final ? '' : btn('qz__btn--ghost', 'data-qz-continue', 'Continue anyway'));
          const go = $('[data-qz-continue]', box), book = $('[data-qz-book]', box);
          go && go.addEventListener('click', () => { step.dataset.continue = '1'; box.hidden = true; show(i + 1); });
          book && book.addEventListener('click', () => window.aleafiateBook && window.aleafiateBook({ enquiry: 'Book a follow-up' }, book));
        }
      }
      paint();
      if (!n) setTimeout(() => show(i + 1), 380); // pick an answer → next question
    }));
  });
  back.addEventListener('click', () => show(at - 1, -1));
  next.addEventListener('click', () => at === STEPS.length - 1 ? form.requestSubmit() : answered(at) && !stopped(at) && show(at + 1));

  /* ---------- details + submit ---------- */
  const ok = {
    name: v => v.trim().length > 1,
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    phone: v => v.replace(/\D/g, '').length >= 8,
    consent: (v, el) => el.checked
  };
  const check = el => {
    const good = ok[el.name](el.value, el);
    (el.closest('.qz__field') || el.closest('.qz__consent')).classList.toggle('is-error', !good);
    return good;
  };
  const inputs = ['name', 'email', 'phone', 'consent'].map(n => form.elements[n]);
  inputs.forEach(el => {
    el.addEventListener(el.type === 'checkbox' ? 'change' : 'blur', () => el.value && check(el));
    el.addEventListener('input', () => el.closest('.is-error') && check(el));
  });
  const outcome = v => {
    if (v.pregnant === 'Yes' || v.psychosis === 'Yes') return 'no';
    if (v.treated === 'I have not treated my condition') return 'review';
    return 'eligible';
  };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (at !== STEPS.length - 1) return;
    const blocked = STEPS.findIndex(st => st.notes && Object.entries(st.notes).some(([ans, n]) => n.final && form.elements[st.key].value === ans));
    if (blocked > -1) { show(blocked, -1); return; } // a not-eligible answer: back to that question, no submission
    const bad = inputs.filter(el => !check(el));
    if (bad.length) { bad[0].focus(); form.classList.remove('qz--shake'); void form.offsetWidth; form.classList.add('qz--shake'); return; }
    const v = Object.fromEntries(new FormData(form));
    const res = outcome(v);
    if (ACTIVECAMPAIGN && window.aleafiateAC) {
      const ac = ACTIVECAMPAIGN, f = ac.fields;
      const pairs = [[f.name, v.name.trim()], [f.email, v.email.trim()], [f.phone, window.aleafiateAC.phone(v.phone)],
        ...['existing', 'condition', 'treated', 'pregnant', 'psychosis'].map(k => [f[k], v[k] || '']),
        [f.result, RESULT[res]], [ac.consent.name, '~|'], [ac.consent.name, ac.consent.value]];
      next.disabled = true; next.classList.add('is-sending');
      try { await window.aleafiateAC.submit(ac, pairs); }
      catch (err) {
        next.disabled = false; next.classList.remove('is-sending');
        alert(`Sorry, something went wrong sending your answers. Please try again, or call us on ${PHONE}.`);
        return;
      }
    } else if (!ACTIVECAMPAIGN) console.warn('Eligibility quiz: ActiveCampaign is not connected yet (js/eligibility.js), so these answers were not sent.');
    showResult(res, v);
  });

  /* ---------- result ---------- */
  const showResult = (res, v) => {
    const first = esc(v.name.trim().split(/\s+/)[0]);
    const copy = {
      eligible: { icon: 'tick', title: `Great news, ${first} — you may be eligible.`, text: 'With your eligibility check complete, your journey to wellness begins now. Our team will call you within one business day to arrange your free, no-obligation nurse call.', quote: 'This is your moment to rise, reclaim your strength, and move forward with purpose. Wellness isn’t just a destination — it’s the power within you, ready to unfold.', cta: true },
      review: { icon: 'chat', title: `Thanks, ${first} — let’s talk it through.`, text: `Based on your answers, we’ll need to check a few things with you first. Our team will call you within one business day, or you can call us now on <a href="${TEL}">${PHONE}</a>.`, cta: true },
      no: { icon: 'info', title: `Thanks for checking, ${first}.`, text: `Based on your answers, you are not eligible for treatment through our clinic at this time. Please speak with your GP, or call us on <a href="${TEL}">${PHONE}</a> for more details.`, cta: false }
    }[res];
    const icons = {
      tick: '<svg viewBox="0 0 84 84" fill="none" stroke="currentColor" stroke-width="2"><circle cx="42" cy="42" r="40"/><path d="M27 43l10 10 20-22"/></svg>',
      chat: '<svg viewBox="0 0 84 84" fill="none" stroke="currentColor" stroke-width="2"><circle cx="42" cy="42" r="40"/><path d="M26 34h32M26 44h22"/><path d="M30 58l-4 8 12-6"/></svg>',
      info: '<svg viewBox="0 0 84 84" fill="none" stroke="currentColor" stroke-width="2"><circle cx="42" cy="42" r="40"/><path d="M42 38v20"/><path d="M42 27v2"/></svg>'
    };
    result.className = `qz-result qz-result--${res}`;
    result.innerHTML = `
      <span class="qz-result__icon">${icons[copy.icon]}</span>
      <span class="qz-result__tag">${RESULT[res]}</span>
      <h2>${copy.title}</h2>
      <p>${copy.text}</p>
      ${copy.quote ? `<blockquote class="qz-result__quote">${copy.quote}</blockquote>` : ''}
      <div class="qz-result__actions">
        ${copy.cta ? `<button type="button" class="qz__btn qz__btn--solid" data-qz-book>Book your free nurse call ${ARROW}</button>` : `<a class="qz__btn qz__btn--solid" href="${TEL}">Call ${PHONE}</a>`}
        <a class="qz__btn qz__btn--ghost" href="index.html">Back to homepage</a>
      </div>`;
    form.hidden = true; result.hidden = false;
    requestAnimationFrame(() => result.classList.add('is-shown'));
    result.focus({ preventScroll: true });
    if (root.getBoundingClientRect().top < 80) window.__lenis ? window.__lenis.scrollTo(root, { offset: -110, duration: .9 }) : root.scrollIntoView({ behavior: 'smooth' });
    const b = $('[data-qz-book]', result);
    b && b.addEventListener('click', () => window.aleafiateBook && window.aleafiateBook({ name: v.name, email: v.email, phone: v.phone, enquiry: 'Book a free discovery call' }, b));
  };

  form.addEventListener('keydown', e => { if (e.key === 'Enter' && at < STEPS.length - 1 && e.target.type !== 'radio') e.preventDefault(); });
  steps[0].hidden = false; paint();
})();
