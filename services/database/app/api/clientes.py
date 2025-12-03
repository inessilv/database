from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from app.db.connection import DatabaseConnection as db


router = APIRouter()


# ============================================================================
# MODELS
# ============================================================================

class ClienteBase(BaseModel):
    nome: str
    email: EmailStr


class ClienteCreate(ClienteBase):
    data_expiracao: str  # ISO format: "2025-12-31"
    criado_por: str  # admin_id


class ClienteUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None


class ClienteResponse(ClienteBase):
    id: str
    data_registo: str
    data_expiracao: str
    criado_por: str


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/all", response_model=List[ClienteResponse])
def get_all_clientes():
    """Listar todos os clientes"""
    query = "SELECT id, nome, email, data_expiracao, criado_por, data_registo FROM cliente"
    return db.execute_query(query)


@router.get("/active", response_model=List[ClienteResponse])
def get_active_clientes():
    """Listar clientes ativos (não expirados)"""
    query = """
        SELECT id, nome, email, data_expiracao, criado_por, data_registo
        FROM cliente
        WHERE datetime(data_expiracao) >= datetime('now')
        ORDER BY data_expiracao DESC
    """
    return db.execute_query(query)


@router.get("/expired", response_model=List[ClienteResponse])
def get_expired_clientes():
    """Listar clientes expirados"""
    query = """
        SELECT id, nome, email, data_expiracao, criado_por, data_registo
        FROM cliente
        WHERE datetime(data_expiracao) < datetime('now')
        ORDER BY data_expiracao DESC
    """
    return db.execute_query(query)


@router.get("/{cliente_id}", response_model=ClienteResponse)
def get_cliente(cliente_id: str):
    """Obter cliente específico por ID"""
    query = """
        SELECT id, nome, email, data_expiracao, criado_por, data_registo
        FROM cliente WHERE id = ?
    """
    clientes = db.execute_query(query, (cliente_id,))
    
    if not clientes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente {cliente_id} não encontrado"
        )
    
    return clientes[0]


@router.get("/by-email/{email}", response_model=ClienteResponse)
def get_cliente_by_email(email: str):
    """Obter cliente por email"""
    query = """
        SELECT id, nome, email, data_expiracao, criado_por, data_registo
        FROM cliente WHERE email = ?
    """
    clientes = db.execute_query(query, (email,))
    
    if not clientes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente com email {email} não encontrado"
        )
    
    return clientes[0]


@router.post("/", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
def create_cliente(cliente: ClienteCreate):
    """Criar novo cliente"""
    import secrets
    cliente_id = secrets.token_hex(16)
    
    query = """
        INSERT INTO cliente (id, nome, email, data_expiracao, criado_por)
        VALUES (?, ?, ?, ?, ?)
    """
    
    try:
        db.execute_insert(
            query,
            (cliente_id, cliente.nome, cliente.email,
             cliente.data_expiracao, cliente.criado_por)
        )
    except Exception as e:
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já existe"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar cliente: {str(e)}"
        )
    
    return get_cliente(cliente_id)


@router.put("/{cliente_id}", response_model=ClienteResponse)
def update_cliente(cliente_id: str, cliente: ClienteUpdate):
    """Atualizar cliente"""
    # Verificar se existe
    existing = db.execute_query("SELECT id FROM cliente WHERE id = ?", (cliente_id,))
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente {cliente_id} não encontrado"
        )
    
    # Construir query dinâmica
    updates = []
    params = []
    
    if cliente.nome is not None:
        updates.append("nome = ?")
        params.append(cliente.nome)
    
    if cliente.email is not None:
        updates.append("email = ?")
        params.append(cliente.email)
    
    
    if not updates:
        return get_cliente(cliente_id)
    
    params.append(cliente_id)
    query = f"UPDATE cliente SET {', '.join(updates)} WHERE id = ?"
    
    try:
        db.execute_update(query, tuple(params))
    except Exception as e:
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já existe"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar cliente: {str(e)}"
        )
    
    return get_cliente(cliente_id)


@router.delete("/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_cliente_access(cliente_id: str):
    """Revogar acesso do cliente (expira imediatamente)"""
    cliente_exists = db.execute_query(
        "SELECT id FROM cliente WHERE id = ?",
        (cliente_id,)
    )
    
    if not cliente_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente {cliente_id} não encontrado"
        )
    
    # Definir data_expiracao como datetime.now (expira imediatamente)
    query = "UPDATE cliente SET data_expiracao = datetime('now') WHERE id = ?"
    
    try:
        db.execute_update(query, (cliente_id,))
        return None
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao revogar acesso: {str(e)}"
        )
