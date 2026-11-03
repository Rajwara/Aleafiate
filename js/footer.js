/* =========================================================
   ALEAFIATE — footer newsletter (every page with the site footer)
   Sends to the ActiveCampaign form "Website – Newsletter" through js/booking.js
   (window.aleafiateAC, window.aleafiateCaptcha), so load it after booking.js.
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const news = $('[data-news]');
  // ActiveCampaign "Website – Newsletter" form (ID 18), sent through js/booking.js (window.aleafiateAC)
  const NEWSLETTER_AC = { url: 'https://aleafiate.activehosted.com/proc.php', id: '18',
    hidden: { u: '18', f: '18', s: '', c: '0', m: '0', act: 'sub', v: '2', or: '1dbc94dc-2e26-413a-a8c6-86cf567e1298' } }; // 'or' changes whenever the form is edited in ActiveCampaign
  // reCAPTCHA (js/booking.js): the box appears once someone starts on the email field
  const newsCap = news && $('.fv2__captcha', news), newsBox = newsCap && $('[data-captcha]', newsCap);
  const showNewsCap = () => { if (!newsCap || !window.aleafiateCaptcha) return; newsCap.hidden = false; window.aleafiateCaptcha.mount(newsBox); };
  if (news) news.elements.email.addEventListener('focus', showNewsCap);
  if (news) news.addEventListener('submit', async e => {
    e.preventDefault();
    const input = news.elements.email, msg = $('.fv2__msg', news), btn = $('button', news), v = input.value.trim();
    const say = (text, ok) => { msg.textContent = text; msg.classList.toggle('is-ok', ok); msg.classList.toggle('is-error', !ok); };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { say('Please enter a valid email address.', false); input.focus(); return; }
    showNewsCap();
    if (window.aleafiateCaptcha && !window.aleafiateCaptcha.check(newsBox)) { say('', true); return; }
    btn.disabled = true; btn.style.opacity = '.6'; say('Subscribing…', true);
    const token = window.aleafiateCaptcha ? window.aleafiateCaptcha.token(newsBox) : '';
    try {
      await window.aleafiateAC.submit(NEWSLETTER_AC, token ? [['email', v], ['g-recaptcha-response', token]] : [['email', v]]);
      say('Thanks for subscribing! Look out for our next update.', true);
      news.reset();
    } catch (err) { say(`Couldn’t subscribe: ${err && err.message ? err.message : 'something went wrong.'} Please try again.`, false); }
    window.aleafiateCaptcha && window.aleafiateCaptcha.reset(newsBox);
    btn.disabled = false; btn.style.opacity = '';
  });
  const yr = $('[data-year]'); if (yr) yr.textContent = new Date().getFullYear();
})();
