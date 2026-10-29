function verificarUsuario(req, res, next) {

    if (!req.session.usuario) {
        return res.redirect('/login');
    }

    if (req.session.usuario.tipo !== 'usuario') {
        return res.status(403).send('Acesso negado.');
    }

    next();
}



function verificarAdmin(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect('/login');
    }

    const tipo = req.session.usuario.tipo;

    if (!['admin', 'superusuario'].includes(tipo)) {
        return res.status(403).send('Acesso negado.');
    }

    if (
        tipo === 'superusuario' &&
        !req.session.usuario.emailConfirmado
    ) {
        return res.status(403).send(
            'Confirme seu e-mail para acessar esta funcionalidade.'
        );
    }

    next();
}

function verificarSuperusuario(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect('/login');
    }

    if (req.session.usuario.tipo !== 'superusuario') {
        return res.status(403).send('Acesso negado.');
    }

    if (!req.session.usuario.emailConfirmado) {
        return res.status(403).send('Confirme seu e-mail para continuar.');
    }

    next();
}


module.exports = {
    verificarUsuario,
    verificarAdmin,
    verificarSuperusuario
};