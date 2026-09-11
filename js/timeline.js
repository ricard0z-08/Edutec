/* =========================================================
   ECOCLIMA — timeline.js
   O que se mexe na página Timeline:

     1. cada card entra pelo lado em que ele está;
     2. o fio do tempo vai se pintando conforme a pessoa desce
        e os nós acendem quando são ultrapassados;
     3. o atalho lateral com os anos aparece junto da trilha e
        marca sozinho em que COP a leitura está;
     4. a arte de cada card se desloca um pouco dentro da
        moldura (parallax), o que dá profundidade ao rolar.

   Tudo que rola na rolagem passa por uma fila única de rAF,
   igual ao script.js, para não disputar quadro com ele.

   Quem pediu menos animação no sistema recebe a página inteira
   parada: só o conteúdo, sem entrada, sem parallax.
   ========================================================= */
(function () {
  'use strict';

  var itens = Array.prototype.slice.call(document.querySelectorAll('.tl-item'));
  if (!itens.length) return;

  var trilha  = document.getElementById('trilha');
  var fio     = document.getElementById('tlFio');
  var atalho  = document.getElementById('tlAtalho');
  var entradas = Array.prototype.slice.call(document.querySelectorAll('.tl-entra'));

  var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =======================================================
     1. Entrada dos cards e dos textos
     ======================================================= */
  function revelar(el) { el.classList.add('is-dentro'); }

  if (reduzido || !('IntersectionObserver' in window)) {
    itens.forEach(revelar);
    entradas.forEach(revelar);
  } else {
    var olho = new IntersectionObserver(function (registros) {
      registros.forEach(function (r) {
        if (!r.isIntersecting) return;
        revelar(r.target);
        olho.unobserve(r.target);      // entra uma vez só; não repete na volta
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -12% 0px' });

    itens.concat(entradas).forEach(function (el) { olho.observe(el); });
  }

  /* =======================================================
     2. Atalho lateral com os anos

     Montado a partir dos próprios cards: para acrescentar uma
     COP nova basta escrever o <li> no HTML, nada muda aqui.
     ======================================================= */
  var botoes = [];

  function montarAtalho() {
    if (!atalho) return;

    itens.forEach(function (item) {
      var ano = item.getAttribute('data-ano') || '';
      var local = item.querySelector('.tl-card__local');

      var link = document.createElement('a');
      link.className = 'tl-atalho__item';
      link.href = '#' + item.id;
      link.setAttribute('aria-label', local ? ano + ' — ' + local.textContent : ano);

      var rotulo = document.createElement('span');
      rotulo.className = 'tl-atalho__ano';
      rotulo.textContent = ano;

      var traco = document.createElement('span');
      traco.className = 'tl-atalho__traco';

      link.appendChild(rotulo);
      link.appendChild(traco);
      atalho.appendChild(link);
      botoes.push(link);
    });

    atalho.hidden = false;
  }

  var marcado = -1;
  function marcarAtalho(i) {
    if (i === marcado) return;          // só mexe no DOM quando o ano muda
    botoes.forEach(function (b, k) {
      b.classList.toggle('is-atual', k === i);
      if (k === i) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
    marcado = i;
  }

  /* =======================================================
     3. Fila de trabalho da rolagem
     ======================================================= */
  var tarefas = [];
  var agendado = false;

  function aoRolar() {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(function () {
      for (var i = 0; i < tarefas.length; i++) tarefas[i]();
      agendado = false;
    });
  }

  /* linha imaginária na tela: o que passa dela já foi lido */
  function referencia() { return window.innerHeight * 0.58; }

  /* ---- fio, nós e ano atual ---- */
  function pintarTrilha() {
    if (!trilha) return;
    var alvo = referencia();
    var r = trilha.getBoundingClientRect();

    if (fio && r.height) {
      var p = (alvo - r.top) / r.height;
      fio.style.height = Math.max(0, Math.min(1, p)) * 100 + '%';
    }

    var atual = 0;
    for (var i = 0; i < itens.length; i++) {
      var ri = itens[i].getBoundingClientRect();
      itens[i].classList.toggle('is-passado', ri.bottom < alvo);
      if (ri.top < alvo) atual = i;
    }
    marcarAtalho(atual);
  }

  /* ---- o atalho só existe enquanto a trilha está na tela ---- */
  function mostrarAtalho() {
    if (!atalho || atalho.hidden || !trilha) return;
    var r = trilha.getBoundingClientRect();
    var altura = window.innerHeight;
    atalho.classList.toggle('is-visivel', r.top < altura * 0.5 && r.bottom > altura * 0.4);
  }

  /* ---- parallax da arte ---- */
  function parallax() {
    var altura = window.innerHeight;
    for (var i = 0; i < itens.length; i++) {
      var img = itens[i].querySelector('.tl-card__img');
      if (!img) continue;

      var r = itens[i].getBoundingClientRect();
      if (r.bottom < -120 || r.top > altura + 120) continue;   // fora da tela: não gasta quadro

      // -1 quando o card está entrando por baixo, +1 quando já está saindo por cima
      var meio = r.top + r.height / 2;
      var p = (meio - altura / 2) / (altura / 2 + r.height / 2);

      // 4% de deslocamento cabe dentro dos 6% de folga do scale(1.12)
      img.style.transform = 'translate3d(0,' + (p * 4).toFixed(2) + '%,0) scale(1.12)';
    }
  }

  /* =======================================================
     4. Liga tudo
     ======================================================= */
  montarAtalho();

  tarefas.push(pintarTrilha, mostrarAtalho);
  if (!reduzido) tarefas.push(parallax);

  window.addEventListener('scroll', aoRolar, { passive: true });
  window.addEventListener('resize', aoRolar);
  // as artes e as fontes chegam depois e mudam as medidas
  window.addEventListener('load', aoRolar);

  aoRolar();
})();
