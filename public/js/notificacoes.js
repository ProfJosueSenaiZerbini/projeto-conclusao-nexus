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
        link.addEventListener('click', () => {
            const card = link.querySelector('.notificacao-item');
            const icone = link.querySelector('.notificacao-icone');

            /* Se o card ainda tiver o destaque de "não lida" */
            if(card && card.classList.contains('nao-lida')) {
                /* Remove a cor de destaque do card imediatamente */
                card.classList.remove('nao-lida');

                /* Troca o ícone de sininho para check */
                if(icone){
                    icone.textContent = '✓';
                }
            }
        })
    })
})