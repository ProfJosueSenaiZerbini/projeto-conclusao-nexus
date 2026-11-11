
const express = require('express');
const router = express.Router();

const organizacaoController = require('../controllers/organizacaoController');
const localidadeController = require('../controllers/localidadeController');
const { verificarSuperusuario } = require('../middlewares/autenticacao');

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

// Gerenciamento das localidades atendidas pela organização
router.get(
    '/localidades',
    verificarSuperusuario,
    localidadeController.exibirLocalidades
);

router.post(
    '/localidades',
    verificarSuperusuario,
    localidadeController.cadastrarLocalidade
);

router.post(
    '/localidades/:id/remover',
    verificarSuperusuario,
    localidadeController.removerLocalidade
);

module.exports = router;
