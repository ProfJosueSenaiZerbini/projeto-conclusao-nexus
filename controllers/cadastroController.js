const cadastroModel = require('../models/cadastroModel');

async function exibirCadastro(req, res) {
    res.render('cadastro', {
        mensagemErro: null
    });
}

async function cadastrar(req, res) {

   const nome = req.body.nome?.trim();
    const email = req.body.email?.trim();

    // Remove pontos, hífen e qualquer caractere que não seja número.
    const cpf = req.body.cpf?.replace(/\D/g, '');

    const senha = req.body.senha;

    if (!nome || !email || !cpf || !senha) {
        return res.render('cadastro', {
            mensagemErro: 'Preencha todos os campos.'
        });
    }

    try {

        const usuarioExistente =
            await cadastroModel.buscarUsuarioPorEmail(email);

        if (usuarioExistente.length > 0) {
            return res.render('cadastro', {
                mensagemErro: 'Este e-mail já está cadastrado.'
            });
        }

        const cpfExistente =
            await cadastroModel.buscarUsuarioPorCpf(cpf);

        if (cpfExistente.length > 0) {
            return res.render('cadastro', {
                mensagemErro: 'Este CPF já está cadastrado.'
            });
        }

        await cadastroModel.cadastrarUsuario(
            nome,
            email,
            cpf,
            senha
        );

        return res.redirect('/login');

    } catch (erro) {

        console.error('Erro ao cadastrar:', erro);

        return res.render('cadastro', {
            mensagemErro: 'Erro ao realizar o cadastro.'
        });
    }
}

module.exports = {
    exibirCadastro,
    cadastrar
};