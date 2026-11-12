const express = require('express');
const router = express.Router();

const denunciaAdmModel = require('../models/denunciaAdmModel');
const { verificarPainelOrganizacao } = require('../middlewares/autenticacao');

router.get('/', verificarPainelOrganizacao, async (req, res) => {
    try {
        const usuario = req.session.usuario;

        let denuncias;

        if (usuario.tipo === 'fiscal') {
            denuncias = await denunciaAdmModel.listarDenunciasPorFiscal(
                usuario.id
            );
        } else {
            const idOrganizacao = Number(usuario.idOrganizacao);

            if (!Number.isInteger(idOrganizacao) || idOrganizacao <= 0) {
                return res.status(403).send(
                    'Sua conta não está vinculada a uma organização.'
                );
            }

            denuncias = await denunciaAdmModel.listarDenuncias(
                idOrganizacao
            );
        }

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
