/* =========================================================
   ECOCLIMA — Página Entraves

   O comportamento compartilhado (navbar fixa, troca de cor,
   menu mobile, entrada por scroll e ajuste do "ECOCLIMA" do
   rodapé) vem do script.js, carregado antes deste arquivo.
   Aqui fica só o que é específico desta página.
   ========================================================= */
(function () {
  'use strict';

  const cards = Array.from(document.querySelectorAll('.entrave'));
  if (!cards.length) return;

  /* Escalona a entrada dos cards: quando dois ou três aparecem
     na tela ao mesmo tempo, eles entram em sequência em vez de
     todos de uma vez. O script.js cuida de adicionar o .is-in. */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entradas) => {
      entradas
        .filter((e) => e.isIntersecting)
        .forEach((e, i) => {
          e.target.style.transitionDelay = i * 110 + 'ms';
          io.unobserve(e.target);
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    cards.forEach((c) => io.observe(c));
  }

  /* Se alguma imagem não carregar, o card fica só com o fundo
     escuro em vez de mostrar ícone de imagem quebrada. */
  cards.forEach((card) => {
    const img = card.querySelector('.entrave__img');
    if (!img) return;
    img.addEventListener('error', () => {
      img.remove();
      card.querySelector('.entrave__card').classList.add('entrave__card--sem-imagem');
    });
  });
})();
