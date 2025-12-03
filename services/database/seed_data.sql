-- ============================================================================
-- SEED DATA - Versão para o Schema Atual
-- ============================================================================
-- Autenticação via Microsoft OAuth apenas
-- ============================================================================

-- ============================================================================
-- ADMINS
-- ============================================================================

INSERT INTO admin (id, nome, email, contacto) VALUES
    ('admin001', 'Administrador Sistema', 'admin@ltplabs.com', '+351 910 000 001'),
    ('admin002', 'João Silva', 'joao.silva@ltplabs.com', '+351 910 000 002'),
    ('admin003', 'Maria Santos', 'maria.santos@ltplabs.com', '+351 910 000 003'),
    ('fmafonso', 'Francisco Afonso', 'pg57873@alunos.uminho.pt', '+351 910 000 004'),
    ('isilva', 'Inês Silva', 'pg55949@alunos.uminho.pt', '+351 910 000 005'),
    ('jmoura', 'João Moura', 'pg60273@alunos.uminho.pt', '+351 910 000 006');

-- ============================================================================
-- DEMOS
-- ============================================================================

INSERT INTO demo (id, nome, descricao, vertical, horizontal, keywords, codigo_projeto, comercial_nome, comercial_contacto, 
                  comercial_foto_url, url, estado, criado_por) VALUES
    ('demo001', 
     'Solução CRM Cloud', 
     'Solução CRM completa com gestão de clientes, pipeline de vendas e reporting',
     'Retalho', 
     'Vendas & Marketing', 
     'crm,vendas,clientes,pipeline', 
     'LTP011',
     'João Silva', 
     '+351 910 000 002',
     'https://avatars.ltplabs.com/joao.jpg',
     'https://www.youtube.com/', 
     'ativa', 
     'admin002'),
     
    ('demo002', 
     'Gestor Inteligente de Inventário',
     'Tracking de inventário em tempo real com previsão de procura baseada em IA',
     'Manufatura', 
     'Supply Chain', 
     'inventario,armazem,stock,previsao', 
     'LTP022',
     'Maria Santos', 
     '+351 910 000 003',
     'https://avatars.ltplabs.com/maria.jpg',
     'https://www.ola.pt/', 
     'ativa', 
     'admin003'),
     
    ('demo003', 
     'Suite Business Intelligence',
     'Plataforma de analytics avançada com dashboards customizáveis',
     'Finanças', 
     'Business Intelligence', 
     'analytics,bi,reporting,dashboards', 
     'LTP033', 
     'João Silva', 
     '+351 910 000 002',
     'https://avatars.ltplabs.com/joao.jpg',
     'https://www.facebook.com/', 
     'ativa', 
     'admin002'),
     
    ('demo004', 
     'E-Commerce Nova Geração',
     'Plataforma moderna de e-commerce com recomendações IA',
     'Retalho', 
     'E-Commerce', 
     'ecommerce,retalho,loja,online', 
     'LTP044',
     'Maria Santos', 
     '+351 910 000 003',
     'https://avatars.ltplabs.com/maria.jpg',
     'https://www.instagram.com/', 
     'ativa', 
     'admin003'),
     
    ('demo005', 
     'Plataforma IoT Monitoring',
     'Solução IoT industrial para monitorização de dispositivos em tempo real',
     'Manufatura', 
     'IoT & Indústria 4.0', 
     'iot,monitorizacao,sensores,industria', 
     'LTP055',
     'João Silva', 
     '+351 910 000 002',
     'https://avatars.ltplabs.com/joao.jpg',
     'https://x.com/?lang=pt', 
     'ativa', 
     'admin002');

-- ============================================================================
-- CLIENTES (diferentes estados para testar)
-- ============================================================================

-- Cliente 1: ATIVO (acesso válido - 25 dias restantes)
INSERT INTO cliente (id, nome, email, data_registo, data_expiracao, criado_por) VALUES
    ('cliente001', 
     'Pedro Oliveira', 
     'pedro.oliveira@empresa-a.com',
     datetime('now', '-5 days'), 
     datetime('now', '+25 days'), 
     'admin002');

-- Cliente 2: EXPIRA EM BREVE (3 dias)
INSERT INTO cliente (id, nome, email, data_expiracao, criado_por) VALUES
    ('cliente002', 
     'Ana Costa', 
     'ana.costa@empresa-b.pt',
     datetime('now', '+3 days'), 
     'admin003');

-- Cliente 3: EXPIRADO (há 5 dias)
INSERT INTO cliente (id, nome, email, data_expiracao, criado_por) VALUES
    ('cliente003', 
     'Rui Ferreira', 
     'rui.ferreira@empresa-c.com',
     datetime('now', '-5 days'), 
     'admin002');

-- Cliente 4: FUTURO (acesso começa em 2 dias)
INSERT INTO cliente (id, nome, email, data_expiracao, criado_por) VALUES
    ('cliente004', 
     'Sofia Almeida', 
     'sofia.almeida@empresa-d.pt',
     datetime('now', '+32 days'), 
     'admin003');

-- Cliente 5: Outro cliente ativo
INSERT INTO cliente (id, nome, email, data_expiracao, criado_por) VALUES
    ('cliente005', 
     'Carlos Mendes', 
     'carlos.mendes@empresa-e.com',
     datetime('now', '+15 days'), 
     'admin002');

INSERT INTO cliente (id, nome, email, data_expiracao, criado_por) VALUES
    ('cliente007', 
     'Daniel Henrique Cracel Rodrigues', 
     'pg57871@alunos.uminho.pt',
     datetime('now', '+2 days'), 
     'isilva');

INSERT INTO cliente (id, nome, email, data_expiracao, criado_por) VALUES
    ('cliente008', 
     'Francisco Afonso', 
     'francisco-manuel-afonso@hotmail.com',
     datetime('now', '-2 days'), 
     'isilva');

-- ============================================================================
-- LOGS DE ATIVIDADE
-- ============================================================================

-- Atividade do Cliente 1
INSERT INTO log (cliente_id, demo_id, tipo, mensagem, timestamp) VALUES
    ('cliente001', NULL, 'login', 'Login bem-sucedido', 
     datetime('now', '-2 hours')),
    ('cliente001', 'demo001', 'demo_aberta', 'Abriu demo CRM', 
     datetime('now', '-2 hours', '+5 minutes')),
    ('cliente001', 'demo001', 'demo_fechada', 'Fechou demo CRM após 20 minutos', 
     datetime('now', '-2 hours', '+25 minutes')),
    ('cliente001', 'demo003', 'demo_aberta', 'Abriu demo Analytics', 
     datetime('now', '-2 hours', '+30 minutes')),
    ('cliente001', 'demo003', 'demo_fechada', 'Fechou demo Analytics', 
     datetime('now', '-2 hours', '+45 minutes')),
    ('cliente001', NULL, 'logout', 'Logout', 
     datetime('now', '-2 hours', '+50 minutes'));

-- Atividade do Cliente 2
INSERT INTO log (cliente_id, demo_id, tipo, mensagem, timestamp) VALUES
    ('cliente002', NULL, 'login', 'Login bem-sucedido', 
     datetime('now', '-1 day')),
    ('cliente002', 'demo002', 'demo_aberta', 'Abriu demo Inventário', 
     datetime('now', '-1 day', '+5 minutes')),
    ('cliente002', 'demo002', 'demo_fechada', 'Passou 45 min na demo', 
     datetime('now', '-1 day', '+50 minutes')),
    ('cliente002', 'demo001', 'demo_aberta', 'Abriu demo CRM', 
     datetime('now', '-1 day', '+55 minutes')),
    ('cliente002', 'demo004', 'demo_aberta', 'Abriu demo E-commerce', 
     datetime('now', '-1 day', '+120 minutes'));

-- Cliente 3 tentou aceder mas acesso expirado
INSERT INTO log (cliente_id, demo_id, tipo, mensagem, timestamp) VALUES
    ('cliente003', NULL, 'aviso', 'Tentativa de login com acesso expirado', 
     datetime('now', '-1 hour'));

-- Logs de gestão de acessos
INSERT INTO log (cliente_id, demo_id, tipo, mensagem, timestamp) VALUES
    ('cliente001', NULL, 'acesso_concedido', 'Acesso concedido por 30 dias', 
     datetime('now', '-5 days')),
    ('cliente005', NULL, 'acesso_revogado', 'Acesso foi revogado pelo admin', 
     datetime('now', '-15 days'));

-- Logs do sistema (sem cliente)
INSERT INTO log (cliente_id, demo_id, tipo, mensagem, timestamp) VALUES
    (NULL, 'demo001', 'aviso', 'Demo CRM - manutenção programada', 
     datetime('now', '-3 days')),
    (NULL, NULL, 'erro', 'Falha temporária no sistema de autenticação', 
     datetime('now', '-5 days'));

-- ============================================================================
-- PEDIDOS DE ACESSO
-- ============================================================================

-- Pedido de renovação do cliente 3 (expirado) - PENDENTE
INSERT INTO pedido (id, cliente_id, tipo_pedido, estado) VALUES
    ('pedido001', 'cliente003', 'renovação', 'pendente');

-- Pedido de renovação do cliente 2 (vai expirar) - PENDENTE
INSERT INTO pedido (id, cliente_id, tipo_pedido, estado) VALUES
    ('pedido002', 'cliente002', 'renovação', 'pendente');

-- Pedido aprovado anteriormente (já resolvido)
INSERT INTO pedido (id, cliente_id, tipo_pedido, estado, gerido_por) VALUES
    ('pedido003', 'cliente001', 'renovação', 'aprovado', 'admin002');

-- Pedido rejeitado
INSERT INTO pedido (id, cliente_id, tipo_pedido, estado, gerido_por) VALUES
    ('pedido004', 'cliente005', 'renovação', 'rejeitado', 'admin003');


-- ============================================================================
-- SESSÕES DE DEMOS (Métricas de Tempo)
-- ============================================================================

INSERT OR IGNORE INTO demo_sessions (session_id, cliente_id, demo_id, timestamp_inicio, timestamp_fim, duracao_segundos) VALUES
('sess-001', 'cliente001', 'demo001', '2025-11-20 10:30:00', '2025-11-20 11:15:00', 2700),
('sess-002', 'cliente001', 'demo001', '2025-11-21 14:20:00', '2025-11-21 14:52:00', 1920),
('sess-003', 'cliente001', 'demo003', '2025-11-22 09:15:00', '2025-11-22 09:45:00', 1800),
('sess-004', 'cliente002', 'demo001', '2025-11-23 11:00:00', '2025-11-23 11:35:00', 2100),
('sess-005', 'cliente002', 'demo002', '2025-11-24 15:30:00', '2025-11-24 16:25:00', 3300),
('sess-006', 'cliente002', 'demo003', '2025-11-25 10:00:00', '2025-11-25 10:28:00', 1680),
('sess-007', 'cliente003', 'demo001', '2025-11-26 13:45:00', '2025-11-26 13:57:00', 720),
('sess-008', 'cliente005', 'demo005', '2025-11-27 08:30:00', '2025-11-27 09:15:00', 2700);

-- Verificação
SELECT 'Sessões de demos inseridas:' as status, COUNT(*) as total FROM demo_sessions;



-- ============================================================================
-- QUERIES DE VERIFICAÇÃO
-- ============================================================================

-- Contar registos em cada tabela
SELECT 'Admins' as tabela, COUNT(*) as total FROM admin
UNION ALL SELECT 'Clientes', COUNT(*) FROM cliente
UNION ALL SELECT 'Demos', COUNT(*) FROM demo
UNION ALL SELECT 'Logs', COUNT(*) FROM log
UNION ALL SELECT 'Pedidos', COUNT(*) FROM pedido;

-- Ver todos os clientes com datas
SELECT 
    nome, 
    email, 
    data_registo,
    data_expiracao,
    CASE 
        WHEN datetime(data_expiracao) < datetime('now') THEN 'EXPIRADO'
        WHEN datetime(data_registo) > datetime('now') THEN 'FUTURO'
        ELSE 'ATIVO'
    END as status
FROM cliente
ORDER BY status, nome;

-- Ver pedidos pendentes
SELECT 
    c.nome as cliente_nome,
    c.email as cliente_email,
    p.tipo_pedido,
    p.estado,
    p.criado_em
FROM pedido p
JOIN cliente c ON p.cliente_id = c.id
WHERE p.estado = 'pendente';

-- Ver demos ativas
SELECT 
    nome,
    vertical,
    horizontal,
    comercial_nome,
    url,
    estado
FROM demo
WHERE estado = 'ativa'
ORDER BY vertical, nome;

-- Estatísticas de logs por cliente
SELECT 
    c.nome,
    c.email,
    COUNT(l.id) as total_eventos,
    COUNT(CASE WHEN l.tipo = 'login' THEN 1 END) as logins,
    COUNT(CASE WHEN l.tipo = 'demo_aberta' THEN 1 END) as demos_abertas,
    MAX(l.timestamp) as ultima_atividade
FROM cliente c
LEFT JOIN log l ON c.id = l.cliente_id
GROUP BY c.id, c.nome, c.email
HAVING total_eventos > 0
ORDER BY total_eventos DESC;

-- ============================================================================
-- FIM DO SEED DATA
-- ============================================================================