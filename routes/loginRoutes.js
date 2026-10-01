const express = require('express');
const router = express.Router();

const loginController = require('../controllers/loginController');

// GET: mostra o formulário 
router.get('/',(req , res) => {
    res.render('login', {
      mensagemErro: null
    });
});

// POST: processa o login
router.post('/', loginController.login);

module.exports = router;