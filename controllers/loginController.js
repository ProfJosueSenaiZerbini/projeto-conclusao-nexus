const bcrypt = require('bcrypt');
const loginModel = require('../models/loginModel');

async function senhaValida(senhaInformada, senhaArmazenada) {
    if (!senhaArmazenada) return false;

    // Compatibilidade temporária com contas antigas.
    if (/^\$2[aby]\$/.test(senhaArmazenada)) {
        return bcrypt.compare(senhaInformada, senhaArmazenada);
    }

    return senhaArmazenada === senhaInformada;
}

async function login(req, res) {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).render('login', {
            mensagemErro: 'Por favor, preencha e-mail e senha!'
        });
    }

    try {
        const emailNormalizado = email.trim().toLowerCase();

        const [usuarios, fiscais, superusuarios] = await Promise.all([
            loginModel.buscarUsuarioPorEmail(emailNormalizado),
            loginModel.buscarFiscalPorEmail(emailNormalizado),
            loginModel.buscarSuperusuarioPorEmail(emailNormalizado)
        ]);

        const contasValidas = [];

        if (
            usuarios.length &&
            await senhaValida(senha, usuarios[0].senha)
        ) {
            contasValidas.push({
                tipo: 'usuario',
                conta: usuarios[0]
            });
        }

        if (
            fiscais.length &&
            await senhaValida(senha, fiscais[0].senha)
        ) {
            contasValidas.push({
                tipo: 'fiscal',
                conta: fiscais[0]
            });
        }

        if (
            superusuarios.length &&
            await senhaValida(senha, superusuarios[0].senha)
        ) {
            contasValidas.push({
                tipo: 'superusuario',
                conta: superusuarios[0]
            });
        }

        if (contasValidas.length === 0) {
            return res.status(401).render('login', {
                mensagemErro: 'E-mail ou senha inválidos.'
            });
        }

        if (contasValidas.length > 1) {
            return res.status(401).render('login', {
                mensagemErro:
                    'Não foi possível identificar sua conta. Entre em contato com o suporte.'
            });
        }

        const { tipo, conta } = contasValidas[0];

        if (tipo === 'usuario') {
            req.session.usuario = {
                id: conta.id,
                nome: conta.nome,
                email: conta.email,
                tipo: 'usuario'
            };

            return res.redirect('/dashboardUsuario');
        }

        if (tipo === 'fiscal') {
            req.session.usuario = {
                id: conta.id,
                idOrganizacao: conta.idOrganizacao,
                nome: conta.nome,
                email: conta.email,
                tipo: 'fiscal'
            };

            return res.redirect('/dashboardAdmin');
        }

        const organizacaoAtiva =
            conta.statusOrganizacao === 'ativa' &&
            conta.statusContrato === 'ativo';

        const emTransicao =
            conta.statusOrganizacao === 'em_transicao' &&
            conta.fimPeriodoTransicao &&
            new Date(conta.fimPeriodoTransicao) > new Date();

        if (
            conta.status === 'desativado' ||
            (conta.emailConfirmado && conta.status !== 'ativo') ||
            (!organizacaoAtiva && !emTransicao)
        ) {
            return res.status(403).render('login', {
                mensagemErro:
                    'Sua conta ou organização não está autorizada a acessar o sistema.'
            });
        }

        req.session.usuario = {
            id: conta.idSuperusuario,
            idOrganizacao: conta.idOrganizacao,
            nome: conta.nome,
            email: conta.email,
            tipo: 'superusuario',
            emailConfirmado: Boolean(conta.emailConfirmado),
            acessoLimitado: !Boolean(conta.emailConfirmado)
        };

        return res.redirect('/dashboardAdmin');

    } catch (erro) {
        console.error('Erro ao realizar login:', erro);

        return res.status(500).render('login', {
            mensagemErro: 'Erro ao realizar login.'
        });
    }
}

module.exports = { login };