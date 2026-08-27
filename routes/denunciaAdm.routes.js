const express = require('express');

const router = express.Router();

// Página de denúncias do administrador
router.get('/', (req, res) => {
    res.render('denunciaAdm');
});

module.exports = router;
