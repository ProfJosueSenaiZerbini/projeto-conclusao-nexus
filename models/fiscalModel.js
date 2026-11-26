const bcrypt = require('bcrypt');
const { executarQuery, executarTransacao } = require('../db/dbConnect');

// Lista os fiscais e mantém a exibição de localidades já vinculadas.
async function listarFiscais(idSuperusuario) {
    return executarQuery(
        `SELECT
            f.id,
            f.nome,
            f.email,
            f.cpf,
            f.status,
            f.dataCadastro,
            f.dataDesativacao,
            GROUP_CONCAT(
                DISTINCT CONCAT(l.cidade, ' - ', l.estado)
                ORDER BY l.cidade
                SEPARATOR ', '
            ) AS localidades
         FROM FISCAL f
         LEFT JOIN FISCAL_LOCALIDADE fl
            ON fl.idFiscal = f.id
         LEFT JOIN LOCALIDADE l
            ON l.idLocalidade = fl.idLocalidade
         WHERE f.idSuperusuario = ?
         GROUP BY
            f.id, f.nome, f.email, f.cpf,
            f.status, f.dataCadastro, f.dataDesativacao
         ORDER BY f.nome ASC`,
        [idSuperusuario]
    );
}

// Lista as localidades já cadastradas para atribuição aos fiscais.
async function listarLocalidades() {
    return executarQuery(
        `SELECT idLocalidade, cidade, estado
         FROM LOCALIDADE
         ORDER BY estado ASC, cidade ASC`
    );
}

// Verifica se o e-mail já existe.
async function buscarEmailExistente(email) {
    const usuario = await executarQuery(
        'SELECT email FROM USUARIO WHERE LOWER(email) = ?',
        [email]
    );

    if (usuario.length) return usuario;

    const fiscal = await executarQuery(
        'SELECT email FROM FISCAL WHERE LOWER(email) = ?',
        [email]
    );

    if (fiscal.length) return fiscal;

    return executarQuery(
        'SELECT email FROM SUPERUSUARIO WHERE LOWER(email) = ?',
        [email]
    );
}

// Verifica se o CPF já existe.
async function buscarCpfExistente(cpfNumeros) {
    const usuario = await executarQuery(
        `SELECT cpf FROM USUARIO
         WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = ?`,
        [cpfNumeros]
    );

    if (usuario.length) return usuario;

    const fiscal = await executarQuery(
        `SELECT cpf FROM FISCAL
         WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = ?`,
        [cpfNumeros]
    );

    if (fiscal.length) return fiscal;

    return executarQuery(
        `SELECT cpf FROM SUPERUSUARIO
         WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = ?`,
        [cpfNumeros]
    );
}

// Cadastra o fiscal apenas com os dados básicos e associa as localidades escolhidas.
async function cadastrarFiscal({
    nome,
    email,
    cpf,
    senha,
    localidades,
    idSuperusuario
}) {
    const senhaHash = await bcrypt.hash(senha, 12);

    return executarTransacao(async (conn) => {
        const placeholders = localidades.map(() => '?').join(',');
        const existentes = await conn.query(
            `SELECT idLocalidade
             FROM LOCALIDADE
             WHERE idLocalidade IN (${placeholders})`,
            localidades
        );

        if (existentes.length !== localidades.length) {
            const erro = new Error('Uma ou mais localidades são inválidas.');
            erro.code = 'LOCALIDADES_INVALIDAS';
            throw erro;
        }

        const resultado = await conn.query(
            `INSERT INTO FISCAL (
                idOrganizacao, idSuperusuario, nome, email, cpf, senha, status
             ) VALUES (NULL, ?, ?, ?, ?, ?, 'ativo')`,
            [idSuperusuario, nome, email, cpf, senhaHash]
        );

        for (const idLocalidade of localidades) {
            await conn.query(
                `INSERT INTO FISCAL_LOCALIDADE (idFiscal, idLocalidade)
                 VALUES (?, ?)`,
                [resultado.insertId, idLocalidade]
            );
        }

        return resultado;
    });
}

// Desativa fiscal sem remover suas localidades ou seu histórico.
async function desativarFiscal(idFiscal, idSuperusuario) {
    return executarQuery(
        `UPDATE FISCAL
         SET status = 'desativado',
             dataDesativacao = CURRENT_TIMESTAMP
         WHERE id = ?
           AND idSuperusuario = ?
           AND status = 'ativo'`,
        [idFiscal, idSuperusuario]
    );
}

// Reatribui (reativa) um fiscal, preservando os vínculos de localidades existentes.
async function reatribuirFiscal(idFiscal, idSuperusuario) {
    return executarQuery(
        `UPDATE FISCAL
         SET status = 'ativo',
             dataDesativacao = NULL
         WHERE id = ?
           AND idSuperusuario = ?
           AND status = 'desativado'`,
        [idFiscal, idSuperusuario]
    );
}

module.exports = {
    listarFiscais,
    listarLocalidades,
    buscarEmailExistente,
    buscarCpfExistente,
    cadastrarFiscal,
    desativarFiscal,
    reatribuirFiscal
};
