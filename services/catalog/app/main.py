"""
Main Application - Catalog Service
FastAPI application com todos os endpoints
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx

# Import routers
from app.api import admin, clientes, demos, pedidos, logs, auth
from app.core.config import settings


# ==========================================================================
# APP INITIALIZATION
# ============================================================================

app = FastAPI(
    title="LTP Labs E-Catalog API",
    description="""
    API completa para gestão do catálogo de demos LTP Labs
    
    ## Módulos
    
    ### 👥 Admin
    - Gestão de administradores
    - CRUD completo
    - Autenticação
    
    ### 🎫 Clientes
    - Gestão de clientes externos
    - Controlo de acessos temporários
    - Renovação e revogação
    
    ### 🎯 Demos
    - Catálogo de demos
    - Filtros por vertical/horizontal
    - Gestão de estado
    
    ### 📋 Pedidos
    - Pedidos de renovação/revogação
    - Aprovação/rejeição com transactions
    - Histórico
    
    ### 📊 Logs
    - Logs de atividade
    - Analytics e estatísticas
    - Auditoria
    
    ### 🔐 Auth
    - Proxy para Authentication Service
    - Login/Logout
    - Validação de tokens JWT
    
    ### 📈 Metrics (Proxy)
    - Proxy para Metrics Exporter Service
    - Analytics e métricas agregadas
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


# ============================================================================
# MIDDLEWARE
# ============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção: especificar domínios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# ROOT & HEALTH
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint com informação da API"""
    return {
        "service": "LTP Labs E-Catalog API",
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs",
        "endpoints": {
            "admin": "/api/admin",
            "clientes": "/api/clientes",
            "demos": "/api/demos",
            "pedidos": "/api/pedidos",
            "logs": "/api/logs",
            "auth": "/api/auth",
            "metrics": "/api/metrics"
        }
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.SERVICE_NAME,
        "version": "2.0.0",
        "database_url": settings.DATABASE_URL
    }


# ============================================================================
# METRICS PROXY
# ============================================================================

@app.get("/api/metrics/{path:path}")
async def metrics_proxy(path: str):
    """
    Proxy para Metrics Exporter Service
    
    Permite ao frontend aceder às métricas através do Catalog Service,
    evitando problemas de CORS e centralizando o acesso.
    
    Examples:
        - /api/metrics/overview
        - /api/metrics/logs/overview
        - /api/metrics/clients/overview
        - /api/metrics/demos/overview
        - /api/metrics/logs/top-clients?limit=10
        - /api/metrics/demos/top-used?limit=10
    """
    metrics_exporter_url = "http://metrics-exporter:9090"
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{metrics_exporter_url}/metrics/{path}")
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Metrics Exporter error: {e.response.text}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Metrics Exporter unavailable: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )


# ============================================================================
# DATABASE QUERY PROXY (para Metrics Exporter)
# ============================================================================

@app.get("/api/db/query")
async def database_query_proxy(sql: str):
    """
    Proxy para executar queries SQL genéricas na Database
    
    Usado pelo Metrics Exporter para queries customizadas
    (ex: views, agregações, métricas de tempo)
    
    IMPORTANTE: Em produção, adicionar validação/whitelist de queries
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{settings.DATABASE_URL}/db/query",
                params={"sql": sql}
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Database error: {e.response.text}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Database unavailable: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )

# ============================================================================
# INCLUDE ROUTERS
# ============================================================================

# Admin Management
app.include_router(
    admin.router,
    prefix="/api/admin",
    tags=["👥 Admin"]
)

# Cliente Management
app.include_router(
    clientes.router,
    prefix="/api/clientes",
    tags=["🎫 Clientes"]
)

# Demo Catalog
app.include_router(
    demos.router,
    prefix="/api/demos",
    tags=["🎯 Demos"]
)

# Pedidos (Requests)
app.include_router(
    pedidos.router,
    prefix="/api/pedidos",
    tags=["📋 Pedidos"]
)

# Logs & Analytics
app.include_router(
    logs.router,
    prefix="/api/logs",
    tags=["📊 Logs"]
)

# Authentication (Proxy)
app.include_router(
    auth.router,
    prefix="/api/auth",
    tags=["🔐 Auth"]
)


# ============================================================================
# STARTUP/SHUTDOWN
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Executado no início"""
    print("=" * 60)
    print("🚀 LTP Labs E-Catalog API - Starting...")
    print("=" * 60)
    print(f"📦 Service: {settings.SERVICE_NAME}")
    print(f"🔢 Version: 2.0.0")
    print(f"🔗 Database URL: {settings.DATABASE_URL}")
    print(f"🔐 Auth URL: {settings.AUTHENTICATION_URL}")
    print(f"📈 Metrics Proxy: /api/metrics/*")
    print(f"📖 Docs: http://localhost:8000/docs")
    print("=" * 60)
    print("✅ Catalog Service is ready!")
    print("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    """Executado ao parar"""
    print("🛑 Shutting down...")
    print("👋 Goodbye!")


# ============================================================================
# DEVELOPMENT
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )