USE sistema_denuncia;

START TRANSACTION;

-- =====================================================
-- POVOAMENTO DEMONSTRATIVO NEXUS
-- 2 organizações, 2 superusuários, 4 fiscais (2 por organização)
-- 4 localidades (uma por fiscal) e EXATAMENTE 4 denúncias
-- Cada fiscal atende uma localidade definida por bairro + cidade + estado.
-- O bairro é gravado tanto em LOCALIDADE quanto em LOCALIZACAO,
-- conforme o schema mais recente do projeto.
--
-- SENHA DE LOGIN DE TODAS AS CONTAS ABAIXO: SafeZone@2026
-- O valor gravado no banco é o hash bcrypt dessa senha.
-- Execute uma única vez em uma base preparada para demonstração.
-- =====================================================

SET @senha = '$2b$10$vxT4O6X8bfFeV3MyImCfAuvJd2z1rlTqD1r8BDS1yM1pgxQROlfpG';

-- 1. ORGANIZAÇÕES
INSERT INTO ORGANIZACAO
(nome, cnpj, emailContato, status, statusContrato, inicioContrato)
VALUES
('Prefeitura Municipal de Campinas (Demo)', '00.000.000/0000-01', 'contato.campinas@safezone.example', 'ativa', 'ativo', NOW()),
('Prefeitura Municipal de Vinhedo (Demo)',  '00.000.000/0000-02', 'contato.vinhedo@safezone.example',  'ativa', 'ativo', NOW());

SET @orgCampinas = (SELECT idOrganizacao FROM ORGANIZACAO WHERE cnpj = '00.000.000/0000-01');
SET @orgVinhedo  = (SELECT idOrganizacao FROM ORGANIZACAO WHERE cnpj = '00.000.000/0000-02');

-- 2. LOCALIDADES: uma combinação bairro + cidade + estado por fiscal.
INSERT INTO LOCALIDADE (bairro, cidade, estado)
VALUES
('Centro', 'Campinas', 'SP'),
('Jardim Pinheiros', 'Valinhos', 'SP'),
('Capela', 'Vinhedo', 'SP'),
('Nova Veneza', 'Sumaré', 'SP');

SET @locCampinas = (SELECT idLocalidade FROM LOCALIDADE WHERE bairro = 'Centro' AND cidade = 'Campinas' AND estado = 'SP');
SET @locValinhos = (SELECT idLocalidade FROM LOCALIDADE WHERE bairro = 'Jardim Pinheiros' AND cidade = 'Valinhos' AND estado = 'SP');
SET @locVinhedo  = (SELECT idLocalidade FROM LOCALIDADE WHERE bairro = 'Capela' AND cidade = 'Vinhedo' AND estado = 'SP');
SET @locSumare   = (SELECT idLocalidade FROM LOCALIDADE WHERE bairro = 'Nova Veneza' AND cidade = 'Sumaré' AND estado = 'SP');

-- Vínculo administrativo das cidades com as organizações.
INSERT INTO ORGANIZACAO_LOCALIDADE (idOrganizacao, cidade, estado)
VALUES
(@orgCampinas, 'Campinas', 'SP'),
(@orgCampinas, 'Valinhos', 'SP'),
(@orgVinhedo, 'Vinhedo', 'SP'),
(@orgVinhedo, 'Sumaré', 'SP');

-- 3. SUPERUSUÁRIOS: um por organização.
INSERT INTO SUPERUSUARIO
(idOrganizacao, nome, email, cpf, senha, emailConfirmado, status, dataConfirmacaoEmail)
VALUES
(@orgCampinas, 'Eduardo Henrique Martins', 'eduardo@safezone.example', '000.000.000-01', @senha, TRUE, 'ativo', NOW()),
(@orgVinhedo,  'Patrícia Almeida Costa',   'patricia@safezone.example', '000.000.000-02', @senha, TRUE, 'ativo', NOW());

SET @superCampinas = (SELECT idSuperusuario FROM SUPERUSUARIO WHERE email = 'eduardo@safezone.example');
SET @superVinhedo  = (SELECT idSuperusuario FROM SUPERUSUARIO WHERE email = 'patricia@safezone.example');

-- 4. USUÁRIO COMUM que será o autor das quatro denúncias demonstrativas.
INSERT INTO USUARIO (nome, email, cpf, senha)
VALUES ('Lucas Oliveira', 'lucas@safezone.example', '000.000.000-03', @senha);
SET @usuario = (SELECT id FROM USUARIO WHERE email = 'lucas@safezone.example');

-- 5. FISCAIS: dois cadastrados por cada superusuário.
INSERT INTO FISCAL
(nome, email, cpf, senha, idOrganizacao, idSuperusuario, status)
VALUES
('Mariana Costa Oliveira', 'mariana@safezone.example', '000.000.000-04', @senha, @orgCampinas, @superCampinas, 'ativo'),
('Roberto Almeida Ferreira', 'roberto@safezone.example', '000.000.000-05', @senha, @orgCampinas, @superCampinas, 'ativo'),
('Camila Rodrigues Santos', 'camila@safezone.example', '000.000.000-06', @senha, @orgVinhedo,  @superVinhedo,  'ativo'),
('André Luiz Nascimento', 'andre@safezone.example', '000.000.000-07', @senha, @orgVinhedo,  @superVinhedo,  'ativo');

SET @mariana = (SELECT id FROM FISCAL WHERE email = 'mariana@safezone.example');
SET @roberto = (SELECT id FROM FISCAL WHERE email = 'roberto@safezone.example');
SET @camila  = (SELECT id FROM FISCAL WHERE email = 'camila@safezone.example');
SET @andre   = (SELECT id FROM FISCAL WHERE email = 'andre@safezone.example');

-- 6. CADA FISCAL FICA RESPONSÁVEL POR UMA ÚNICA LOCALIDADE.
INSERT INTO FISCAL_LOCALIDADE (idFiscal, idLocalidade)
VALUES
(@mariana, @locCampinas),
(@roberto, @locValinhos),
(@camila,  @locVinhedo),
(@andre,   @locSumare);

-- 7. CATEGORIAS: duas para cada organização.
-- tipoDenuncia é chave primária, por isso cada descrição é única.
INSERT INTO ORGANIZACAO_TIPO_DENUNCIA (tipoDenuncia, idOrganizacao)
VALUES
('Descarte irregular de lixo', @orgCampinas),
('Buraco na via pública', @orgCampinas),
('Calçada irregular', @orgVinhedo),
('Iluminação pública', @orgVinhedo);

-- 8. EXATAMENTE QUATRO DENÚNCIAS: uma por localidade/fiscal.
-- fiscal_id permanece NULL de propósito: o fluxo do Nexus notifica o fiscal
-- responsável pela localidade para que ele assuma a denúncia no sistema.
-- Bairro gravado nas colunas próprias de LOCALIZACAO e LOCALIDADE.

-- CAMPINAS / bairro Centro / fiscal responsável: Mariana
INSERT INTO LOCALIZACAO (tipo, bairro, endereco, cidade, estado)
VALUES ('Via pública', 'Centro', 'Rua demonstrativa', 'Campinas', 'SP');
SET @endCampinas = LAST_INSERT_ID();
INSERT INTO DENUNCIA
(idUsuario, titulo, tipo, descricao, dataOcorrencia, visibilidade, status, prioridade, dataAbertura, idLocalizacao, idLocalidade, fiscal_id, idOrganizacao)
VALUES
(@usuario, 'Descarte irregular de resíduos', 'Descarte irregular de lixo', 'Acúmulo de sacos de lixo e entulho em via pública, situação demonstrativa para apresentação.', CURDATE() - INTERVAL 5 DAY, 'anonimo', 'Pendente', 'Alta', NOW() - INTERVAL 4 DAY, @endCampinas, @locCampinas, NULL, NULL);

-- VALINHOS / bairro Jardim Pinheiros / fiscal responsável: Roberto
INSERT INTO LOCALIZACAO (tipo, bairro, endereco, cidade, estado)
VALUES ('Via pública', 'Jardim Pinheiros', 'Rua demonstrativa', 'Valinhos', 'SP');
SET @endValinhos = LAST_INSERT_ID();
INSERT INTO DENUNCIA
(idUsuario, titulo, tipo, descricao, dataOcorrencia, visibilidade, status, prioridade, dataAbertura, idLocalizacao, idLocalidade, fiscal_id, idOrganizacao)
VALUES
(@usuario, 'Buraco na via pública', 'Buraco na via pública', 'Buraco no pavimento dificultando a circulação de veículos e pedestres.', CURDATE() - INTERVAL 3 DAY, 'anonimo', 'Pendente', 'Alta', NOW() - INTERVAL 2 DAY, @endValinhos, @locValinhos, NULL, NULL);

-- VINHEDO / bairro Capela / fiscal responsável: Camila
INSERT INTO LOCALIZACAO (tipo, bairro, endereco, cidade, estado)
VALUES ('Calçada', 'Capela', 'Avenida demonstrativa', 'Vinhedo', 'SP');
SET @endVinhedo = LAST_INSERT_ID();
INSERT INTO DENUNCIA
(idUsuario, titulo, tipo, descricao, dataOcorrencia, visibilidade, status, prioridade, dataAbertura, idLocalizacao, idLocalidade, fiscal_id, idOrganizacao)
VALUES
(@usuario, 'Calçada danificada', 'Calçada irregular', 'Trecho de calçada danificado, dificultando a passagem de pedestres.', CURDATE() - INTERVAL 2 DAY, 'anonimo', 'Pendente', 'Média', NOW() - INTERVAL 1 DAY, @endVinhedo, @locVinhedo, NULL, NULL);

-- SUMARÉ / bairro Nova Veneza / fiscal responsável: André
INSERT INTO LOCALIZACAO (tipo, bairro, endereco, cidade, estado)
VALUES ('Via pública', 'Nova Veneza', 'Rua demonstrativa', 'Sumaré', 'SP');
SET @endSumare = LAST_INSERT_ID();
INSERT INTO DENUNCIA
(idUsuario, titulo, tipo, descricao, dataOcorrencia, visibilidade, status, prioridade, dataAbertura, idLocalizacao, idLocalidade, fiscal_id, idOrganizacao)
VALUES
(@usuario, 'Falha na iluminação pública', 'Iluminação pública', 'Poste de iluminação pública sem funcionamento em trecho da via.', CURDATE() - INTERVAL 1 DAY, 'anonimo', 'Pendente', 'Média', NOW(), @endSumare, @locSumare, NULL, NULL);

COMMIT;

-- 9. CONFERÊNCIA DOS CADASTROS E DAS QUATRO DENÚNCIAS.
SELECT o.nome AS organizacao, s.nome AS superusuario, s.email AS email_superusuario
FROM ORGANIZACAO o
INNER JOIN SUPERUSUARIO s ON s.idOrganizacao = o.idOrganizacao
WHERE o.idOrganizacao IN (@orgCampinas, @orgVinhedo)
ORDER BY o.nome;

SELECT o.nome AS organizacao, f.nome AS fiscal, f.email, l.bairro, l.cidade, l.estado
FROM FISCAL f
INNER JOIN ORGANIZACAO o ON o.idOrganizacao = f.idOrganizacao
INNER JOIN FISCAL_LOCALIDADE fl ON fl.idFiscal = f.id
INNER JOIN LOCALIDADE l ON l.idLocalidade = fl.idLocalidade
WHERE f.email IN ('mariana@safezone.example', 'roberto@safezone.example', 'camila@safezone.example', 'andre@safezone.example')
ORDER BY o.nome, f.nome;

SELECT d.idDenuncia, d.titulo, d.tipo, d.status, d.prioridade,
       loc.endereco, loc.bairro, loc.cidade, loc.estado, l.bairro AS bairro_localidade,
       f.nome AS fiscal_atribuido
FROM DENUNCIA d
INNER JOIN LOCALIZACAO loc ON loc.idLocalizacao = d.idLocalizacao
LEFT JOIN LOCALIDADE l ON l.idLocalidade = d.idLocalidade
LEFT JOIN FISCAL f ON f.id = d.fiscal_id
WHERE d.idUsuario = @usuario
ORDER BY d.dataAbertura DESC;
