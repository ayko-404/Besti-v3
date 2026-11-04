// Бэсти v3: меню, акция первого визита во всплывающем окне, прайс списком с раскрытием, ленты со стрелками,
// работы на весь экран, «читать полностью» у отзывов, видео без звука рядом с экраном
(function () {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lockScroll = (on) => { document.documentElement.style.overflow = on ? 'hidden' : ''; };

  // шапка поверх обложки прозрачная; когда обложка ушла вверх — светлая
  const hd = document.querySelector('.hd'), hero = document.querySelector('.hero');
  const solid = () => hd.classList.toggle('is-solid', scrollY > hero.offsetHeight - hd.offsetHeight - 10);
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

  // ВРЕМЕННО: варианты заголовка обложки (?zag=a…f, &caps=1 — заглавными; служебная панель).
  // Три строки примерно равной длины, как у devichnik; перенос задан вручную; последняя строка — курсивный акцент.
  // Описание под заголовком убрано (правка 04.11). Убрать после выбора варианта.
  // Голос бренда (бриф, research.md §16): «подруга со вкусом зовёт в гости» — на «вы», тепло, с подмигиванием, вещи вместо эпитетов,
  // 2–6 слов, без «!»; подмигивание — как в названиях комплексов («Дорогая привычка», «Роскошный максимум»)
  const ZAG = { // со «студией маникюра» (просьба Дмитрия 04.11), как у devichnik, но на «вы»
    a: ['Бэсти&nbsp;—', 'ваша студия', 'маникюра'],
    b: ['Студия', 'маникюра', 'вашей бэсти'],
    c: ['Студия', 'маникюра', 'с&nbsp;кофе и&nbsp;кино'],
    d: ['Студия', 'маникюра,', 'где вас ждут'],
    e: ['Студия', 'маникюра', 'по-дружески'],
    f: ['Ваша', 'студия', 'маникюра']
  };
  const zh = document.getElementById('zag'), zp = document.querySelector('.vpanel[aria-label="Варианты заголовка"]');
  const st = { z: 'a', caps: false, round: false };
  try { const q = new URLSearchParams(location.search); st.z = ZAG[(q.get('zag') || '').toLowerCase()] ? q.get('zag').toLowerCase() : 'a'; st.caps = q.get('caps') === '1'; st.round = q.get('round') === '1'; } catch (e) {}
  const fitZag = () => {
    zh.style.fontSize = '';
    const ha = zh.closest('.ha'), btns = ha.querySelector('.btns');
    const avail = getComputedStyle(ha).flexDirection === 'column' ? ha.clientWidth : ha.clientWidth - btns.offsetWidth - 40;
    const widest = Math.max(...[...zh.querySelectorAll('span')].map((s) => { const r = document.createRange(); r.selectNodeContents(s); return r.getBoundingClientRect().width; }));
    if (widest > avail) zh.style.fontSize = Math.floor(parseFloat(getComputedStyle(zh).fontSize) * avail / widest) + 'px';
  }; // строки заголовка не переносятся: если самая длинная не влезает — шрифт уменьшается ровно настолько, насколько нужно
  addEventListener('resize', () => fitZag());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitZag());
  const drawZag = () => {
    const l = ZAG[st.z];
    zh.innerHTML = '<span>' + l[0] + '</span><span>' + l[1] + '</span><em><span>' + l[2] + '</span></em>';
    zh.classList.toggle('is-caps', st.caps);
    document.documentElement.classList.toggle('is-round', st.round); // вариант с небольшими скруглениями у кнопок и элементов
    fitZag();
    if (zp) {
      zp.querySelectorAll('[data-z]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.z === st.z)));
      zp.querySelector('[data-caps]').setAttribute('aria-pressed', String(st.caps));
      zp.querySelector('[data-round]').setAttribute('aria-pressed', String(st.round));
    }
  };
  drawZag();
  if (zp) zp.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.z) st.z = b.dataset.z; else if (b.dataset.round) st.round = !st.round; else st.caps = !st.caps;
    drawZag();
    const u = new URL(location.href); u.searchParams.set('zag', st.z);
    if (st.caps) u.searchParams.set('caps', '1'); else u.searchParams.delete('caps');
    if (st.round) u.searchParams.set('round', '1'); else u.searchParams.delete('round');
    history.replaceState(null, '', u);
  });


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
  if (!seen) setTimeout(() => { openPromo(); try { sessionStorage.setItem('besti-promo', '1'); } catch (e) {} }, 4000);
  promo.addEventListener('click', (e) => { if (e.target === promo || e.target.closest('.promo__x, a')) closePromo(); });

  // прайс: разделы раскрываются, в строке раздела — цена «от»
  const acc = document.getElementById('acc');
  const num = (p) => { const m = String(p).replace(/\s/g, '').match(/\d+/); return m ? +m[0] : Infinity; };
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  acc.innerHTML = (window.BESTI_PRICES || []).map((c) => {
    const from = Math.min(...c.rows.map((r) => num(r.p)));
    return '<details class="acc__it"><summary class="acc__sum"><span class="acc__t">' + esc(c.title) + '</span>' +
      '<span class="acc__from">от ' + fmt(from) + ' ₽</span><span class="acc__pl" aria-hidden="true"></span></summary>' +
      '<ul class="acc__list">' + c.rows.map((r) =>
        '<li class="acc__row"><span class="acc__n">' + esc(r.n) + '</span>' +
        (r.c ? '<span class="acc__c">' + esc(r.c.split(' · ').join(', ')) + '</span>' : '') +
        '<span class="acc__p">' + esc(r.p) + '</span><span class="acc__time">' + esc(r.t) + '</span></li>').join('') +
      '</ul></details>';
  }).join('');

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

  // работы: открытие на весь экран, листание стрелками, клавишами и свайпом
  const works = [...document.querySelectorAll('.wk')], lb = document.querySelector('.lb');
  if (lb && works.length) {
    const img = lb.querySelector('img'), cap = lb.querySelector('figcaption');
    let cur = 0, from = null;
    const show = (i) => {
      cur = (i + works.length) % works.length;
      const s = works[cur].querySelector('img');
      img.src = s.src; img.alt = s.alt; cap.textContent = works[cur].querySelector('.wk__cap').textContent;
    };
    const open = (i, btn) => { from = btn; show(i); lb.hidden = false; lockScroll(true); requestAnimationFrame(() => requestAnimationFrame(() => lb.classList.add('is-on'))); lb.querySelector('.lb__x').focus({ preventScroll: true }); };
    const close = () => { lb.classList.remove('is-on'); setTimeout(() => { lb.hidden = true; lockScroll(false); if (from) from.focus({ preventScroll: true }); }, 250); };
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

  // видео: без звука, играют только рядом с экраном
  const vids = document.querySelectorAll('video');
  const play = (v) => { v.muted = true; const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((en) => (en.isIntersecting ? play(en.target) : en.target.pause())), { rootMargin: '200px 0px' });
    vids.forEach((v) => io.observe(v));
  } else vids.forEach(play);
})();
