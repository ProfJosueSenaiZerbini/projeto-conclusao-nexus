
document.addEventListener("DOMContentLoaded", () => {

    const contador = document.getElementById(
        "contador-notificacoes"
    );

    if (!contador) return;

    async function atualizarContador() {
        try {
            const resposta = await fetch(
                "/notificacoes/nao-lidas",
                {
                    method: "GET",
                    cache: "no-store"
                }
            );

            if (!resposta.ok) {
                throw new Error("Erro ao consultar notificações.");
            }

            const dados = await resposta.json();

            if (!dados.sucesso) return;

            const total = Number(dados.totalNaoLidas);

            contador.textContent = total;

            // Esconde a bolinha quando não existem notificações.
            contador.hidden = total <= 0;

        } catch (erro) {
            console.error(
                "Erro ao atualizar contador:",
                erro
            );
        }
    }

    // Consulta imediatamente.
    atualizarContador();

    // Atualiza a cada 15 segundos.
    setInterval(atualizarContador, 15000);

    // Atualiza quando o usuário volta para a página.
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            atualizarContador();
        }
    });

});
