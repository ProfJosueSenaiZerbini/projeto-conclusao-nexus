const {
    executarQuery,
    executarTransacao
} = require('../db/dbConnect');

async function buscarCodigo(codigo) {
    return executarQuery(
        `SELECT codigo
         FROM CODIGO_ATIVACAO
         WHERE codigo = ? AND usado = FALSE`,
        [codigo]
    );
}

async function verificarAtivacaoConcluida() {
    const resultado = await executarQuery(
        `SELECT ativacao_concluida
         FROM CONFIGURACAO_SISTEMA
         WHERE id = 1`
    );

    return resultado.length > 0 &&
        Boolean(resultado[0].ativacao_concluida);
}

async function buscarFiscalPorEmail(email) {
    return executarQuery(
        'SELECT id FROM FISCAL WHERE email = ?',
        [email]
    );
}

async function buscarFiscalPorCpf(cpf) {
    return executarQuery(
        'SELECT id FROM FISCAL WHERE cpf = ?',
        [cpf]
    );
}

async function cadastrarFiscal(nome, email, cpf, senha) {
    return executarQuery(
        `INSERT INTO FISCAL (nome, email, cpf, senha)
         VALUES (?, ?, ?, ?)`,
        [nome, email, cpf, senha]
    );
}

async function concluirAtivacaoFiscal({
    nome,
    email,
    cpf,
    senha,
    codigo
}) {
    return executarTransacao(async (conn) => {
        // Bloqueia a configuração para impedir ativações simultâneas.
        const configuracao = await conn.query(
            `SELECT ativacao_concluida
             FROM CONFIGURACAO_SISTEMA
             WHERE id = 1
             FOR UPDATE`
        );

        if (
            configuracao.length === 0 ||
            Boolean(configuracao[0].ativacao_concluida)
        ) {
            return { status: 'concluida' };
        }

        const codigos = await conn.query(
            `SELECT codigo
             FROM CODIGO_ATIVACAO
             WHERE codigo = ? AND usado = FALSE
             FOR UPDATE`,
            [codigo]
        );

        if (codigos.length === 0) {
            return { status: 'codigo_invalido' };
        }

        const emails = await conn.query(
            'SELECT id FROM FISCAL WHERE email = ?',
            [email]
        );

        const cpfs = await conn.query(
            'SELECT id FROM FISCAL WHERE cpf = ?',
            [cpf]
        );

        if (emails.length > 0 || cpfs.length > 0) {
            return { status: 'dados_existentes' };
        }

        await conn.query(
            `INSERT INTO FISCAL (nome, email, cpf, senha)
             VALUES (?, ?, ?, ?)`,
            [nome, email, cpf, senha]
        );

        const codigoAtualizado = await conn.query(
            `UPDATE CODIGO_ATIVACAO
             SET usado = TRUE
             WHERE codigo = ? AND usado = FALSE`,
            [codigo]
        );

        if (codigoAtualizado.affectedRows !== 1) {
            throw new Error('Não foi possível consumir o código.');
        }

        const ativacaoAtualizada = await conn.query(
            `UPDATE CONFIGURACAO_SISTEMA
             SET ativacao_concluida = TRUE,
                 concluida_em = CURRENT_TIMESTAMP
             WHERE id = 1 AND ativacao_concluida = FALSE`
        );

        if (ativacaoAtualizada.affectedRows !== 1) {
            throw new Error('Não foi possível concluir a ativação.');
        }

        return { status: 'sucesso' };
    });
}

module.exports = {
    buscarCodigo,
    verificarAtivacaoConcluida,
    buscarFiscalPorEmail,
    buscarFiscalPorCpf,
    cadastrarFiscal,
    concluirAtivacaoFiscal
};