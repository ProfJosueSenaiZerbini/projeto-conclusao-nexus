CREATE DATABASE IF NOT EXISTS sistema_denuncia
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
USE sistema_denuncia;

-- ORGANIZAÇÃO: cada empresa/prefeitura que contrata a SafeZone.
CREATE TABLE ORGANIZACAO (
    idOrganizacao INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    emailContato VARCHAR(255) NOT NULL,
    status ENUM('pendente', 'ativa', 'em_transicao', 'bloqueada', 'inativa') NOT NULL DEFAULT 'pendente',
    statusContrato ENUM('pendente', 'ativo', 'cancelado', 'encerrado') NOT NULL DEFAULT 'pendente',
    dataCadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    inicioContrato DATETIME NULL,
    fimContrato DATETIME NULL,
    fimPeriodoTransicao DATETIME NULL
);

-- SUPERUSUÁRIO: responsável administrativo de uma única organização.
CREATE TABLE SUPERUSUARIO (
    idSuperusuario INT PRIMARY KEY AUTO_INCREMENT,
    idOrganizacao INT NOT NULL UNIQUE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    emailConfirmado BOOLEAN NOT NULL DEFAULT FALSE,
    status ENUM('pendente', 'ativo', 'desativado') NOT NULL DEFAULT 'pendente',
    dataCadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dataConfirmacaoEmail DATETIME NULL,
    CONSTRAINT fk_superusuario_organizacao
        FOREIGN KEY (idOrganizacao) REFERENCES ORGANIZACAO(idOrganizacao)
        ON DELETE RESTRICT
);

-- Convites para cadastro do superusuário. O token deve ser aleatório e de uso único.
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
        FOREIGN KEY (idOrganizacao) REFERENCES ORGANIZACAO(idOrganizacao)
        ON DELETE RESTRICT,
    INDEX idx_convite_email (emailResponsavel),
    INDEX idx_convite_validade (expiraEm, usadoEm, revogado)
);

----- TABELA USUARIO -----
CREATE TABLE USUARIO (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
);

----- TABELA FISCAL -----
-- Cada fiscal pertence a uma organização e pode ser desativado sem apagar seu histórico.
CREATE TABLE FISCAL (
    id INT PRIMARY KEY AUTO_INCREMENT,
    idOrganizacao INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    cpf VARCHAR(18) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    status ENUM('ativo', 'desativado') NOT NULL DEFAULT 'ativo',
    dataCadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dataDesativacao DATETIME NULL,
    CONSTRAINT fk_fiscal_organizacao
        FOREIGN KEY (idOrganizacao) REFERENCES ORGANIZACAO(idOrganizacao)
        ON DELETE RESTRICT
);

----- TABELA LOCALIZACAO -----
CREATE TABLE LOCALIZACAO (
    idLocalizacao INT PRIMARY KEY AUTO_INCREMENT,
    tipo VARCHAR(50) NOT NULL, -- Ex.: 'Manual' ou 'Auto'
    endereco TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8)
);

CREATE TABLE DENUNCIA (
    idDenuncia INT PRIMARY KEY AUTO_INCREMENT,
    idOrganizacao INT NOT NULL,
    idUsuario INT NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    prioridade VARCHAR(50) NOT NULL,
    dataAbertura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    idLocalizacao INT NOT NULL UNIQUE,
    fiscal_id INT NULL, -- Pode ser NULL até que um fiscal seja atribuído.
    CONSTRAINT fk_denuncia_organizacao
        FOREIGN KEY (idOrganizacao) REFERENCES ORGANIZACAO(idOrganizacao)
        ON DELETE RESTRICT,
    CONSTRAINT fk_denuncia_usuario
        FOREIGN KEY (idUsuario) REFERENCES USUARIO(id),
    CONSTRAINT fk_denuncia_localizacao
        FOREIGN KEY (idLocalizacao) REFERENCES LOCALIZACAO(idLocalizacao),
    CONSTRAINT fk_denuncia_fiscal
        FOREIGN KEY (fiscal_id) REFERENCES FISCAL(id)
        ON DELETE SET NULL,
    INDEX idx_denuncia_organizacao (idOrganizacao),
    INDEX idx_denuncia_fiscal (fiscal_id)
);

----- TABELA EVIDENCIA -----
CREATE TABLE EVIDENCIA (
    idEvidencia INT PRIMARY KEY AUTO_INCREMENT,
    idDenuncia INT NOT NULL,
    tipoEvidencia VARCHAR(50) NOT NULL,
    fotoVideoAudio LONGBLOB,
    dadosEvidencia TEXT,
    CONSTRAINT fk_evidencia_denuncia
        FOREIGN KEY (idDenuncia) REFERENCES DENUNCIA(idDenuncia)
        ON DELETE CASCADE
);

----- TABELA NOTIFICACAO -----
CREATE TABLE NOTIFICACAO (
    idNotificacao INT PRIMARY KEY AUTO_INCREMENT,
    idDenuncia INT NOT NULL,
    idUsuario INT NOT NULL,
    conteudo TEXT NOT NULL,
    dataHora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notificacao_denuncia
        FOREIGN KEY (idDenuncia) REFERENCES DENUNCIA(idDenuncia)
        ON DELETE CASCADE,
    CONSTRAINT fk_notificacao_usuario
        FOREIGN KEY (idUsuario) REFERENCES USUARIO(id)
        ON DELETE CASCADE
);

----- TABELA HISTORICO_DENUNCIA -----
CREATE TABLE HISTORICO_DENUNCIA (
    idHistorico INT PRIMARY KEY AUTO_INCREMENT,
    idDenuncia INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    dataRegistro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historico_denuncia
        FOREIGN KEY (idDenuncia) REFERENCES DENUNCIA(idDenuncia)
        ON DELETE CASCADE
);

----- TABELA MENSAGEM_DENUNCIA -----
CREATE TABLE MENSAGEM_DENUNCIA (
    idMensagem INT PRIMARY KEY AUTO_INCREMENT,
    idDenuncia INT NOT NULL,
    idUsuario INT NOT NULL,
    texto TEXT NOT NULL,
    dataHora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mensagem_denuncia
        FOREIGN KEY (idDenuncia) REFERENCES DENUNCIA(idDenuncia)
        ON DELETE CASCADE,
    CONSTRAINT fk_mensagem_usuario
        FOREIGN KEY (idUsuario) REFERENCES USUARIO(id)
        ON DELETE CASCADE
);