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

class PedidoResponseCliente(PedidoResponse):
    cliente_nome: str
    cliente_email:str
    data_expiracao_atual: str


class ApproveRejectRequest(BaseModel):
    admin_id: str  # Quem está a aprovar/rejeitar
    nova_data_expiracao: Optional[str] = None  # Apenas para aprovações de renovação


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/all", response_model=List[PedidoResponseCliente])
def get_all_pedidos():
    """Listar todos os pedidos"""
    query = "SELECT * FROM pedido ORDER BY criado_em DESC"
    pedidos = db.execute_query(query)
    #Inicio de Teste ---------------
    results = []
    for pedido in pedidos:
        
        cliente = db.execute_query(
            "SELECT nome, email, data_expiracao FROM cliente WHERE id = ?",
            (pedido["cliente_id"],)
        )
        cliente = cliente[0] if cliente else None

        # Construir o resultado final
        result = {
            **pedido,
            "cliente_nome": cliente["nome"],
            "cliente_email": cliente["email"],
            "data_expiracao_atual": cliente["data_expiracao"],
        }
        results.append(result)

    #Fim de Teste -------------------
    return results


@router.get("/pending", response_model=List[PedidoResponseCliente])
def get_pending_pedidos():
    """Listar pedidos pendentes"""
    query = """
        SELECT * FROM pedido 
        WHERE estado = 'pendente' 
        ORDER BY criado_em ASC
    """
    pedidos = db.execute_query(query)
    #Inicio de Teste ---------------
    results = []
    for pedido in pedidos:
        
        cliente = db.execute_query(
            "SELECT nome, email, data_expiracao FROM cliente WHERE id = ?",
            (pedido["cliente_id"],)
        )
        cliente = cliente[0] if cliente else None

        # Construir o resultado final
        result = {
            **pedido,
            "cliente_nome": cliente["nome"],
            "cliente_email": cliente["email"],
            "data_expiracao_atual": cliente["data_expiracao"],
        }
        results.append(result)

    #Fim de Teste -------------------
    return results

@router.get("/approved", response_model=List[PedidoResponseCliente])
def get_approved_pedidos():
    """Listar pedidos aprovados"""
    query = """
        SELECT * FROM pedido 
        WHERE estado = 'aprovado' 
        ORDER BY criado_em ASC
    """
    pedidos = db.execute_query(query)
    #Inicio de Teste ---------------
    results = []
    for pedido in pedidos:
        
        cliente = db.execute_query(
            "SELECT nome, email, data_expiracao FROM cliente WHERE id = ?",
            (pedido["cliente_id"],)
        )
        cliente = cliente[0] if cliente else None

        # Construir o resultado final
        result = {
            **pedido,
            "cliente_nome": cliente["nome"],
            "cliente_email": cliente["email"],
            "data_expiracao_atual": cliente["data_expiracao"],
        }
        results.append(result)

    #Fim de Teste -------------------
    return results

@router.get("/rejected", response_model=List[PedidoResponseCliente])
def get_rejected_pedidos():
    """Listar pedidos rejeitados"""
    query = """
        SELECT * FROM pedido 
        WHERE estado = 'rejeitado' 
        ORDER BY criado_em ASC
    """
    pedidos = db.execute_query(query)
    #Inicio de Teste ---------------
    results = []
    for pedido in pedidos:
        
        cliente = db.execute_query(
            "SELECT nome, email, data_expiracao FROM cliente WHERE id = ?",
            (pedido["cliente_id"],)
        )
        cliente = cliente[0] if cliente else None

        # Construir o resultado final
        result = {
            **pedido,
            "cliente_nome": cliente["nome"],
            "cliente_email": cliente["email"],
            "data_expiracao_atual": cliente["data_expiracao"],
        }
        results.append(result)

    #Fim de Teste -------------------
    return results


@router.get("/{pedido_id}", response_model=PedidoResponseCliente)
def get_pedido(pedido_id: str):
    """Obter pedido específico por ID"""
    query = "SELECT * FROM pedido WHERE id = ?"
    pedidos = db.execute_query(query, (pedido_id.strip(),))
    
    if not pedidos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pedido {pedido_id} não encontrado"
        )
    pedido = pedidos[0]
    cliente = db.execute_query(
        "SELECT nome, email, data_expiracao FROM cliente WHERE id = ?",
        (pedido["cliente_id"],)
    )
    cliente = cliente[0] if cliente else None

    # Construir o resultado final
    result = {
        **pedido,
        "cliente_nome": cliente["nome"],
        "cliente_email": cliente["email"],
        "data_expiracao_atual": cliente["data_expiracao"],
    }
    return result


@router.post("/create", response_model=PedidoResponse, status_code=status.HTTP_201_CREATED)
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


@router.post("/{pedido_id}/approve")
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
                cursor.execute(
                    """
                    UPDATE cliente
                    SET data_expiracao = DATETIME(data_expiracao, '+30 days')
                    WHERE id = ?
                    """,
                    (pedido['cliente_id'],)
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
        query = "SELECT * FROM pedido WHERE id = ?"
        pedidos = db.execute_query(query, (pedido_id.strip(),))
        pedido = pedidos[0]

        return pedido
        
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao aprovar pedido: {str(e)}"
        )


@router.post("/{pedido_id}/reject")
def reject_pedido(pedido_id: str, request: ApproveRejectRequest):
    """
    Rejeitar pedido - TRANSACTION
    1. Atualiza pedido para 'rejeitado'
    2. Cria log de rejeição
    """
    # Buscar pedido
    query = "SELECT * FROM pedido WHERE id = ?"
    pedidos = db.execute_query(query, (pedido_id.strip(),))
    
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
    
    admin = db.execute_query("SELECT id FROM admin WHERE id = ?", (request.admin_id,))
    if not admin:
        print(f"[WARN] Administrador {request.admin_id} não encontrado")
        raise HTTPException(
            status_code=400,
            detail=f"Administrador {request.admin_id} não encontrado"
        )
    try:
        # TRANSACTION START
        with db.get_cursor() as cursor:
            # 1. Atualizar pedido
        
            cursor.execute(
                "UPDATE pedido SET estado = 'rejeitado', gerido_por = ? WHERE id = ?",
                (request.admin_id, pedido_id)
            )
            

            # # 2. Criar log
            # import secrets
            # log_id = secrets.token_hex(16)
            # cursor.execute(
            #     """INSERT INTO log (id, cliente_id, tipo, mensagem)
            #        VALUES (?, ?, 'acesso_revogado', ?)""",
            #     (log_id, pedido['cliente_id'], 
            #      f"Pedido de {pedido['tipo_pedido']} rejeitado")
            # )
        # TRANSACTION END
        query = "SELECT * FROM pedido WHERE id = ?"
        pedidos = db.execute_query(query, (pedido_id.strip(),))
        return pedidos[0]
        # return {
        #     "message": "Pedido rejeitado",
        #     "pedido_id": pedido_id,
        #     "tipo_pedido": pedido['tipo_pedido']
        # }
    
    except Exception as e:
         import traceback; traceback.print_exc()
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Erro ao rejeitar pedido no DB: {str(e)}"
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
