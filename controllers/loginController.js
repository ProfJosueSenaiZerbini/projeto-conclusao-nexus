const bcrypt = require('bcrypt');
const loginModel = require('../models/loginModel');

async function senhaValida(senhaInformada, senhaArmazenada) {
    if (!senhaArmazenada) return false;
    // Compatibilidade temporária com contas antigas que ainda guardam senha em texto.
    if (/^\$2[aby]\$/.test(senhaArmazenada)) {
        return bcrypt.compare(senhaInformada, senhaArmazenada);
    }
    return senhaArmazenada === senhaInformada;
}

async function login(req, res) {
    const { tipo, email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).render('login', { mensagemErro: 'Por favor, preencha e-mail e senha!' });
    }

    try {
        const emailNormalizado = email.trim().toLowerCase();
        const [usuario, fiscal, superusuarios] = await Promise.all([
            loginModel.buscarUsuarioPorEmail(emailNormalizado),
            loginModel.buscarFiscalPorEmail(emailNormalizado),
            loginModel.buscarSuperusuarioPorEmail(emailNormalizado)
        ]);

        if (tipo === 'usuario') {
            if ((fiscal.length || superusuarios.length) && !usuario.length) {
                return res.status(401).render('login', {
                    mensagemErro: 'Essa conta é administrativa. Selecione “Administrador” para entrar.'
                });
            }
            if (!usuario.length || !(await senhaValida(senha, usuario[0].senha))) {
                return res.status(401).render('login', { mensagemErro: 'E-mail ou senha inválidos.' });
            }
            req.session.usuario = {
                id: usuario[0].id,
                nome: usuario[0].nome,
                email: usuario[0].email,
                tipo: 'usuario'
            };
            return res.redirect('/dashboardUsuario');
        }

        if (tipo === 'admin') {
            if (superusuarios.length) {
                const s = superusuarios[0];
                if (!(await senhaValida(senha, s.senha))) {
                    return res.status(401).render('login', { mensagemErro: 'E-mail ou senha inválidos.' });
                }
                const organizacaoAtiva = s.statusOrganizacao === 'ativa' && s.statusContrato === 'ativo';
                const emTransicao = s.statusOrganizacao === 'em_transicao' && s.fimPeriodoTransicao && new Date(s.fimPeriodoTransicao) > new Date();
                if (!s.emailConfirmado || s.status !== 'ativo' || (!organizacaoAtiva && !emTransicao)) {
                    return res.status(403).render('login', {
                        mensagemErro: 'Confirme seu e-mail antes de acessar o painel administrativo.'
                    });
                }
                req.session.usuario = {
                    id: s.idSuperusuario,
                    idOrganizacao: s.idOrganizacao,
                    nome: s.nome,
                    email: s.email,
                    tipo: 'superusuario',
                    emailConfirmado: true
                };
                return res.redirect('/dashboardAdmin');
            }

            if (usuario.length && !fiscal.length) {
                return res.status(401).render('login', { mensagemErro: 'Essa conta é de usuário. Selecione “Usuário” para entrar.' });
            }
            if (!fiscal.length || !(await senhaValida(senha, fiscal[0].senha)) || fiscal[0].status === 'desativado') {
                return res.status(401).render('login', { mensagemErro: 'E-mail ou senha inválidos.' });
            }
            req.session.usuario = {
                id: fiscal[0].id,
                idOrganizacao: fiscal[0].idOrganizacao,
                nome: fiscal[0].nome,
                email: fiscal[0].email,
                tipo: 'admin'
            };
            return res.redirect('/dashboardAdmin');
        }

        return res.status(400).render('login', { mensagemErro: 'Tipo de acesso inválido.' });
    } catch (erro) {
        console.error('Erro ao realizar login:', erro);
        return res.status(500).render('login', { mensagemErro: 'Erro ao realizar login.' });
    }
}

module.exports = { login };
