const express = require('express');
const router = express.Router();

const codigoAtivacaoController = require('../controllers/codigoAtivacaoController');

router.get('/', codigoAtivacaoController.exibirAtivacao);
router.post('/', codigoAtivacaoController.validarCodigo);
router.post('/cadastro', codigoAtivacaoController.cadastrarFiscal);

module.exports = router;
