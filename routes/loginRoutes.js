const express = require('express');
const router = express.Router();

const loginController = require('../controllers/loginController');

/*  GET: mostra o formulário  */
router.get('/', (req, res) => {
  res.render('login', {
    mensagemErro: null
  });
});

/* POST: processa o login */
router.post('/', loginController.login);

/*  Encerra a sessão do usuário e retorna para a tela de login. */
router.post('/logout', (req, res) => {
  req.session.destroy((erro) => {
    if (erro) {
      console.error('Erro ao realizar logout:', erro);
      return res.status(500).send('Erro ao realizar logout.');
    }

    /* O express-session utiliza um cookie para identificar a sessão do navegador, então o ClearCookie remove esse cookie */
    res.clearCookie('connect.sid');
    return res.redirect('/login');
  });
});

module.exports = router;