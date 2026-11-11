
const express = require('express');
const router = express.Router();

const denunciaAdmModel = require('../models/denunciaAdmModel');

const {
    verificarPainelOrganizacao
} = require('../middlewares/autenticacao');

router.get('/', verificarPainelOrganizacao, async (req, res) => {
    try {
        // Identifica a organização do usuário autenticado.
        const idOrganizacao = Number(
            req.session.usuario.idOrganizacao
        );

        if (!Number.isInteger(idOrganizacao) || idOrganizacao <= 0) {
            return res.status(403).send(
                'Sua conta não está vinculada a uma organização.'
            );
        }

        // Busca somente as denúncias daquela organização.
        const denuncias = await denunciaAdmModel.listarDenuncias(
            idOrganizacao
        );

        // Calcula os indicadores do painel.
        const resumo = {
            total: denuncias.length,

            urgentes: denuncias.filter(
                d => d.prioridade === 'Alta'
            ).length,

            emAnalise: denuncias.filter(
                d => d.status === 'Em análise'
            ).length,

            resolvidas: denuncias.filter(
                d => d.status === 'Resolvida'
            ).length
        };

        // Estrutura do mapa.
        const geojson = {
            type: 'FeatureCollection',
            features: []
        };

        return res.render('dashboardAdmin', {
            modoDemonstracao: false,
            resumo,
            denuncias,
            geojson
        });

    } catch (erro) {
        console.error(
            'Erro ao carregar dashboard administrativo:',
            erro
        );

        return res.status(500).send(
            'Erro ao carregar o dashboard administrativo.'
        );
    }
});

module.exports = router;
