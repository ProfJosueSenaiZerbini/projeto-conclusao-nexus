document.addEventListener("DOMContentLoaded", () => {
    const campoPesquisa = document.getElementById("pesquisaFeed");
    const botaoLimpar = document.getElementById("limparPesquisa");
    const cards = Array.from(document.querySelectorAll(".feed-card"));
    const estadoVazio = document.getElementById("feedVazio");
    const mensagemVazia = document.getElementById("mensagemFeedVazio");
    const resultadoPesquisa = document.getElementById("resultadoPesquisa");

    if (!campoPesquisa) return;

    const normalizar = (texto) => texto
        .normalize("NFD")
        .replace(/[\\u0300-\\u036f]/g, "")
        .toLocaleLowerCase("pt-BR")
        .trim();

    const atualizarPesquisa = () => {
        const termo = normalizar(campoPesquisa.value);
        let encontrados = 0;

        cards.forEach((card) => {
            const conteudo = normalizar(card.innerText || card.textContent || "");
            const corresponde = !termo || conteudo.includes(termo);

            card.hidden = !corresponde;
            if (corresponde) encontrados++;
        });

        if (estadoVazio) {
            estadoVazio.hidden = encontrados > 0;
            if (mensagemVazia) {
                mensagemVazia.textContent = cards.length === 0
                    ? "Não há denúncias públicas no momento."
                    : "Nenhuma denúncia corresponde à sua pesquisa.";
            }
        }

        if (resultadoPesquisa) {
            resultadoPesquisa.textContent = termo
                ? `${encontrados} ${encontrados === 1 ? "denúncia encontrada" : "denúncias encontradas"}`
                : "";
        }

        if (botaoLimpar) botaoLimpar.hidden = !campoPesquisa.value;
    };

    campoPesquisa.addEventListener("input", atualizarPesquisa);

    if (botaoLimpar) {
        botaoLimpar.addEventListener("click", () => {
            campoPesquisa.value = "";
            atualizarPesquisa();
            campoPesquisa.focus();
        });
    }

    atualizarPesquisa();
});
