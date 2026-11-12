/* =========================================================
   Inner pages v2 (about-v2, pricing, how-it-works): animations
   - [data-a] reveal on scroll (up / left / right / scale), staggered with --i
   - .split headings: words rise in one after another
   - [data-num] numbers count up when they come into view
   - [data-parallax] images drift as the page scrolls (GSAP)
   - .ph__media hero image opens out as you scroll (GSAP)
   - .ptl timeline line fills as you scroll; steps light up
   - .phw sticky photo changes with the step in view
   - .fq__item accordion
   Everything is skipped for visitors who prefer reduced motion.
   ========================================================= */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  // split headings into words
  $$('.split').forEach(el => {
    let i = 0;
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const w = document.createElement('span'); w.className = 'w';
          const inner = document.createElement('span'); inner.className = 'wi'; inner.textContent = part; inner.style.setProperty('--i', i++);
          w.appendChild(inner); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
    walk(el);
  });

  // reveal + count-up
  const countUp = el => {
    const end = parseFloat(el.dataset.num), dec = (el.dataset.num.split('.')[1] || '').length, pre = el.dataset.pre || '', t0 = performance.now(), dur = 1400;
    if (reduce) { el.textContent = pre + end.toFixed(dec); return; }
    const tick = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = pre + (end * e).toFixed(dec); if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
  const targets = $$('[data-a], .split, [data-num]');
  if (!('IntersectionObserver' in window) || reduce) targets.forEach(el => { el.classList.add('is-in'); if (el.dataset.num) countUp(el); });
  else {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in'); if (e.target.dataset.num) countUp(e.target); io.unobserve(e.target);
    }), { threshold: .15, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(el => io.observe(el));
  }

  // FAQ accordion
  $$('.fq__item').forEach(item => {
    const q = item.querySelector('.fq__q');
    q.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      $$('.fq__item.is-open').forEach(o => { if (o !== item) { o.classList.remove('is-open'); o.querySelector('.fq__q').setAttribute('aria-expanded', 'false'); } });
      item.classList.toggle('is-open', open); q.setAttribute('aria-expanded', open);
      window.ScrollTrigger && setTimeout(() => ScrollTrigger.refresh(), 550);
    });
  });

  // how it works: sticky photo follows the step in view
  const phw = document.querySelector('.phw');
  if (phw && 'IntersectionObserver' in window) {
    const steps = $$('.phw__step', phw), imgs = $$('.phw__stage img', phw), num = phw.querySelector('[data-phw-num]'), bar = phw.querySelector('.phw__bar i');
    const set = k => {
      steps.forEach((s, j) => s.classList.toggle('is-on', j === k));
      imgs.forEach((im, j) => im.classList.toggle('is-on', j === k));
      if (num) num.textContent = String(k + 1).padStart(2, '0');
      if (bar) bar.style.transform = `scaleX(${(k + 1) / steps.length})`;
    };
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) set(steps.indexOf(e.target)); }), { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(s => io.observe(s)); set(0);
  }

  // GSAP scroll effects
  window.addEventListener('load', () => {
    if (reduce || !window.gsap || !window.ScrollTrigger) {
      $$('.ptl__step').forEach(s => s.classList.add('is-on'));
      $$('.ptl__line i').forEach(l => l.style.transform = 'none');
      $$('.ph__media').forEach(m => m.style.clipPath = 'inset(0 0 0 0 round 32px)');
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    $$('[data-parallax]').forEach(img => gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
    $$('.ph__media').forEach(m => gsap.to(m, { clipPath: 'inset(0 0% 0 0% round 32px)', ease: 'none', scrollTrigger: { trigger: m, start: 'top 90%', end: 'top 25%', scrub: true } }));
    $$('.ptl').forEach(tl => {
      const steps = $$('.ptl__step', tl);
      gsap.to(tl.querySelector('.ptl__line i'), {
        scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: tl, start: 'top 75%', end: 'bottom 60%', scrub: true,
          onUpdate: self => steps.forEach((s, k) => s.classList.toggle('is-on', self.progress >= k / steps.length - .001)) }
      });
    });
    ScrollTrigger.refresh();
  });
})();
