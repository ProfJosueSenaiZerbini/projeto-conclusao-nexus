function mostrarAba(nomeAba, botao) {

    // Pega todos os conteúdos das abas
    const conteudos =
        document.querySelectorAll('.conteudo-aba');

    // Esconde todas as abas
    conteudos.forEach(function (conteudo) {
        conteudo.classList.remove('ativa');
    });

    // Pega todos os botões
    const botoes =
        document.querySelectorAll('.aba');

    // Remove a seleção de todos os botões
    botoes.forEach(function (botao) {
        botao.classList.remove('ativa');
    });

    // Mostra a aba escolhida
    document
        .getElementById(nomeAba)
        .classList.add('ativa');

    // Marca o botão clicado
    botao.classList.add('ativa');
}
