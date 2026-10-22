
const express = require("express");
const router = express.Router();

const {
    verificarUsuario
} = require("../middlewares/autenticacao");

router.get("/", verificarUsuario, (req, res) => {
    res.render("dashboardUsuario");
});

router.get("/denunciaUsuario", verificarUsuario, (req, res) => {
    res.render("denunciaUsuario");
});

router.get("/notificacoes", verificarUsuario, (req, res) => {
    res.redirect("/notificacoes");
});

router.get("/login", (req, res) => {
    res.redirect("/login");
});

module.exports = router;
