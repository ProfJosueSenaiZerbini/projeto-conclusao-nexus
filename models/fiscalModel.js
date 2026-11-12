const bcrypt = require('bcrypt');
const {
    executarQuery,
    executarTransacao
} = require('../db/dbConnect');

// Lista todos os fiscais e suas localidades.
async function listarFiscais() {
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
         GROUP BY
            f.id, f.nome, f.email, f.cpf,
            f.status, f.dataCadastro, f.dataDesativacao
         ORDER BY f.nome ASC`
    );
}

// Lista as localidades disponíveis para atribuição.
async function listarLocalidades() {
    return executarQuery(
        `SELECT idLocalidade, cidade, estado
         FROM LOCALIDADE
         ORDER BY estado, cidade`
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

// Cadastra o fiscal e associa suas localidades.
async function cadastrarFiscal({
    nome,
    email,
    cpf,
    senha,
    localidades
}) {
    const senhaHash = await bcrypt.hash(senha, 12);

    return executarTransacao(async (conn) => {

        // Confere se todas as localidades ainda existem.
        const placeholders = localidades.map(() => '?').join(',');

        const existentes = await conn.query(
            `SELECT idLocalidade
             FROM LOCALIDADE
             WHERE idLocalidade IN (${placeholders})`,
            localidades
        );

        if (existentes.length !== localidades.length) {
            const erro = new Error(
                'Uma ou mais localidades são inválidas.'
            );
            erro.code = 'LOCALIDADES_INVALIDAS';
            throw erro;
        }

        // O fiscal não pertence a uma organização específica.
        const resultado = await conn.query(
            `INSERT INTO FISCAL
                (idOrganizacao, nome, email, cpf, senha, status)
             VALUES (NULL, ?, ?, ?, ?, 'ativo')`,
            [nome, email, cpf, senhaHash]
        );

        const idFiscal = resultado.insertId;

        // Vincula o fiscal a cada localidade selecionada.
        for (const idLocalidade of localidades) {
            await conn.query(
                `INSERT INTO FISCAL_LOCALIDADE
                    (idFiscal, idLocalidade)
                 VALUES (?, ?)`,
                [idFiscal, idLocalidade]
            );
        }

        return resultado;
    });
}

// Desativa fiscal sem depender de organização.
async function desativarFiscal(idFiscal) {
    return executarQuery(
        `UPDATE FISCAL
         SET status = 'desativado',
             dataDesativacao = CURRENT_TIMESTAMP
         WHERE id = ?
           AND status = 'ativo'`,
        [idFiscal]
    );
}

module.exports = {
    listarFiscais,
    listarLocalidades,
    buscarEmailExistente,
    buscarCpfExistente,
    cadastrarFiscal,
    desativarFiscal
};
