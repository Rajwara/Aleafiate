/* =========================================================
   ALEAFIATE — "Check eligibility" quiz (check-eligibility.html)
   Builds the quiz into [data-quiz] from STEPS, one big question per
   screen, then sends every answer to ActiveCampaign through
   window.aleafiateAC (js/booking.js, which must load first).
   Step types: 'text' (one large input), 'circles' (round Yes/No
   buttons), 'cards' (icon cards), 'rows' (full-width radio rows),
   'final' (phone + consent, then submit).
   ========================================================= */
(() => {
  const root = document.querySelector('[data-quiz]');
  if (!root) return;

  // ActiveCampaign "Website – Eligibility check" form (ID 17). Values come from its Full Embed code: the
  // hidden inputs, and the field[n] name of each custom field (consent shares the booking form's field 12).
  const ACTIVECAMPAIGN = {
    url: 'https://aleafiate.activehosted.com/proc.php', id: '17',
    hidden: { u: '17', f: '17', s: '', c: '0', m: '0', act: 'sub', v: '2', or: '014a609e-3e39-49ce-b61d-2efc3510ce0b' },
    fields: { name: 'fullname', email: 'email', phone: 'phone', existing: 'field[13]', condition: 'field[14]',
              treated: 'field[15]', pregnant: 'field[16]', psychosis: 'field[17]', result: 'field[18]' },
    consent: { name: 'field[12][]', value: 'I agree to be contacted and have read the Privacy Policy' }
  };

  const PHONE = '07 3473 3396', TEL = 'tel:+61734733396';
  const NOT_ELIGIBLE = `<b>You are not eligible.</b> Call us for more details on <a href="${TEL}">${PHONE}</a>.`;
  const ICON = {
    returning: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="21"/><circle cx="24" cy="19" r="6"/><path d="M13 37c2.5-5 6.5-7.5 11-7.5S32.5 32 35 37"/><path d="M33 9l3 3 6-6"/></svg>',
    new: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="24" cy="24" r="21"/><circle cx="24" cy="19" r="6"/><path d="M13 37c2.5-5 6.5-7.5 11-7.5S32.5 32 35 37"/><path d="M38 6v8M34 10h8"/></svg>'
  };
  // q may be a function of the visitor's first name (asked first, as in the design reference)
  const STEPS = [
    { key: 'name', type: 'text', q: 'First, let’s start with your name.', hint: 'We’ll use this to personalise your check and when our team calls you.',
      input: { type: 'text', autocomplete: 'name', placeholder: 'Type your name (e.g. Jane Smith)', check: v => v.trim().length > 1, err: 'Please enter your name' } },
    { key: 'existing', type: 'cards', q: n => `Thanks, ${n}! Are you an existing patient?`,
      options: [{ value: 'Yes', title: 'Yes, I am', text: 'I’ve seen an Aleafiate practitioner before', icon: ICON.returning },
                { value: 'No', title: 'No, I’m new', text: 'This is my first time with Aleafiate', icon: ICON.new }],
      notes: { Yes: { kind: 'existing', text: '<b>Welcome back!</b> As an existing patient, you can book your next appointment straight away.' } } },
    { key: 'condition', type: 'circles', q: 'Do you have a medical condition that has been causing you distress for 3+ months?',
      hint: 'You must have a medical condition for 3+ months to qualify for treatment through our clinic. Some examples include chronic pain, anxiety, depression, insomnia, migraine.',
      options: ['Yes', 'No'], notes: { No: { kind: 'stop', final: true, text: NOT_ELIGIBLE } } },
    { key: 'treated', type: 'rows', q: 'Great, and how have you tried treating your condition?',
      hint: 'Under TGA guidelines you must have tried other treatments before alternative options can be considered.',
      options: ['Prescription medication', 'Alternative therapies including (but not limited to) physiotherapy, psychological therapy, chiropractor, naturopath and osteopaths', 'I have not treated my condition'],
      notes: { 'I have not treated my condition': { kind: 'soft', text: `<b>You may not be eligible.</b> Please contact our clinic on <a href="${TEL}">${PHONE}</a> — or continue and we’ll talk it through with you.` } } },
    { key: 'pregnant', type: 'circles', q: 'And to check, are you pregnant?', options: ['Yes', 'No'],
      notes: { Yes: { kind: 'stop', final: true, text: NOT_ELIGIBLE } } },
    { key: 'psychosis', type: 'circles', q: 'Do you have a history of schizophrenia, bipolar type 1 and 2 disorder or have experienced psychosis?',
      hint: 'Psychosis – a severe mental disorder in which thought and emotions are so impaired that contact is lost with external reality.',
      options: ['Yes', 'No'], notes: { Yes: { kind: 'stop', final: true, text: NOT_ELIGIBLE } } },
    { key: 'email', type: 'text', q: n => `Almost there, ${n}. What’s your email?`, hint: 'We’ll only use it to contact you about your appointment.',
      input: { type: 'email', autocomplete: 'email', placeholder: 'Type your email (e.g. jane@email.com)', check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), err: 'Please enter a valid email' } },
    { key: 'phone', type: 'final', q: 'And the best number to call you on?', hint: 'Our team will call you within one business day to talk through your result.',
      input: { type: 'tel', autocomplete: 'tel', placeholder: 'Type your phone number (e.g. 0412 345 678)', check: v => v.replace(/\D/g, '').length >= 8, err: 'Please enter a valid phone number' } }
  ];
  const RESULT = { eligible: 'Likely eligible', review: 'Needs review', no: 'Not eligible' };

  const $ = (s, c = root) => c.querySelector(s);
  const $$ = (s, c = root) => [...c.querySelectorAll(s)];
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ARROW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
  const BACK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M13 8H3M7 4L3 8l4 4"/></svg>';
  const privacy = document.body.dataset.privacyUrl || 'privacy-policy.html';

  /* ---------- markup ---------- */
  const opt = (s, o, j) => {
    const v = typeof o === 'string' ? o : o.value;
    const inner = s.type === 'cards' ? `<span class="qz__icon" aria-hidden="true">${o.icon}</span><b>${esc(o.title)}</b><small>${esc(o.text)}</small>`
      : s.type === 'rows' ? `<span class="qz__radio" aria-hidden="true"></span><span>${esc(v)}</span>` : `<span>${esc(v)}</span>`;
    return `<label class="qz__opt" style="--i:${j}"><input type="radio" name="${s.key}" value="${esc(v)}">${inner}</label>`;
  };
  const stepHTML = (s, i) => `
    <fieldset class="qz__step qz__step--${s.type}" data-step="${i}" hidden>
      <legend class="qz__q" tabindex="-1" data-q></legend>
      ${s.hint ? `<p class="qz__hint">${esc(s.hint)}</p>` : ''}
      ${s.input ? `<div class="qz__input"><input name="${s.key}" type="${s.input.type}" autocomplete="${s.input.autocomplete}" placeholder="${esc(s.input.placeholder)}"${s.input.type === 'tel' ? ' inputmode="tel"' : ''} aria-label="${esc(s.input.placeholder)}"><em class="qz__err">${s.input.err}</em></div>` : ''}
      ${s.type === 'final' ? `<label class="qz__consent"><input type="checkbox" name="consent"><span>I agree to be contacted and have read the <a href="${privacy}"${privacy.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>Privacy Policy</a>.</span></label><div class="captcha qz__captcha"><div data-captcha></div><p class="captcha__err" hidden>Please tick “I’m not a robot”.</p></div>` : ''}
      ${s.options ? `<div class="qz__opts qz__opts--${s.type}" role="radiogroup">${s.options.map((o, j) => opt(s, o, j)).join('')}</div>` : ''}
      ${s.notes ? `<div class="qz__note" hidden role="alert"><p data-qz-note></p><div class="qz__note-actions" data-qz-actions></div></div>` : ''}
      ${s.input ? `<button type="button" class="qz__btn qz__btn--solid qz__go" data-qz-go><span>${s.type === 'final' ? 'See my result' : 'Continue'}</span>${ARROW}</button>` : ''}
    </fieldset>`;

  root.innerHTML = `
    <form class="qz" novalidate>
      <div class="qz__top">
        <button type="button" class="qz__back" data-qz-back aria-label="Previous question">${BACK}<span>Back</span></button>
        <p class="qz__count" aria-live="polite">Question <b data-qz-n>1</b> of ${STEPS.length}</p>
      </div>
      <div class="qz__stage">${STEPS.map(stepHTML).join('')}</div>
      <p class="qz__fine">Free · confidential · takes about 2 minutes</p>
    </form>
    <div class="qz-result" hidden aria-live="polite" tabindex="-1"></div>`;

  const form = $('.qz'), steps = $$('.qz__step'), back = $('[data-qz-back]'), result = $('.qz-result');
  const bar = document.querySelector('[data-qz-bar]');
  let at = 0, busy = false;
  const first = () => esc((form.elements.name.value.trim().split(/\s+/)[0] || 'there').replace(/^./, c => c.toUpperCase()));
  const val = k => { const el = form.elements[k]; return el ? (el.value || '') : ''; };

  /* ---------- navigation ---------- */
  const paint = () => {
    $('[data-qz-n]').textContent = at + 1;
    if (bar) bar.style.width = `${((at + 1) / STEPS.length) * 100}%`;
    back.disabled = at === 0;
    const s = STEPS[at];
    $('[data-q]', steps[at]).innerHTML = typeof s.q === 'function' ? s.q(first()) : esc(s.q);
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
      window.aleafiateCaptcha && window.aleafiateCaptcha.mount($('[data-captcha]', into));
      const field = $('.qz__input input', into);
      field ? field.focus({ preventScroll: true }) : $('.qz__q', into).focus({ preventScroll: true });
      if (root.getBoundingClientRect().top < 0) window.__lenis ? window.__lenis.scrollTo(root, { offset: -140, duration: .8 }) : root.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => { into.classList.remove('is-in', 'is-in-back'); busy = false; }, 560);
    }, 260);
  };
  back.addEventListener('click', () => show(at - 1, -1));

  const btn = (cls, attrs, label) => attrs.startsWith('href') ? `<a class="qz__btn ${cls}" ${attrs}>${label}</a>` : `<button type="button" class="qz__btn ${cls}" ${attrs}>${label}</button>`;
  steps.forEach((step, i) => {
    const s = STEPS[i];
    if (s.options) {
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
            book && book.addEventListener('click', () => window.aleafiateBook && window.aleafiateBook({ name: form.elements.name.value, enquiry: 'Book a follow-up' }, book));
          }
        }
        if (!n) setTimeout(() => show(i + 1), 380); // pick an answer → next question
      }));
    }
    if (s.input) {
      const el = $('.qz__input input', step), wrap = el.parentNode;
      const ok = () => {
        const good = s.input.check(el.value);
        wrap.classList.toggle('is-error', !good);
        if (s.type !== 'final') return good;
        const c = form.elements.consent;
        c.closest('.qz__consent').classList.toggle('is-error', !c.checked);
        const human = !window.aleafiateCaptcha || window.aleafiateCaptcha.check($('[data-captcha]', step));
        return good && c.checked && human;
      };
      el.addEventListener('input', () => { wrap.classList.toggle('has-value', !!el.value.trim()); if (wrap.classList.contains('is-error')) wrap.classList.toggle('is-error', !s.input.check(el.value)); });
      const go = () => {
        if (!ok()) { step.classList.remove('qz--shake'); void step.offsetWidth; step.classList.add('qz--shake'); (wrap.classList.contains('is-error') ? el : form.elements.consent).focus(); return; }
        s.type === 'final' ? submit() : show(i + 1);
      };
      $('[data-qz-go]', step).addEventListener('click', go);
      el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    }
  });
  form.elements.consent.addEventListener('change', e => e.target.checked && e.target.closest('.qz__consent').classList.remove('is-error'));
  form.addEventListener('submit', e => e.preventDefault());

  /* ---------- submit ---------- */
  const outcome = v => {
    if (v.pregnant === 'Yes' || v.psychosis === 'Yes') return 'no';
    if (v.treated === 'I have not treated my condition') return 'review';
    return 'eligible';
  };
  const submit = async () => {
    // never send a not-eligible (or missing) answer, even one changed after moving on: go back to that question
    const blocked = STEPS.findIndex(st => st.options && (!val(st.key) || (st.notes && Object.entries(st.notes).some(([ans, n]) => n.final && val(st.key) === ans))));
    if (blocked > -1) { show(blocked, -1); return; }
    const v = Object.fromEntries(new FormData(form));
    const res = outcome(v), b = $('[data-qz-go]', steps[at]);
    if (ACTIVECAMPAIGN && window.aleafiateAC) {
      const ac = ACTIVECAMPAIGN, f = ac.fields;
      const pairs = [[f.name, v.name.trim()], [f.email, v.email.trim()], [f.phone, window.aleafiateAC.phone(v.phone)],
        ...['existing', 'condition', 'treated', 'pregnant', 'psychosis'].map(k => [f[k], v[k] || '']),
        [f.result, RESULT[res]], [ac.consent.name, '~|'], [ac.consent.name, ac.consent.value]];
      const cap = $('[data-captcha]', steps[at]), token = window.aleafiateCaptcha ? window.aleafiateCaptcha.token(cap) : '';
      if (token) pairs.push(['g-recaptcha-response', token]);
      b.disabled = true; b.classList.add('is-sending');
      try { await window.aleafiateAC.submit(ac, pairs); window.aleafiateCaptcha && window.aleafiateCaptcha.reset(cap); }
      catch (err) {
        window.aleafiateCaptcha && window.aleafiateCaptcha.reset(cap);
        b.disabled = false; b.classList.remove('is-sending');
        alert(`Sorry, something went wrong sending your answers. Please try again, or call us on ${PHONE}.`);
        return;
      }
    }
    showResult(res, v);
  };

  /* ---------- result ---------- */
  const showResult = (res, v) => {
    const name = first();
    const copy = {
      eligible: { icon: 'tick', title: `Great news, ${name} — you may be eligible.`, text: 'With your eligibility check complete, your journey to wellness begins now. Our team will call you within one business day to arrange your free, no-obligation nurse call.', quote: 'This is your moment to rise, reclaim your strength, and move forward with purpose. Wellness isn’t just a destination — it’s the power within you, ready to unfold.', cta: true },
      review: { icon: 'chat', title: `Thanks, ${name} — let’s talk it through.`, text: `Based on your answers, we’ll need to check a few things with you first. Our team will call you within one business day, or you can call us now on <a href="${TEL}">${PHONE}</a>.`, cta: true },
      no: { icon: 'info', title: `Thanks for checking, ${name}.`, text: `Based on your answers, you are not eligible for treatment through our clinic at this time. Please speak with your GP, or call us on <a href="${TEL}">${PHONE}</a> for more details.`, cta: false }
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
    if (bar) bar.style.width = '100%';
    requestAnimationFrame(() => result.classList.add('is-shown'));
    result.focus({ preventScroll: true });
    if (root.getBoundingClientRect().top < 80) window.__lenis ? window.__lenis.scrollTo(root, { offset: -140, duration: .9 }) : root.scrollIntoView({ behavior: 'smooth' });
    const b = $('[data-qz-book]', result);
    b && b.addEventListener('click', () => window.aleafiateBook && window.aleafiateBook({ name: v.name, email: v.email, phone: v.phone, enquiry: 'Book a free discovery call' }, b));
  };

  steps[0].hidden = false; paint();
})();
