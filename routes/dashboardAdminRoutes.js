
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    try {
        res.render('dashboardAdmin', {
            modoDemonstracao: false,

            resumo: {
                total: 0,
                urgentes: 0,
                emAnalise: 0,
                resolvidas: 0
            },

            denuncias: [],

            geojson: {
                type: 'FeatureCollection',
                features: []
            }
        });
    } catch (erro) {
        console.error('Erro ao abrir dashboard administrativo:', erro);
        res.status(500).send('Erro ao carregar o dashboard administrativo.');
    }
});

module.exports = router;
