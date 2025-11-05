"""
Catalog Service - API Pública
Serviço principal que expõe endpoints públicos e comunica com Database e Authentication
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import admin


app = FastAPI(
    title="E-Catalog API",
    description="API pública do catálogo de demos LTP Labs",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção: especificar domínios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.SERVICE_NAME,
        "version": settings.VERSION,
        "database_url": settings.DATABASE_URL,
        "authentication_url": settings.AUTHENTICATION_URL
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "E-Catalog API - LTP Labs",
        "service": settings.SERVICE_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "admin": "/api/admin",
            "clientes": "/api/clientes",
            "demos": "/api/demos",
            "pedidos": "/api/pedidos",
            "logs": "/api/logs",
            "auth": "/api/auth"
        }
    }


# ============================================================================
# INCLUIR ROUTERS
# ============================================================================

# Admin endpoints
app.include_router(
    admin.router,
    prefix="/api/admin",
    tags=["Admin"]
)

# TODO: Adicionar outros routers quando criados
# from app.api import clientes, demos, pedidos, logs, auth
# app.include_router(clientes.router, prefix="/api/clientes", tags=["Clientes"])
# app.include_router(demos.router, prefix="/api/demos", tags=["Demos"])
# app.include_router(pedidos.router, prefix="/api/pedidos", tags=["Pedidos"])
# app.include_router(logs.router, prefix="/api/logs", tags=["Logs"])
# app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])


# ============================================================================
# STARTUP/SHUTDOWN
# ============================================================================

@app.on_event("startup")
async def startup_event():
    print("=" * 60)
    print("🚀 Catalog Service Started!")
    print(f"📦 Service: {settings.SERVICE_NAME}")
    print(f"🔢 Version: {settings.VERSION}")
    print(f"🌍 Environment: {settings.ENVIRONMENT}")
    print(f"📍 Port: {settings.CATALOG_PORT}")
    print(f"🗄️  Database: {settings.DATABASE_URL}")
    print(f"🔐 Authentication: {settings.AUTHENTICATION_URL}")
    print(f"📖 Docs: http://localhost:{settings.CATALOG_PORT}/docs")
    print("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    print("🛑 Catalog Service Stopped")
