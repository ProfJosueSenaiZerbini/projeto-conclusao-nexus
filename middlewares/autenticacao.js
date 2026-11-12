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

    // Fiscais trabalham por localidade
    if (tipo === 'fiscal') {
        return next();
    }

    // Superusuários continuam vinculados à organização.
    const idOrganizacao = Number(
        req.session.usuario.idOrganizacao
    );

    if (!Number.isInteger(idOrganizacao) || idOrganizacao <= 0) {
        return res.status(403).send(
            'Sua conta não está vinculada a uma organização.'
        );
    }

    next();
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

    next();
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

    next();
}

module.exports = {
    verificarUsuario,
    verificarPainelOrganizacao,
    verificarEquipeConfirmada,
    verificarSuperusuario,
    verificarAutenticado
};