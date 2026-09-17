function alternarSenha() {
    
    const campoSenha = document.getElementById('inputSenha');

    if (campoSenha.type === 'password') {
        campoSenha.type = 'text';

    } else {

        campoSenha.type = 'password';
    }
}