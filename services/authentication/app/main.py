"""
E-Catalog Authentication Service
Serviço de autenticação e autorização via Microsoft OAuth

Responsabilidades:
- Microsoft OAuth integration
- JWT token generation
- Role-based access control (Admin/Viewer)
- Database integration for user management
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import jwt
import hashlib
import httpx
from urllib.parse import urlencode
import json
import secrets

from app.core.config import settings
from app.services.database_client import DatabaseClient

# Initialize database client
db_client = DatabaseClient()

app = FastAPI(
    title="E-Catalog Authentication API",
    description="Serviço de autenticação via Microsoft OAuth",
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

# Configurações
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

# Microsoft OAuth Configuration
MICROSOFT_CLIENT_ID = settings.MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET = settings.MICROSOFT_CLIENT_SECRET
MICROSOFT_REDIRECT_URI = settings.MICROSOFT_REDIRECT_URI
MICROSOFT_TENANT_ID = settings.MICROSOFT_TENANT_ID
MICROSOFT_AUTHORITY = f"https://login.microsoftonline.com/{MICROSOFT_TENANT_ID}"
MICROSOFT_SCOPES = ["openid", "profile", "email", "User.Read"]

# ============================================================================
# MODELS
# ============================================================================

class TokenValidationRequest(BaseModel):
    token: str

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

async def is_email_allowed(email: str) -> tuple[bool, Optional[str]]:
    """
    Verificar se o email existe na base de dados (admin ou cliente)
    Retorna: (permitido: bool, role: Optional[str])
    """
    if not email:
        return False, None
    
    email_lower = email.lower()
    
    # Verificar se é admin
    try:
        admin = await db_client.get_admin_by_email(email_lower)
        if admin:
            print(f"Email {email_lower} encontrado como ADMIN na BD")
            return True, "admin"
    except Exception as e:
        print(f"Erro ao verificar admin: {e}")
    
    # Verificar se é cliente
    try:
        cliente = await db_client.get_cliente_by_email(email_lower)
        if cliente:
            print(f"Email {email_lower} encontrado como CLIENTE na BD")
            return True, "viewer"
    except Exception as e:
        print(f"Erro ao verificar cliente: {e}")
    
    print(f"Email {email_lower} NÃO encontrado na BD")
    return False, None


async def authenticate_user(email: str) -> tuple[bool, Optional[str]]:
    """
    Autenticar utilizador com hierarquia:
    1. Admin (tabela admin) → role: admin
    2. Cliente (tabela cliente) → role: viewer
    3. Domínio permitido (@alunos.uminho.pt, @ltplabs.com) → role: viewer (auto-criado)
    4. Caso contrário → negado
    
    Retorna: (autenticado: bool, role: Optional[str])
    """
    if not email:
        return False, None
    
    email_lower = email.lower()
    
    # 1. Verificar se é admin
    try:
        admin = await db_client.get_admin_by_email(email_lower)
        if admin:
            print(f"Email {email_lower} autenticado como ADMIN")
            return True, "admin"
    except Exception as e:
        print(f"Erro ao verificar admin: {e}")
    
    # 2. Verificar se é cliente
    try:
        cliente = await db_client.get_cliente_by_email(email_lower)
        if cliente:
            print(f"Email {email_lower} autenticado como CLIENTE")
            return True, "viewer"
    except Exception as e:
        print(f"Erro ao verificar cliente: {e}")
    
    # 3. Verificar se é domínio permitido
    domain = email_lower.split("@")[-1] if "@" in email_lower else ""
    if domain in settings.ALLOWED_DOMAINS:
        print(f"Email {email_lower} do domínio permitido: {domain}")
        return True, "viewer"  # Será auto-criado como cliente
    
    print(f"Email {email_lower} não autorizado")
    return False, None


async def create_cliente_if_not_exists(email: str, name: str) -> None:
    """
    Criar cliente automaticamente se não existir
    Usado para utilizadores de domínios permitidos
    """
    try:
        # Verificar se já existe
        existing = await db_client.get_cliente_by_email(email.lower())
        if existing:
            print(f"ℹ️ Cliente {email} já existe na BD")
            return
    except Exception:
        # Cliente não existe, vamos criar
        pass
    
    try:
        # Criar novo cliente
        from datetime import datetime, timedelta
        import secrets
        
        cliente_data = {
            "id": f"oauth_{secrets.token_hex(8)}",
            "nome": name,
            "email": email.lower(),
            "password_hash": "",  # OAuth não precisa de password
            "data_expiracao": (datetime.now() + timedelta(days=30)).isoformat(),
            "criado_por": "system_oauth"
        }
        
        await db_client.create_cliente(cliente_data)
        print(f"✅ Cliente {email} criado automaticamente na BD")
    except Exception as e:
        print(f"⚠️ Erro ao criar cliente {email}: {e}")


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
        "docs": "/docs",
        "auth_method": "Microsoft OAuth only"
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
                error_text = token_response.text
                raise HTTPException(
                    status_code=400,
                    detail=f"Erro ao obter token: {error_text}"
                )
            
            token_json = token_response.json()
            ms_access_token = token_json.get("access_token")
            
            # Obter informações do utilizador usando o token da Microsoft
            user_info = await get_microsoft_user_info(ms_access_token)
            
            # Extrair email do utilizador
            user_email = user_info.get("mail") or user_info.get("userPrincipalName")
            user_name = user_info.get("displayName", user_email)
            
            print(f"Microsoft OAuth - Email: {user_email}")
            
            # Autenticar utilizador (verifica admin -> cliente -> domínio permitido)
            authenticated, user_role = await authenticate_user(user_email)
            
            if not authenticated:
                print(f"Email {user_email} não autorizado")
                frontend_url = settings.FRONTEND_URL
                error_url = f"{frontend_url}/login?error=unauthorized_domain"
                return RedirectResponse(url=error_url)
            
            # Buscar ID do utilizador na base de dados
            user_db_id = None
            if user_role == "admin":
                try:
                    admin = await db_client.get_admin_by_email(user_email)
                    user_db_id = admin.get("id")
                except Exception as e:
                    print(f"⚠️ Erro ao buscar ID do admin: {e}")
            elif user_role == "viewer":
                # Se é viewer, criar cliente se não existir
                await create_cliente_if_not_exists(user_email, user_name)
                try:
                    cliente = await db_client.get_cliente_by_email(user_email)
                    user_db_id = cliente.get("id")
                except Exception as e:
                    print(f"⚠️ Erro ao buscar ID do cliente: {e}")
            
            print(f"Email {user_email} autenticado com role: {user_role}, ID: {user_db_id}")
            
            # Criar JWT token interno
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={
                    "sub": user_email,
                    "user_id": user_db_id or user_email,  # Usar ID da BD ou email como fallback
                    "role": user_role,
                    "provider": "microsoft"
                },
                expires_delta=access_token_expires
            )
            
            # Redirecionar para o frontend com o token
            frontend_url = settings.FRONTEND_URL
            from urllib.parse import quote
            user_data = json.dumps({
                'id': user_db_id or user_email,  # ID da base de dados
                'name': user_name, 
                'email': user_email, 
                'role': user_role
            })
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
    print(f"🌐 Allowed domains: {settings.ALLOWED_DOMAINS}")
    print(f"🔗 Microsoft OAuth redirect: {MICROSOFT_REDIRECT_URI}")
    print("📋 Ordem de autenticação: Admin → Cliente → Domínio Permitido")