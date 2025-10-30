from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.requests_route import router as requests_router
from app.api.auth_route import router as auth_router
from app.core.config import settings

app = FastAPI(
    title="E-Catalog API",
    description="API monolítica + proxy para autenticação",
    version="1.0.0",
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
    """Health check"""
    return {
        "status": "healthy",
        "service": settings.SERVICE_NAME,
        "version": settings.VERSION
    }

# ============================================================================
# ROOT
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "E-Catalog API",
        "service": settings.SERVICE_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "endpoints": {
            "requests": "/api/requests",
            "auth": "/api/auth",
            "health": "/health"
        }
    }

# ============================================================================
# INCLUIR ROUTERS
# ============================================================================

# Requests (lógica própria do Catalog)
app.include_router(
    requests_router,
    prefix="/api/requests",
    tags=["Requests"]
)

# Authentication (proxy para Authentication Service)
app.include_router(
    auth_router,
    prefix="/api/auth",
    tags=["Authentication"]
)
# ============================================================================

@app.on_event("startup")
async def startup_event():
    print("🚀 Catalog Service iniciado!")
    print(f"📦 Porta: 8000")
    print(f"📖 Docs: http://localhost:8000/docs")
    print(f"🔐 Authentication URL: {settings.AUTHENTICATION_URL}")