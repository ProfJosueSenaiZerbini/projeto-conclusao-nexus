(() => {
  "use strict";

  function iniciarFiltros() {
    const busca = document.getElementById("buscaDenuncia");
    const status = document.getElementById("status");
    const prioridade = document.getElementById("prioridade");
    const data = document.getElementById("data");
    const botaoPesquisar = document.getElementById("btnPesquisar");
    const tabela = document.querySelector(".tabela");

    if (!tabela || !busca || !status || !prioridade || !data) return;

    const linhas = Array.from(tabela.querySelectorAll("[data-denuncia]"));
    let mensagemVazia = tabela.querySelector(".resultado-vazio");

    if (!mensagemVazia) {
      mensagemVazia = document.createElement("div");
      mensagemVazia.className = "linha resultado-vazio";
      mensagemVazia.innerHTML =
        '<div class="celula" style="grid-column: 1 / -1;">Nenhuma denúncia encontrada com os filtros selecionados.</div>';
      tabela.appendChild(mensagemVazia);
    }

    const normalizar = (valor) => String(valor ?? "")
      .normalize("NFD")
      .replace(/[\\u0300-\\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .trim();

    function filtrar() {
      const termo = normalizar(busca.value);
      const statusSelecionado = normalizar(status.value);
      const prioridadeSelecionada = normalizar(prioridade.value);
      const dataSelecionada = data.value;
      let exibidas = 0;

      linhas.forEach((linha) => {
        const statusLinha = normalizar(linha.dataset.status);
        const prioridadeLinha = normalizar(linha.dataset.prioridade);
        const dataLinha = String(linha.dataset.data || "").slice(0, 10);
        const textoLinha = normalizar(linha.textContent);

        const corresponde =
          (!termo || textoLinha.includes(termo)) &&
          (!statusSelecionado || statusLinha === statusSelecionado) &&
          (!prioridadeSelecionada || prioridadeLinha === prioridadeSelecionada) &&
          (!dataSelecionada || dataLinha === dataSelecionada);

        linha.style.display = corresponde ? "grid" : "none";
        if (corresponde) exibidas++;
      });

      mensagemVazia.style.display = exibidas === 0 ? "grid" : "none";
    }

    // Pesquisa em tempo real e aplica os demais filtros ao alterar os campos.
    busca.addEventListener("input", filtrar);
    [status, prioridade, data].forEach((campo) => {
      campo.addEventListener("change", filtrar);
    });

    if (botaoPesquisar) {
      botaoPesquisar.addEventListener("click", filtrar);
    }

    busca.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter") {
        evento.preventDefault();
        filtrar();
      }
    });

    filtrar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarFiltros);
  } else {
    iniciarFiltros();
  }
})();

// Mantém apenas um menu de opções dos três pontos aberto por vez.
document.addEventListener("toggle", (evento) => {
  const menuAberto = evento.target;
  if (!menuAberto.matches ||
      !menuAberto.matches(".menu-mais-opcoes") ||
      !menuAberto.open) return;

  document.querySelectorAll(".menu-mais-opcoes[open]").forEach((menu) => {
    if (menu !== menuAberto) menu.open = false;
  });
}, true);
