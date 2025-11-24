"""
E-Catalog Authentication Service
Serviço de autenticação e autorização

Responsabilidades:
- Login/Logout
- Gestão de tokens (JWT)
- Validação de credenciais
- RBAC (Role-Based Access Control)
- MFA (Multi-Factor Authentication) - futuro
- Microsoft OAuth integration
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import jwt
import hashlib
import httpx
import os
from urllib.parse import urlencode
import json

app = FastAPI(
    title="E-Catalog Authentication API",
    description="Serviço de autenticação e autorização",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurações (em produção: usar .env)
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 300

# Microsoft OAuth Configuration
MICROSOFT_CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID", "a6822c5f-f140-4356-8778-5e821789c75e")
MICROSOFT_CLIENT_SECRET = os.getenv("MICROSOFT_CLIENT_SECRET", "u0L8Q~XduiIHtwxHYwJt-oyTBVwiX2YmRtoONbQF")
MICROSOFT_REDIRECT_URI = os.getenv("MICROSOFT_REDIRECT_URI", "http://localhost:8080/api/auth/microsoft/callback")
MICROSOFT_TENANT_ID = os.getenv("MICROSOFT_TENANT_ID", "common")  # "common" for multi-tenant
MICROSOFT_AUTHORITY = f"https://login.microsoftonline.com/{MICROSOFT_TENANT_ID}"
MICROSOFT_SCOPES = ["openid", "profile", "email", "User.Read"]

# ============================================================================
# MODELS
# ============================================================================

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: dict

class TokenValidationRequest(BaseModel):
    token: str

class MicrosoftAuthResponse(BaseModel):
    """Model para response do callback Microsoft"""
    access_token: str
    token_type: str
    expires_in: int
    user: dict

# ============================================================================
# MOCK USERS (em produção: usar base de dados)
# ============================================================================

MOCK_USERS = [
    {
        "id": 1,
        "email": "admin@ltplabs.com",
        "password_hash": hashlib.sha256("admin123".encode()).hexdigest(),
        "role": "admin",
        "name": "Administrator"
    },
    {
        "id": 2,
        "email": "client@example.com",
        "password_hash": hashlib.sha256("client123".encode()).hexdigest(),
        "role": "client",
        "name": "Test Client"
    },
    {
        "id": 3,
        "email": "",
        "password_hash": hashlib.sha256("".encode()).hexdigest(),
        "role": "admin",
        "name": "Administrator2"
    }
]

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Criar JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    """Verificar e decodificar token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

def get_user_by_email(email: str):
    """Buscar utilizador por email"""
    for user in MOCK_USERS:
        if user["email"] == email:
            return user
    return None

def verify_password(plain_password: str, password_hash: str):
    """Verificar password"""
    return hashlib.sha256(plain_password.encode()).hexdigest() == password_hash

# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/health")
async def health():
    """Health check"""
    return {
        "status": "healthy",
        "service": "authentication",
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "E-Catalog Authentication Service",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.post("/api/auth/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """
    Login de utilizador
    Retorna JWT token se credenciais válidas
    """
    # Buscar utilizador
    user = get_user_by_email(request.email)
    if not user:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    # Verificar password
    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    # Criar token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user["email"],
            "user_id": user["id"],
            "role": user["role"]
        },
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    }

@app.post("/api/auth/validate")
async def validate_token(request: TokenValidationRequest):
    """
    Validar token JWT
    Usado por outros serviços (Catalog) para verificar autenticação
    """
    payload = verify_token(request.token)
    return {
        "valid": True,
        "user_id": payload.get("user_id"),
        "email": payload.get("sub"),
        "role": payload.get("role")
    }

@app.post("/api/auth/logout")
async def logout():
    """
    Logout de utilizador
    (Em JWT stateless, logout é gerido no frontend removendo token)
    """
    return {
        "message": "Logout efetuado com sucesso"
    }

@app.get("/api/users/me")
async def get_current_user(token: str):
    """
    Obter informações do utilizador atual
    Requer token JWT no header Authorization
    """
    payload = verify_token(token)
    user = get_user_by_email(payload.get("sub"))
    
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"]
    }

# ============================================================================
# MICROSOFT OAUTH ENDPOINTS
# ============================================================================

@app.get("/api/auth/microsoft/login")
async def microsoft_login():
    """
    Iniciar fluxo de autenticação com Microsoft
    Redireciona para a página de login da Microsoft
    """
    params = {
        "client_id": MICROSOFT_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": MICROSOFT_REDIRECT_URI,
        "response_mode": "query",
        "scope": " ".join(MICROSOFT_SCOPES),
        "state": "12345"  # Em produção, usar um valor aleatório seguro
    }
    
    auth_url = f"{MICROSOFT_AUTHORITY}/oauth2/v2.0/authorize?{urlencode(params)}"
    return RedirectResponse(url=auth_url)


@app.get("/api/auth/microsoft/callback")
async def microsoft_callback(code: str, state: Optional[str] = None):
    """
    Callback para autenticação Microsoft
    Recebe o código de autorização e troca por token de acesso
    """
    if not code:
        raise HTTPException(status_code=400, detail="Código de autorização não fornecido")
    
    # Trocar código por token
    token_url = f"{MICROSOFT_AUTHORITY}/oauth2/v2.0/token"
    token_data = {
        "client_id": MICROSOFT_CLIENT_ID,
        "client_secret": MICROSOFT_CLIENT_SECRET,
        "code": code,
        "redirect_uri": MICROSOFT_REDIRECT_URI,
        "grant_type": "authorization_code",
        "scope": " ".join(MICROSOFT_SCOPES)
    }
    
    try:
        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data=token_data)
            
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail=f"Erro ao obter token: {token_response.text}"
                )
            
            token_json = token_response.json()
            ms_access_token = token_json.get("access_token")
            
            # Obter informações do utilizador usando o token da Microsoft
            user_info = await get_microsoft_user_info(ms_access_token)
            
            # Criar ou atualizar utilizador na base de dados
            # Por agora, vamos criar um utilizador temporário
            user_email = user_info.get("mail") or user_info.get("userPrincipalName")
            user_name = user_info.get("displayName", user_email)
            
            # Criar JWT token interno
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={
                    "sub": user_email,
                    "user_id": user_info.get("id"),
                    "role": "client",  # Por defeito, utilizadores Microsoft são "client"
                    "provider": "microsoft"
                },
                expires_delta=access_token_expires
            )
            
            # Redirecionar para o frontend com o token
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
            from urllib.parse import quote
            user_data = json.dumps({'name': user_name, 'email': user_email, 'role': 'client'})
            redirect_url = f"{frontend_url}/auth/callback?token={access_token}&user={quote(user_data)}"
            
            return RedirectResponse(url=redirect_url)
            
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Erro ao comunicar com Microsoft: {str(e)}"
        )


async def get_microsoft_user_info(access_token: str) -> dict:
    """
    Obter informações do utilizador do Microsoft Graph API
    """
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://graph.microsoft.com/v1.0/me",
            headers=headers
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=400,
                detail="Erro ao obter informações do utilizador"
            )
        
        return response.json()

# ============================================================================
# STARTUP EVENT
# ============================================================================

@app.on_event("startup")
async def startup_event():
    print("🔐 Authentication Service iniciado!")
    print(f"📋 {len(MOCK_USERS)} utilizadores disponíveis")