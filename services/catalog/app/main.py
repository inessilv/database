"""
Main Application - Catalog Service
FastAPI application com todos os endpoints
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    
    ### 📝 Pedidos
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
            "auth": "/api/auth"
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
    tags=["📝 Pedidos"]
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
