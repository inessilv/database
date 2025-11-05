FROM python:3.11-slim

# Criar diretórios
WORKDIR /app

# Copiar requirements e instalar dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY app/ /app/app/

# Criar user não-root
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

# Expor porta da API
EXPOSE 8000

# Variáveis de ambiente (podem ser sobrescritas pelo Kubernetes)
ENV CATALOG_PORT=8000
ENV DATABASE_URL=http://database-internal:8001
ENV AUTHENTICATION_URL=http://authentication:8080
ENV PYTHONUNBUFFERED=1

# Comando: Iniciar FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
