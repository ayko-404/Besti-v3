// Бэсти v3: меню, акция первого визита во всплывающем окне, прайс списком с раскрытием, ленты со стрелками,
// работы на весь экран, «читать полностью» у отзывов, видео без звука рядом с экраном
(function () {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lockScroll = (on) => { document.documentElement.style.overflow = on ? 'hidden' : ''; };

  // логотип «пишется от руки» (правка 04.11): штрихи прорисовываются по очереди слева направо, затем буквы заливаются цветом.
  // writeLogo возвращает Promise — заставка ждёт, пока логотип допишется. Без анимации — если в системе «уменьшить движение»
  const lgSvg = document.querySelector('.hd__logo .lg');
  const root = document.documentElement;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const writeLogo = (svg, total, start) => new Promise((done) => {
    const paths = [...svg.querySelectorAll('path')].sort((a, b) => a.getBBox().x - b.getBBox().x);
    const lens = paths.map((p) => p.getTotalLength());
    const sum = lens.reduce((a, b) => a + b, 0);
    svg.classList.add('is-writing');
    let t = start;
    paths.forEach((p, i) => {
      const d = Math.max(240, total * lens[i] / sum); // длинный штрих пишется дольше
      p.style.strokeDasharray = lens[i]; p.style.strokeDashoffset = lens[i];
      p.animate([{ strokeDashoffset: lens[i] }, { strokeDashoffset: 0 }], { duration: d, delay: t, easing: 'ease-in-out', fill: 'forwards' });
      t += d * 0.82; // следующая буква начинается чуть раньше, чем закончилась предыдущая — как рука на бумаге
    });
    const fillAt = t + 120;
    paths.forEach((p) => p.animate([{ fillOpacity: 0, strokeOpacity: 1 }, { fillOpacity: 1, strokeOpacity: 0 }], { duration: 500, delay: fillAt, easing: 'ease-out', fill: 'forwards' }));
    setTimeout(() => {
      svg.classList.remove('is-writing');
      paths.forEach((p) => { p.getAnimations().forEach((a) => a.cancel()); p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; });
      done();
    }, fillAt + 520);
  });

  // заставка при загрузке (04.11): без подложки — поверх видео по центру крупно пишется «бэсти», затем логотип плавно
  // уменьшается и уходит на своё место в шапке; заголовок, кнопки обложки и шапки проявляются после. При каждом заходе
  const introOn = root.classList.contains('is-intro') && lgSvg && lgSvg.animate && !calm;
  if (introOn) {
    const link = lgSvg.closest('.hd__logo');
    if (scrollY > 0) scrollTo(0, 0); // заставка — с верха страницы
    lockScroll(true);
    // пока идёт заставка, сайт не листается: ни колёсиком, ни пальцем, ни клавишами (CSS тоже держит overflow: hidden)
    const stopScroll = (e) => e.preventDefault();
    const stopKeys = (e) => { if ([' ', 'Spacebar', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(e.key)) e.preventDefault(); };
    addEventListener('wheel', stopScroll, { passive: false });
    addEventListener('touchmove', stopScroll, { passive: false });
    addEventListener('keydown', stopKeys);
    const freeScroll = () => { removeEventListener('wheel', stopScroll); removeEventListener('touchmove', stopScroll); removeEventListener('keydown', stopKeys); };
    link.classList.add('is-writing'); // подпись «студия маникюра» появится после приземления
    const r = lgSvg.getBoundingClientRect(), lr = link.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const k = Math.min(innerWidth * 0.72, 640) / r.width; // крупно: до 72% ширины экрана
    link.style.transformOrigin = (cx - lr.left) + 'px ' + (cy - lr.top) + 'px';
    link.style.transform = 'translate(' + (innerWidth / 2 - cx) + 'px, ' + (innerHeight / 2 - cy) + 'px) scale(' + k.toFixed(3) + ')';
    link.classList.add('is-placed');
    writeLogo(lgSvg, 1700, 300).then(() => setTimeout(() => {
      link.style.transition = 'transform 1s cubic-bezier(.7, 0, .2, 1)';
      link.style.transform = '';
      setTimeout(() => {
        root.classList.remove('is-intro');
        link.classList.remove('is-writing');
        link.style.transition = ''; link.style.transformOrigin = '';
        lockScroll(false); freeScroll();
      }, 1000);
    }, 250));
  } else {
    root.classList.remove('is-intro');
    // без заставки (повторный заход в том же посещении) логотип дописывается прямо в шапке
    if (lgSvg && lgSvg.animate && !calm) {
      const link = lgSvg.closest('.hd__logo');
      link.classList.add('is-writing');
      writeLogo(lgSvg, 2300, 200);
      setTimeout(() => link.classList.remove('is-writing'), 2600);
    }
  }

  // шапка поверх обложки прозрачная; когда обложка ушла вверх — светлая
  const hd = document.querySelector('.hd'), hero = document.querySelector('.hero');
  // логотип наверху большой и по прокрутке плавно уменьшается: --p от 0 (верх страницы) до 1 (прокручено 320 px и больше)
  const solid = () => {
    // предел 0,999, а не 1: Chrome при ровно 1 считает calc() с clamp() внутри как 0 px и логотип пропадает (проверено 04.11)
    hd.style.setProperty('--p', Math.min(0.999, Math.max(0, scrollY / 320)).toFixed(3));
    hd.classList.toggle('is-solid', scrollY > hero.offsetHeight - hd.offsetHeight - 10);
  };
  addEventListener('scroll', () => requestAnimationFrame(solid), { passive: true });
  addEventListener('resize', solid); solid();

  // меню — на весь экран, на компьютере и телефоне одинаково
  const mb = document.querySelector('.hd__menu'), menu = document.getElementById('menu');
  const setMenu = (open) => {
    menu.hidden = !open; mb.setAttribute('aria-expanded', String(open)); mb.lastChild.textContent = open ? 'Закрыть' : 'Меню';
    document.body.classList.toggle('menu-open', open); lockScroll(open);
  };
  mb.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });

  // Заголовок обложки (04.11, «пока»): «Студия / маникюра, / где тебя ждут» — в разметке index.html.
  // Строки не переносятся: если самая длинная не влезает в свою колонку — шрифт уменьшается ровно настолько, насколько нужно.
  const zh = document.getElementById('zag');
  const fitZag = () => {
    zh.style.fontSize = '';
    const ha = zh.closest('.ha'), btns = ha.querySelector('.btns');
    const avail = getComputedStyle(ha).flexDirection.startsWith('column') ? ha.clientWidth : ha.clientWidth - btns.offsetWidth - 40; // на телефоне кнопки над заголовком (column-reverse)
    const widest = Math.max(...[...zh.querySelectorAll('span')].map((s) => { const r = document.createRange(); r.selectNodeContents(s); return r.getBoundingClientRect().width; }));
    if (widest > avail) zh.style.fontSize = Math.floor(parseFloat(getComputedStyle(zh).fontSize) * avail / widest) + 'px';
  };
  addEventListener('resize', fitZag);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitZag);

  fitZag();


  // акция первого визита: окно всплывает через 4 секунды, один раз за посещение сайта
  const promo = document.getElementById('promo');
  const closePromo = () => { promo.classList.remove('is-on'); setTimeout(() => { promo.hidden = true; lockScroll(false); }, 300); };
  const openPromo = () => {
    if (!menu.hidden || !document.querySelector('.lb').hidden) return; // не перекрываем меню и просмотр работы
    promo.hidden = false; lockScroll(true);
    requestAnimationFrame(() => requestAnimationFrame(() => promo.classList.add('is-on')));
    promo.querySelector('.promo__box').focus({ preventScroll: true });
  };
  let seen = false;
  try { seen = sessionStorage.getItem('besti-promo') === '1'; } catch (e) { /* без хранилища просто покажем */ }
  const promoDelay = introOn ? 8000 : 4000; // с заставкой — после неё
  if (!seen) setTimeout(() => { openPromo(); try { sessionStorage.setItem('besti-promo', '1'); } catch (e) {} }, promoDelay);
  promo.addEventListener('click', (e) => { if (e.target === promo || e.target.closest('.promo__x, a')) closePromo(); });

  // прайс: разделы раскрываются, в строке раздела — цена «от»
  const acc = document.getElementById('acc');
  const num = (p) => { const m = String(p).replace(/\s/g, '').match(/\d+/); return m ? +m[0] : Infinity; };
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  acc.innerHTML = (window.BESTI_PRICES || []).map((c) => {
    const from = Math.min(...c.rows.map((r) => num(r.p)));
    return '<details class="acc__it" name="prajs"><summary class="acc__sum">' +
      (c.img ? '<span class="acc__ph"><img src="' + c.img + '" width="176" height="220" alt="" loading="lazy"></span>' : '') +
      '<span class="acc__t">' + esc(c.title) + '</span>' +
      '<span class="acc__from">от ' + fmt(from) + ' ₽</span><span class="acc__pl" aria-hidden="true"></span></summary>' +
      '<ul class="acc__list">' + c.rows.map((r) =>
        '<li class="acc__row"><span class="acc__n">' + esc(r.n) + '</span>' +
        (r.c ? '<span class="acc__c">' + esc(r.c.split(' · ').join(', ')) + '</span>' : '') +
        '<span class="acc__p">' + esc(r.p) + '</span><span class="acc__time">' + esc(r.t) + '</span></li>').join('') +
      '</ul></details>';
  }).join('');
  // открыт только один раздел прайса (04.11: «чтобы не растягивать страницу»). name="prajs" делает это в новых браузерах,
  // код ниже — для остальных. Если раздел выше схлопнулся и заголовок открытого уехал за верх экрана — подкручиваем к нему
  acc.addEventListener('toggle', (e) => {
    const d = e.target;
    if (!d.open) return;
    acc.querySelectorAll('details[open]').forEach((x) => { if (x !== d) x.open = false; });
    requestAnimationFrame(() => {
      const top = d.getBoundingClientRect().top, hdH = document.querySelector('.hd').offsetHeight;
      if (top < hdH + 8) scrollBy({ top: top - hdH - 16, behavior: 'smooth' });
    });
  }, true);

  // ленты: стрелки листают на одну карточку, на краях гаснут
  document.querySelectorAll('.arrows[data-for]').forEach((nav) => {
    const row = document.getElementById(nav.dataset.for + '-row');
    const [prev, next] = nav.querySelectorAll('.arrow');
    const upd = () => {
      prev.disabled = row.scrollLeft < 4;
      next.disabled = row.scrollLeft + row.clientWidth > row.scrollWidth - 4;
    };
    nav.querySelectorAll('.arrow').forEach((b) => b.addEventListener('click', () => {
      const card = row.firstElementChild, gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      row.scrollBy({ left: +b.dataset.d * (card.offsetWidth + gap), behavior: 'smooth' });
    }));
    row.addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true });
    addEventListener('resize', upd); upd();
  });

  // работы (как у soyka): одно крупное фото, листается свайпом (scroll-snap) и стрелками со счётчиком; нажатие — на весь экран
  const track = document.querySelector('.ws__track'), lb = document.querySelector('.lb');
  const works = track ? [...track.querySelectorAll('.ws__sl')] : [], wsN = document.querySelector('.ws__n b');
  if (track && works.length) {
    let cur = 0;
    const step = () => works[0].offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0);
    const mark = (i) => { cur = i; if (wsN) wsN.textContent = i + 1; };
    const go = (i, smooth = true) => { i = (i + works.length) % works.length; if (Math.abs(i - cur) > 1) smooth = false; /* с последнего на первое — сразу, без прокрутки через все фото */ track.scrollTo({ left: i * step(), behavior: smooth ? 'smooth' : 'auto' }); mark(i); };
    track.addEventListener('scroll', () => requestAnimationFrame(() => {
      const i = Math.min(works.length - 1, Math.round(track.scrollLeft / step()));
      if (i !== cur) mark(i);
    }), { passive: true });
    document.querySelectorAll('.ws__nav .arrow').forEach((b) => b.addEventListener('click', () => go(cur + +b.dataset.d)));
    mark(0);

    if (lb) {
      const img = lb.querySelector('img'), cap = lb.querySelector('figcaption');
      let from = null;
      const show = (i) => {
        i = (i + works.length) % works.length;
        const s = works[i].querySelector('img');
        img.src = s.src; img.alt = s.alt; cap.textContent = works[i].dataset.cap;
        go(i, false); // фото на странице идёт следом за просмотром
      };
      const open = (i, btn) => { from = btn; show(i); lb.hidden = false; lockScroll(true); requestAnimationFrame(() => requestAnimationFrame(() => lb.classList.add('is-on'))); lb.querySelector('.lb__x').focus({ preventScroll: true }); };
      const close = () => { lb.classList.remove('is-on'); setTimeout(() => { lb.hidden = true; lockScroll(false); if (from) works[cur].focus({ preventScroll: true }); }, 250); };
      works.forEach((w, i) => w.addEventListener('click', () => open(i, w)));
      lb.querySelector('.lb__prev').addEventListener('click', () => show(cur - 1));
      lb.querySelector('.lb__next').addEventListener('click', () => show(cur + 1));
      lb.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('.lb__x')) close(); });
      let sx = null;
      lb.addEventListener('pointerdown', (e) => { sx = e.clientX; });
      lb.addEventListener('pointerup', (e) => { if (sx === null) return; const d = e.clientX - sx; sx = null; if (Math.abs(d) > 50) show(cur + (d < 0 ? 1 : -1)); });
      document.addEventListener('keydown', (e) => {
        if (lb.hidden) return;
        if (e.key === 'ArrowRight') show(cur + 1);
        if (e.key === 'ArrowLeft') show(cur - 1);
      });
    }
  }

  // Escape закрывает открытое окно
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!lb.hidden) lb.querySelector('.lb__x').click();
    else if (!promo.hidden) closePromo();
    else if (!menu.hidden) setMenu(false);
  });

  // отзывы: «Читать полностью» только у длинных
  document.querySelectorAll('.rv').forEach((r) => {
    const t = r.querySelector('.rv__t'), more = r.querySelector('.rv__more');
    const chk = () => { if (!r.classList.contains('is-open')) more.hidden = t.scrollHeight <= t.clientHeight + 4; };
    chk(); new ResizeObserver(chk).observe(t);
    more.addEventListener('click', () => { const o = r.classList.toggle('is-open'); more.textContent = o ? 'Свернуть' : 'Читать полностью'; });
  });

  // обложка: ролик под экран (телефон — вертикальный, компьютер — широкий), проявляется, когда начал играть
  const cv = document.querySelector('.vid-cover');
  if (cv) {
    cv.src = matchMedia('(max-width: 900px)').matches ? cv.dataset.srcM : cv.dataset.srcD;
    cv.addEventListener('playing', () => cv.classList.add('is-on'), { once: true });
  }

  // ссылка на Instagram ещё не получена от клиентки — иконка пока никуда не ведёт [ждём: ссылка на аккаунт]
  document.querySelectorAll('[data-wait="instagram"]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));

  // круглая кнопка записи: видна всегда, кроме первого экрана, где свои кнопки записи (и пока идёт заставка)
  const fab = document.querySelector('.fab'), heroBtns = document.querySelector('.ha .btns');
  if (fab && heroBtns && 'IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => fab.classList.toggle('is-on', !en.isIntersecting && !root.classList.contains('is-intro')), { threshold: 0 }).observe(heroBtns);
  } else if (fab) fab.classList.add('is-on');

  // видео: без звука, играют только рядом с экраном
  const vids = document.querySelectorAll('video');
  const play = (v) => { v.muted = true; const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((en) => (en.isIntersecting ? play(en.target) : en.target.pause())), { rootMargin: '200px 0px' });
    vids.forEach((v) => io.observe(v));
  } else vids.forEach(play);
})();
