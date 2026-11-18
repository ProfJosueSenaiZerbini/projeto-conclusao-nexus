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
        } else if (usuario.tipo === 'superusuario') {
            const idSuperusuario = Number(usuario.id);

            if (!Number.isInteger(idSuperusuario) || idSuperusuario <= 0) {
                return res.status(403).send('Superusuário inválido.');
            }

            denuncias = await denunciaAdmModel.listarDenunciasPorSuperusuario(
                idSuperusuario
            );
        } else {
            return res.status(403).send('Acesso negado.');
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
