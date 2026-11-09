/* Moenda Café — lógica compartilhada pelos dois sites.
   As duas versões usam exatamente este mesmo script, de modo que
   a única diferença entre elas é a camada visual (CSS). */
(function () {
  "use strict";

  var ICONES = {
    cafes:
      '<svg width="56" height="56" viewBox="0 0 64 64" aria-hidden="true"><path d="M24 8c-3 4 3 6 0 10M32 6c-3 4 3 6 0 10M40 8c-3 4 3 6 0 10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M12 24h34v14a14 14 0 0 1-14 14h-6a14 14 0 0 1-14-14z" fill="currentColor"/><path d="M46 29h3a7 7 0 0 1 0 14h-4" fill="none" stroke="currentColor" stroke-width="4"/><rect x="8" y="54" width="44" height="4" rx="2" fill="currentColor"/></svg>',
    doces:
      '<svg width="56" height="56" viewBox="0 0 64 64" aria-hidden="true"><path d="M8 30 L56 18 L56 52 L8 52 Z" fill="currentColor"/><path d="M8 40 L56 33" stroke="#fff" stroke-opacity=".55" stroke-width="3"/><circle cx="44" cy="12" r="5" fill="currentColor"/></svg>',
    salgados:
      '<svg width="56" height="56" viewBox="0 0 64 64" aria-hidden="true"><path d="M6 40c0-12 12-22 26-22s26 10 26 22v6a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" fill="currentColor"/><path d="M20 26l4 10M31 23l2 11M42 26l-3 10" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/></svg>'
  };

  var PRODUTOS = [
    { id: "espresso", nome: "Espresso", cat: "cafes", preco: 7, desc: "30 ml, grão Catuaí Amarelo de torra média." },
    { id: "coado", nome: "Coado no V60", cat: "cafes", preco: 12, desc: "250 ml com notas de caramelo e laranja." },
    { id: "cappuccino", nome: "Cappuccino", cat: "cafes", preco: 14, desc: "Espresso duplo com leite vaporizado." },
    { id: "coldbrew", nome: "Cold brew", cat: "cafes", preco: 15, desc: "Extração a frio por 16 horas, servido com gelo." },
    { id: "fuba", nome: "Bolo de fubá com goiabada", cat: "doces", preco: 11, desc: "Fatia generosa, assado todos os dias às 9h30." },
    { id: "brownie", nome: "Brownie de cacau 70%", cat: "doces", preco: 12, desc: "Casquinha crocante e centro úmido." },
    { id: "paodemel", nome: "Pão de mel", cat: "doces", preco: 8, desc: "Recheio de doce de leite e cobertura de chocolate." },
    { id: "paodequeijo", nome: "Pão de queijo", cat: "salgados", preco: 13, desc: "Porção com 6 unidades, queijo canastra." },
    { id: "croissant", nome: "Croissant de presunto e queijo", cat: "salgados", preco: 16, desc: "Massa folhada com manteiga, aquecido na hora." },
    { id: "torrada", nome: "Torrada de fermentação natural", cat: "salgados", preco: 14, desc: "Pão da casa com manteiga e geleia de frutas." }
  ];

  var NOMES_CAT = { cafes: "Cafés", doces: "Doces", salgados: "Salgados" };
  var moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  var pedido = {}; // id -> quantidade
  var numeroPedido = 427;

  function $(sel) { return document.querySelector(sel); }

  /* Registra eventos no Microsoft Clarity (quando instalado), para
     medir a conclusão das tarefas na pesquisa com usuários */
  function rastrear(evento) {
    try { if (typeof window.clarity === "function") window.clarity("event", evento); } catch (e) {}
  }

  /* ---------- Cardápio ---------- */
  function renderProdutos(filtro) {
    var lista = $("#produtos");
    lista.innerHTML = PRODUTOS.filter(function (p) {
      return filtro === "todos" || p.cat === filtro;
    }).map(function (p) {
      return (
        '<li class="produto produto--' + p.cat + '">' +
          '<div class="produto-icone">' + ICONES[p.cat] + "</div>" +
          '<div class="produto-texto">' +
            '<span class="produto-cat">' + NOMES_CAT[p.cat] + "</span>" +
            '<h3 class="produto-nome">' + p.nome + "</h3>" +
            '<p class="produto-desc">' + p.desc + "</p>" +
          "</div>" +
          '<div class="produto-rodape">' +
            '<span class="produto-preco">' + moeda.format(p.preco) + "</span>" +
            '<button type="button" class="btn btn-adicionar" data-add="' + p.id + '">Adicionar</button>' +
          "</div>" +
        "</li>"
      );
    }).join("");
  }

  document.addEventListener("click", function (e) {
    var filtro = e.target.closest("[data-filtro]");
    if (filtro) {
      document.querySelectorAll("[data-filtro]").forEach(function (b) {
        var ativo = b === filtro;
        b.classList.toggle("ativo", ativo);
        b.setAttribute("aria-pressed", ativo ? "true" : "false");
      });
      renderProdutos(filtro.getAttribute("data-filtro"));
      rastrear("filtro_" + filtro.getAttribute("data-filtro"));
      return;
    }
    var add = e.target.closest("[data-add]");
    if (add) { adicionar(add.getAttribute("data-add")); return; }
    var mais = e.target.closest("[data-mais]");
    if (mais) { alterar(mais.getAttribute("data-mais"), 1); return; }
    var menos = e.target.closest("[data-menos]");
    if (menos) { alterar(menos.getAttribute("data-menos"), -1); return; }
    var rem = e.target.closest("[data-remover]");
    if (rem) { delete pedido[rem.getAttribute("data-remover")]; renderPedido(); return; }
  });

  /* ---------- Pedido ---------- */
  function produto(id) {
    for (var i = 0; i < PRODUTOS.length; i++) if (PRODUTOS[i].id === id) return PRODUTOS[i];
    return null;
  }

  function adicionar(id) {
    pedido[id] = (pedido[id] || 0) + 1;
    renderPedido();
    var c = $("#contador");
    c.classList.remove("pulsar");
    void c.offsetWidth; // reinicia a animação
    c.classList.add("pulsar");
    avisar(produto(id).nome + " adicionado ao pedido");
    rastrear("item_adicionado");
  }

  function alterar(id, delta) {
    pedido[id] = (pedido[id] || 0) + delta;
    if (pedido[id] <= 0) delete pedido[id];
    renderPedido();
  }

  function totais() {
    var qtd = 0, total = 0;
    Object.keys(pedido).forEach(function (id) {
      qtd += pedido[id];
      total += pedido[id] * produto(id).preco;
    });
    return { qtd: qtd, total: total };
  }

  function renderPedido() {
    var t = totais();
    $("#contador").textContent = t.qtd;
    $("#total").textContent = moeda.format(t.total);
    var ids = Object.keys(pedido);
    $("#pedido-vazio").hidden = ids.length > 0;
    $("#finalizar").disabled = ids.length === 0;
    $("#itens-pedido").innerHTML = ids.map(function (id) {
      var p = produto(id);
      return (
        '<li class="item">' +
          '<div class="item-info"><span class="item-nome">' + p.nome + "</span>" +
          '<span class="item-unit">' + moeda.format(p.preco) + " cada</span></div>" +
          '<div class="item-qtd">' +
            '<button type="button" class="qtd-btn" data-menos="' + id + '" aria-label="Diminuir ' + p.nome + '">−</button>' +
            '<span class="qtd-num" aria-live="polite">' + pedido[id] + "</span>" +
            '<button type="button" class="qtd-btn" data-mais="' + id + '" aria-label="Aumentar ' + p.nome + '">+</button>' +
          "</div>" +
          '<span class="item-subtotal">' + moeda.format(p.preco * pedido[id]) + "</span>" +
          '<button type="button" class="item-remover" data-remover="' + id + '">Remover</button>' +
        "</li>"
      );
    }).join("");
  }

  function abrirPainel() {
    $("#painel-pedido").hidden = false;
    $("#veu").hidden = false;
    $("#pedido-ok").hidden = true;
    $("#abrir-pedido").setAttribute("aria-expanded", "true");
    $("#fechar-pedido").focus();
    rastrear("pedido_aberto");
  }
  function fecharPainel() {
    $("#painel-pedido").hidden = true;
    $("#veu").hidden = true;
    $("#abrir-pedido").setAttribute("aria-expanded", "false");
    $("#abrir-pedido").focus();
  }

  $("#abrir-pedido").addEventListener("click", abrirPainel);
  $("#fechar-pedido").addEventListener("click", fecharPainel);
  $("#veu").addEventListener("click", fecharPainel);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !$("#painel-pedido").hidden) fecharPainel();
  });

  $("#finalizar").addEventListener("click", function () {
    var t = totais();
    if (!t.qtd) return;
    numeroPedido += 1;
    var ok = $("#pedido-ok");
    ok.textContent = "Pedido nº " + numeroPedido + " recebido. Total de " + moeda.format(t.total) +
      ". Retire no balcão em cerca de 10 minutos.";
    ok.hidden = false;
    pedido = {};
    renderPedido();
    rastrear("pedido_finalizado");
  });

  /* ---------- Aviso (toast) ---------- */
  var timerAviso;
  function avisar(texto) {
    var a = $("#aviso");
    a.textContent = texto;
    a.classList.add("visivel");
    clearTimeout(timerAviso);
    timerAviso = setTimeout(function () { a.classList.remove("visivel"); }, 2200);
  }

  /* ---------- Reserva ---------- */
  var form = $("#form-reserva");
  var hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  $("#data").min = hoje.toISOString().slice(0, 10);

  function erro(campo, msg) {
    var el = $("#" + campo);
    var box = $("#erro-" + campo);
    box.textContent = msg || "";
    el.setAttribute("aria-invalid", msg ? "true" : "false");
    el.closest(".campo").classList.toggle("com-erro", !!msg);
    return !msg;
  }

  function validar() {
    var ok = true;
    var nome = $("#nome").value.trim();
    ok = erro("nome", nome.length < 3 ? "Informe seu nome com pelo menos 3 letras." : "") && ok;

    var tel = $("#telefone").value.replace(/\D/g, "");
    ok = erro("telefone", tel.length < 10 || tel.length > 11
      ? "Use DDD + número, por exemplo (11) 98765-4321." : "") && ok;

    var dataTxt = $("#data").value, msgData = "", sabado = false;
    if (!dataTxt) msgData = "Escolha a data da visita.";
    else {
      var d = new Date(dataTxt + "T00:00:00");
      if (d < hoje) msgData = "Escolha uma data a partir de hoje.";
      else if (d.getDay() === 0) msgData = "Fechamos aos domingos. Escolha outro dia.";
      sabado = d.getDay() === 6;
    }
    ok = erro("data", msgData) && ok;

    var hora = $("#horario").value, msgHora = "";
    if (!hora) msgHora = "Escolha um horário.";
    else if (sabado && parseInt(hora, 10) > 13) msgHora = "Aos sábados atendemos até 14h. Escolha um horário até 13h.";
    ok = erro("horario", msgHora) && ok;

    ok = erro("pessoas", $("#pessoas").value ? "" : "Informe quantas pessoas virão.") && ok;
    return ok;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var msg = $("#reserva-ok");
    if (!validar()) {
      msg.hidden = true;
      var primeiro = form.querySelector('[aria-invalid="true"]');
      if (primeiro) primeiro.focus();
      rastrear("reserva_com_erro");
      return;
    }
    var d = new Date($("#data").value + "T00:00:00");
    var dataFmt = d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
    var n = $("#pessoas").value;
    msg.textContent = "Reserva confirmada, " + $("#nome").value.trim().split(" ")[0] + ": " + dataFmt +
      " às " + $("#horario").value + ", mesa para " + n + (n === "1" ? " pessoa" : " pessoas") +
      ". Guardamos a mesa por 15 minutos após o horário.";
    msg.hidden = false;
    rastrear("reserva_confirmada");
    form.reset();
    ["nome", "telefone", "data", "horario", "pessoas"].forEach(function (c) { erro(c, ""); });
  });

  renderProdutos("todos");
  renderPedido();

  /* Ganchos usados apenas para gerar as capturas de tela do TCC */
  window.__demo = {
    adicionar: adicionar,
    abrirPainel: abrirPainel,
    validar: validar
  };
})();
