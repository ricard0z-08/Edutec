/* =========================================================
   ECOCLIMA — Página DEVs

   O comportamento compartilhado (navbar fixa, troca de cor,
   menu mobile, reveal ao rolar e ajuste do "ECOCLIMA" do rodapé)
   vem do script.js, carregado antes deste arquivo.
   Aqui fica só o que é específico desta página.
   ========================================================= */
(function () {
  'use strict';

  /* Se alguma foto não carregar (arquivo renomeado, extensão trocada),
     mostra as iniciais no lugar em vez de deixar o ícone de imagem quebrada. */
  document.querySelectorAll('.dev-card__photo').forEach((img) => {
    img.addEventListener('error', () => {
      const card = img.closest('.dev-card');
      const nome = card && card.querySelector('.dev-card__name');
      const iniciais = nome
        ? nome.textContent.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('')
        : '?';

      const marca = document.createElement('span');
      marca.className = 'dev-card__photo dev-card__photo--vazia';
      marca.textContent = iniciais.toUpperCase();
      img.replaceWith(marca);
    });
  });
})();
