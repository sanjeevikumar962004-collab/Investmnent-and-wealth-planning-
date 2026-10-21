(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Text splitting ---------- */
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    el.setAttribute('aria-label', text.replace(/ /g, ' '));
    let i = 0;
    text.split(/(\s+| )/).forEach(part => {
      if (/^(\s+| )$/.test(part)) { el.appendChild(document.createTextNode(' ')); return; }
      const word = document.createElement('span');
      word.style.display = 'inline-block';
      word.style.whiteSpace = 'nowrap';
      word.setAttribute('aria-hidden', 'true');
      [...part].forEach(c => {
        const s = document.createElement('span');
        s.className = 'ch';
        s.textContent = c;
        s.style.transitionDelay = (i++ * 28) + 'ms';
        word.appendChild(s);
      });
      el.appendChild(word);
    });
  }

  function splitWords(el) {
    const text = el.textContent.trim();
    el.textContent = '';
    el.setAttribute('aria-label', text);
    text.split(/\s+/).forEach((w, i) => {
      const wrap = document.createElement('span');
      wrap.className = 'wd-wrap';
      wrap.setAttribute('aria-hidden', 'true');
      const s = document.createElement('span');
      s.className = 'wd';
      s.textContent = w;
      s.style.transitionDelay = (i * 70) + 'ms';
      wrap.appendChild(s);
      el.appendChild(wrap);
      el.appendChild(document.createTextNode(' '));
    });
  }

  $$('[data-split="chars"]').forEach(splitChars);
  $$('[data-split="words"]').forEach(splitWords);

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const d = parseInt(el.dataset.delay || '0', 10);
      setTimeout(() => el.classList.add('in'), d);
      if (el.classList.contains('stat')) runCount(el);
      io.unobserve(el);
    });
  }, { threshold: .02, rootMargin: '0px 0px 60px 0px' });

  $$('.reveal, [data-split]').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top <= window.innerHeight + 60) {
      const d = parseInt(el.dataset.delay || '0', 10);
      setTimeout(() => el.classList.add('in'), d);
      if (el.classList.contains('stat')) runCount(el);
    } else {
      io.observe(el);
    }
  });
  $$('.hero-title .line').forEach(l => io.observe(l));

  /* ---------- Count up ---------- */
  function runCount(stat) {
    const n = $('.count', stat);
    if (!n || n.dataset.done) return;
    n.dataset.done = '1';
    const to = +n.dataset.to;
    if (reduce) { n.textContent = to; return; }
    const dur = 1600, t0 = performance.now();
    const tick = t => {
      const p = Math.min((t - t0) / dur, 1);
      n.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  if (reduce) $$('.count').forEach(n => n.textContent = n.dataset.to);

  /* ---------- Rotating typewriter word (home) ---------- */
  const rot = $('#rotator');
  const words = ['layer by layer.', 'goal by goal.', 'month by month.', 'with confidence.'];
  if (rot) {
    if (reduce) { rot.textContent = words[0]; }
    else {
      let w = 0, c = 0, del = false;
      const type = () => {
        const word = words[w];
        rot.textContent = word.slice(0, c);
        if (!del && c === word.length) { del = true; return setTimeout(type, 1700); }
        if (del && c === 0) { del = false; w = (w + 1) % words.length; return setTimeout(type, 350); }
        c += del ? -1 : 1;
        setTimeout(type, del ? 38 : 80);
      };
      setTimeout(type, 1500);
    }
  }

  /* ---------- Nav ---------- */
  const nav = $('#nav'), burger = $('#burger'), links = $('#navLinks');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', scrollY > 30);
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  if (burger && links) {
    burger.addEventListener('click', () => {
      const open = burger.classList.toggle('open');
      links.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('a', links).forEach(a => a.addEventListener('click', () => {
      burger.classList.remove('open'); links.classList.remove('open');
    }));
  }

  /* ---------- Cursor glow + card spotlight ---------- */
  const glow = $('.glow');
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    addEventListener('pointermove', e => {
      if (!glow) return;
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    }, { passive: true });
    $$('.card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        card.style.setProperty('--mx', x + 'px');
        card.style.setProperty('--my', y + 'px');
        card.style.transform = `perspective(900px) rotateX(${((y / r.height) - .5) * -5}deg) rotateY(${((x / r.width) - .5) * 5}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  } else if (glow) { glow.style.display = 'none'; }

  /* ---------- SIP calculator (home) ---------- */
  const amt = $('#amt'), rate = $('#rate'), yrs = $('#yrs');
  if (amt && rate && yrs) {
    const fmt = n => '₹' + Math.round(n).toLocaleString('en-IN');
    const compact = n => {
      if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr';
      if (n >= 1e5) return '₹' + (n / 1e5).toFixed(2) + ' L';
      return fmt(n);
    };
    const fill = el => el.style.setProperty('--p', ((el.value - el.min) / (el.max - el.min) * 100) + '%');
    const calc = () => {
      const P = +amt.value, r = +rate.value / 100 / 12, n = +yrs.value * 12;
      const fv = P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
      const inv = P * n, gain = fv - inv;
      $('#amtOut').textContent = fmt(P);
      $('#rateOut').textContent = rate.value + '%';
      $('#yrsOut').textContent = yrs.value + (+yrs.value === 1 ? ' year' : ' years');
      $('#total').textContent = compact(fv);
      $('#invested').textContent = compact(inv);
      $('#gains').textContent = compact(gain);
      const share = (inv / fv) * 100;
      $('#donut').style.strokeDasharray = `${share} ${100 - share}`;
      [amt, rate, yrs].forEach(fill);
    };
    [amt, rate, yrs].forEach(el => el.addEventListener('input', calc));
    calc();
  }

  /* ---------- Forms (contact, home, newsletter) ---------- */
  $$('form.form').forEach(form => {
    const note = $('.form-note', form);
    const newsletter = form.classList.contains('newsletter');

    // Live validation clearing on input and blur
    $$('input, select, textarea', form).forEach(input => {
      const validateInput = () => {
        let bad = false;
        const val = input.value.trim();
        if (input.hasAttribute('required')) {
          if (input.type === 'checkbox') bad = !input.checked;
          else if (!val) bad = true;
          else if (input.type === 'tel' && !/^[0-9+\-\s]{10,15}$/.test(val)) bad = true;
          else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) bad = true;
        } else if (val) {
          if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) bad = true;
          else if (input.type === 'tel' && !/^[0-9+\-\s]{10,15}$/.test(val)) bad = true;
        }
        input.classList.toggle('err', bad);
        input.classList.toggle('valid', !bad && !!val);
        return !bad;
      };

      input.addEventListener('input', () => {
        if (input.classList.contains('err')) validateInput();
      });
      input.addEventListener('blur', validateInput);
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;
      $$('input, select, textarea', form).forEach(i => {
        let bad = false;
        const val = i.value.trim();
        if (i.hasAttribute('required')) {
          if (i.type === 'checkbox') bad = !i.checked;
          else if (!val) bad = true;
          else if (i.type === 'tel' && !/^[0-9+\-\s]{10,15}$/.test(val)) bad = true;
          else if (i.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) bad = true;
        } else if (val) {
          if (i.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) bad = true;
          else if (i.type === 'tel' && !/^[0-9+\-\s]{10,15}$/.test(val)) bad = true;
        }
        i.classList.toggle('err', bad);
        i.classList.toggle('valid', !bad && !!val);
        if (bad) ok = false;
      });
      if (!ok) {
        if (note) {
          note.style.color = '#ff9a9a';
          note.textContent = newsletter ? 'Please enter a valid email address.' : 'Please complete the required fields with valid details.';
        }
        return;
      }
      if (note) {
        note.style.color = 'var(--accent)';
        note.textContent = newsletter ? 'Thanks for subscribing. We will send monthly wealth notes.' : 'Thank you. We will contact you within one working day.';
      }
      form.reset();
      $$('.valid', form).forEach(el => el.classList.remove('valid'));
    });
  });

  /* ---------- Blog filter + search ---------- */
  const posts = $$('#posts .post');
  if (posts.length) {
    const chips = $$('.chip[data-filter]');
    const search = $('#blogSearch');
    const empty = $('#blogEmpty');
    let cat = 'all';
    const apply = () => {
      const q = (search ? search.value : '').trim().toLowerCase();
      let shown = 0;
      posts.forEach(p => {
        const matchCat = cat === 'all' || p.dataset.cat === cat;
        const matchQ = !q || p.textContent.toLowerCase().includes(q);
        const show = matchCat && matchQ;
        p.hidden = !show;
        if (show) { shown++; p.classList.add('in'); }
      });
      if (empty) empty.hidden = shown > 0;
    };
    chips.forEach(c => c.addEventListener('click', () => {
      chips.forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      cat = c.dataset.filter;
      apply();
    }));
    if (search) search.addEventListener('input', apply);
  }

  /* ---------- FAQ: one open at a time ---------- */
  $$('.faq').forEach(group => {
    const items = $$('details', group);
    items.forEach(d => d.addEventListener('toggle', () => {
      if (d.open) items.forEach(o => { if (o !== d) o.open = false; });
    }));
  });

  /* ---------- Article: reading progress + table of contents ---------- */
  const bar = $('#progress');
  const prose = $('.prose');
  if (bar && prose) {
    const upd = () => {
      const r = prose.getBoundingClientRect();
      const total = r.height - innerHeight * .6;
      const done = Math.min(Math.max(-r.top + innerHeight * .2, 0), Math.max(total, 1));
      bar.style.width = (done / Math.max(total, 1) * 100) + '%';
    };
    addEventListener('scroll', upd, { passive: true });
    addEventListener('resize', upd);
    upd();
  }
  const toc = $$('.toc a');
  if (toc.length) {
    const map = new Map(toc.map(a => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) {
          toc.forEach(a => a.classList.remove('active'));
          const a = map.get(e.target.id);
          if (a) a.classList.add('active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    map.forEach((_, id) => { const h = document.getElementById(id); if (h) spy.observe(h); });
  }

  /* ---------- Footer year ---------- */
  $$('#yr').forEach(y => { y.textContent = new Date().getFullYear(); });
})();