"""
Pedido CRUD Endpoints
Tabela: pedido (id, cliente_id, estado, tipo_pedido, criado_em, gerido_por)
"""
from fastapi import APIRouter, HTTPException, status
from typing import List, Optional, Literal
from pydantic import BaseModel
from app.db.connection import DatabaseConnection as db


router = APIRouter()


# ============================================================================
# MODELS
# ============================================================================

class PedidoBase(BaseModel):
    cliente_id: str
    tipo_pedido: Literal['renovação', 'revogação']


class PedidoCreate(PedidoBase):
    pass


class PedidoResponse(PedidoBase):
    id: str
    estado: str
    criado_em: str
    gerido_por: Optional[str] = None


class ApproveRejectRequest(BaseModel):
    admin_id: str  # Quem está a aprovar/rejeitar
    nova_data_expiracao: Optional[str] = None  # Apenas para aprovações de renovação


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/all", response_model=List[PedidoResponse])
def get_all_pedidos():
    """Listar todos os pedidos"""
    query = "SELECT * FROM pedido ORDER BY criado_em DESC"
    return db.execute_query(query)


@router.get("/pending", response_model=List[PedidoResponse])
def get_pending_pedidos():
    """Listar pedidos pendentes"""
    query = """
        SELECT * FROM pedido 
        WHERE estado = 'pendente' 
        ORDER BY criado_em ASC
    """
    return db.execute_query(query)


@router.get("/{pedido_id}", response_model=PedidoResponse)
def get_pedido(pedido_id: str):
    """Obter pedido específico por ID"""
    query = "SELECT * FROM pedido WHERE id = ?"
    pedidos = db.execute_query(query, (pedido_id,))
    
    if not pedidos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pedido {pedido_id} não encontrado"
        )
    
    return pedidos[0]


@router.post("/", response_model=PedidoResponse, status_code=status.HTTP_201_CREATED)
def create_pedido(pedido: PedidoCreate):
    """Criar novo pedido"""
    import secrets
    pedido_id = secrets.token_hex(16)
    
    query = """
        INSERT INTO pedido (id, cliente_id, tipo_pedido, estado)
        VALUES (?, ?, ?, 'pendente')
    """
    
    try:
        db.execute_insert(query, (pedido_id, pedido.cliente_id, pedido.tipo_pedido))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar pedido: {str(e)}"
        )
    
    return get_pedido(pedido_id)


@router.put("/{pedido_id}/approve")
def approve_pedido(pedido_id: str, request: ApproveRejectRequest):
    """
    Aprovar pedido - TRANSACTION
    1. Atualiza pedido para 'aprovado'
    2. Se renovação: atualiza data_expiracao do cliente
    3. Cria log de aprovação
    """
    # Buscar pedido
    pedidos = db.execute_query("SELECT * FROM pedido WHERE id = ?", (pedido_id,))
    if not pedidos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pedido {pedido_id} não encontrado"
        )
    
    pedido = pedidos[0]
    
    if pedido['estado'] != 'pendente':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Pedido já foi {pedido['estado']}"
        )
    
    try:
        # TRANSACTION START (context manager garante commit/rollback)
        with db.get_cursor() as cursor:
            # 1. Atualizar pedido
            cursor.execute(
                "UPDATE pedido SET estado = 'aprovado', gerido_por = ? WHERE id = ?",
                (request.admin_id, pedido_id)
            )
            
            # 2. Se renovação, atualizar cliente
            if pedido['tipo_pedido'] == 'renovação':
                if not request.nova_data_expiracao:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="nova_data_expiracao é obrigatória para renovações"
                    )
                
                cursor.execute(
                    "UPDATE cliente SET data_expiracao = ? WHERE id = ?",
                    (request.nova_data_expiracao, pedido['cliente_id'])
                )
            
            # 3. Criar log
            import secrets
            log_id = secrets.token_hex(16)
            cursor.execute(
                """INSERT INTO log (id, cliente_id, tipo, mensagem)
                   VALUES (?, ?, 'acesso_concedido', ?)""",
                (log_id, pedido['cliente_id'], 
                 f"Pedido de {pedido['tipo_pedido']} aprovado")
            )
        # TRANSACTION END (auto-commit)
        
        return {
            "message": "Pedido aprovado com sucesso",
            "pedido_id": pedido_id,
            "tipo_pedido": pedido['tipo_pedido']
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao aprovar pedido: {str(e)}"
        )


@router.put("/{pedido_id}/reject")
def reject_pedido(pedido_id: str, request: ApproveRejectRequest):
    """
    Rejeitar pedido - TRANSACTION
    1. Atualiza pedido para 'rejeitado'
    2. Cria log de rejeição
    """
    # Buscar pedido
    pedidos = db.execute_query("SELECT * FROM pedido WHERE id = ?", (pedido_id,))
    if not pedidos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pedido {pedido_id} não encontrado"
        )
    
    pedido = pedidos[0]
    
    if pedido['estado'] != 'pendente':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Pedido já foi {pedido['estado']}"
        )
    
    try:
        # TRANSACTION START
        with db.get_cursor() as cursor:
            # 1. Atualizar pedido
            cursor.execute(
                "UPDATE pedido SET estado = 'rejeitado', gerido_por = ? WHERE id = ?",
                (request.admin_id, pedido_id)
            )
            
            # 2. Criar log
            import secrets
            log_id = secrets.token_hex(16)
            cursor.execute(
                """INSERT INTO log (id, cliente_id, tipo, mensagem)
                   VALUES (?, ?, 'acesso_revogado', ?)""",
                (log_id, pedido['cliente_id'], 
                 f"Pedido de {pedido['tipo_pedido']} rejeitado")
            )
        # TRANSACTION END
        
        return {
            "message": "Pedido rejeitado",
            "pedido_id": pedido_id,
            "tipo_pedido": pedido['tipo_pedido']
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao rejeitar pedido: {str(e)}"
        )


@router.delete("/{pedido_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pedido(pedido_id: str):
    """Apagar pedido"""
    rows_affected = db.execute_update("DELETE FROM pedido WHERE id = ?", (pedido_id,))
    
    if rows_affected == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pedido {pedido_id} não encontrado"
        )
    
    return None
