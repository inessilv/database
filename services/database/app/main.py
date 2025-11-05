"""
Database Service - Mini API FastAPI
Fornece endpoints CRUD internos para o serviço Catalog
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import admin


app = FastAPI(
    title="E-Catalog Database API",
    description="Mini API interna para acesso à base de dados SQLite",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS (interno, mas deixamos aberto para desenvolvimento)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    from app.db.connection import DatabaseConnection as db
    
    try:
        # Testar conexão à database
        result = db.execute_query("SELECT 1 as test")
        
        return {
            "status": "healthy",
            "service": settings.SERVICE_NAME,
            "version": settings.VERSION,
            "database": "connected",
            "db_path": settings.DB_PATH
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": settings.SERVICE_NAME,
            "version": settings.VERSION,
            "database": "error",
            "error": str(e)
        }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "E-Catalog Database API",
        "service": settings.SERVICE_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health",
        "note": "Esta API é apenas para uso interno pelo serviço Catalog"
    }


# ============================================================================
# INCLUIR ROUTERS
# ============================================================================

from app.api import clientes, demos, pedidos, logs, docker_images, views

# Admin endpoints
app.include_router(
    admin.router,
    prefix="/db/admin",
    tags=["Admin"]
)

# Clientes endpoints
app.include_router(
    clientes.router,
    prefix="/db/clientes",
    tags=["Clientes"]
)

# Demos endpoints
app.include_router(
    demos.router,
    prefix="/db/demos",
    tags=["Demos"]
)

# Pedidos endpoints
app.include_router(
    pedidos.router,
    prefix="/db/pedidos",
    tags=["Pedidos"]
)

# Logs endpoints
app.include_router(
    logs.router,
    prefix="/db/logs",
    tags=["Logs"]
)

# Docker Images endpoints
app.include_router(
    docker_images.router,
    prefix="/db/docker-images",
    tags=["Docker Images"]
)

# Views endpoints
app.include_router(
    views.router,
    prefix="/db/views",
    tags=["Views"]
)


# ============================================================================
# STARTUP/SHUTDOWN
# ============================================================================

@app.on_event("startup")
async def startup_event():
    print("=" * 60)
    print("🗄️  Database Service Started!")
    print(f"📦 Service: {settings.SERVICE_NAME}")
    print(f"🔢 Version: {settings.VERSION}")
    print(f"🌍 Environment: {settings.ENVIRONMENT}")
    print(f"📍 Port: {settings.DATABASE_PORT}")
    print(f"💾 Database: {settings.DB_PATH}")
    print(f"📖 Docs: http://localhost:{settings.DATABASE_PORT}/docs")
    print("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    from app.db.connection import DatabaseConnection
    DatabaseConnection.close_connection()
    print("🛑 Database Service Stopped")
