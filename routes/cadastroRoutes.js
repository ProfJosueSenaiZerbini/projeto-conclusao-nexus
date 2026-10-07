const express = require('express');
const router = express.Router();

const cadastroController = require('../controllers/cadastroController');

/* Mostra a tela */
router.get('/', cadastroController.exibirCadastro);

/* Recebe os dados do cadastro */
router.post('/', cadastroController.cadastrar);

module.exports = router;