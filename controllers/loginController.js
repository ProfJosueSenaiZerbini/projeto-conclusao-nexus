const loginModel = require('../models/loginModel');

async function login(req, res) {

    const { tipo, email, senha } = req.body;

    if (!email || !senha) {
        return res.render('login', {
            mensagemErro: 'Por favor, preencha e-mail e senha!'
        });
    }

    try {

        const usuario = await loginModel.buscarUsuarioPorEmail(email);

        const fiscal = await loginModel.buscarFiscalPorEmail(email);


        // LOGIN COMO USUÁRIO
        if (tipo === 'usuario') {

            if (fiscal.length > 0 && usuario.length === 0) {
                return res.render('login', {
                    mensagemErro: 'Essa conta é de administrador. Selecione "Administrador" para entrar.'
                });
            }

            if (usuario.length === 0 || usuario[0].senha !== senha) {
                return res.render('login', {
                    mensagemErro: 'E-mail ou senha inválidos.'
                });
            }

            req.session.usuario = {
                id: usuario[0].id,
                tipo: 'usuario'
            };

            return res.redirect('/dashboardUsuario');
        }


        // LOGIN COMO ADMINISTRADOR
        if (tipo === 'admin') {

            if (usuario.length > 0 && fiscal.length === 0) {
                return res.render('login', {
                    mensagemErro: 'Essa conta é de usuário. Selecione "Usuário" para entrar.'
                });
            }

            if (fiscal.length === 0 || fiscal[0].senha !== senha) {
                return res.render('login', {
                    mensagemErro: 'E-mail ou senha inválidos.'
                });
            }

            req.session.usuario = {
                id: fiscal[0].id,
                tipo: 'admin'
            };

            return res.redirect('/dashboardAdm');
        }


        return res.render('login', {
            mensagemErro: 'Tipo de acesso inválido.'
        });

    } catch (erro) {

        console.error('Erro ao realizar login:', erro);

        return res.render('login', {
            mensagemErro: 'Erro ao realizar login.'
        });
    }
}

module.exports = {
    login
};