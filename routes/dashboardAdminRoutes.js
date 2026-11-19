const express = require('express');
const router = express.Router();

const {
    carregarDashboard
} = require('../controllers/dashboardAdminController');

const {
    verificarPainelOrganizacao
} = require('../middlewares/autenticacao');

router.get('/', verificarPainelOrganizacao, carregarDashboard);

module.exports = router;
