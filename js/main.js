(function () {
  'use strict';

  var body = document.body;

  // Imágenes que ya fallaron antes de que este script se ejecutara
  document.querySelectorAll('.media img').forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) img.closest('.media').classList.add('is-empty');
  });

  // ---------- Cabecera: estado al hacer scroll ----------
  var header = document.querySelector('.site-header');
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---------- Nombre de la cabecera: solo cuando el de la portada ya no se ve ----------
  var heroTitle = document.querySelector('.hero-title');
  if (heroTitle && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      header.classList.toggle('show-brand', !entries[entries.length - 1].isIntersecting);
    }, { rootMargin: '-64px 0px 0px 0px' }).observe(heroTitle);
  } else {
    header.classList.add('show-brand');
  }

  // ---------- Menú móvil ----------
  var toggle = document.querySelector('.nav-toggle');
  function setNav(open) {
    body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }
  toggle.addEventListener('click', function () {
    setNav(!body.classList.contains('nav-open'));
  });
  document.querySelectorAll('.main-nav a').forEach(function (a) {
    a.addEventListener('click', function () { setNav(false); });
  });

  // ---------- Enlace activo según la sección visible ----------
  var navLinks = document.querySelectorAll('.main-nav ul a');
  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { sectionObserver.observe(s); });
  }

  // ---------- Animaciones de entrada ----------
  var reveals = document.querySelectorAll('.reveal');
  // Escalonado ligero entre elementos hermanos
  reveals.forEach(function (el) {
    var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) {
      return c.classList.contains('reveal');
    });
    var i = siblings.indexOf(el);
    if (i > 0) el.style.setProperty('--delay', Math.min(i, 6) * 0.08 + 's');
  });
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // ---------- Pestañas de trayectoria ----------
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
    });
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (next) { e.preventDefault(); next.focus(); selectTab(next); }
    });
  });

  // ---------- Lightbox (galería y vídeos) ----------
  var lb = document.getElementById('lightbox');
  var stage = lb.querySelector('.lb-stage');
  var counter = lb.querySelector('.lb-counter');
  var items = Array.prototype.slice.call(document.querySelectorAll('.gallery-item'));
  var current = 0;
  var lastFocus = null;

  function openLightbox() {
    lastFocus = document.activeElement;
    lb.hidden = false;
    body.style.overflow = 'hidden';
    requestAnimationFrame(function () { lb.classList.add('is-open'); });
    lb.querySelector('.lb-close').focus();
  }
  function closeLightbox() {
    var playing = stage.querySelector('video');
    if (playing) playing.pause();
    lb.classList.remove('is-open');
    body.style.overflow = '';
    setTimeout(function () {
      lb.hidden = true;
      lb.classList.remove('is-video');
      stage.innerHTML = '';
    }, 350);
    if (lastFocus) lastFocus.focus();
  }

  function showImage(index) {
    current = (index + items.length) % items.length;
    var item = items[current];
    var figure = item.querySelector('.media');
    stage.innerHTML = '';
    if (figure.classList.contains('is-empty')) {
      stage.appendChild(figure.cloneNode(true));
    } else {
      var img = document.createElement('img');
      img.src = item.getAttribute('href');
      img.alt = item.querySelector('img').alt;
      stage.appendChild(img);
    }
    counter.textContent = (current + 1) + ' / ' + items.length;
  }

  items.forEach(function (item, i) {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      lb.classList.remove('is-video');
      showImage(i);
      openLightbox();
    });
  });

  document.querySelectorAll('.video-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var url = card.getAttribute('data-video');
      lb.classList.add('is-video');
      stage.innerHTML = '';
      if (/\.(webm|mp4)$/.test(url)) {
        var video = document.createElement('video');
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        var poster = card.querySelector('.media:not(.is-empty) img');
        if (poster) video.poster = poster.src;
        [url, card.getAttribute('data-video-fallback')].forEach(function (src) {
          if (!src) return;
          var source = document.createElement('source');
          source.src = src;
          source.type = /\.webm$/.test(src) ? 'video/webm' : 'video/mp4';
          video.appendChild(source);
        });
        stage.appendChild(video);
      } else if (url) {
        var iframe = document.createElement('iframe');
        iframe.src = url + (url.indexOf('?') > -1 ? '&' : '?') + 'autoplay=1';
        iframe.allow = 'autoplay; fullscreen; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.title = card.getAttribute('aria-label') || 'Vídeo';
        stage.appendChild(iframe);
      } else {
        var msg = document.createElement('p');
        msg.className = 'lb-message';
        msg.textContent = 'Vídeo próximamente';
        stage.appendChild(msg);
      }
      openLightbox();
    });
  });

  lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
  lb.querySelector('.lb-prev').addEventListener('click', function () { showImage(current - 1); });
  lb.querySelector('.lb-next').addEventListener('click', function () { showImage(current + 1); });
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target === stage) closeLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && body.classList.contains('nav-open')) setNav(false);
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (lb.classList.contains('is-video')) return;
    if (e.key === 'ArrowRight') showImage(current + 1);
    if (e.key === 'ArrowLeft') showImage(current - 1);
  });

  // ---------- Año del pie ----------
  document.getElementById('year').textContent = new Date().getFullYear();
})();
