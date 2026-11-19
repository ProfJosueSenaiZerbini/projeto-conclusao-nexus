const express = require("express");
const router = express.Router();

const {
    carregarDashboard
} = require("../controllers/dashboardUsuarioController");

const {
    verificarUsuario
} = require("../middlewares/autenticacao");

router.get("/", verificarUsuario, carregarDashboard);

module.exports = router;
