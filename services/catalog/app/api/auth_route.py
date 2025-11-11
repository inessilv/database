from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from app.core.config import settings

router = APIRouter()

# Models
class LoginRequest(BaseModel):
    email: str
    password: str

class TokenValidationRequest(BaseModel):
    token: str

# ============================================================================
# PROXY ENDPOINTS
# ============================================================================

@router.post("/login")
async def login_proxy(credentials: LoginRequest):
    """
    Proxy para login no Authentication Service
    Frontend chama: POST /api/auth/login
    Catalog faz proxy para: http://authentication:8080/api/auth/login
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.AUTHENTICATION_URL}/api/auth/login",
                json=credentials.dict(),
                timeout=10.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.json().get("detail", "Erro na autenticação")
                )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Erro ao comunicar com Authentication Service: {str(e)}"
        )

@router.post("/validate")
async def validate_token_proxy(request: TokenValidationRequest):
    """
    Proxy para validação de token no Authentication Service
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.AUTHENTICATION_URL}/api/auth/validate",
                json=request.dict(),
                timeout=10.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Token inválido"
                )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Erro ao comunicar com Authentication Service: {str(e)}"
        )

@router.post("/logout")
async def logout_proxy():
    """
    Proxy para logout no Authentication Service
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.AUTHENTICATION_URL}/api/auth/logout",
                timeout=10.0
            )
            return response.json()
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Erro ao comunicar com Authentication Service: {str(e)}"
        )

@router.get("/status")
async def check_auth_status():
    """
    Verificar status do Authentication Service
    Útil para debugging e health checks
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.AUTHENTICATION_URL}/health",
                timeout=5.0
            )
            return {
                "catalog": "healthy",
                "authentication": "healthy" if response.status_code == 200 else "unhealthy",
                "authentication_url": settings.AUTHENTICATION_URL
            }
    except Exception as e:
        return {
            "catalog": "healthy",
            "authentication": "unreachable",
            "error": str(e)
        }