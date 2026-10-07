const codigoAtivacaoModel = require('../models/codigoAtivacaoModel');

async function exibirAtivacao(req, res) {
    res.render('ativacao', {
        mensagemErro: null
    });
}

async function validarCodigo(req, res) {

    const { codigo } = req.body;

    if (!codigo) {
        return res.render('ativacao', {
            mensagemErro: 'Digite o código de ativação.'
        });
    }

    try {

        // Verifica se já existe um fiscal
        const fiscalExistente =
            await codigoAtivacaoModel.verificarFiscalExistente();

        if (fiscalExistente.length > 0) {
            return res.render('ativacao', {
                mensagemErro: 'A ativação inicial já foi realizada.'
            });
        }

        // Verifica o código
        const codigoValido =
            await codigoAtivacaoModel.buscarCodigo(codigo);

        if (codigoValido.length === 0) {
            return res.render('ativacao', {
                mensagemErro: 'Código de ativação inválido ou já utilizado.'
            });
        }

        // Código válido
        return res.render('cadastroFiscal', {
            codigo: codigo
        });

    } catch (erro) {

        console.error('Erro ao validar código:', erro);

        return res.render('ativacao', {
            mensagemErro: 'Erro ao validar o código de ativação.'
        });
    }
}

module.exports = {
    exibirAtivacao,
    validarCodigo
};