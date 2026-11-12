const fiscalModel = require('../models/fiscalModel');

function formatarCpf(cpf) {
    const numeros = String(cpf || '').replace(/\D/g, '');

    if (numeros.length !== 11) return null;

    return numeros.replace(
        /(\d{3})(\d{3})(\d{3})(\d{2})/,
        '$1.$2.$3-$4'
    );
}

async function renderGerenciar(
    req,
    res,
    status = 200,
    mensagemErro = null,
    mensagemSucesso = null
) {
    try {
        const [fiscais, localidades] = await Promise.all([
            fiscalModel.listarFiscais(),
            fiscalModel.listarLocalidades()
        ]);

        return res.status(status).render('gerenciarFiscais', {
            fiscais,
            localidades,
            mensagemErro,
            mensagemSucesso
        });

    } catch (erro) {
        console.error('Erro ao carregar fiscais:', erro);

        return res.status(500).send(
            'Não foi possível carregar os fiscais.'
        );
    }
}

async function exibirGerenciarFiscais(req, res) {
    return renderGerenciar(
        req,
        res,
        200,
        null,
        req.query.sucesso === '1'
            ? 'Fiscal cadastrado com sucesso!'
            : req.query.desativado === '1'
                ? 'Fiscal desativado. O histórico foi preservado.'
                : null
    );
}

async function cadastrarFiscal(req, res) {
    const nome = String(req.body.nome || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();

    const cpfNumeros = String(req.body.cpf || '').replace(/\D/g, '');
    const cpf = formatarCpf(req.body.cpf);

    const senha = req.body.senha;

    // Recebe uma ou várias localidades.
    const localidadesRecebidas = req.body.localidades;

    const localidades = [
        ...new Set(
            (Array.isArray(localidadesRecebidas)
                ? localidadesRecebidas
                : localidadesRecebidas
                    ? [localidadesRecebidas]
                    : []
            ).map(Number)
        )
    ];

    if (!nome || !email || !cpf || !senha) {
        return renderGerenciar(
            req,
            res,
            400,
            'Preencha todos os campos obrigatórios e informe um CPF válido.'
        );
    }

    if (senha.length < 8) {
        return renderGerenciar(
            req,
            res,
            400,
            'A senha precisa ter pelo menos 8 caracteres.'
        );
    }

    if (
        localidades.length === 0 ||
        localidades.some(id => !Number.isInteger(id) || id <= 0)
    ) {
        return renderGerenciar(
            req,
            res,
            400,
            'Selecione pelo menos uma localidade válida.'
        );
    }

    try {
        if ((await fiscalModel.buscarEmailExistente(email)).length) {
            return renderGerenciar(
                req,
                res,
                409,
                'Este e-mail já está cadastrado.'
            );
        }

        if ((await fiscalModel.buscarCpfExistente(cpfNumeros)).length) {
            return renderGerenciar(
                req,
                res,
                409,
                'Este CPF já está cadastrado.'
            );
        }

        await fiscalModel.cadastrarFiscal({
            nome,
            email,
            cpf,
            senha,
            localidades
        });

        return res.redirect('/gerenciarFiscais?sucesso=1');

    } catch (erro) {
        console.error('Erro ao cadastrar fiscal:', erro);

        if (erro.code === 'LOCALIDADES_INVALIDAS') {
            return renderGerenciar(
                req,
                res,
                400,
                'Uma das localidades selecionadas não existe mais.'
            );
        }

        return renderGerenciar(
            req,
            res,
            500,
            'Não foi possível cadastrar o fiscal. Verifique os dados e tente novamente.'
        );
    }
}

async function desativarFiscal(req, res) {
    const idFiscal = Number(req.params.id);

    if (!Number.isInteger(idFiscal) || idFiscal <= 0) {
        return res.status(400).send('Dados inválidos.');
    }

    try {
        const resultado = await fiscalModel.desativarFiscal(idFiscal);

        if (resultado.affectedRows !== 1) {
            return renderGerenciar(
                req,
                res,
                404,
                'Fiscal não encontrado ou já desativado.'
            );
        }

        return res.redirect('/gerenciarFiscais?desativado=1');

    } catch (erro) {
        console.error('Erro ao desativar fiscal:', erro);

        return renderGerenciar(
            req,
            res,
            500,
            'Não foi possível desativar o fiscal.'
        );
    }
}

module.exports = {
    exibirGerenciarFiscais,
    cadastrarFiscal,
    desativarFiscal
};
