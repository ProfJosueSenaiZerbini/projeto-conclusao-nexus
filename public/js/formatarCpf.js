const cpf = document.getElementById('cpf');

cpf.addEventListener('input', function () {
    let numeros = cpf.value.replace(/\D/g, '').slice(0, 11);

    numeros = numeros
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

    cpf.value = numeros;
});