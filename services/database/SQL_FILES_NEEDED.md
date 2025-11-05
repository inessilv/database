# FICHEIROS SQL NECESSÁRIOS

Os seguintes ficheiros precisam de ser copiados do projeto original `inessilv/database/database/` para esta pasta:

## 1. schema.sql
Contém:
- Tabelas: admin, cliente, demo, pedido, log, docker_images
- Indexes para performance
- Triggers para atualizado_em
- 4 Views: v_active_clients, v_active_demos, v_pending_requests, v_client_stats
- Foreign keys

## 2. seed_data.sql
Contém dados de teste:
- 3 admins
- 5 clientes (em diferentes estados: ativo, expirado, futuro)
- 5 demos ativas
- 5 imagens Docker
- Logs de atividade
- Pedidos de exemplo

## 3. init-db.sh
Script bash que:
- Verifica se DB já existe
- Cria DB se não existir
- Aplica schema.sql
- Carrega seed_data.sql (se LOAD_SEED_DATA=true)
- Configura WAL mode
- Inicia health check server na porta 8080

## 4. healthcheck.sh
Script bash que:
- Verifica se ficheiro DB existe
- Testa query simples (SELECT 1)
- Retorna exit code 0 se OK, 1 se erro

---

## Como copiar (na raiz do projeto):

```bash
cp inessilv/database/database/schema.sql services/database/
cp inessilv/database/database/seed_data.sql services/database/
cp inessilv/database/database/init-db.sh services/database/
cp inessilv/database/database/healthcheck.sh services/database/
```

---

## Alternativa: Criar manualmente

Se não existirem no projeto original, podes usar os ficheiros do projeto knowledge que já foram fornecidos anteriormente, ou criar versões simplificadas.

Ver conteúdo completo em:
- `/mnt/project/database/schema.sql` (se existir)
- Ou usar o schema.sql que foi mostrado no conhecimento do projeto
