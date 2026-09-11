/* =========================================================
   ECOCLIMA — auth.js
   Cadastro, login e "esqueci minha senha".

   Não existe banco de dados: tudo é simulado. Quem guarda e
   lê o usuário é o js/layout.js (window.EcoClima), carregado
   antes deste arquivo — assim a chave do localStorage mora
   num lugar só. A senha nunca é guardada.
   ========================================================= */
(function () {
  'use strict';

  var Eco = window.EcoClima || {};
  var HOME = Eco.HOME || 'home.html';

  var $ = function (seletor, dentro) { return (dentro || document).querySelector(seletor); };
  var $$ = function (seletor, dentro) {
    return Array.prototype.slice.call((dentro || document).querySelectorAll(seletor));
  };

  /* =======================================================
     1. As regras de cada campo

     Cada mensagem diz como corrigir, não só o que está errado.
     ======================================================= */
  var REGRAS = {
    nome: {
      valida: function (valor) {
        var letras = valor.match(/[A-Za-zÀ-ÿ]/g);
        return !!letras && letras.length >= 3;
      },
      erro: 'Digite seu nome completo, com pelo menos 3 letras.'
    },
    email: {
      valida: function (valor) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim());
      },
      erro: 'Digite um e-mail válido, como nome@email.com'
    },
    senha: {
      valida: function (valor) { return valor.length >= 6; },
      erro: 'Use pelo menos 6 caracteres.'
    },
    confirmar: {
      valida: function (valor, form) {
        var senha = $('#senha', form);
        return valor.length > 0 && senha && valor === senha.value;
      },
      erro: 'As senhas precisam ser iguais.'
    },
    termos: {
      valida: function (valor) { return valor === 'marcado'; },
      erro: 'Marque a caixa para continuar.'
    }
  };

  /* =======================================================
     2. Mostrar e apagar erro
     ======================================================= */
  function bloco(form, nome) { return $('[data-campo="' + nome + '"]', form); }

  function controle(bl) { return $('input', bl); }

  function valorDe(campo) {
    return campo.type === 'checkbox' ? (campo.checked ? 'marcado' : '') : campo.value;
  }

  function marcar(bl, mensagem) {
    var campo = controle(bl);
    var caixa = $('.eco-campo__erro', bl);

    if (mensagem) {
      bl.classList.add('eco-campo--erro');
      campo.setAttribute('aria-invalid', 'true');
      if (caixa) caixa.textContent = mensagem;
    } else {
      bl.classList.remove('eco-campo--erro');
      campo.removeAttribute('aria-invalid');
      if (caixa) caixa.textContent = '';
    }
  }

  /* mostrar = true só quando a pessoa já teve a chance de preencher
     (ao sair do campo ou ao enviar). Digitando, o erro só some. */
  function validar(form, nome, mostrar) {
    var regra = REGRAS[nome];
    var bl = bloco(form, nome);
    if (!regra || !bl) return true;

    var ok = regra.valida(valorDe(controle(bl)), form);
    if (ok) marcar(bl, '');
    else if (mostrar) marcar(bl, regra.erro);
    return ok;
  }

  /* Valida tudo na ordem da tela. Se algo estiver errado, marca
     todos os campos inválidos e põe o foco no primeiro. */
  function validarTudo(form, nomes) {
    var primeiroErro = null;

    nomes.forEach(function (nome) {
      if (!validar(form, nome, true) && !primeiroErro) primeiroErro = nome;
    });

    if (primeiroErro) {
      var campo = controle(bloco(form, primeiroErro));
      campo.focus();
      return false;
    }
    return true;
  }

  function ligarValidacao(form, nomes) {
    nomes.forEach(function (nome) {
      var bl = bloco(form, nome);
      if (!bl) return;
      var campo = controle(bl);

      // ao sair do campo: valida e mostra o erro.
      // Sair para um botão do próprio campo (o olho da senha) não conta.
      campo.addEventListener('focusout', function (evento) {
        if (evento.relatedTarget && bl.contains(evento.relatedTarget)) return;
        validar(form, nome, true);
      });

      // digitando: o erro some assim que o campo fica válido
      campo.addEventListener('input', function () { validar(form, nome, false); });
      campo.addEventListener('change', function () { validar(form, nome, false); });
    });

    // mudar a senha pode consertar (ou quebrar) a confirmação
    var senha = $('#senha', form);
    var confirmar = $('#confirmar', form);
    if (senha && confirmar) {
      senha.addEventListener('input', function () {
        if (confirmar.value) validar(form, 'confirmar', false);
      });
    }
  }

  /* =======================================================
     3. Botão de mostrar e ocultar a senha
     ======================================================= */
  $$('.auth__olho').forEach(function (botao) {
    botao.addEventListener('click', function () {
      var campo = document.getElementById(botao.getAttribute('data-olho'));
      if (!campo) return;

      var estavaVisivel = campo.type === 'text';
      campo.type = estavaVisivel ? 'password' : 'text';
      botao.setAttribute('aria-pressed', estavaVisivel ? 'false' : 'true');
      botao.setAttribute('aria-label', estavaVisivel ? 'Mostrar senha' : 'Ocultar senha');
      campo.focus();
    });
  });

  /* =======================================================
     4. Força da senha (só no cadastro)
     ======================================================= */
  function tiposDeCaractere(valor) {
    var tipos = 0;
    if (/[a-zà-ÿ]/.test(valor)) tipos++;
    if (/[A-ZÀ-Ý]/.test(valor)) tipos++;
    if (/[0-9]/.test(valor)) tipos++;
    if (/[^A-Za-zÀ-ÿ0-9]/.test(valor)) tipos++;
    return tipos;
  }

  function ligarForca(form) {
    var senha = $('#senha', form);
    var caixa = document.getElementById('forca');
    var texto = document.getElementById('forca-texto');
    if (!senha || !caixa || !texto) return;

    senha.addEventListener('input', function () {
      var valor = senha.value;

      if (!valor) {
        caixa.hidden = true;
        caixa.className = 'auth__forca';
        texto.textContent = '';
        return;
      }

      var tipos = tiposDeCaractere(valor);
      var nivel = 'fraca';
      if (valor.length >= 10 && tipos >= 3) nivel = 'forte';
      else if (valor.length >= 8 && tipos >= 2) nivel = 'media';

      caixa.hidden = false;
      caixa.className = 'auth__forca auth__forca--' + nivel;
      texto.textContent = 'Senha ' + (nivel === 'media' ? 'média' : nivel);
    });
  }

  /* =======================================================
     5. Botão enviando
     O botão continua clicável; só ignoramos cliques repetidos
     enquanto a simulação está rodando.
     ======================================================= */
  function carregando(botao, texto) {
    var rotulo = $('[data-rotulo]', botao);
    botao.setAttribute('aria-busy', 'true');
    if (rotulo) rotulo.textContent = texto;
    if (!$('.auth__girando', botao)) {
      var giro = document.createElement('span');
      giro.className = 'auth__girando';
      botao.insertBefore(giro, botao.firstChild);
    }
  }

  function pararCarregando(botao, texto) {
    var rotulo = $('[data-rotulo]', botao);
    var giro = $('.auth__girando', botao);
    botao.removeAttribute('aria-busy');
    if (giro) giro.parentNode.removeChild(giro);
    if (rotulo) rotulo.textContent = texto;
  }

  function ocupado(botao) { return botao.getAttribute('aria-busy') === 'true'; }

  /* =======================================================
     6. Nome de quem entrou
     ======================================================= */
  function comMaiuscula(palavra) {
    return palavra ? palavra.charAt(0).toUpperCase() + palavra.slice(1) : palavra;
  }

  function primeiroNome(nomeCompleto) {
    return comMaiuscula(nomeCompleto.trim().split(/\s+/)[0] || '');
  }

  /* joao.silva@gmail.com vira "Joao": corta no primeiro
     ".", "_", "-" ou número */
  function nomeDoEmail(email) {
    var local = (email.split('@')[0] || '').trim();
    var corte = local.split(/[._\-0-9]/)[0];
    return comMaiuscula(corte || local);
  }

  function irParaHome() { window.location.href = HOME; }

  /* =======================================================
     7. CADASTRO
     ======================================================= */
  var formCadastro = document.getElementById('formCadastro');
  if (formCadastro) {
    var camposCadastro = ['nome', 'email', 'senha', 'confirmar', 'termos'];
    var botaoCadastro = document.getElementById('enviarCadastro');

    ligarValidacao(formCadastro, camposCadastro);
    ligarForca(formCadastro);

    formCadastro.addEventListener('submit', function (evento) {
      evento.preventDefault();
      if (ocupado(botaoCadastro)) return;
      if (!validarTudo(formCadastro, camposCadastro)) return;

      carregando(botaoCadastro, 'Criando conta...');

      setTimeout(function () {
        if (Eco.salvarUsuario) {
          Eco.salvarUsuario({
            nome: primeiroNome($('#nome', formCadastro).value),
            email: $('#email', formCadastro).value.trim()
          });
        }
        abrirSucesso();
      }, 1500);
    });
  }

  function abrirSucesso() {
    var caixa = document.getElementById('sucesso');
    var botao = document.getElementById('irAgora');
    var contagem = document.getElementById('contagem');
    if (!caixa || !botao) { irParaHome(); return; }

    caixa.hidden = false;
    botao.focus();

    var restam = 3;
    var relogio = setInterval(function () {
      restam--;
      if (restam <= 0) {
        clearInterval(relogio);
        irParaHome();
        return;
      }
      if (contagem) contagem.textContent = restam;
    }, 1000);

    botao.addEventListener('click', function () {
      clearInterval(relogio);
      irParaHome();
    });

    // o cartão só tem um botão: o Tab não deve sair dele
    caixa.addEventListener('keydown', function (evento) {
      if (evento.key === 'Tab') {
        evento.preventDefault();
        botao.focus();
      }
    });
  }

  /* =======================================================
     8. LOGIN
     ======================================================= */
  var formLogin = document.getElementById('formLogin');
  if (formLogin) {
    var camposLogin = ['email', 'senha'];
    var botaoLogin = document.getElementById('enviarLogin');

    ligarValidacao(formLogin, camposLogin);

    formLogin.addEventListener('submit', function (evento) {
      evento.preventDefault();
      if (ocupado(botaoLogin)) return;
      if (!validarTudo(formLogin, camposLogin)) return;

      carregando(botaoLogin, 'Entrando...');

      setTimeout(function () {
        var email = $('#email', formLogin).value.trim();
        var salvo = Eco.lerUsuario ? Eco.lerUsuario() : null;

        // se o e-mail for o mesmo do cadastro, usa o nome salvo
        var mesmoEmail = salvo && salvo.email &&
                         salvo.email.toLowerCase() === email.toLowerCase();
        var nome = mesmoEmail && salvo.nome ? salvo.nome : nomeDoEmail(email);

        if (Eco.salvarUsuario) Eco.salvarUsuario({ nome: nome, email: email });
        if (Eco.aviso) Eco.aviso('Você entrou. Que bom te ver de novo, ' + nome + '!');

        setTimeout(irParaHome, 2000);
      }, 1500);
    });
  }

  /* =======================================================
     9. ESQUECI MINHA SENHA
     ======================================================= */
  var formEsqueci = document.getElementById('formEsqueci');
  if (formEsqueci) {
    var botaoEsqueci = document.getElementById('enviarEsqueci');

    ligarValidacao(formEsqueci, ['email']);

    formEsqueci.addEventListener('submit', function (evento) {
      evento.preventDefault();
      if (ocupado(botaoEsqueci)) return;
      if (!validarTudo(formEsqueci, ['email'])) return;

      carregando(botaoEsqueci, 'Enviando...');

      setTimeout(function () {
        pararCarregando(botaoEsqueci, 'Enviar link');
        mostrarEnviado($('#email', formEsqueci).value.trim());
      }, 1500);
    });
  }

  /* mostra só o começo do e-mail: cl*****@gmail.com */
  function mascarar(email) {
    var partes = email.split('@');
    var inicio = (partes[0] || '').slice(0, 2);
    var dominio = partes[1] ? '@' + partes[1] : '';
    return inicio + '*****' + dominio;
  }

  function mostrarEnviado(email) {
    var titulo = document.getElementById('tituloEsqueci');
    var texto = document.getElementById('textoEsqueci');
    var enviado = document.getElementById('enviado');
    var enviadoTexto = document.getElementById('enviadoTexto');
    var reenviar = document.getElementById('reenviar');

    formEsqueci.hidden = true;
    if (titulo) titulo.textContent = 'Link enviado';
    if (texto) texto.hidden = true;

    // textContent nas duas partes: nada do que a pessoa digitar vira HTML
    if (enviadoTexto) {
      enviadoTexto.textContent = 'Enviamos um link para ';
      var destaque = document.createElement('strong');
      destaque.textContent = mascarar(email);
      enviadoTexto.appendChild(destaque);
    }

    if (enviado) enviado.hidden = false;
    if (reenviar) {
      contarReenvio(reenviar);
      reenviar.addEventListener('click', function () {
        if (reenviar.disabled) return;
        if (Eco.aviso) Eco.aviso('Link reenviado');
        contarReenvio(reenviar);
      });
    }

    // o foco vai para a mensagem (o botão de reenviar começa
    // desligado e não poderia recebê-lo), para quem usa leitor de
    // tela ou teclado continuar de onde a tela mudou
    if (enviadoTexto) enviadoTexto.focus();
  }

  /* o "Reenviar link" só libera depois de 30 segundos */
  function contarReenvio(botao) {
    var restam = 30;
    botao.disabled = true;
    botao.textContent = 'Reenviar link (' + restam + 's)';

    var relogio = setInterval(function () {
      restam--;
      if (restam <= 0) {
        clearInterval(relogio);
        botao.disabled = false;
        botao.textContent = 'Reenviar link';
        return;
      }
      botao.textContent = 'Reenviar link (' + restam + 's)';
    }, 1000);
  }
})();
