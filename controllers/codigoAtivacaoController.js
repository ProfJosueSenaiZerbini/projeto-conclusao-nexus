const codigoAtivacaoModel = require('../models/codigoAtivacaoModel');
const { executarQuery } = require('../db/dbConnect');

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
        const fiscalExistente =
            await codigoAtivacaoModel.verificarFiscalExistente();

        if (fiscalExistente.length > 0) {
            return res.render('ativacao', {
                mensagemErro: 'A ativação inicial já foi realizada.'
            });
        }

        const codigoValido =
            await codigoAtivacaoModel.buscarCodigo(codigo);

        if (codigoValido.length === 0) {
            return res.render('ativacao', {
                mensagemErro: 'Código de ativação inválido ou já utilizado.'
            });
        }

        return res.render('cadastroFiscal', {
            codigo: codigo,
            mensagemErro: null
        });

    } catch (erro) {
        console.error('Erro ao validar código:', erro);

        return res.render('ativacao', {
            mensagemErro: 'Erro ao validar o código de ativação.'
        });
    }
}

async function cadastrarFiscal(req, res) {
    const { nome, email, cpf, senha, codigo } = req.body;

    if (!nome || !email || !cpf || !senha || !codigo) {
        return res.render('cadastroFiscal', {
            codigo: codigo || '',
            mensagemErro: 'Preencha todos os campos.'
        });
    }

    try {
        const fiscalExistente =
            await codigoAtivacaoModel.verificarFiscalExistente();

        if (fiscalExistente.length > 0) {
            return res.render('ativacao', {
                mensagemErro: 'A ativação inicial já foi realizada.'
            });
        }

        const codigoValido =
            await codigoAtivacaoModel.buscarCodigo(codigo);

        if (codigoValido.length === 0) {
            return res.render('ativacao', {
                mensagemErro: 'Código inválido ou já utilizado.'
            });
        }

        const emailExistente = await executarQuery(
            'SELECT id FROM FISCAL WHERE email = ?',
            [email]
        );

        const cpfExistente = await executarQuery(
            'SELECT id FROM FISCAL WHERE cpf = ?',
            [cpf]
        );

        if (emailExistente.length > 0 || cpfExistente.length > 0) {
            return res.render('cadastroFiscal', {
                codigo: codigo,
                mensagemErro: 'Este e-mail ou CPF já está cadastrado.'
            });
        }

        await codigoAtivacaoModel.cadastrarFiscal(
            nome,
            email,
            cpf,
            senha
        );

        await codigoAtivacaoModel.marcarCodigoComoUsado(codigo);

        return res.redirect('/login');

    } catch (erro) {
        console.error('Erro ao cadastrar fiscal:', erro);

        return res.render('cadastroFiscal', {
            codigo: codigo || '',
            mensagemErro: 'Não foi possível concluir o cadastro.'
        });
    }
}

module.exports = {
    exibirAtivacao,
    validarCodigo,
    cadastrarFiscal
};
