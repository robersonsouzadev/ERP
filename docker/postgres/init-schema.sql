-- ==============================================================================
-- COLISEU ERP - BANCO DE DADOS CONCENTRADOR EM NUVEM (POSTGRESQL 16)
-- Esquema Completo com Suporte a Sincronização Local-First, Multi-Tenant e Auditoria
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configurações de Fuso Horário e Codificação
SET timezone = 'America/Campo_Grande';

-- ==============================================================================
-- 1. ESTRUTURA ORGANIZACIONAL (EMPRESAS, FILIAIS E USUÁRIOS)
-- ==============================================================================

-- Tabela: Empresas (Tenants)
CREATE TABLE IF NOT EXISTS empresas (
    id VARCHAR(64) PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL DEFAULT 'server',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    x_sync_status VARCHAR(20) NOT NULL DEFAULT 'synced',
    x_version BIGINT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    cnpj VARCHAR(20) UNIQUE NOT NULL,
    inscricao_estadual VARCHAR(30),
    regime_tributario VARCHAR(30) DEFAULT 'SIMPLES_NACIONAL',
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON empresas(cnpj);
CREATE INDEX IF NOT EXISTS idx_empresas_sync ON empresas(x_sync_status, updated_at);

-- Tabela: Filiais
CREATE TABLE IF NOT EXISTS filiais (
    id VARCHAR(64) PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL DEFAULT 'server',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    x_sync_status VARCHAR(20) NOT NULL DEFAULT 'synced',
    x_version BIGINT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    empresa_id VARCHAR(64) NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(20) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20) NOT NULL,
    inscricao_estadual VARCHAR(30),
    endereco VARCHAR(255),
    numero VARCHAR(20),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf VARCHAR(2),
    cep VARCHAR(10),
    telefone VARCHAR(30),
    email VARCHAR(150),
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_filiais_empresa ON filiais(empresa_id);
CREATE INDEX IF NOT EXISTS idx_filiais_sync ON filiais(x_sync_status, updated_at);

-- Tabela: Grupos de Acesso
CREATE TABLE IF NOT EXISTS grupos_acesso (
    id VARCHAR(64) PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL DEFAULT 'server',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    x_sync_status VARCHAR(20) NOT NULL DEFAULT 'synced',
    x_version BIGINT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    empresa_id VARCHAR(64) NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    permissoes_json JSONB DEFAULT '{}'::jsonb,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Tabela: Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(64) PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL DEFAULT 'server',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    x_sync_status VARCHAR(20) NOT NULL DEFAULT 'synced',
    x_version BIGINT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    empresa_id VARCHAR(64) NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    filial_padrao_id VARCHAR(64) REFERENCES filiais(id),
    grupo_id VARCHAR(64) REFERENCES grupos_acesso(id),
    nome VARCHAR(150) NOT NULL,
    login VARCHAR(50) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    email VARCHAR(150),
    cargo VARCHAR(100),
    is_vendedor BOOLEAN DEFAULT FALSE,
    percentual_comissao NUMERIC(5,2) DEFAULT 0.00,
    alçada_desconto_max NUMERIC(5,2) DEFAULT 10.00,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_login ON usuarios(login);

-- ==============================================================================
-- 2. CADASTRO DE PESSOAS (CLIENTES, FORNECEDORES, TRANSPORTADORAS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS pessoas (
    id VARCHAR(64) PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL DEFAULT 'server',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    x_sync_status VARCHAR(20) NOT NULL DEFAULT 'synced',
    x_version BIGINT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    empresa_id VARCHAR(64) NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    tipo_cadastro VARCHAR(30) NOT NULL DEFAULT 'CLIENTE',
    tipo_pessoa VARCHAR(10) NOT NULL DEFAULT 'FISICA', -- 'FISICA', 'JURIDICA'
    nome_razaosocial VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    cpf_cnpj VARCHAR(20),
    codigo_interno VARCHAR(50),

    -- Documentos
    rg_ie VARCHAR(30),
    inscricao_municipal VARCHAR(30),
    suframa VARCHAR(30),

    -- Endereço Principal
    cep VARCHAR(10),
    logradouro VARCHAR(255),
    numero VARCHAR(30),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    municipio VARCHAR(100),
    uf VARCHAR(2),
    codigo_ibge VARCHAR(10),
    pais VARCHAR(50) DEFAULT 'BRASIL',

    -- Contato
    email VARCHAR(150),
    email_financeiro VARCHAR(150),
    telefone VARCHAR(30),
    celular VARCHAR(30),
    whatsapp VARCHAR(30),

    -- Financeiro & Crédito
    is_cliente BOOLEAN NOT NULL DEFAULT TRUE,
    is_fornecedor BOOLEAN NOT NULL DEFAULT FALSE,
    is_transportadora BOOLEAN NOT NULL DEFAULT FALSE,
    limite_credito NUMERIC(15,2) DEFAULT 5000.00,
    score_credito INT DEFAULT 700,
    observacoes TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_pessoas_empresa ON pessoas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pessoas_cpf_cnpj ON pessoas(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_pessoas_nome ON pessoas(nome_razaosocial);

-- ==============================================================================
-- 3. PRODUTOS, GRADES E ESTOQUE
-- ==============================================================================

-- Tabela: Categorias & Marcas
CREATE TABLE IF NOT EXISTS categorias (
    id VARCHAR(64) PRIMARY KEY,
    empresa_id VARCHAR(64) NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS marcas (
    id VARCHAR(64) PRIMARY KEY,
    empresa_id VARCHAR(64) NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE
);

-- Tabela: Produtos
CREATE TABLE IF NOT EXISTS produtos (
    id VARCHAR(64) PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL DEFAULT 'server',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    x_sync_status VARCHAR(20) NOT NULL DEFAULT 'synced',
    x_version BIGINT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    empresa_id VARCHAR(64) NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    categoria_id VARCHAR(64) REFERENCES categorias(id),
    marca_id VARCHAR(64) REFERENCES marcas(id),
    codigo_sku VARCHAR(50) NOT NULL,
    codigo_barras VARCHAR(50),
    descricao VARCHAR(255) NOT NULL,
    unidade_medida VARCHAR(10) NOT NULL DEFAULT 'UN',
    preco_custo NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    preco_venda NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    preco_minimo NUMERIC(15,4) DEFAULT 0.0000,
    markup_sugerido NUMERIC(8,2) DEFAULT 50.00,
    
    -- Fiscal
    ncm VARCHAR(10),
    cest VARCHAR(10),
    cfop_padrao VARCHAR(10) DEFAULT '5102',
    csosn_cst_padrao VARCHAR(10) DEFAULT '102',
    aliquota_icms NUMERIC(5,2) DEFAULT 0.00,
    aliquota_pis NUMERIC(5,2) DEFAULT 0.00,
    aliquota_cofins NUMERIC(5,2) DEFAULT 0.00,
    
    estoque_minimo NUMERIC(15,4) DEFAULT 0.0000,
    controla_lote BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_produtos_empresa ON produtos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_produtos_sku ON produtos(codigo_sku);
CREATE INDEX IF NOT EXISTS idx_produtos_barras ON produtos(codigo_barras);

-- Tabela: Depósitos
CREATE TABLE IF NOT EXISTS depositos (
    id VARCHAR(64) PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL DEFAULT 'server',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    x_sync_status VARCHAR(20) NOT NULL DEFAULT 'synced',
    x_version BIGINT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    filial_id VARCHAR(64) NOT NULL REFERENCES filiais(id) ON DELETE CASCADE,
    codigo VARCHAR(20) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    padrao BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Tabela: Estoque Saldos
CREATE TABLE IF NOT EXISTS estoque_saldos (
    id VARCHAR(64) PRIMARY KEY,
    deposito_id VARCHAR(64) NOT NULL REFERENCES depositos(id) ON DELETE CASCADE,
    produto_id VARCHAR(64) NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    quantidade_atual NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    quantidade_reservada NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(deposito_id, produto_id)
);
CREATE INDEX IF NOT EXISTS idx_estoque_saldos_produto ON estoque_saldos(produto_id);

-- Tabela: Estoque Movimentações
CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
    id VARCHAR(64) PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL DEFAULT 'server',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deposito_id VARCHAR(64) NOT NULL REFERENCES depositos(id) ON DELETE CASCADE,
    produto_id VARCHAR(64) NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL, -- 'ENTRADA', 'SAIDA', 'AJUSTE', 'VENDA', 'DEVOLUCAO'
    quantidade NUMERIC(15,4) NOT NULL,
    saldo_anterior NUMERIC(15,4) NOT NULL,
    saldo_posterior NUMERIC(15,4) NOT NULL,
    origem_documento VARCHAR(50),
    origem_id VARCHAR(64),
    observacao TEXT
);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_prod ON estoque_movimentacoes(produto_id);

-- ==============================================================================
-- 4. VENDAS, PEDIDOS E PDV
-- ==============================================================================

CREATE TABLE IF NOT EXISTS vendas (
    id VARCHAR(64) PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL DEFAULT 'server',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    x_sync_status VARCHAR(20) NOT NULL DEFAULT 'synced',
    x_version BIGINT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    filial_id VARCHAR(64) NOT NULL REFERENCES filiais(id) ON DELETE CASCADE,
    numero_pedido VARCHAR(30) NOT NULL,
    cliente_id VARCHAR(64) REFERENCES pessoas(id),
    vendedor_id VARCHAR(64) REFERENCES usuarios(id),
    status VARCHAR(30) NOT NULL DEFAULT 'FATURADO', -- 'ORCAMENTO', 'APROVADO', 'FATURADO', 'CANCELADO'
    
    total_produtos NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_desconto NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_frete NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_liquido NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    
    forma_pagamento_principal VARCHAR(50),
    observacoes TEXT
);
CREATE INDEX IF NOT EXISTS idx_vendas_filial ON vendas(filial_id);
CREATE INDEX IF NOT EXISTS idx_vendas_numero ON vendas(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente ON vendas(cliente_id);

CREATE TABLE IF NOT EXISTS vendas_itens (
    id VARCHAR(64) PRIMARY KEY,
    venda_id VARCHAR(64) NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
    produto_id VARCHAR(64) NOT NULL REFERENCES produtos(id),
    item_numero INT NOT NULL,
    quantidade NUMERIC(15,4) NOT NULL,
    valor_unitario NUMERIC(15,4) NOT NULL,
    valor_desconto NUMERIC(15,2) DEFAULT 0.00,
    valor_total NUMERIC(15,2) NOT NULL,
    cfop VARCHAR(10),
    csosn_cst VARCHAR(10)
);
CREATE INDEX IF NOT EXISTS idx_vendas_itens_venda ON vendas_itens(venda_id);

CREATE TABLE IF NOT EXISTS vendas_pagamentos (
    id VARCHAR(64) PRIMARY KEY,
    venda_id VARCHAR(64) NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
    meio_pagamento VARCHAR(30) NOT NULL, -- 'DINHEIRO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'BOLETO'
    valor NUMERIC(15,2) NOT NULL,
    parcelas INT DEFAULT 1,
    nsu_autorizacao VARCHAR(50),
    troco NUMERIC(15,2) DEFAULT 0.00
);
CREATE INDEX IF NOT EXISTS idx_vendas_pag_venda ON vendas_pagamentos(venda_id);

-- ==============================================================================
-- 5. DOCUMENTOS FISCAIS (NF-e, NFC-e, MDF-e)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS documentos_fiscais (
    id VARCHAR(64) PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL DEFAULT 'server',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    x_sync_status VARCHAR(20) NOT NULL DEFAULT 'synced',
    x_version BIGINT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    filial_id VARCHAR(64) NOT NULL REFERENCES filiais(id) ON DELETE CASCADE,
    venda_id VARCHAR(64) REFERENCES vendas(id),
    modelo INT NOT NULL DEFAULT 55, -- 55 (NF-e), 65 (NFC-e), 58 (MDF-e)
    serie INT NOT NULL DEFAULT 1,
    numero INT NOT NULL,
    chave_acesso VARCHAR(50) UNIQUE,
    data_emissao TIMESTAMPTZ NOT NULL,
    
    ambiente INT NOT NULL DEFAULT 2, -- 1 = Producao, 2 = Homologacao
    status_sefaz INT NOT NULL DEFAULT 100, -- 100 = Autorizada, 135 = Cancelada, etc.
    motivo_sefaz VARCHAR(255),
    protocolo_autorizacao VARCHAR(50),
    data_protocolo TIMESTAMPTZ,
    digest_value VARCHAR(100),
    
    xml_conteudo TEXT,
    danfe_pdf_url TEXT
);
CREATE INDEX IF NOT EXISTS idx_doc_fiscais_filial ON documentos_fiscais(filial_id);
CREATE INDEX IF NOT EXISTS idx_doc_fiscais_chave ON documentos_fiscais(chave_acesso);
CREATE INDEX IF NOT EXISTS idx_doc_fiscais_numero ON documentos_fiscais(modelo, serie, numero);

CREATE TABLE IF NOT EXISTS documentos_fiscais_eventos (
    id VARCHAR(64) PRIMARY KEY,
    documento_fiscal_id VARCHAR(64) NOT NULL REFERENCES documentos_fiscais(id) ON DELETE CASCADE,
    tipo_evento VARCHAR(30) NOT NULL, -- 'CANCELAMENTO', 'CCE', 'INUTILIZACAO'
    codigo_evento VARCHAR(20) NOT NULL, -- '110111', '110110'
    sequencia INT NOT NULL DEFAULT 1,
    protocolo VARCHAR(50),
    justificativa TEXT,
    xml_evento TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_doc_eventos_doc ON documentos_fiscais_eventos(documento_fiscal_id);

-- ==============================================================================
-- 6. FINANCEIRO (CONTAS A RECEBER/PAGAR, CAIXAS, CONTAS BANCÁRIAS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS caixas (
    id VARCHAR(64) PRIMARY KEY,
    filial_id VARCHAR(64) NOT NULL REFERENCES filiais(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS contas_bancarias (
    id VARCHAR(64) PRIMARY KEY,
    empresa_id VARCHAR(64) NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    banco VARCHAR(50) NOT NULL,
    agencia VARCHAR(20) NOT NULL,
    conta VARCHAR(30) NOT NULL,
    tipo_conta VARCHAR(30) DEFAULT 'CORRENTE',
    saldo_atual NUMERIC(15,2) DEFAULT 0.00,
    chave_pix VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS plano_contas (
    id VARCHAR(64) PRIMARY KEY,
    empresa_id VARCHAR(64) NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    codigo VARCHAR(30) NOT NULL,
    descricao VARCHAR(150) NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- 'RECEITA', 'DESPESA', 'ATIVO', 'PASSIVO'
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS titulos_financeiros (
    id VARCHAR(64) PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL DEFAULT 'server',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    x_sync_status VARCHAR(20) NOT NULL DEFAULT 'synced',
    x_version BIGINT NOT NULL DEFAULT 1,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    filial_id VARCHAR(64) NOT NULL REFERENCES filiais(id) ON DELETE CASCADE,
    pessoa_id VARCHAR(64) NOT NULL REFERENCES pessoas(id),
    venda_id VARCHAR(64) REFERENCES vendas(id),
    plano_conta_id VARCHAR(64) REFERENCES plano_contas(id),
    
    tipo VARCHAR(20) NOT NULL, -- 'RECEBER', 'PAGAR'
    numero_documento VARCHAR(50) NOT NULL,
    parcela VARCHAR(10) NOT NULL DEFAULT '1/1',
    data_emissao DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    data_liquidacao DATE,
    
    valor_nominal NUMERIC(15,2) NOT NULL,
    valor_desconto NUMERIC(15,2) DEFAULT 0.00,
    valor_juros NUMERIC(15,2) DEFAULT 0.00,
    valor_multa NUMERIC(15,2) DEFAULT 0.00,
    valor_saldo NUMERIC(15,2) NOT NULL,
    
    status VARCHAR(20) NOT NULL DEFAULT 'EM_ABERTO', -- 'EM_ABERTO', 'QUITADO', 'CANCELADO', 'RENEGOCIADO'
    especie_cobranca VARCHAR(30) DEFAULT 'BOLETO'
);
CREATE INDEX IF NOT EXISTS idx_titulos_filial ON titulos_financeiros(filial_id);
CREATE INDEX IF NOT EXISTS idx_titulos_pessoa ON titulos_financeiros(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_titulos_status ON titulos_financeiros(status);
CREATE INDEX IF NOT EXISTS idx_titulos_vencimento ON titulos_financeiros(data_vencimento);

-- ==============================================================================
-- 7. AUDITORIA E LOGS DO SISTEMA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_id VARCHAR(64) REFERENCES usuarios(id),
    empresa_id VARCHAR(64) REFERENCES empresas(id),
    acao VARCHAR(50) NOT NULL,
    tabela VARCHAR(50) NOT NULL,
    registro_id VARCHAR(64),
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_address VARCHAR(50)
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- ==============================================================================
-- 8. CARGA INICIAL DE DADOS PADRÃO (SEED DATA)
-- ==============================================================================

INSERT INTO empresas (id, razao_social, nome_fantasia, cnpj, inscricao_estadual, regime_tributario)
VALUES ('emp_matriz_01', 'LIVRARIA DAMASCO LTDA', 'LIVRARIA DAMASCO', '68148349000109', '283261864', 'SIMPLES_NACIONAL')
ON CONFLICT (cnpj) DO NOTHING;

INSERT INTO filiais (id, empresa_id, codigo, nome, cnpj, inscricao_estadual, endereco, numero, bairro, cidade, uf, cep)
VALUES ('fil_matriz_01', 'emp_matriz_01', '001', 'MATRIZ DOURADOS', '68148349000109', '283261864', 'AV. MARCELINO PIRES', '1250', 'CENTRO', 'DOURADOS', 'MS', '79800000')
ON CONFLICT (id) DO NOTHING;

INSERT INTO grupos_acesso (id, empresa_id, nome, descricao)
VALUES ('grp_admin', 'emp_matriz_01', 'Administrador', 'Acesso total e irrestrito a todos os módulos do ERP')
ON CONFLICT (id) DO NOTHING;

INSERT INTO usuarios (id, empresa_id, filial_padrao_id, grupo_id, nome, login, senha_hash, cargo)
VALUES ('usr_admin', 'emp_matriz_01', 'fil_matriz_01', 'grp_admin', 'Administrador do Sistema', 'admin', crypt('admin123', gen_salt('bf')), 'Administrador')
ON CONFLICT (id) DO NOTHING;

INSERT INTO caixas (id, filial_id, nome)
VALUES ('cx_01', 'fil_matriz_01', 'CAIXA PRINCIPAL 01'),
       ('cx_02', 'fil_matriz_01', 'CAIXA PDV 02')
ON CONFLICT (id) DO NOTHING;

INSERT INTO depositos (id, filial_id, codigo, nome, padrao)
VALUES ('dep_01', 'fil_matriz_01', '001', 'DEPÓSITO CENTRAL', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Concluído