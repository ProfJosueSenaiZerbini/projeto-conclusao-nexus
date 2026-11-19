/* Aguarda o HTML da página carregar 100% antes de executar o script */
document.addEventListener('DOMContentLoaded', () => {

    // Elementos do Modal e Formulário
    const formMarcarLidas = document.querySelector('form[action="/notificacoes/marcar-todas-lidas"]');
    const modal = document.getElementById('modal-confirmacao');
    const btnCancelar = document.getElementById('btn-cancelar');
    const btnConfirmar = document.getElementById('btn-confirmar');

    // 1. MODAL ESTILIZADO PARA "MARCAR TODAS COMO LIDAS"
   
    if (formMarcarLidas && modal) {
        // Ao clicar no botão de enviar, impede o envio e mostra o modal
        formMarcarLidas.addEventListener('submit', (event) => {
            event.preventDefault(); // Impede o envio imediato
            modal.classList.remove('hidden'); // Exibe o modal centralizado
        });

        // Clique no botão "Cancelar" do modal
        btnCancelar.addEventListener('click', () => {
            modal.classList.add('hidden'); // Esconde o modal
        });

        // Clique no botão "Confirmar" do modal
        btnConfirmar.addEventListener('click', () => {
            modal.classList.add('hidden');
            formMarcarLidas.submit(); // Envia o formulário manualmente para a rota POST
        });
    }

    /* ATUALIZAR O VISUAL DA NOTIFICAÇÃO NA HORA DO CLIQUE */

    /* Pega todos os cards de notificação da tela */
    const linksNotificacao = document.querySelectorAll('.link-notificacao');

    linksNotificacao.forEach(link => {
        /* Escuta o clique em cada card */
        link.addEventListener('click', async event => {

            event.preventDefault();

            const id = link.dataset.id;
            const destino = link.dataset.url;

           const card = link.querySelector(".notificacao-item");

        // Se já estiver lida, apenas abre a denúncia.
        if (!card.classList.contains("nao-lida")) {
            window.location.href = destino;
            return;
        }

        try {

            const resposta = await fetch(
                `/notificacoes/${id}/marcar-lida`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            const resultado = await resposta.json();

            if (!resposta.ok || !resultado.sucesso) {
                throw new Error(resultado.mensagem);
            }

            card.classList.remove("nao-lida");

            const icone = link.querySelector(
                ".notificacao-icone"
            );

            if (icone) {
                icone.textContent = "✓";
            }

            window.location.href = destino;

        } catch (erro) {

            console.error(
                "Erro ao marcar notificação:",
                erro
            );

            alert(
                "Não foi possível atualizar a notificação."
            );
        }

    });
});
});

