(() => {
  "use strict";

  function iniciarFiltros() {
    const busca = document.getElementById("buscaDenuncia");
    const categoria = document.getElementById("categoria");
    const status = document.getElementById("status");
    const prioridade = document.getElementById("prioridade");
    const data = document.getElementById("data");
    const botaoPesquisar = document.getElementById("btnPesquisar");
    const tabela = document.querySelector(".tabela");
    if (!tabela || !busca || !categoria || !status || !prioridade || !data) return;

    const linhas = Array.from(tabela.querySelectorAll("[data-denuncia]"));
    let mensagemVazia = tabela.querySelector(".resultado-vazio");
    if (!mensagemVazia) {
      mensagemVazia = document.createElement("div");
      mensagemVazia.className = "linha resultado-vazio";
      mensagemVazia.innerHTML = '<div class="celula" style="grid-column: 1 / -1;">Nenhuma denúncia encontrada com os filtros selecionados.</div>';
      tabela.appendChild(mensagemVazia);
    }

    const normalizar = (valor) => String(valor ?? "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR").trim();

    function filtrar() {
      const termo = normalizar(busca.value);
      const tipoSelecionado = normalizar(categoria.value);
      const statusSelecionado = normalizar(status.value);
      const prioridadeSelecionada = normalizar(prioridade.value);
      const dataSelecionada = data.value;
      let exibidas = 0;

      linhas.forEach((linha) => {
        const tipo = normalizar(linha.dataset.tipo);
        const statusLinha = normalizar(linha.dataset.status);
        const prioridadeLinha = normalizar(linha.dataset.prioridade);
        const dataLinha = String(linha.dataset.data || "").slice(0, 10);
        const textoLinha = normalizar(linha.textContent);

        const corresponde =
          (!termo || textoLinha.includes(termo)) &&
          (!tipoSelecionado || tipo === tipoSelecionado) &&
          (!statusSelecionado || statusLinha === statusSelecionado) &&
          (!prioridadeSelecionada || prioridadeLinha === prioridadeSelecionada) &&
          (!dataSelecionada || dataLinha === dataSelecionada);

        // Usar display diretamente evita que regras CSS de .linha (display:grid)
        // sobrescrevam o atributo hidden e mantenham resultados incorretos visíveis.
        linha.style.display = corresponde ? "grid" : "none";
        if (corresponde) exibidas++;
      });

      mensagemVazia.style.display = exibidas === 0 ? "grid" : "none";
    }

    [busca, categoria, status, prioridade, data].forEach((campo) => {
      campo.addEventListener(campo === busca ? "input" : "change", filtrar);
    });
    if (botaoPesquisar) botaoPesquisar.addEventListener("click", filtrar);
    busca.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter") {
        evento.preventDefault();
        filtrar();
      }
    });

    // Aplica filtros também ao carregar a página e mantém a mensagem vazia correta.
    filtrar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarFiltros);
  } else {
    iniciarFiltros();
  }
})();
