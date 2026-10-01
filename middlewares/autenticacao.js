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

    if (req.session.usuario.tipo !== 'admin') {
        return res.status(403).send('Acesso negado.');
    }

    next();
}


module.exports = {
    verificarUsuario,
    verificarAdmin
};