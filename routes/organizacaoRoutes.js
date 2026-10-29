const express = require('express');
const router = express.Router();

const organizacaoController = require('../controllers/organizacaoController');

// Formulário de cadastro da organização
router.post(
    '/cadastro',
    organizacaoController.cadastrarOrganizacao
);

// Formulário de cadastro do superusuário por convite
router.get(
    '/convite/:token',
    organizacaoController.exibirCadastroSuperusuario
);

module.exports = router;