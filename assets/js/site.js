/* Harshal Rathod — motion layer (GSAP + ScrollTrigger + Lenis) */
(function () {
  const $ = (q, c = document) => c.querySelector(q)
  const $$ = (q, c = document) => [...c.querySelectorAll(q)]
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches

  /* old one-page hash links → new pages */
  const OLD = { 'mytransactions-cs': 'my-transactions', 'dashboard-cs': 'dashboard-revamp', 'gpa-cs': 'group-personal-accident',
    'kodo-north-cs': 'kodo-north', 'payments-cs': 'vendor-payments', 'member-cs': 'teams-redesign', 'login-cs': 'login',
    'apply-pan-cs': 'apply-pan', 'claim-cs': 'claim-settlement', 'fimoney-cs': 'fi-money' }
  const h = location.hash.slice(1)
  if (OLD[h]) { location.replace('work/' + OLD[h] + '.html'); return }
  if (h === 'resume') { location.replace('harshal-rathod-resume.pdf'); return }

  /* nav */
  const nav = $('.nav')
  const onScroll = () => nav && nav.classList.toggle('is-solid', scrollY > 40)
  addEventListener('scroll', onScroll, { passive: true }); onScroll()

  /* clock */
  const clock = $('[data-clock]')
  const tick = () => { if (clock) clock.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date()) }
  tick(); setInterval(tick, 20000)

  /* copy email */
  $$('[data-copy]').forEach(el => el.addEventListener('click', e => {
    if (!navigator.clipboard) return
    e.preventDefault()
    navigator.clipboard.writeText(el.dataset.copy).then(() => {
      const n = $('.copy-note'); if (!n) return
      n.textContent = 'Copied ✓'; setTimeout(() => (n.textContent = 'Click to copy'), 2000)
    }).catch(() => (location.href = 'mailto:' + el.dataset.copy))
  }))

  /* lightbox (case pages) */
  const lb = $('.lightbox')
  if (lb) {
    const img = $('img', lb)
    $$('.cs-fig').forEach(f => f.addEventListener('click', () => { img.src = $('img', f).src; img.alt = $('img', f).alt; lb.classList.add('open'); lb.scrollTop = 0; document.documentElement.style.overflow = 'hidden'; window.__lenis && window.__lenis.stop() }))
    const close = () => { lb.classList.remove('open'); document.documentElement.style.overflow = ''; window.__lenis && window.__lenis.start() }
    lb.addEventListener('click', close)
    addEventListener('keydown', e => { if (e.key === 'Escape') close() })
  }

  if (!window.gsap) { document.documentElement.classList.add('no-motion'); return }
  gsap.registerPlugin(ScrollTrigger)

  /* smooth scroll */
  let lenis = null
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true })
    window.__lenis = lenis
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(t => lenis.raf(t * 1000))
    gsap.ticker.lagSmoothing(0)
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const t = $(a.getAttribute('href')); if (!t) return
      e.preventDefault(); lenis.scrollTo(t, { offset: -60, duration: 1.4 })
    }))
  }

  /* helpers */
  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/)
    el.setAttribute('aria-label', el.textContent.trim())
    el.innerHTML = words.map(w => `<span class="word" aria-hidden="true">${[...w].map(c => `<span class="ch">${c}</span>`).join('')}</span>`).join(' ')
    return $$('.ch', el)
  }
  function splitLines(el, html) {
    el.innerHTML = html
    const tmp = []
    // wrap each word (keep inline tags like <em>)
    el.childNodes.forEach(n => {
      if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach(t => { if (t.trim()) tmp.push({ t, tag: null }) })
      else n.textContent.split(/\s+/).forEach(t => { if (t) tmp.push({ t, tag: n.nodeName.toLowerCase() }) })
    })
    el.innerHTML = tmp.map(w => `<span class="w" style="display:inline-block">${w.tag ? `<${w.tag}>${w.t}</${w.tag}>` : w.t}</span>`).join(' ')
    const lines = []; let top = null
    $$('.w', el).forEach(w => { if (w.offsetTop !== top) { lines.push([]); top = w.offsetTop } lines[lines.length - 1].push(w.innerHTML) })
    el.innerHTML = lines.map(l => `<span class="ln"><span>${l.join(' ')}</span></span>`).join('')
    return $$('.ln > span', el)
  }

  /* cursor badge */
  const cur = $('.cursor')
  if (cur && fine) {
    const x = gsap.quickTo(cur, 'x', { duration: 0.45, ease: 'power3' }), y = gsap.quickTo(cur, 'y', { duration: 0.45, ease: 'power3' })
    let mx = -100, my = -100, on = null
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; x(mx); y(my) })
    const check = () => {
      const el = document.elementFromPoint(mx, my), t = el && el.closest('[data-cursor]')
      if (t === on) return; on = t
      if (t) { cur.textContent = t.dataset.cursor; gsap.to(cur, { scale: 1, duration: 0.45, ease: 'back.out(2)' }) }
      else gsap.to(cur, { scale: 0, duration: 0.3, ease: 'power3.in' })
    }
    addEventListener('mousemove', check)
    addEventListener('scroll', () => requestAnimationFrame(check), { passive: true })
  }

  /* magnetic */
  if (fine && !reduce) $$('.magnetic').forEach(b => {
    const xT = gsap.quickTo(b, 'x', { duration: 0.6, ease: 'elastic.out(1,.4)' }), yT = gsap.quickTo(b, 'y', { duration: 0.6, ease: 'elastic.out(1,.4)' })
    b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); xT((e.clientX - r.left - r.width / 2) * 0.3); yT((e.clientY - r.top - r.height / 2) * 0.45) })
    b.addEventListener('mouseleave', () => { xT(0); yT(0) })
  })

  /* generic reveals */
  $$('[data-split]').forEach(el => {
    const chars = splitWords(el)
    if (reduce) return
    gsap.set(chars, { yPercent: 112 })
    ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true,
      onEnter: () => gsap.to(chars, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.022 }) })
  })
  if (!reduce) {
    gsap.set('[data-reveal]', { y: 40, opacity: 0 })
    ScrollTrigger.batch('[data-reveal]', { start: 'top 90%', once: true,
      onEnter: els => gsap.to(els, { y: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.08 }) })
  }

  /* counters */
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, o = { v: 0 }
    if (reduce) return
    el.textContent = '0'
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(o, { v: end, duration: 1.6, ease: 'power3.out', onUpdate: () => (el.textContent = Math.round(o.v)) }) })
  })

  /* ══ HERO ══ */
  const hero = $('#hero')
  if (hero) {
    const back = splitWords($('.hero-name.back')), front = splitWords($('.hero-name.front'))
    const photo = $('.hero-photo'), tone = $('.hero-photo .tone'), sel = $('.sel'), spark = $('.spark')
    const claim = $('.hero-claim'), claimHTML = claim.innerHTML
    const F = { cx: 0.455, cy: 0.30, w: 0.34, h: 0.50, rot: -9, s: 0, mx: 0, my: 0, mr: 0 }
    const draw = () => {
      const W = photo.offsetWidth, H = photo.offsetHeight, w = F.w * W * F.s, hh = F.h * H * F.s
      const cx = (F.cx + F.mx) * W, cy = (F.cy + F.my) * H, a = (F.rot + F.mr) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a)
      tone.style.clipPath = 'polygon(' + [[-w / 2, -hh / 2], [w / 2, -hh / 2], [w / 2, hh / 2], [-w / 2, hh / 2]]
        .map(([x, y]) => `${(cx + x * c - y * s).toFixed(1)}px ${(cy + x * s + y * c).toFixed(1)}px`).join(',') + ')'
      Object.assign(sel.style, { width: w + 'px', height: hh + 'px', left: cx - w / 2 + 'px', top: cy - hh / 2 + 'px', transform: `rotate(${F.rot + F.mr}deg)`, opacity: F.s > 0.02 ? 1 : 0 })
    }
    draw(); addEventListener('resize', draw)

    const fades = $$('.hero-side > *, .nav > *')
    if (!reduce) {
      gsap.set(back, { yPercent: 112 }); gsap.set(front, { yPercent: -112 })
      gsap.set(photo, { y: 140, opacity: 0, scale: 0.92, filter: 'blur(14px)' })
      gsap.set(spark, { scale: 0, rotate: -200 })
      gsap.set(fades, { opacity: 0, y: 14 })
      gsap.set(claim, { opacity: 0 })
      gsap.set($$('.sel i, .sel-tag, .sel-dim'), { scale: 0 })
    } else { F.s = 1; draw() }

    const intro = () => {
      if (reduce) return
      const lines = splitLines(claim, claimHTML)
      gsap.set(claim, { opacity: 1 }); gsap.set(lines, { yPercent: 110 })
      let rw = innerWidth
      addEventListener('resize', () => { if (Math.abs(innerWidth - rw) > 2) { rw = innerWidth; splitLines(claim, claimHTML) } })
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        .to(back, { yPercent: 0, duration: 1.3, stagger: 0.045 })
        .to(front, { yPercent: 0, duration: 1.3, stagger: { each: 0.045, from: 'end' } }, '<.1')
        .to(photo, { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.6 }, '<.15')
        .to(F, { s: 1, duration: 1.1, ease: 'expo.inOut', onUpdate: draw }, '-=.9')
        .fromTo(F, { rot: 14 }, { rot: -9, duration: 1.3, ease: 'elastic.out(1,.6)', onUpdate: draw, immediateRender: false }, '<')
        .to($$('.sel i'), { scale: 1, duration: 0.4, stagger: 0.04, ease: 'back.out(3)' }, '-=.7')
        .to($$('.sel-tag, .sel-dim'), { scale: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(2.4)' }, '<.1')
        .to(spark, { scale: 1, rotate: 0, duration: 1.2, ease: 'elastic.out(1,.5)' }, '<')
        .to(lines, { yPercent: 0, duration: 1.1, stagger: 0.09 }, '<')
        .to(fades, { opacity: 1, y: 0, duration: 0.9, stagger: 0.05 }, '<.1')
        .add(() => {
          hero.dataset.ready = '1'
          gsap.to(spark, { rotate: 360, duration: 14, repeat: -1, ease: 'none' })
          gsap.to(spark, { scale: 0.82, duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut' })
        })
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(intro, 120)); else addEventListener('load', intro)

    if (fine && !reduce) {
      const q = (el, d) => [gsap.quickTo(el, 'x', { duration: d, ease: 'power3' }), gsap.quickTo(el, 'y', { duration: d, ease: 'power3' })]
      const [bx, by] = q('.hero-name.back', 1.2), [fx, fy] = q('.hero-name.front', 1), [sx, sy] = q(spark, 0.8)
      hero.addEventListener('mousemove', e => {
        const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5
        bx(nx * -40); by(ny * -20); fx(nx * 60); fy(ny * 30); sx(nx * 90); sy(ny * 60)
        if (!hero.dataset.ready) return
        gsap.to(photo, { x: nx * 18, y: ny * 10, duration: 1, ease: 'power3', overwrite: 'auto' })
        gsap.to(F, { mx: nx * 0.02, my: ny * 0.015, mr: nx * 6, duration: 0.9, ease: 'power3', onUpdate: draw, overwrite: 'auto' })
      })
    }
    if (!reduce) gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.8 } })
      .to('.hero-name.back', { xPercent: -16, ease: 'none' }, 0)
      .to('.hero-name.front', { xPercent: 16, ease: 'none' }, 0)
      .to('.hero-stage', { yPercent: 12, scale: 0.95, ease: 'none' }, 0)
      .to(F, { rot: -24, onUpdate: draw, ease: 'none' }, 0)
      .to('.hero-foot', { opacity: 0, y: -30, ease: 'none' }, 0)
  }

  /* ══ FLAGSHIPS: image parallax + tilt ══ */
  $$('.flag-media').forEach(m => {
    const img = $('img', m)
    if (reduce) return
    gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true } })
    gsap.set(m, { clipPath: 'inset(10% 5% 10% 5% round 18px)' })
    ScrollTrigger.create({ trigger: m, start: 'top 88%', once: true,
      onEnter: () => gsap.to(m, { clipPath: 'inset(0% 0% 0% 0% round 18px)', duration: 1.4, ease: 'expo.out' }) })
    if (!fine) return
    const rx = gsap.quickTo(m, 'rotationX', { duration: 0.7, ease: 'power3' }), ry = gsap.quickTo(m, 'rotationY', { duration: 0.7, ease: 'power3' })
    gsap.set(m, { transformPerspective: 1200 })
    m.addEventListener('mousemove', e => { const r = m.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 7); rx(((e.clientY - r.top) / r.height - 0.5) * -5) })
    m.addEventListener('mouseleave', () => { rx(0); ry(0) })
  })

  /* ══ NOW BUILDING ticker ══ */
  const tt = $('.now-ticker-track')
  if (tt && !reduce) { tt.innerHTML += tt.innerHTML; gsap.to(tt, { xPercent: -50, duration: 26, ease: 'none', repeat: -1 }) }

  /* ══ REEL ══ */
  const track = $('.reel-track')
  if (track) {
    track.innerHTML += track.innerHTML
    const panels = $$('.reel-panel', track)
    $$('img', track).slice(panels.length / 2).forEach(i => i.setAttribute('alt', ''))
    if (!reduce) {
      const loop = gsap.to(track, { xPercent: -50, duration: 55, ease: 'none', repeat: -1 })
      let active = false
      ScrollTrigger.create({ trigger: '.reel', start: 'top bottom', end: 'bottom top', onToggle: s => (active = s.isActive),
        onUpdate: s => {
          const v = Math.min(Math.abs(s.getVelocity()) / 220, 6), d = s.direction
          gsap.to(loop, { timeScale: d * (1 + v), duration: 0.25, overwrite: true })
          gsap.to(loop, { timeScale: d, duration: 1.2, delay: 0.25 })
        } })
      gsap.ticker.add(() => {
        if (!active) return
        const mid = innerWidth / 2
        panels.forEach(p => {
          const r = p.getBoundingClientRect(); if (r.right < -50 || r.left > innerWidth + 50) return
          const off = (r.left + r.width / 2 - mid) / mid, d = Math.min(Math.abs(off), 1)
          p.style.transform = `translateY(${(d * d * 34).toFixed(1)}px) scale(${(1 - d * 0.14).toFixed(3)}) rotate(${(off * 4).toFixed(2)}deg)`
        })
      })
    }
  }

  /* ══ WORK LIST hover preview ══ */
  const prev = $('.preview')
  if (prev && fine) {
    const pi = $('img', prev)
    const px = gsap.quickTo(prev, 'x', { duration: 0.6, ease: 'power3' }), py = gsap.quickTo(prev, 'y', { duration: 0.6, ease: 'power3' })
    const pr = gsap.quickTo(prev, 'rotation', { duration: 0.6, ease: 'power3' })
    let lastX = 0
    $$('.row').forEach(r => {
      r.addEventListener('mouseenter', () => { pi.src = r.dataset.img; gsap.to(prev, { opacity: 1, scale: 1, duration: 0.45, ease: 'expo.out' }) })
      r.addEventListener('mouseleave', () => gsap.to(prev, { opacity: 0, scale: 0.6, duration: 0.35, ease: 'power3.in' }))
      r.addEventListener('mousemove', e => { px(e.clientX + 30); py(e.clientY - 120); pr(Math.max(-12, Math.min(12, (e.clientX - lastX) * 0.6))); lastX = e.clientX })
    })
    $$('.row').forEach(r => { const i = new Image(); i.src = r.dataset.img })
  }

  /* ══ CASE PAGE ══ */
  const bar = $('.cs-progress')
  if (bar) gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.2 } })
  if (!reduce) $$('.cs-fig, .cs-cover').forEach(f => {
    gsap.set(f, { clipPath: 'inset(6% 3% 6% 3% round 14px)', opacity: 0.3 })
    ScrollTrigger.create({ trigger: f, start: 'top 92%', once: true,
      onEnter: () => gsap.to(f, { clipPath: 'inset(0% 0% 0% 0% round 14px)', opacity: 1, duration: 1.2, ease: 'expo.out' }) })
  })

  addEventListener('load', () => ScrollTrigger.refresh())
})()
