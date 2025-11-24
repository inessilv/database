"""
E-Catalog Authentication Service
Serviço de autenticação e autorização

Responsabilidades:
- Login/Logout
- Gestão de tokens (JWT)
- Validação de credenciais
- RBAC (Role-Based Access Control)
- MFA (Multi-Factor Authentication) - futuro
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import jwt
import hashlib

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
# STARTUP EVENT
# ============================================================================

@app.on_event("startup")
async def startup_event():
    print("🔐 Authentication Service iniciado!")
    print(f"📋 {len(MOCK_USERS)} utilizadores disponíveis")