/* =========================================================
   ECOCLIMA — layout.js
   Cabeçalho e rodapé compartilhados por todas as páginas.

   Como usar numa página:
     1. no lugar do cabeçalho:  <div data-eco-cabecalho></div>
        (na Home, que tem foto no topo: data-variante="sobre-foto")
     2. no lugar do rodapé:     <div data-eco-rodape></div>
        (em página de fundo escuro: data-variante="escuro")
     3. carregar este arquivo ANTES do script.js:
        <script src="js/layout.js"></script>
        <script src="script.js"></script>

   Sem fetch: o HTML é montado aqui dentro com template strings,
   então funciona no Live Server e abrindo o arquivo direto.

   A marcação gerada é a mesma que estava escrita à mão nas três
   primeiras páginas (classes nav__*, footer__* e os id que o
   script.js procura). Mudar nomes aqui quebra o style.css e o
   script.js.
   ========================================================= */
(function () {
  'use strict';

  /* =======================================================
     1. As páginas do site

     Lista única: é o único lugar a mexer quando uma etapa
     criar uma página nova. Enquanto a página não existe,
     'arquivo' fica vazio e o link aparece sem destino
     (o script.js impede o clique pelo data-soon).

     'internas' são as páginas que ficam por dentro de um item do
     menu: a tela de cada jogo continua sendo a seção Jogo, então
     o link do cabeçalho segue marcado quando se está nelas.
     ======================================================= */
  var PAGINAS = [
    { arquivo: 'entraves.html', texto: 'Entraves', lado: 'esquerda' },
    { arquivo: 'jogo.html',     texto: 'Jogo',     lado: 'esquerda',
      internas: ['jogo-coleta.html', 'jogo-quiz.html'] },
    { arquivo: 'noticias.html', texto: 'Notícias', lado: 'esquerda' },
    { arquivo: 'timeline.html', texto: 'Timeline', lado: 'direita'  },
    { arquivo: 'dev.html',      texto: 'DEVs',     lado: 'direita'  }
  ];

  var HOME = 'home.html';

  /* Texto do rodapé.
     REVISAR — escrito na Etapa 1 para substituir o texto antigo,
     que descrevia uma empresa de climatização e não este site. */
  var TEXTO_RODAPE =
    'O EcoClima é um projeto de estudantes sobre meio ambiente e mudanças ' +
    'climáticas. Reunimos informação confiável em linguagem acessível, para ' +
    'que o que se aprende aqui vire atitude no dia a dia. © 2026 EcoClima. ' +
    'Todos os direitos reservados.';

  /* =======================================================
     2. Qual página está aberta
     ======================================================= */
  function paginaAtual() {
    var caminho = window.location.pathname;
    var nome = caminho.substring(caminho.lastIndexOf('/') + 1);
    // endereço terminando em "/" abre o index.html, que é a tela
    // de Boas-vindas (e não tem cabeçalho nem rodapé)
    return nome === '' ? 'index.html' : nome;
  }

  var atual = paginaAtual();
  var naHome = atual === HOME;

  /* =======================================================
     3. Pedaços do cabeçalho
     ======================================================= */
  /* a página aberta é esta do menu, ou uma das que moram dentro dela */
  function estaAtiva(pagina) {
    if (pagina.arquivo === '') return false;
    if (pagina.arquivo === atual) return true;
    return !!pagina.internas && pagina.internas.indexOf(atual) !== -1;
  }

  function link(pagina, classe) {
    var ativa = estaAtiva(pagina);
    var destino = pagina.arquivo === '' ? '#' : pagina.arquivo;
    return '<a class="' + classe + (ativa ? ' is-active' : '') + '"' +
           ' href="' + destino + '"' +
           (pagina.arquivo === '' ? ' data-soon' : '') +
           (ativa ? ' aria-current="page"' : '') +
           '>' + pagina.texto + '</a>';
  }

  function linksDoLado(lado, classe) {
    return PAGINAS
      .filter(function (p) { return p.lado === lado; })
      .map(function (p) { return link(p, classe); })
      .join('\n      ');
  }

  function cabecalho(variante) {
    // na Home o logotipo sobe a página; nas outras, volta para a Home
    var destinoLogo = naHome ? '#top' : HOME;
    var textoLogo = naHome
      ? 'EcoClima — voltar ao topo'
      : 'EcoClima — voltar para a home';

    // "sobre-foto": a página começa com foto no topo, então o cabeçalho
    // já nasce em texto branco. Depois o script.js continua trocando a
    // cor sozinho, conforme a seção que estiver atrás da barra.
    var classeInicial = variante === 'sobre-foto' ? ' is-light' : '';

    return '' +
'<header class="nav' + classeInicial + '" id="nav">\n' +
'  <div class="nav__inner">\n' +
'    <nav class="nav__group nav__group--left" aria-label="Navegação principal">\n' +
'      ' + linksDoLado('esquerda', 'nav__link') + '\n' +
'    </nav>\n' +
'\n' +
'    <a class="nav__logo" href="' + destinoLogo + '" id="logoHome" aria-label="' + textoLogo + '">\n' +
'      <img class="nav__logo-img nav__logo-img--light" src="imagens/Logo-branco.png" alt="EcoClima">\n' +
'      <img class="nav__logo-img nav__logo-img--dark" src="imagens/Logo-preto.png" alt="">\n' +
'    </a>\n' +
'\n' +
'    <nav class="nav__group nav__group--right" aria-label="Navegação secundária">\n' +
'      ' + linksDoLado('direita', 'nav__link') + '\n' +
'      <div class="eco-conta" id="ecoConta" hidden></div>\n' +
'    </nav>\n' +
'\n' +
'    <button class="nav__burger" id="navBurger" aria-label="Abrir menu" aria-expanded="false" aria-controls="navMobile">\n' +
'      <span></span><span></span><span></span>\n' +
'    </button>\n' +
'  </div>\n' +
'\n' +
'  <div class="nav__mobile" id="navMobile" hidden>\n' +
'    ' + PAGINAS.map(function (p) { return link(p, 'nav__mlink'); }).join('\n    ') + '\n' +
'    <div class="eco-conta eco-conta--mobile" id="ecoContaMobile" hidden></div>\n' +
'  </div>\n' +
'</header>';
  }

  /* =======================================================
     4. Rodapé
     ======================================================= */
  function rodape(variante) {
    var escuro = variante === 'escuro';

    // páginas que já existem (a Home entra sempre, as outras
    // aparecem conforme forem sendo criadas)
    var lista = [{ arquivo: HOME, texto: 'Home' }].concat(
      PAGINAS.filter(function (p) { return p.arquivo !== ''; })
    );

    var links = lista.map(function (p) {
      var ativa = estaAtiva(p);
      return '<a class="eco-rodape-link" href="' + p.arquivo + '"' +
             (ativa ? ' aria-current="page"' : '') + '>' + p.texto + '</a>';
    }).join('\n      ');

    return '' +
'<footer class="footer' + (escuro ? ' footer--dark' : '') + '" data-nav="' + (escuro ? 'light' : 'dark') + '">\n' +
'  <div class="wrap">\n' +
'    <h2 class="footer__word">ECOCLIMA</h2>\n' +
'    <hr class="footer__rule">\n' +
'    <nav class="eco-rodape-links" aria-label="Páginas do EcoClima">\n' +
'      ' + links + '\n' +
'    </nav>\n' +
'    <div class="footer__bottom">\n' +
'      <p class="footer__text">' + TEXTO_RODAPE + '</p>\n' +
'      <button class="badge" type="button" data-soon>PT-BR</button>\n' +
'    </div>\n' +
'  </div>\n' +
'</footer>';
  }

  /* =======================================================
     5. Conta: o que o site guarda sobre quem está usando

     Não existe banco de dados. Guardamos no localStorage
     apenas { nome, email, logado }. Senha nunca é guardada.
     ======================================================= */
  var CHAVE = 'ecoclima_usuario';

  // o localStorage pode estar bloqueado (navegação anônima em
  // alguns navegadores), então toda leitura e escrita é protegida
  function lerUsuario() {
    try {
      var bruto = window.localStorage.getItem(CHAVE);
      return bruto ? JSON.parse(bruto) : null;
    } catch (e) {
      return null;
    }
  }

  function usuarioLogado() {
    var u = lerUsuario();
    return u && u.logado ? u : null;
  }

  function salvarUsuario(dados) {
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify({
        nome: dados.nome,
        email: dados.email,
        logado: true
      }));
    } catch (e) { /* sem localStorage, o site continua funcionando */ }
  }

  function sair() {
    var u = lerUsuario() || { nome: '', email: '' };
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify({
        nome: u.nome,
        email: u.email,
        logado: false
      }));
    } catch (e) { /* idem */ }
  }

  /* =======================================================
     6. Aviso (toast)
     Aparece no canto, fala para o leitor de tela e some em 4s.
     ======================================================= */
  function aviso(texto, tipo) {
    var caixa = document.createElement('div');
    caixa.className = 'eco-aviso' + (tipo === 'erro' ? ' eco-aviso--erro' : '');
    caixa.setAttribute('role', 'status');
    caixa.setAttribute('aria-live', 'polite');
    caixa.textContent = texto;
    document.body.appendChild(caixa);

    // dois quadros de espera: sem isso o navegador pula a transição
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { caixa.classList.add('eco-aviso--visivel'); });
    });

    setTimeout(function () {
      caixa.classList.remove('eco-aviso--visivel');
      setTimeout(function () {
        if (caixa.parentNode) caixa.parentNode.removeChild(caixa);
      }, 400);
    }, 4000);

    return caixa;
  }

  /* =======================================================
     7. O canto do login, no cabeçalho

     Montado com createElement (e não com texto) porque o nome
     vem de quem digitou: assim nada do que a pessoa escrever
     pode virar HTML.
     ======================================================= */
  function preencherConta(slot, usuario) {
    while (slot.firstChild) slot.removeChild(slot.firstChild);

    if (usuario) {
      var ola = document.createElement('span');
      ola.className = 'eco-conta__ola';
      ola.textContent = 'Olá, ' + usuario.nome;

      var botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'eco-conta__sair';
      botao.textContent = 'Sair';
      botao.addEventListener('click', aoClicarSair);

      slot.appendChild(ola);
      slot.appendChild(botao);
    } else {
      var entrar = document.createElement('a');
      entrar.className = 'eco-conta__entrar';
      entrar.href = 'login.html';
      entrar.textContent = 'Entrar';
      slot.appendChild(entrar);
    }

    slot.hidden = false;
  }

  /* O botão do canto da tela de Boas-vindas: "Entrar" para quem
     não entrou ainda, "Ir para a Home" para quem já entrou. */
  function preencherEntrar(usuario) {
    var botoes = document.querySelectorAll('[data-eco-entrar]');
    Array.prototype.forEach.call(botoes, function (botao) {
      var rotulo = botao.querySelector('[data-rotulo]') || botao;
      if (usuario) {
        botao.setAttribute('href', HOME);
        rotulo.textContent = 'Ir para a Home';
      } else {
        botao.setAttribute('href', 'login.html');
        rotulo.textContent = 'Entrar';
      }
    });
  }

  function pintarConta() {
    var usuario = usuarioLogado();
    ['#ecoConta', '#ecoContaMobile'].forEach(function (seletor) {
      var slot = document.querySelector(seletor);
      if (slot) preencherConta(slot, usuario);
    });
    preencherEntrar(usuario);
  }

  function aoClicarSair() {
    sair();
    pintarConta();
    aviso('Você saiu da sua conta');
  }

  /* =======================================================
     8. Troca os marcadores pelo HTML de verdade
     Se a página não tiver o marcador, nada acontece.
     ======================================================= */
  function trocar(seletor, monta) {
    var marcador = document.querySelector(seletor);
    if (!marcador) return;
    marcador.outerHTML = monta(marcador.getAttribute('data-variante') || '');
  }

  trocar('[data-eco-cabecalho]', cabecalho);
  trocar('[data-eco-rodape]', rodape);
  pintarConta();

  /* =======================================================
     9. O que as outras páginas podem usar

     O js/auth.js usa daqui para não repetir a chave do
     localStorage nem o código do aviso.
     ======================================================= */
  window.EcoClima = {
    HOME: HOME,
    lerUsuario: lerUsuario,
    usuarioLogado: usuarioLogado,
    salvarUsuario: salvarUsuario,
    sair: sair,
    aviso: aviso,
    pintarConta: pintarConta
  };
})();
