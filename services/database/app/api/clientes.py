"""
Cliente CRUD Endpoints
Tabela: cliente (id, nome, email, password_hash, data_registo, data_expiracao, criado_por, criado_em)
"""
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
    password_hash: str
    data_registo: str  # ISO format: "2025-11-05"
    data_expiracao: str  # ISO format: "2025-12-31"
    criado_por: str  # admin_id


class ClienteUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    password_hash: Optional[str] = None
    data_expiracao: Optional[str] = None  # Para renovações


class ClienteResponse(ClienteBase):
    id: str
    data_registo: str
    data_expiracao: str
    criado_por: str
    criado_em: str


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/all", response_model=List[ClienteResponse])
def get_all_clientes():
    """Listar todos os clientes"""
    query = "SELECT id, nome, email, data_registo, data_expiracao, criado_por, criado_em FROM cliente"
    return db.execute_query(query)


@router.get("/active", response_model=List[ClienteResponse])
def get_active_clientes():
    """Listar clientes ativos (não expirados)"""
    query = """
        SELECT id, nome, email, data_registo, data_expiracao, criado_por, criado_em
        FROM cliente
        WHERE datetime(data_expiracao) >= datetime('now')
        AND datetime(data_registo) <= datetime('now')
        ORDER BY data_expiracao DESC
    """
    return db.execute_query(query)


@router.get("/expired", response_model=List[ClienteResponse])
def get_expired_clientes():
    """Listar clientes expirados"""
    query = """
        SELECT id, nome, email, data_registo, data_expiracao, criado_por, criado_em
        FROM cliente
        WHERE datetime(data_expiracao) < datetime('now')
        ORDER BY data_expiracao DESC
    """
    return db.execute_query(query)


@router.get("/{cliente_id}", response_model=ClienteResponse)
def get_cliente(cliente_id: str):
    """Obter cliente específico por ID"""
    query = """
        SELECT id, nome, email, data_registo, data_expiracao, criado_por, criado_em
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
        SELECT id, nome, email, data_registo, data_expiracao, criado_por, criado_em
        FROM cliente WHERE email = ?
    """
    clientes = db.execute_query(query, (email,))
    
    if not clientes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente com email {email} não encontrado"
        )
    
    return clientes[0]


@router.get("/by-email-with-password/{email}")
def get_cliente_with_password(email: str):
    """
    Obter cliente com password_hash (para autenticação)
    NOTA: Inclui password_hash - usar apenas para autenticação
    """
    query = "SELECT * FROM cliente WHERE email = ?"
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
        INSERT INTO cliente (id, nome, email, password_hash, data_registo, data_expiracao, criado_por)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """
    
    try:
        db.execute_insert(
            query,
            (cliente_id, cliente.nome, cliente.email, cliente.password_hash,
             cliente.data_registo, cliente.data_expiracao, cliente.criado_por)
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
    
    if cliente.password_hash is not None:
        updates.append("password_hash = ?")
        params.append(cliente.password_hash)
    
    if cliente.data_expiracao is not None:
        updates.append("data_expiracao = ?")
        params.append(cliente.data_expiracao)
    
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


@router.post("/{cliente_id}/extend")
def extend_cliente_access(cliente_id: str, nova_data_expiracao: str):
    """
    Extender acesso de cliente (renovação)
    Body: {"nova_data_expiracao": "2026-01-01"}
    """
    existing = db.execute_query("SELECT id FROM cliente WHERE id = ?", (cliente_id,))
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente {cliente_id} não encontrado"
        )
    
    query = "UPDATE cliente SET data_expiracao = ? WHERE id = ?"
    db.execute_update(query, (nova_data_expiracao, cliente_id))
    
    return {"message": "Acesso renovado com sucesso", "nova_data_expiracao": nova_data_expiracao}


@router.delete("/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cliente(cliente_id: str):
    """Apagar cliente"""
    rows_affected = db.execute_update("DELETE FROM cliente WHERE id = ?", (cliente_id,))
    
    if rows_affected == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente {cliente_id} não encontrado"
        )
    
    return None
