/* =========================================================
   ECOCLIMA — Home
   ========================================================= */
(function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp  = (a, b, t) => a + (b - a) * t;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* fila única de trabalho no scroll (um rAF para tudo) */
  const scrollJobs = [];
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      scrollJobs.forEach((fn) => fn());
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* =======================================================
     1. Links ainda sem destino
     ======================================================= */
  $$('[data-soon]').forEach((el) => {
    el.addEventListener('click', (e) => e.preventDefault());
  });

  /* =======================================================
     2. Navbar — fundo, menu e troca automática de cor
     ======================================================= */
  (function nav() {
    const nav = $('#nav');
    const burger = $('#navBurger');
    const mobile = $('#navMobile');
    const logo = $('#logoHome');
    const zones = $$('[data-nav]');
    if (!nav) return;

    // logo = botão "home": na home sobe até o topo,
    // nas outras páginas o href leva de volta para index.html
    if (logo) {
      logo.addEventListener('click', (e) => {
        const href = logo.getAttribute('href') || '';
        if (href.charAt(0) !== '#') return;      // deixa navegar normalmente
        e.preventDefault();
        closeMenu();
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      });
    }

    function openMenu() {
      nav.classList.add('is-open');
      mobile.hidden = false;
      burger.setAttribute('aria-expanded', 'true');
      paint();
    }
    function closeMenu() {
      nav.classList.remove('is-open');
      mobile.hidden = true;
      burger.setAttribute('aria-expanded', 'false');
      paint();
    }
    burger.addEventListener('click', () =>
      nav.classList.contains('is-open') ? closeMenu() : openMenu()
    );
    $$('.nav__mlink').forEach((l) => l.addEventListener('click', closeMenu));
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) closeMenu();
    });

    // a cor dos elementos segue o fundo da seção que está atrás da navbar
    const bar = $('.nav__inner', nav);
    function paint() {
      // mede a barra, não o header inteiro (que cresce com o menu mobile aberto)
      const y = bar.offsetHeight * 0.55;
      let mode = 'dark';
      for (const z of zones) {
        const r = z.getBoundingClientRect();
        if (r.top <= y && r.bottom > y) { mode = z.dataset.nav; break; }
      }
      if (nav.classList.contains('is-open')) mode = 'dark';
      nav.classList.toggle('is-light', mode === 'light');
      nav.classList.toggle('is-dark', mode !== 'light');
      nav.classList.toggle('is-stuck', window.scrollY > 24);
    }

    scrollJobs.push(paint);
    paint();
  })();

  /* =======================================================
     3. Texto que preenche exatamente a largura disponível
        (hero "RESPIRE FUTURO" e assinatura "ECOCLIMA")
     ======================================================= */
  (function fitText() {
    // largura do texto em uma fonte de referência, medida num clone fora da tela
    function widthAt(el, px) {
      const clone = el.cloneNode(true);
      clone.style.cssText =
        'position:absolute;left:-99999px;top:0;visibility:hidden;' +
        'white-space:nowrap;width:auto;max-width:none;font-size:' + px + 'px;';
      el.parentNode.appendChild(clone);
      const w = clone.getBoundingClientRect().width;
      clone.remove();
      return w;
    }

    function fit(el, availFn, maxPx) {
      if (!el) return;
      const avail = availFn();
      if (avail <= 0) return;
      const ratio = widthAt(el, 100) / 100;
      if (!ratio) return;
      el.style.fontSize = Math.min(avail / ratio, maxPx || Infinity) + 'px';
    }

    const heroTitle = $('.hero__title');
    const heroBox = $('.hero__content');
    const kicker = $('.hero__kicker');
    const word = $('.footer__word');
    const wordBox = word && word.parentElement;

    function heroAvail() {
      const cs = getComputedStyle(heroBox);
      let a = heroBox.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (cs.flexDirection !== 'column') {
        a -= kicker.getBoundingClientRect().width + (parseFloat(cs.columnGap) || 0);
      }
      return a;
    }
    function wordAvail() {
      const cs = getComputedStyle(wordBox);
      return wordBox.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    }

    function run() {
      fit(heroTitle, heroAvail);
      fit(word, wordAvail);
    }

    run();
    window.addEventListener('resize', run);
    window.addEventListener('load', run);

    // refaz a conta quando as fontes chegam (a medida muda com a fonte real)
    if (document.fonts) {
      if (document.fonts.ready) document.fonts.ready.then(run);
      document.fonts.addEventListener('loadingdone', run);
    }
    // e sempre que o container mudar de LARGURA
    // (só a largura: mudar a fonte altera a altura e criaria um laço)
    if ('ResizeObserver' in window) {
      let lastW = 0;
      const ro = new ResizeObserver((entries) => {
        const w = Math.round(entries[0].contentRect.width);
        if (w === lastW) return;
        lastW = w;
        run();
      });
      [heroBox, wordBox].forEach((b) => b && ro.observe(b));
    }
  })();

  /* =======================================================
     4. Reveal genérico ao entrar na tela
     ======================================================= */
  (function revealUp() {
    const items = $$('.reveal-up');
    if (!items.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach((i) => i.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (!e.isIntersecting) return;
          e.target.style.transitionDelay = (i % 6) * 70 + 'ms';
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    items.forEach((i) => io.observe(i));
  })();

  /* =======================================================
     5. Carrossel — automático + arrastar com o mouse
     ======================================================= */
  (function carousel() {
    const viewport = $('#carViewport');
    const track = $('#carTrack');
    if (!viewport || !track) return;

    const slides = $$('.slide', track);
    const dotsBox = $('#carDots');
    const DELAY = 5200;

    let index = 0;
    let dragging = false;
    let startX = 0;
    let delta = 0;
    let timer = null;

    // medido na hora: não depende do evento de resize nem da ordem de layout
    const slideWidth = () => viewport.clientWidth;

    const dots = slides.map((_, i) => {
      const d = document.createElement('button');
      d.className = 'dot';
      d.type = 'button';
      d.setAttribute('aria-label', 'Ir para a imagem ' + (i + 1));
      d.addEventListener('click', () => { go(i); restart(); });
      dotsBox.appendChild(d);
      return d;
    });

    function render(animate = true) {
      track.style.transition = animate ? 'transform .75s cubic-bezier(.22,.68,.32,1)' : 'none';
      track.style.transform = 'translate3d(' + (-index * slideWidth() + delta) + 'px,0,0)';
      dots.forEach((d, i) => d.classList.toggle('is-on', i === index));
      slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
    }
    function go(i) {
      index = (i + slides.length) % slides.length;
      delta = 0;
      render();
    }
    const next = () => go(index + 1);
    const prev = () => go(index - 1);

    function start() { if (!timer) timer = setInterval(next, DELAY); }
    function stop() { clearInterval(timer); timer = null; }
    function restart() { stop(); start(); }

    $('#carNext').addEventListener('click', () => { next(); restart(); });
    $('#carPrev').addEventListener('click', () => { prev(); restart(); });

    // arrastar
    viewport.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      dragging = true;
      startX = e.clientX;
      delta = 0;
      stop();
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      delta = e.clientX - startX;
      // resistência nas pontas
      if ((index === 0 && delta > 0) || (index === slides.length - 1 && delta < 0)) delta *= 0.35;
      render(false);
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove('is-dragging');
      const limit = Math.min(120, slideWidth() * 0.16);
      if (delta < -limit) index++;
      else if (delta > limit) index--;
      go(index);
      start();
    }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('lostpointercapture', endDrag);

    window.addEventListener('resize', () => render(false));
    if ('ResizeObserver' in window) new ResizeObserver(() => render(false)).observe(viewport);
    document.addEventListener('visibilitychange', () =>
      document.hidden ? stop() : start()
    );

    render(false);
    start();
  })();

  /* =======================================================
     6. Texto que se revela com o scroll (+ imagens inline)
     ======================================================= */
  (function revealText() {
    const el = $('#revealText');
    if (!el) return;

    const SPREAD = 5;                 // suavidade da "onda" de revelação
    const FROM = [185, 178, 166];
    const TO = [23, 22, 15];

    // quebra o conteúdo em tokens (palavras + imagens) mantendo a ordem
    const frag = document.createDocumentFragment();
    Array.from(el.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (!part.trim()) { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span');
          s.className = 'word';
          s.textContent = part;
          frag.appendChild(s);
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const w = document.createElement('span');
        w.className = 'word word--img';
        w.appendChild(node);
        frag.appendChild(w);
      }
    });
    el.textContent = '';
    el.appendChild(frag);

    const tokens = $$('.word', el);
    if (!tokens.length) return;

    function update() {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom < -200 || r.top > vh + 200) return;

      const travel = r.height + vh * 0.25;
      const p = clamp((vh * 0.78 - r.top) / travel, 0, 1);
      const head = p * (tokens.length + SPREAD);

      tokens.forEach((t, i) => {
        const k = clamp((head - i) / SPREAD, 0, 1);
        const img = t.firstElementChild;
        if (img && img.tagName === 'IMG') {
          img.style.opacity = k;
          img.style.transform = 'scale(' + lerp(0.55, 1, k) + ')';
        } else {
          t.style.color =
            'rgb(' +
            Math.round(lerp(FROM[0], TO[0], k)) + ',' +
            Math.round(lerp(FROM[1], TO[1], k)) + ',' +
            Math.round(lerp(FROM[2], TO[2], k)) + ')';
          t.style.opacity = lerp(0.55, 1, k);
        }
      });
    }

    scrollJobs.push(update);
    update();
  })();

  /* =======================================================
     7. Carrossel infinito dos cards
        (pausa só enquanto o botão esquerdo estiver pressionado)
     ======================================================= */
  (function marquee() {
    const box = $('#marquee');
    const track = $('#marqueeTrack');
    if (!box || !track) return;

    const originals = Array.from(track.children);
    const gap = parseFloat(getComputedStyle(track).gap) || 0;

    // duplica o conjunto para o loop nunca ter fim
    originals.forEach((n) => track.appendChild(n.cloneNode(true)));

    let setWidth = 0;
    function measure() {
      setWidth = originals.reduce((sum, n) => sum + n.getBoundingClientRect().width + gap, 0);
    }
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);

    const SPEED = 42;              // px por segundo
    let offset = 0;
    let held = false;
    let last = performance.now();

    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (!held && setWidth > 0) {
        offset -= SPEED * dt;
        if (-offset >= setWidth) offset += setWidth;
        track.style.transform = 'translate3d(' + offset + 'px,0,0)';
      }
      requestAnimationFrame(frame);
    }
    if (!reduced) requestAnimationFrame(frame);

    box.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      held = true;
      box.classList.add('is-held');
    });
    window.addEventListener('mouseup', () => {
      held = false;
      box.classList.remove('is-held');
    });
    // no toque, pausa enquanto o dedo estiver na tela
    box.addEventListener('touchstart', () => { held = true; }, { passive: true });
    window.addEventListener('touchend', () => { held = false; });
  })();

  /* =======================================================
     8. FAQs — accordion
     ======================================================= */
  (function faq() {
    const list = $('#faqList');
    if (!list) return;
    const items = $$('.faq__item', list);

    items.forEach((item) => {
      const btn = $('.faq__q', item);
      btn.addEventListener('click', () => {
        const wasOpen = item.classList.contains('is-open');
        items.forEach((o) => {
          o.classList.remove('is-open');
          $('.faq__q', o).setAttribute('aria-expanded', 'false');
        });
        if (!wasOpen) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  })();

  /* =======================================================
     9. Cena do espaço — Terra cortada ao meio, frase circular,
        satélites flutuando e campo de estrelas
     ======================================================= */
  (function space() {
    const section = $('.section--space');
    const stage = $('#planetStage');
    if (!section || !stage) return;

    /* ---------- 9.1 estrelas ---------- */
    (function stars() {
      const box = $('#spaceStars');
      if (!box) return;
      const frag = document.createDocumentFragment();
      for (let i = 0; i < 160; i++) {
        const s = document.createElement('span');
        const size = Math.random() < 0.85 ? 1 + Math.random() * 1.2 : 2 + Math.random() * 1.4;
        s.className = 'star';
        s.style.cssText =
          'left:' + (Math.random() * 100).toFixed(2) + '%;' +
          'top:' + (Math.random() * 100).toFixed(2) + '%;' +
          'width:' + size.toFixed(2) + 'px;height:' + size.toFixed(2) + 'px;' +
          '--o:' + (0.35 + Math.random() * 0.6).toFixed(2) + ';' +
          '--dur:' + (2.6 + Math.random() * 5).toFixed(1) + 's;' +
          '--delay:' + (-Math.random() * 6).toFixed(1) + 's;';
        frag.appendChild(s);
      }
      box.appendChild(frag);
    })();

    /* ---------- 9.2 frase circular ---------- */
    (function ring() {
      const path = $('#ringPath');
      const textPath = $('#ringText');
      if (!path || !textPath) return;

      const FRASE = 'SEJA O FUTURO   ';

      function build() {
        const total = path.getTotalLength();
        if (!total) return;
        // mede uma repetição para descobrir quantas cabem na volta
        textPath.textContent = FRASE;
        const uma = textPath.parentNode.getComputedTextLength();
        if (!uma) return;
        const vezes = Math.max(1, Math.round(total / uma));
        textPath.textContent = FRASE.repeat(vezes);
        // encaixa exatamente na circunferência, sem sobra nem emenda
        textPath.setAttribute('textLength', total);
        textPath.setAttribute('lengthAdjust', 'spacing');
      }

      build();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    })();

    /* ---------- 9.3 textura estilizada da Terra ---------- */
    const LAND = {
      americaN: [[-168,66],[-160,71],[-140,70],[-125,70],[-110,68],[-95,68],[-85,70],[-75,68],[-64,60],[-56,52],[-66,45],[-70,42],[-75,36],[-81,31],[-80,25],[-84,29],[-90,29],[-97,26],[-97,22],[-95,16],[-88,15],[-83,9],[-78,8],[-84,14],[-92,16],[-105,20],[-110,24],[-117,32],[-124,40],[-125,48],[-133,55],[-140,60],[-150,59],[-160,55],[-165,60]],
      americaS: [[-81,8],[-77,12],[-71,12],[-62,11],[-52,5],[-50,0],[-44,-2],[-35,-5],[-35,-8],[-39,-13],[-41,-22],[-48,-25],[-53,-34],[-57,-38],[-62,-40],[-63,-46],[-68,-52],[-75,-52],[-73,-45],[-73,-37],[-71,-30],[-70,-23],[-71,-18],[-77,-12],[-81,-6],[-80,-2],[-79,2]],
      africa:   [[-17,15],[-16,21],[-10,26],[0,32],[10,37],[20,32],[30,31],[33,28],[35,23],[38,18],[43,12],[51,12],[50,5],[42,-1],[40,-8],[40,-16],[35,-22],[32,-28],[26,-34],[19,-34],[15,-25],[12,-17],[9,-2],[9,4],[3,6],[-5,5],[-13,8]],
      eurasia:  [[-10,36],[-9,43],[-2,43],[0,49],[-5,50],[2,51],[8,54],[10,58],[18,65],[25,71],[30,68],[45,68],[60,70],[75,73],[100,77],[110,74],[130,72],[145,70],[160,68],[170,66],[178,64],[170,60],[155,58],[142,52],[135,44],[130,42],[126,38],[122,31],[120,24],[110,20],[105,10],[100,3],[103,1],[95,6],[90,22],[80,15],[77,8],[72,20],[68,23],[62,25],[57,25],[50,30],[45,38],[40,42],[35,45],[30,45],[28,41],[23,40],[16,42],[12,38],[15,37],[10,44],[3,42]],
      oceania:  [[113,-22],[114,-27],[118,-34],[125,-32],[132,-31],[137,-34],[141,-38],[147,-38],[150,-35],[153,-28],[146,-19],[142,-11],[136,-12],[130,-11],[126,-14],[120,-17]],
      groenl:   [[-45,60],[-50,68],[-55,72],[-45,78],[-30,82],[-20,78],[-22,70],[-32,65]],
      madag:    [[43,-12],[50,-15],[50,-24],[45,-25],[43,-19]],
      japao:    [[130,31],[136,35],[141,41],[145,44],[142,39],[138,35],[133,33]],
      novaz:    [[166,-46],[170,-44],[174,-41],[178,-37],[173,-35],[172,-40],[168,-44]],
      britan:   [[-6,50],[-5,55],[-3,58],[0,58],[1,53],[-2,51]]
    };

    function makeTexture() {
      const c = document.createElement('canvas');
      c.width = 2048; c.height = 1024;
      const g = c.getContext('2d');

      const sea = g.createLinearGradient(0, 0, 0, 1024);
      sea.addColorStop(0.00, '#1d3f4d');
      sea.addColorStop(0.25, '#245a6b');
      sea.addColorStop(0.50, '#2b6c7d');
      sea.addColorStop(0.75, '#245a6b');
      sea.addColorStop(1.00, '#1d3f4d');
      g.fillStyle = sea;
      g.fillRect(0, 0, 2048, 1024);

      const px = (lon) => ((lon + 180) / 360) * 2048;
      const py = (lat) => ((90 - lat) / 180) * 1024;

      g.lineJoin = 'round';
      Object.values(LAND).forEach((pts) => {
        g.beginPath();
        pts.forEach(([lon, lat], i) => {
          const x = px(lon), y = py(lat);
          i ? g.lineTo(x, y) : g.moveTo(x, y);
        });
        g.closePath();
        g.fillStyle = '#3d6b45';
        g.fill();
        g.strokeStyle = '#4e7f54';
        g.lineWidth = 5;
        g.stroke();
      });

      // calotas polares
      g.fillStyle = '#e8efe9';
      g.fillRect(0, 0, 2048, 46);
      g.fillRect(0, 968, 2048, 56);
      g.globalAlpha = 0.55;
      g.fillRect(0, 46, 2048, 30);
      g.fillRect(0, 938, 2048, 30);
      g.globalAlpha = 1;

      // relevo sutil
      for (let i = 0; i < 2600; i++) {
        g.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.05) + ')';
        g.fillRect(Math.random() * 2048, 80 + Math.random() * 864, 2, 2);
      }
      return c;
    }

    const texCanvas = makeTexture();

    /* ---------- 9.4 fallback sem WebGL / sem CDN ---------- */
    function startFallback() {
      const ball = $('#planetFallback');
      if (!ball) return;
      ball.hidden = false;
      ball.style.backgroundImage = 'url(' + texCanvas.toDataURL('image/jpeg', 0.82) + ')';
    }

    function hasWebGL() {
      try {
        const c = document.createElement('canvas');
        return !!(window.WebGLRenderingContext &&
          (c.getContext('webgl') || c.getContext('experimental-webgl')));
      } catch (e) { return false; }
    }

    /* ---------- 9.5 planeta em 3D, girando sozinho ---------- */
    async function startThree() {
      const THREE = await import('https://unpkg.com/three@0.160.0/build/three.module.js');

      const scene = new THREE.Scene();
      // z = 3.4 deixa a esfera ocupando ~95% do quadro
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
      camera.position.z = 3.4;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      stage.appendChild(renderer.domElement);

      const tex = new THREE.CanvasTexture(texCanvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

      const world = new THREE.Group();
      world.rotation.z = 0.41;                     // inclinação do eixo
      scene.add(world);

      const earth = new THREE.Mesh(
        new THREE.SphereGeometry(1, 72, 72),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0.02 })
      );
      world.add(earth);

      // luz vinda do canto superior direito, igual ao brilho do sol da seção
      scene.add(new THREE.AmbientLight(0x8fa4c4, 0.5));
      const sun = new THREE.DirectionalLight(0xfff2dc, 2.5);
      sun.position.set(2.6, 1.9, 2.2);
      scene.add(sun);
      const rim = new THREE.DirectionalLight(0x6f8ecb, 0.55);
      rim.position.set(-2.6, -0.6, -1.8);
      scene.add(rim);

      function resize() {
        const s = stage.clientWidth;
        if (!s) return;
        renderer.setSize(s, s, false);
        camera.aspect = 1;
        camera.updateProjectionMatrix();
      }
      resize();
      if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
      else window.addEventListener('resize', resize);

      let visible = true;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 })
          .observe(section);
      }

      const SPEED = reduced ? 0 : 0.0009;          // rotação lenta e contínua
      (function loop() {
        requestAnimationFrame(loop);
        if (!visible || document.hidden) return;
        earth.rotation.y += SPEED;
        renderer.render(scene, camera);
      })();
    }

    if (hasWebGL()) startThree().catch(startFallback);
    else startFallback();
  })();
})();
