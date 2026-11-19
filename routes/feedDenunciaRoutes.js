const express = require("express");
const router = express.Router();

const {
    verificarAutenticado
} = require("../middlewares/autenticacao");

const {
    carregarFeed
} = require("../controllers/feedDenunciaController");

router.get("/", verificarAutenticado, carregarFeed);

module.exports = router;
