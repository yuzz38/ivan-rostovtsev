/* Иван Ростовцев — риелтор, Йошкар-Ола
   © 2026 Полунин Лев. Все права защищены. */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js', 'is-loading');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  window.addEventListener('load', function () { doc.classList.remove('is-loading'); });
  setTimeout(function () { doc.classList.remove('is-loading'); }, 1200);

  /* ---------- Шапка, прогресс, FAB ---------- */
  var header = $('#header');
  var bar = $('.progress span');
  var fab = $('.fab');
  var lastY = window.pageYOffset || 0;
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset || doc.scrollTop;
    var max = (doc.scrollHeight - window.innerHeight) || 1;
    if (bar) bar.style.transform = 'scaleX(' + Math.min(1, y / max) + ')';
    if (header) {
      header.classList.toggle('is-scrolled', y > 40);
      var menuOpen = document.body.classList.contains('is-locked');
      header.classList.toggle('is-hidden', !menuOpen && y > 500 && y > lastY + 4);
      if (y < lastY - 4) header.classList.remove('is-hidden');
    }
    if (fab) fab.classList.toggle('is-visible', y > window.innerHeight * .8);
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; (window.requestAnimationFrame || setTimeout)(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------- Бургер ---------- */
  var burger = $('.burger');
  var mnav = $('#mnav');
  function setMenu(open) {
    if (!burger || !mnav) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.classList.toggle('is-locked', open);
    if (open) {
      mnav.hidden = false;
      header.classList.remove('is-hidden');
      requestAnimationFrame(function () { mnav.classList.add('is-open'); });
    } else {
      mnav.classList.remove('is-open');
      setTimeout(function () { if (!mnav.classList.contains('is-open')) mnav.hidden = true; }, 380);
    }
  }
  if (burger) {
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1000) setMenu(false); });
  }

  /* ---------- Появление блоков ---------- */
  var revealSel = '.lead, .h2, .stats li, .silence__body, .silence__photo, .panel, .lot__card, .lot__steps li, .move, .results__cups, .cups li, .mentor, .story, .about__photos, .about__text > *, .faq__list details, .gift, .form, .deals__head, .deals__grid, .footer__big';
  var revealEls = $$(revealSel);
  if (hasIO && !reduce) {
    revealEls.forEach(function (el) { el.classList.add('reveal'); });
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); rio.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    revealEls.forEach(function (el) { rio.observe(el); });
  }

  /* ---------- Счётчики ---------- */
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-count'));
    var suf = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = to + suf; return; }
    var start = null, dur = 1400;
    function step(t) {
      if (!start) start = t;
      var p = Math.min(1, (t - start) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = $$('[data-count]');
  if (hasIO) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); } });
    }, { threshold: .6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- «Тишина» и аукцион: запуск анимаций ---------- */
  function onceVisible(el, cls, th) {
    if (!el) return;
    if (!hasIO || reduce) { el.classList.add(cls); return; }
    var o = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { el.classList.add(cls); o.disconnect(); } });
    }, { threshold: th || .4 });
    o.observe(el);
  }
  onceVisible($('.noise'), 'is-hushed', .55);
  onceVisible($('[data-lot]'), 'is-live', .35);
  var dots = $$('.crowd__dots i');
  dots.forEach(function (d, i) { d.style.transitionDelay = (0.4 + i * 0.07) + 's'; });

  /* ---------- Маршрут (навигация по секциям) ---------- */
  var routeLinks = $$('.route a');
  var route = $('.route');
  var stations = $$('[data-station]');
  var darkSet = { top: 1, services: 1, method: 1, reviews: 1, faq: 1 };
  if (hasIO && routeLinks.length) {
    var order = stations.map(function (s) { return s.getAttribute('data-station'); });
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.getAttribute('data-station');
        var idx = order.indexOf(id);
        routeLinks.forEach(function (a) {
          var j = order.indexOf(a.getAttribute('data-route'));
          a.classList.toggle('is-active', j === idx);
          a.classList.toggle('is-passed', j < idx);
        });
        if (route) route.classList.toggle('on-dark', !!darkSet[id]);
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    stations.forEach(function (s) { sio.observe(s); });
  }

  /* ---------- Табы «Выберите задачу» ---------- */
  var tabs = $$('[data-tabs] [role="tab"]');
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      var p = document.getElementById(t.getAttribute('aria-controls'));
      if (p) p.hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      if (k === 'ArrowRight' || k === 'ArrowDown') n = tabs[(i + 1) % tabs.length];
      if (k === 'ArrowLeft' || k === 'ArrowUp') n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (n) { e.preventDefault(); selectTab(n, true); }
    });
  });

  /* Кнопки из услуг выбирают нужную задачу в форме */
  function pickIntent(val) {
    $$('input[name="intent"]').forEach(function (r) { r.checked = (r.value === val); });
  }
  $$('[data-pick]').forEach(function (b) {
    b.addEventListener('click', function () { pickIntent(b.getAttribute('data-pick')); });
  });

  /* ---------- Слайдер историй ---------- */
  var slider = $('[data-slider]');
  if (slider) {
    var track = $('.slider__track', slider);
    var slides = $$('.story', track);
    var prev = $('[data-prev]');
    var next = $('[data-next]');
    var cur = $('[data-cur]');
    var total = $('[data-total]');
    var dotsWrap = $('.slider__dots', slider);
    var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
    if (total) total.textContent = pad2(slides.length);

    slides.forEach(function (s, i) {
      s.setAttribute('role', 'group');
      s.setAttribute('aria-roledescription', 'слайд');
      s.setAttribute('aria-label', (i + 1) + ' из ' + slides.length);
      var d = document.createElement('button');
      d.type = 'button';
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', 'История ' + (i + 1));
      d.addEventListener('click', function () { go(i); });
      dotsWrap.appendChild(d);
    });
    var dotBtns = $$('button', dotsWrap);

    function current() {
      var left = track.scrollLeft, best = 0, bestD = Infinity;
      var base = slides[0].offsetLeft;
      slides.forEach(function (s, i) {
        var d = Math.abs((s.offsetLeft - base) - left);
        if (d < bestD) { bestD = d; best = i; }
      });
      return best;
    }
    function maxScroll() { return track.scrollWidth - track.clientWidth - 2; }
    function go(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      var x = slides[i].offsetLeft - slides[0].offsetLeft;
      if (track.scrollTo) track.scrollTo({ left: x, behavior: reduce ? 'auto' : 'smooth' });
      else track.scrollLeft = x;
    }
    function update() {
      var i = current();
      var atEnd = track.scrollLeft >= maxScroll();
      if (atEnd) i = slides.length - 1;
      if (cur) cur.textContent = pad2(i + 1);
      dotBtns.forEach(function (d, j) { d.setAttribute('aria-selected', j === i ? 'true' : 'false'); });
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = atEnd;
    }
    var st;
    track.addEventListener('scroll', function () { clearTimeout(st); st = setTimeout(update, 60); }, { passive: true });
    window.addEventListener('resize', update);
    if (prev) prev.addEventListener('click', function () { go(current() - 1); });
    if (next) next.addEventListener('click', function () { go(current() + 1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(current() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(current() - 1); }
    });

    /* Перетаскивание мышью на десктопе */
    var down = false, sx = 0, sl = 0, moved = false;
    track.addEventListener('mousedown', function (e) {
      down = true; moved = false; sx = e.pageX; sl = track.scrollLeft;
      track.style.scrollSnapType = 'none'; track.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', function (e) {
      if (!down) return;
      var dx = e.pageX - sx;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = sl - dx;
    });
    window.addEventListener('mouseup', function () {
      if (!down) return;
      down = false; track.style.cursor = '';
      var i = current();
      track.style.scrollSnapType = '';
      go(i);
    });
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    update();
  }

  /* ---------- Видео ---------- */
  var vwrap = $('[data-video]');
  if (vwrap) {
    var video = $('video', vwrap);
    var snd = $('.phone__sound', vwrap);
    var playSafe = function () { var p = video.play(); if (p && p.catch) p.catch(function () {}); };
    if (hasIO) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { if (video.preload === 'none') video.preload = 'auto'; if (!reduce) playSafe(); }
          else video.pause();
        });
      }, { threshold: .5 });
      vio.observe(video);
    }
    snd.addEventListener('click', function () {
      var on = video.muted;
      video.muted = !on;
      if (on) { video.currentTime = 0; playSafe(); }
      snd.setAttribute('aria-pressed', on ? 'true' : 'false');
      snd.textContent = on ? 'Без звука' : 'Со звуком';
      snd.setAttribute('aria-label', on ? 'Выключить звук' : 'Включить звук');
    });
    video.addEventListener('click', function () { if (video.paused) playSafe(); else video.pause(); });
  }

  /* ---------- Карта сделок (Яндекс, ленивая загрузка) ---------- */
  var mapBox = $('[data-map]');
  var mapLink = $('[data-map-link]');
  var dealBtns = $$('[data-deals] button');
  var CITY = 'Йошкар-Ола, ';
  var iframe = null;
  function mapUrl(addr) { return 'https://yandex.ru/map-widget/v1/?text=' + encodeURIComponent(CITY + addr) + '&z=16'; }
  function setDeal(btn, load) {
    var addr = btn.getAttribute('data-addr');
    dealBtns.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
    if (mapLink) mapLink.href = 'https://yandex.ru/maps/?text=' + encodeURIComponent(CITY + addr);
    if (load || iframe) {
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.title = 'Карта сделок Ивана Ростовцева в Йошкар-Оле';
        iframe.setAttribute('loading', 'lazy');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
        mapBox.appendChild(iframe);
      }
      iframe.src = mapUrl(addr);
    }
  }
  dealBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      setDeal(b, true);
      if (window.innerWidth < 960 && mapBox.scrollIntoView) mapBox.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });
  });
  if (mapBox && dealBtns.length) {
    if (hasIO) {
      var mio = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { setDeal($('[data-deals] [aria-pressed="true"]') || dealBtns[0], true); mio.disconnect(); }
      }, { rootMargin: '300px 0px' });
      mio.observe(mapBox);
    } else {
      setDeal(dealBtns[0], true);
    }
  }

  /* ---------- Форма → Telegram ---------- */
  var form = $('#lead-form');
  if (form) {
    var phone = form.elements.phone;
    var status = $('.form__status', form);

    phone.addEventListener('input', function () {
      var d = phone.value.replace(/\D/g, '');
      if (!d) { phone.value = ''; return; }
      if (d[0] === '8') d = '7' + d.slice(1);
      if (d[0] !== '7') d = '7' + d;
      d = d.slice(0, 11);
      var r = '+7';
      if (d.length > 1) r += ' (' + d.slice(1, 4);
      if (d.length >= 4) r += ')';
      if (d.length > 4) r += ' ' + d.slice(4, 7);
      if (d.length > 7) r += '-' + d.slice(7, 9);
      if (d.length > 9) r += '-' + d.slice(9, 11);
      phone.value = r;
    });

    function copyText(t) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(t).then(function () { return true; }, function () { return legacyCopy(t); });
      }
      return Promise.resolve(legacyCopy(t));
    }
    function legacyCopy(t) {
      var ta = document.createElement('textarea');
      ta.value = t; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.top = '-1000px'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select(); ta.setSelectionRange(0, t.length);
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name;
      var okName = name.value.trim().length >= 2;
      var okPhone = phone.value.replace(/\D/g, '').length === 11;
      name.parentNode.classList.toggle('is-error', !okName);
      phone.parentNode.classList.toggle('is-error', !okPhone);
      if (!okName || !okPhone) {
        status.textContent = !okName ? 'Напишите, как к вам обращаться.' : 'Проверьте номер телефона — нужно 11 цифр.';
        (!okName ? name : phone).focus();
        return;
      }
      var intent = (form.querySelector('input[name="intent"]:checked') || {}).value || '';
      var msg = form.elements.msg.value.trim();
      var text = 'Здравствуйте, Иван! Хочу бесплатный разбор ситуации.\n' +
        'Задача: ' + intent + '\n' +
        'Имя: ' + name.value.trim() + '\n' +
        'Телефон: ' + phone.value + (msg ? '\nСитуация: ' + msg : '');
      var win = window.open('https://t.me/Ivan_rostovtsev', '_blank');
      copyText(text).then(function (ok) {
        status.textContent = ok
          ? 'Готово! Текст заявки скопирован — вставьте его в открывшийся чат Telegram и отправьте.'
          : 'Открыли Telegram. Напишите Ивану: ' + intent + ', ' + name.value.trim() + ', ' + phone.value;
      });
      if (!win) window.location.href = 'https://t.me/Ivan_rostovtsev';
    });
  }
})();
