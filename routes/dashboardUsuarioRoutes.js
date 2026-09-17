const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('dashboardUsuario');
});

router.get('/denuncias', (req, res) => {
    res.render('denuncias');
});

router.get('/denunciaUsuario', (req, res) => {
    res.render('DenunciaUsuario');
});

router.get('/notificacoes', (req, res) => {
    res.render('notificacoes');
});

router.get('/login', (req, res) => {
    res.render('/');
});

module.exports = router;