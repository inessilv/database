"""
Pedido API Endpoints (Públicos)
Endpoints para gestão de pedidos de renovação/revogação
"""
from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models.pedido import (
    PedidoCreate, 
    PedidoResponse,
    PedidoApprove,
    PedidoReject
)
from app.services.pedido_service import pedido_service


router = APIRouter()


# ============================================================================
# ENDPOINTS PÚBLICOS
# ============================================================================

@router.get("/all", response_model=List[PedidoResponse])
async def get_all_pedidos():
    """
    Listar todos os pedidos
    """
    try:
        return await pedido_service.get_all_pedidos()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter pedidos: {str(e)}"
        )


@router.get("/pending", response_model=List[PedidoResponse])
async def get_pending_pedidos():
    """
    Listar pedidos pendentes
    """
    try:
        return await pedido_service.get_pending_pedidos()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter pedidos pendentes: {str(e)}"
        )
@router.get("/approved", response_model=List[PedidoResponse])
async def get_approved_pedidos():
    """
    Listar pedidos pendentes
    """
    try:
        return await pedido_service.get_approved_pedidos()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter pedidos aprovados: {str(e)}"
        )

@router.get("/rejected", response_model=List[PedidoResponse])
async def get_rejected_pedidos():
    """
    Listar pedidos pendentes
    """
    try:
        return await pedido_service.get_rejected_pedidos()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter pedidos rejeitados: {str(e)}"
        )


@router.get("/{pedido_id}", response_model=PedidoResponse)
async def get_pedido(pedido_id: str):
    """
    Obter pedido específico por ID
    """
    try:
        return await pedido_service.get_pedido(pedido_id)
    except Exception as e:
        if "404" in str(e) or "não encontrado" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pedido {pedido_id} não encontrado"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter pedido: {str(e)}"
        )


@router.post("/create", response_model=PedidoResponse, status_code=status.HTTP_201_CREATED)
async def create_pedido(pedido: PedidoCreate):
    """
    Criar novo pedido
    """
    try:
        return await pedido_service.create_pedido(pedido)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar pedido: {str(e)}"
        )


@router.post("/{pedido_id}/approve", response_model=PedidoResponse)
async def approve_pedido(pedido_id: str, approve: PedidoApprove):
    """
    Aprovar pedido
    TRANSACTION: Atualiza pedido + estende acesso cliente
    """
    try:
        return await pedido_service.approve_pedido(pedido_id, approve)
    except Exception as e:
        if "404" in str(e) or "não encontrado" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pedido {pedido_id} não encontrado"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao aprovar pedido: {str(e)}"
        )


@router.post("/{pedido_id}/reject", response_model=PedidoResponse)
async def reject_pedido(pedido_id: str, reject: PedidoReject):
    """
    Rejeitar pedido
    TRANSACTION: Atualiza estado do pedido
    """
    try:
        return await pedido_service.reject_pedido(pedido_id, reject)
    except Exception as e:
        if "404" in str(e) or "não encontrado" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pedido {pedido_id} não encontrado"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao rejeitar pedido: {str(e)}"
        )


@router.delete("/{pedido_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pedido(pedido_id: str):
    """
    Apagar pedido
    """
    try:
        await pedido_service.delete_pedido(pedido_id)
        return None
    except Exception as e:
        if "404" in str(e) or "não encontrado" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Pedido {pedido_id} não encontrado"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao apagar pedido: {str(e)}"
        )
