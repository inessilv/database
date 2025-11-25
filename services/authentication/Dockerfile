FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar Poetry
RUN pip install --no-cache-dir poetry

# Copiar ficheiros de configuração
COPY pyproject.toml poetry.lock* ./

# Configurar Poetry (não criar venv dentro do container)
RUN poetry config virtualenvs.create false

# Instalar dependências
RUN poetry install --no-interaction --no-ansi --no-root

# Copiar código da aplicação
COPY ./app ./app

# Expor porta
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

ENV DATABASE_URL=http://database-internal:8001

# Comando para executar
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--reload"]