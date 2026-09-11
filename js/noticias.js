/* =========================================================
   ECOCLIMA — noticias.js

   A página de Notícias tem duas barras fixas no topo: a navbar
   (montada pelo js/layout.js) e a faixa vermelha do plantão.
   Como as duas são fixas, elas não ocupam espaço no fluxo — é
   preciso reservar esse espaço na mão, senão a primeira manchete
   nasce escondida atrás delas.

   Este arquivo faz só isso: mede a altura real das duas barras e
   guarda em --nt-nav-h e --nt-faixa-h. O css/noticias.css usa as
   duas variáveis para o padding do topo, para o "top" da faixa e
   para o scroll-margin das âncoras.

   O laço infinito da faixa não está aqui: ele é o mesmo motor do
   script.js, que procura #marquee e #marqueeTrack.

   Precisa vir depois do layout.js (a navbar tem que existir para
   ser medida).
   ========================================================= */
(function () {
  'use strict';

  var raiz = document.documentElement;

  /* A navbar cresce quando o menu do celular abre, e nessa hora ela
     deixa de ser só a barra. Por isso medimos .nav__inner, que é a
     barra propriamente dita, e não o <header> inteiro. */
  function medir() {
    var barra = document.querySelector('#nav .nav__inner');
    var faixa = document.getElementById('marquee');

    if (barra) {
      raiz.style.setProperty('--nt-nav-h', Math.round(barra.getBoundingClientRect().height) + 'px');
    }
    if (faixa) {
      raiz.style.setProperty('--nt-faixa-h', Math.round(faixa.getBoundingClientRect().height) + 'px');
    }
  }

  medir();

  /* As fontes do Google chegam depois do HTML e mudam a altura do
     texto da faixa; sem esta segunda medida, sobra (ou falta) uma
     listra de alguns pixels embaixo da barra vermelha. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(medir);
  }
  window.addEventListener('load', medir);

  /* Ao girar o celular ou redimensionar a janela as barras mudam de
     altura (o texto quebra em duas linhas, por exemplo). Espera o
     fim do redimensionamento para não medir a cada pixel. */
  var espera;
  window.addEventListener('resize', function () {
    clearTimeout(espera);
    espera = setTimeout(medir, 150);
  });
})();
