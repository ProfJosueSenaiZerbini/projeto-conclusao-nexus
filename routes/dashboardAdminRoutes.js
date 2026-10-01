const express = require('express');
const router = express.Router();

const {
    verificarAdmin
} = require('../middlewares/autenticacao');

router.get('/', verificarAdmin, (req, res) => {
    res.render('dashboardAdmin');
});

module.exports = router;