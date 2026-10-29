
const express = require('express');
const router = express.Router();

const {verificarSuperusuario} = require('../middlewares/autenticacao');
const fiscalController = require('../controllers/fiscalController');

router.get(
    '/',
    verificarSuperusuario,
    fiscalController.exibirGerenciarFiscais
);

router.get(
    '/cadastro',
    verificarSuperusuario,
    (req, res) => {
        res.redirect('/gerenciarFiscais');
    }
);

router.post(
    '/cadastro',
    verificarSuperusuario,
    fiscalController.cadastrarFiscal
);

module.exports = router;
