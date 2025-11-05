FROM python:3.11-slim

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Criar diretórios
WORKDIR /app
RUN mkdir -p /data /backups /scripts

# Copiar requirements e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY app/ /app/app/

# Copiar scripts e schema SQL
COPY schema.sql /scripts/schema.sql
COPY seed_data.sql /scripts/seed_data.sql
COPY init-db.sh /scripts/init-db.sh
COPY healthcheck.sh /scripts/healthcheck.sh

# Tornar scripts executáveis
RUN chmod +x /scripts/*.sh

# Criar user não-root
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app /data /backups /scripts

USER appuser

# Expor porta da API
EXPOSE 8001

# Variáveis de ambiente (podem ser sobrescritas pelo Kubernetes)
ENV DB_PATH=/data/ltplabs.db
ENV DATABASE_PORT=8001
ENV LOAD_SEED_DATA=true
ENV PYTHONUNBUFFERED=1

# Comando: Inicializar DB em background + Iniciar FastAPI
CMD ["/bin/sh", "-c", "/scripts/init-db.sh & uvicorn app.main:app --host 0.0.0.0 --port ${DATABASE_PORT}"]
