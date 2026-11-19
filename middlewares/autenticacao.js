const { executarQuery } = require("../db/dbConnect");

async function verificarFiscalAtivo(req, res, next) {
    if (req.session.usuario.tipo !== "fiscal") {
        return next();
    }

    try {
        const idFiscal = Number(req.session.usuario.id);

        const resultado = await executarQuery(
            `SELECT id
             FROM FISCAL
             WHERE id = ?
               AND status = 'ativo'
             LIMIT 1`,
            [idFiscal]
        );

        if (!resultado.length) {
            return res.status(403).send(
                "Seu acesso foi desativado. Entre em contato com o administrador."
            );
        }

        next();
    } catch (erro) {
        console.error("Erro ao verificar fiscal:", erro);

        return res.status(500).send(
            "Erro ao verificar o acesso."
        );
    }
}

function verificarUsuario(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect('/login');
    }

    if (req.session.usuario.tipo !== 'usuario') {
        return res.status(403).send('Acesso negado.');
    }

    next();
}

function verificarPainelOrganizacao(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect('/login');
    }

    const { tipo } = req.session.usuario;

    if (!['fiscal', 'superusuario'].includes(tipo)) {
        return res.status(403).send('Acesso negado.');
    }

    return verificarFiscalAtivo(req, res, next);
}

// Operações sobre denúncias exigem fiscal ou superusuário confirmado.
function verificarEquipeConfirmada(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect('/login');
    }

    const { tipo } = req.session.usuario;

    if (!['fiscal', 'superusuario'].includes(tipo)) {
        return res.status(403).send('Acesso negado.');
    }

    return verificarFiscalAtivo(req, res, next);
}

// Exclusivo do superusuário.
function verificarSuperusuario(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect('/login');
    }

    if (req.session.usuario.tipo !== 'superusuario') {
        return res.status(403).send('Acesso negado.');
    }

    next();
}

// Permite acesso às funcionalidades destinadas a todas as contas.
function verificarAutenticado(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect('/login');
    }

    if (!['usuario', 'fiscal', 'superusuario'].includes(req.session.usuario.tipo)) {
        return res.status(403).send('Acesso negado.');
    }

    return verificarFiscalAtivo(req, res, next);
}

module.exports = {
    verificarFiscalAtivo,
    verificarUsuario,
    verificarPainelOrganizacao,
    verificarEquipeConfirmada,
    verificarSuperusuario,
    verificarAutenticado
};