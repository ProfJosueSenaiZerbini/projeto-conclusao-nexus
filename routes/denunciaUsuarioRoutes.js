const express = require("express");
const router = express.Router();

const {
    verificarUsuario
} = require("../middlewares/autenticacao");

const upload = require("../middlewares/uploadDenuncia");

const denunciaUsuarioController = require(
    "../controllers/denunciaUsuarioController"
);

// EXIBIR PÁGINA DE CADASTRO
router.get(
    "/",
    verificarUsuario,
    denunciaUsuarioController.exibirFormulario
);

// CADASTRAR NOVA DENÚNCIA
router.post(
    "/",
    verificarUsuario,
    upload.array("arquivo"),
    denunciaUsuarioController.cadastrar
);

module.exports = router;
