
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ============================================================================
-- ADMINISTRADORES
-- ============================================================================

CREATE TABLE admin (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    contacto VARCHAR(25)
);

CREATE INDEX idx_admin_email ON admin(email);

-- ============================================================================
-- CLIENTES (externos com acesso temporário)
-- ============================================================================

CREATE TABLE cliente (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    data_registo TEXT NOT NULL,
    data_expiracao TEXT NOT NULL,
    criado_por TEXT NOT NULL,
    criado_em TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (criado_por) REFERENCES admin(id)
);

CREATE INDEX idx_client_email ON cliente(email);
CREATE INDEX idx_client_access_dates ON cliente(data_registo, data_expiracao);


-- ============================================================================
-- DEMOS
-- ============================================================================

CREATE TABLE demo (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    estado TEXT DEFAULT 'ativa' CHECK(estado IN ('ativa', 'inativa', 'manutenção')),
    url TEXT,
    nome VARCHAR(100) NOT NULL,
    descrição TEXT,
    vertical VARCHAR(50),     -- Ex: Retail, Manufacturing, Finance
    horizontal VARCHAR(50),   -- Ex: Supply Chain, CRM, Analytics
    keywords TEXT,     -- Comma-separated para pesquisa simples
    codigo_projeto CHAR(6) UNIQUE,
    imagem_docker TEXT NOT NULL,  -- Ex: 'ltplabs/crm-demo:v1.2.0'
    comercial_nome VARCHAR(100),
    comercial_contacto VARCHAR(20),
    comercial_foto_url VARCHAR(255),
    criado_por TEXT NOT NULL,
    criado_em TEXT DEFAULT (datetime('now')),
    atualizado_em TEXT DEFAULT (datetime('now')),
    
    FOREIGN KEY (criado_por) REFERENCES admin(id)
);

CREATE INDEX idx_demos_status ON demo(estado);
CREATE INDEX idx_demos_vertical ON demo(vertical);
CREATE INDEX idx_demos_project_code ON demo(codigo_projeto);

-- ============================================================================
-- PEDIDOS DE ACESSO (renovação/revogação)
-- ============================================================================

CREATE TABLE pedido (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cliente_id TEXT NOT NULL,
    estado TEXT DEFAULT 'pendente' CHECK(estado IN ('pendente', 'aprovado', 'rejeitado')),
    tipo_pedido TEXT NOT NULL CHECK(tipo_pedido IN ('renovação', 'revogação')),
    criado_em TEXT DEFAULT (datetime('now')),
    gerido_por TEXT,  -- admin que resolveu

    
    FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE CASCADE,
    FOREIGN KEY (gerido_por) REFERENCES admin(id)
);

CREATE INDEX idx_request_client ON pedido(cliente_id);
CREATE INDEX idx_request_status ON pedido(estado);

-- ============================================================================
-- LOG 
-- ============================================================================

CREATE TABLE log (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    cliente_id TEXT,  -- pode ser NULL para eventos de admin
    demo_id TEXT,    -- pode ser NULL para eventos gerais
    tipo TEXT NOT NULL CHECK(tipo IN (
        'login', 'logout',              -- autenticação
        'demo_aberta', 'demo_fechada',  -- uso de demos
        'acesso_concedido', 'acesso_revogado',  -- gestão de acessos
        'erro', 'aviso'                 -- problemas
    )),
    mensagem TEXT,
    timestamp TEXT DEFAULT (datetime('now')),
    
    FOREIGN KEY (cliente_id) REFERENCES cliente(id) ON DELETE SET NULL,
    FOREIGN KEY (demo_id) REFERENCES demo(id) ON DELETE SET NULL
);

CREATE INDEX idx_logs_client ON log(cliente_id);
CREATE INDEX idx_logs_demo ON log(demo_id);
CREATE INDEX idx_logs_timestamp ON log(timestamp);
CREATE INDEX idx_logs_event_type ON log(tipo);

-- ============================================================================
-- DOCKER IMAGES TABLE
-- ============================================================================
CREATE TABLE docker_images (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    nome_imagem TEXT UNIQUE NOT NULL,
    versao_imagem TEXT NOT NULL DEFAULT 'latest',
    url TEXT,
    descrição TEXT,
    criado_em TEXT DEFAULT (datetime('now')),
    atualizado_em TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_docker_images_name ON docker_images(nome_imagem);
CREATE INDEX idx_docker_images_version ON docker_images(versao_imagem);

-- ============================================================================
-- TRIGGERS para updated_at
-- ============================================================================

CREATE TRIGGER update_demos_timestamp 
AFTER UPDATE ON demo
BEGIN
    UPDATE demo SET atualizado_em = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER update_docker_images_timestamp 
AFTER UPDATE ON docker_images
BEGIN
    UPDATE docker_images SET atualizado_em = datetime('now') WHERE id = NEW.id;
END;

-- ============================================================================
-- VIEWS úteis
-- ============================================================================

-- Clientes ativos com status de acesso
CREATE VIEW v_active_clients AS
SELECT 
    c.*,
    a.nome as created_by_name,
    CASE 
        WHEN datetime(c.data_expiracao) < datetime('now') THEN 'expirado'
        WHEN datetime(c.data_registo) > datetime('now') THEN 'pendente'
        ELSE 'ativo'
    END as access_status
FROM cliente c
LEFT JOIN admin a ON c.criado_por = a.id;

-- Demos ativas com info do criador
CREATE VIEW v_active_demos AS
SELECT 
    d.*,
    a.nome as criado_por_nome
FROM demo d
LEFT JOIN admin a ON d.criado_por = a.id
WHERE d.estado = 'ativa';  -- ✅ CORRIGIDO: era d.status = 'active'

-- Pedidos pendentes
CREATE VIEW v_pending_requests AS
SELECT 
    ar.*,
    c.nome as nome,
    c.email as email,
    c.data_expiracao as data_expiracao_atual
FROM pedido ar
INNER JOIN cliente c ON ar.cliente_id = c.id
WHERE ar.estado = 'pendente'
ORDER BY ar.criado_em DESC;

-- Estatísticas de uso por cliente
CREATE VIEW v_client_stats AS
SELECT 
    c.id,
    c.nome,
    c.email,
    COUNT(DISTINCT CASE WHEN l.tipo = 'demo_aberta' THEN l.demo_id END) as demos_opened,
    COUNT(CASE WHEN l.tipo = 'demo_aberta' THEN 1 END) as total_opens,
    COUNT(CASE WHEN l.tipo = 'login' THEN 1 END) as total_logins,  -- ✅ CORRIGIDO: era 'acesso'
    MAX(l.timestamp) as ultima_atividade
FROM cliente c
LEFT JOIN log l ON c.id = l.cliente_id
GROUP BY c.id, c.nome, c.email;

-- ============================================================================
-- END
-- ============================================================================