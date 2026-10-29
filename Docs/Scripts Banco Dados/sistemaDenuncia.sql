CREATE DATABASE IF NOT EXISTS sistema_denuncia
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE sistema_denuncia;

-- TABELA: ORGANIZACAO
-- Cada empresa ou prefeitura que contrata a SafeZone.
CREATE TABLE ORGANIZACAO (
    idOrganizacao INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    emailContato VARCHAR(255) NOT NULL,

    status ENUM(
        'pendente',
        'ativa',
        'em_transicao',
        'bloqueada',
        'inativa'
    ) NOT NULL DEFAULT 'pendente',

    statusContrato ENUM(
        'pendente',
        'ativo',
        'cancelado',
        'encerrado'
    ) NOT NULL DEFAULT 'pendente',

    dataCadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    inicioContrato DATETIME NULL,
    fimContrato DATETIME NULL,
    fimPeriodoTransicao DATETIME NULL
);

-- TABELA: SUPERUSUARIO
-- Responsável administrativo pela organização.
CREATE TABLE SUPERUSUARIO (
    idSuperusuario INT PRIMARY KEY AUTO_INCREMENT,
    idOrganizacao INT NOT NULL UNIQUE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,

    emailConfirmado BOOLEAN NOT NULL DEFAULT FALSE,

    status ENUM(
        'pendente',
        'ativo',
        'desativado'
    ) NOT NULL DEFAULT 'pendente',

    dataCadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dataConfirmacaoEmail DATETIME NULL,
    tokenConfirmacaoHash CHAR(64) NULL UNIQUE,
    tokenConfirmacaoExpiraEm DATETIME NULL,

    CONSTRAINT fk_superusuario_organizacao
        FOREIGN KEY (idOrganizacao)
        REFERENCES ORGANIZACAO(idOrganizacao)
        ON DELETE RESTRICT
);

-- TABELA: CONVITE_SUPERUSUARIO
-- Convite para cadastrar o primeiro superusuário.
CREATE TABLE CONVITE_SUPERUSUARIO (
    idConvite INT PRIMARY KEY AUTO_INCREMENT,
    idOrganizacao INT NOT NULL,
    emailResponsavel VARCHAR(255) NOT NULL,
    tokenHash CHAR(64) NOT NULL UNIQUE,
    criadoEm DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiraEm DATETIME NOT NULL,
    usadoEm DATETIME NULL,
    revogado BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_convite_superusuario_organizacao
        FOREIGN KEY (idOrganizacao)
        REFERENCES ORGANIZACAO(idOrganizacao)
        ON DELETE RESTRICT,

    INDEX idx_convite_email (emailResponsavel),
    INDEX idx_convite_validade (expiraEm, usadoEm, revogado)
);

-- TABELA: CONVITE_TRANSFERENCIA_SUPERUSUARIO
-- Transferência da responsabilidade administrativa.
CREATE TABLE CONVITE_TRANSFERENCIA_SUPERUSUARIO (
    idTransferencia INT PRIMARY KEY AUTO_INCREMENT,
    idOrganizacao INT NOT NULL,
    nomeResponsavel VARCHAR(255) NOT NULL,
    emailResponsavel VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    tokenHash CHAR(64) NOT NULL UNIQUE,
    criadoEm DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiraEm DATETIME NOT NULL,
    usadoEm DATETIME NULL,
    revogado BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_transferencia_organizacao
        FOREIGN KEY (idOrganizacao)
        REFERENCES ORGANIZACAO(idOrganizacao)
        ON DELETE RESTRICT,

    INDEX idx_transferencia_validade (expiraEm, usadoEm, revogado)
);

-- TABELA: USUARIO
-- Usuários que podem registrar denúncias.
CREATE TABLE USUARIO (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
);

-- TABELA: FISCAL
-- Fiscal vinculado a uma organização.
-- A desativação preserva o histórico.
CREATE TABLE FISCAL (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    cpf VARCHAR(18) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    idOrganizacao INT NULL,

    status ENUM(
        'ativo',
        'desativado'
    ) NOT NULL DEFAULT 'ativo',

    dataCadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dataDesativacao DATETIME NULL,

    CONSTRAINT fk_fiscal_organizacao
        FOREIGN KEY (idOrganizacao)
        REFERENCES ORGANIZACAO(idOrganizacao)
        ON DELETE RESTRICT,

    INDEX idx_fiscal_organizacao (idOrganizacao)
);

-- TABELA: LOCALIZACAO
-- Local associado à denúncia.
CREATE TABLE LOCALIZACAO (
    idLocalizacao INT PRIMARY KEY AUTO_INCREMENT,
    tipo VARCHAR(50) NOT NULL,
    endereco TEXT NOT NULL,
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL
);

-- TABELA: DENUNCIA
-- Denúncia registrada por um usuário.
CREATE TABLE DENUNCIA (
    idDenuncia INT PRIMARY KEY AUTO_INCREMENT,
    idUsuario INT NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    dataOcorrencia DATE NULL,

    visibilidade VARCHAR(20) NOT NULL DEFAULT 'anonimo',
    status VARCHAR(50) NOT NULL,
    prioridade VARCHAR(50) NOT NULL,
    dataAbertura DATETIME NULL DEFAULT CURRENT_TIMESTAMP,

    idLocalizacao INT NOT NULL UNIQUE,
    fiscal_id INT NULL,
    idOrganizacao INT NULL,

    CONSTRAINT fk_denuncia_organizacao
        FOREIGN KEY (idOrganizacao)
        REFERENCES ORGANIZACAO(idOrganizacao)
        ON DELETE RESTRICT,

    CONSTRAINT fk_denuncia_usuario
        FOREIGN KEY (idUsuario)
        REFERENCES USUARIO(id),

    CONSTRAINT fk_denuncia_localizacao
        FOREIGN KEY (idLocalizacao)
        REFERENCES LOCALIZACAO(idLocalizacao),

    CONSTRAINT fk_denuncia_fiscal
        FOREIGN KEY (fiscal_id)
        REFERENCES FISCAL(id)
        ON DELETE SET NULL,

    INDEX idx_denuncia_organizacao (idOrganizacao),
    INDEX idx_denuncia_fiscal (fiscal_id)
);

-- TABELA: EVIDENCIA
-- Arquivos e informações anexados às denúncias.
CREATE TABLE EVIDENCIA (
    idEvidencia INT PRIMARY KEY AUTO_INCREMENT,
    idDenuncia INT NOT NULL,
    tipoEvidencia VARCHAR(50) NOT NULL,
    fotoVideoAudio LONGBLOB NULL,
    dadosEvidencia TEXT NULL,

    CONSTRAINT fk_evidencia_denuncia
        FOREIGN KEY (idDenuncia)
        REFERENCES DENUNCIA(idDenuncia)
        ON DELETE CASCADE
);

-- TABELA: NOTIFICACAO
-- Notificações associadas a usuários e denúncias.
CREATE TABLE NOTIFICACAO (
    idNotificacao INT PRIMARY KEY AUTO_INCREMENT,
    idDenuncia INT NOT NULL,
    idUsuario INT NOT NULL,
    conteudo TEXT NOT NULL,
    dataHora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notificacao_denuncia
        FOREIGN KEY (idDenuncia)
        REFERENCES DENUNCIA(idDenuncia)
        ON DELETE CASCADE,

    CONSTRAINT fk_notificacao_usuario
        FOREIGN KEY (idUsuario)
        REFERENCES USUARIO(id)
        ON DELETE CASCADE
);

-- TABELA: HISTORICO_DENUNCIA
-- Registros do histórico das denúncias.
CREATE TABLE HISTORICO_DENUNCIA (
    idHistorico INT PRIMARY KEY AUTO_INCREMENT,
    idDenuncia INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    dataRegistro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_historico_denuncia
        FOREIGN KEY (idDenuncia)
        REFERENCES DENUNCIA(idDenuncia)
        ON DELETE CASCADE
);

-- TABELA: MENSAGEM_DENUNCIA
-- Mensagens associadas às denúncias.
CREATE TABLE MENSAGEM_DENUNCIA (
    idMensagem INT PRIMARY KEY AUTO_INCREMENT,
    idDenuncia INT NOT NULL,
    idUsuario INT NOT NULL,
    texto TEXT NOT NULL,
    dataHora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mensagem_denuncia
        FOREIGN KEY (idDenuncia)
        REFERENCES DENUNCIA(idDenuncia)
        ON DELETE CASCADE,

    CONSTRAINT fk_mensagem_usuario
        FOREIGN KEY (idUsuario)
        REFERENCES USUARIO(id)
        ON DELETE CASCADE
);
