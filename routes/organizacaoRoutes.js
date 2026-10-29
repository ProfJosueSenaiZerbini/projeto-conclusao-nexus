const express = require('express');
const router = express.Router();

const organizacaoController = require('../controllers/organizacaoController');

// Cadastro da organização
router.get('/cadastro', (req, res) => {
    res.render('cadastroOrganizacao', {
        mensagemErro: null,
        mensagemSucesso: null,
        linkConviteTeste: null
    });
});

router.post('/cadastro', organizacaoController.cadastrarOrganizacao);

// Cadastro do superusuário por convite
router.get(
    '/convite/:token',
    organizacaoController.exibirCadastroSuperusuario
);

router.post(
    '/convite/:token',
    organizacaoController.cadastrarSuperusuario
);

// Confirmação de e-mail
router.get(
    '/confirmar-email/:token',
    organizacaoController.confirmarEmailSuperusuario
);

// Simulação local de contratação para testes do TCC
router.get(
    '/contratacao-teste',
    organizacaoController.exibirSimulacaoContratacao
);

router.post(
    '/contratacao-teste',
    organizacaoController.aprovarContratacaoTeste
);

module.exports = router;
