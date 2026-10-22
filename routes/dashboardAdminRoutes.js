const express = require('express');
const router = express.Router();

const { verificarAdmin } = require('../middlewares/autenticacao');
const { executarQuery } = require('../db/dbConnect');

router.get('/', verificarAdmin, async (req, res) => {
    try {
        const registros = await executarQuery(`
            SELECT
                d.tipo AS titulo,
                d.status,
                d.prioridade,
                l.endereco,
                l.latitude,
                l.longitude
            FROM DENUNCIA d
            INNER JOIN LOCALIZACAO l
                ON d.idLocalizacao = l.idLocalizacao
            ORDER BY d.dataAbertura DESC
        `);

        const denuncias = registros.map(({ titulo, endereco, status }) => ({
            titulo,
            endereco,
            status
        }));

        const resumo = {
            total: registros.length,
            urgentes: registros.filter(denuncia => denuncia.prioridade === 'Alta').length,
            emAnalise: registros.filter(denuncia => denuncia.status === 'Em análise').length,
            resolvidas: registros.filter(denuncia => denuncia.status === 'Resolvida').length
        };

        const features = registros
            .filter(denuncia => denuncia.latitude != null && denuncia.longitude != null)
            .map(denuncia => {
                const latitude = Number(denuncia.latitude);
                const longitude = Number(denuncia.longitude);

                if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                    return null;
                }

                return {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    },
                    properties: {
                        titulo: denuncia.titulo,
                        endereco: denuncia.endereco,
                        status: denuncia.status
                    }
                };
            })
            .filter(Boolean);

        return res.render('dashboardAdmin', {
            modoDemonstracao: false,
            resumo,
            denuncias,
            geojson: {
                type: 'FeatureCollection',
                features
            }
        });
    } catch (erro) {
        console.error('Erro ao carregar o dashboard administrativo:', erro);
        return res.status(500).send('Erro ao carregar o dashboard administrativo.');
    }
});

module.exports = router;