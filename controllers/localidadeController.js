
const localidadeModel = require('../models/localidadeModel');

// Exibe a página de gerenciamento.
async function exibirLocalidades(req, res) {
    try {
        const idOrganizacao = Number(req.session.usuario.idOrganizacao);

        if (!Number.isInteger(idOrganizacao) || idOrganizacao <= 0) {
            return res.status(403).send(
                'Sua conta não está vinculada a uma organização.'
            );
        }

        const localidades = await localidadeModel.listarLocalidades(
            idOrganizacao
        );

        return res.render('gerenciarLocalidades', {
            localidades,
            mensagemErro: null,
            mensagemSucesso: req.query.sucesso === '1'
                ? 'Localidade cadastrada com sucesso!'
                : req.query.removido === '1'
                    ? 'Localidade removida com sucesso!'
                    : null
        });

    } catch (erro) {
        console.error('Erro ao carregar localidades:', erro);
        return res.status(500).send(
            'Não foi possível carregar as localidades.'
        );
    }
}

// Cadastra uma nova localidade.
async function cadastrarLocalidade(req, res) {
    const idOrganizacao = Number(req.session.usuario.idOrganizacao);

    const cidade = String(req.body.cidade || '').trim();
    const estado = String(req.body.estado || '').trim().toUpperCase();

    if (!Number.isInteger(idOrganizacao) || idOrganizacao <= 0) {
        return res.status(403).send(
            'Sua conta não está vinculada a uma organização.'
        );
    }

    if (!cidade || cidade.length > 100 || !/^[A-Za-zÀ-ÿ\s'-]+$/.test(cidade)) {
        return res.status(400).send('Informe um nome de cidade válido.');
    }

    if (!/^[A-Z]{2}$/.test(estado)) {
        return res.status(400).send('Informe uma UF válida com duas letras.');
    }

    try {
        const resultado = await localidadeModel.cadastrarLocalidade({
            idOrganizacao,
            cidade,
            estado
        });

        if (resultado.affectedRows !== 1) {
            return res.status(403).send(
                'Sua organização não está ativa para cadastrar localidades.'
            );
        }

        return res.redirect('/organizacao/localidades?sucesso=1');

    } catch (erro) {
        console.error('Erro ao cadastrar localidade:', erro);

        if (erro.code === 'ER_DUP_ENTRY') {
            return res.status(409).send(
                'Esta cidade já está vinculada a uma organização.'
            );
        }

        return res.status(500).send(
            'Não foi possível cadastrar a localidade.'
        );
    }
}

// Remove uma localidade.
async function removerLocalidade(req, res) {
    const idOrganizacao = Number(req.session.usuario.idOrganizacao);
    const id = Number(req.params.id);

    if (
        !Number.isInteger(idOrganizacao) ||
        idOrganizacao <= 0 ||
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return res.status(400).send('Dados inválidos.');
    }

    try {
        const resultado = await localidadeModel.removerLocalidade(
            id,
            idOrganizacao
        );

        if (resultado.affectedRows !== 1) {
            return res.status(404).send(
                'Localidade não encontrada.'
            );
        }

        return res.redirect('/organizacao/localidades?removido=1');

    } catch (erro) {
        console.error('Erro ao remover localidade:', erro);

        return res.status(500).send(
            'Não foi possível remover a localidade.'
        );
    }
}

module.exports = {
    exibirLocalidades,
    cadastrarLocalidade,
    removerLocalidade
};
