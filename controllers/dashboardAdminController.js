const denunciaAdmModel = require('../models/denunciaAdmModel');

async function carregarDashboard(req, res) {
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

        const features = denuncias
            .filter(d => d.latitude != null && d.longitude != null)
            .map(d => {
                const latitude = Number(d.latitude);
                const longitude = Number(d.longitude);

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
                        titulo: d.tipo || 'Denúncia',
                        endereco: d.endereco,
                        status: d.status
                    }
                };
            })
            .filter(Boolean);

        const geojson = {
            type: 'FeatureCollection',
            features: denuncias
                .filter(d =>
                    d.latitude != null &&
                    d.longitude != null
                )
                .map(d => ({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [
                            Number(d.longitude),
                            Number(d.latitude)
                        ]
                    },
                    properties: {
                        titulo: d.tipo,
                        status: d.status
                    }
                }))
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
}

module.exports = {
    carregarDashboard
};
