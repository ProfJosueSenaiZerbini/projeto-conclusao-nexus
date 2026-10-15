
const express = require('express');
const router = express.Router();

const { verificarAdmin } = require('../middlewares/autenticacao');
const fiscalController = require('../controllers/fiscalController');

router.get(
    '/',
    verificarAdmin,
    fiscalController.exibirGerenciarFiscais
);

router.get(
    '/cadastro',
    verificarAdmin,
    (req, res) => {
        res.redirect('/gerenciarFiscais');
    }
);

router.post(
    '/cadastro',
    verificarAdmin,
    fiscalController.cadastrarFiscal
);

module.exports = router;
