const localidadeModel = require('../models/localidadeModel');

// Exibe a página de gerenciamento.
async function exibirLocalidades(req, res) {
    try {
        const localidades = await localidadeModel.listarLocalidades();

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
    const cidade = String(req.body.cidade || '').trim();
    const estado = String(req.body.estado || '').trim().toUpperCase();

    if (
        !cidade ||
        cidade.length > 100 ||
        !/^[A-Za-zÀ-ÿ\s'-]+$/.test(cidade)
    ) {
        return res.status(400).send(
            'Informe um nome de cidade válido.'
        );
    }

    if (!/^[A-Z]{2}$/.test(estado)) {
        return res.status(400).send(
            'Informe uma UF válida com duas letras.'
        );
    }

    try {
        await localidadeModel.cadastrarLocalidade({
            cidade,
            estado
        });

        return res.redirect('/organizacao/localidades?sucesso=1');

    } catch (erro) {
        console.error('Erro ao cadastrar localidade:', erro);

        if (erro.code === 'ER_DUP_ENTRY') {
            return res.status(409).send(
                'Esta cidade já está cadastrada.'
            );
        }

        return res.status(500).send(
            'Não foi possível cadastrar a localidade.'
        );
    }
}

// Remove uma localidade.
async function removerLocalidade(req, res) {
    const idLocalidade = Number(req.params.id);

    if (
        !Number.isInteger(idLocalidade) ||
        idLocalidade <= 0
    ) {
        return res.status(400).send('Dados inválidos.');
    }

    try {
        const resultado = await localidadeModel.removerLocalidade(
            idLocalidade
        );

        if (resultado.affectedRows !== 1) {
            return res.status(404).send(
                'Localidade não encontrada.'
            );
        }

        return res.redirect('/organizacao/localidades?removido=1');

    } catch (erro) {
        console.error('Erro ao remover localidade:', erro);

        if (erro.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).send(
                'Esta localidade possui denúncias ou outros vínculos e não pode ser removida.'
            );
        }

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
