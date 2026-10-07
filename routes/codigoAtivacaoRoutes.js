const express = require('express');
const router = express.Router();

const codigoAtivacaoController = require('../controllers/codigoAtivacaoController');

router.get('/', codigoAtivacaoController.exibirAtivacao);

router.post('/', codigoAtivacaoController.validarCodigo);

module.exports = router;