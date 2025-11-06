"""
Auth API Endpoints (Proxy)
Proxy para Authentication Service
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
import httpx
from app.core.config import settings


router = APIRouter()


# ============================================================================
# MODELS
# ============================================================================

class LoginRequest(BaseModel):
    """Model para request de login"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Model para response com token"""
    access_token: str
    token_type: str
    expires_in: int
    user: dict


class TokenValidation(BaseModel):
    """Model para validação de token"""
    token: str


# ============================================================================
# ENDPOINTS PROXY
# ============================================================================

@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    """
    Proxy para login no Authentication Service
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.AUTHENTICATION_URL}/api/auth/login",
                json=credentials.model_dump()
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                detail = response.json().get("detail", "Erro na autenticação")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=detail
                )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Erro ao comunicar com Authentication Service: {str(e)}"
        )


@router.post("/validate")
async def validate_token(validation: TokenValidation):
    """
    Proxy para validação de token no Authentication Service
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.AUTHENTICATION_URL}/api/auth/validate",
                json=validation.model_dump()
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token inválido"
                )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Erro ao comunicar com Authentication Service: {str(e)}"
        )


@router.post("/logout")
async def logout():
    """
    Proxy para logout no Authentication Service
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.AUTHENTICATION_URL}/api/auth/logout"
            )
            return response.json()
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Erro ao comunicar com Authentication Service: {str(e)}"
        )


@router.get("/status")
async def check_auth_status():
    """
    Verificar status do Authentication Service
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{settings.AUTHENTICATION_URL}/health"
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
