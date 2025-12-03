"""
Cliente API Endpoints (Públicos)
Endpoints para gestão de clientes
"""
from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models.cliente import ClienteCreate, ClienteUpdate, ClienteResponse
from app.services.cliente_service import cliente_service


router = APIRouter()


# ============================================================================
# ENDPOINTS PÚBLICOS
# ============================================================================

@router.get("/all", response_model=List[ClienteResponse])
async def get_all_clientes():
    """
    Listar todos os clientes
    """
    try:
        return await cliente_service.get_all_clientes()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter clientes: {str(e)}"
        )


@router.get("/active", response_model=List[ClienteResponse])
async def get_active_clientes():
    """
    Listar clientes ativos (não expirados)
    """
    try:
        return await cliente_service.get_active_clientes()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter clientes ativos: {str(e)}"
        )


@router.get("/expired", response_model=List[ClienteResponse])
async def get_expired_clientes():
    """
    Listar clientes expirados
    """
    try:
        return await cliente_service.get_expired_clientes()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter clientes expirados: {str(e)}"
        )


@router.get("/{cliente_id}", response_model=ClienteResponse)
async def get_cliente(cliente_id: str):
    """
    Obter cliente específico por ID
    """
    try:
        return await cliente_service.get_cliente(cliente_id)
    except Exception as e:
        if "404" in str(e) or "não encontrado" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cliente {cliente_id} não encontrado"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter cliente: {str(e)}"
        )


@router.get("/by-email/{email}", response_model=ClienteResponse)
async def get_cliente_by_email(email: str):
    """
    Obter cliente por email
    """
    try:
        return await cliente_service.get_cliente_by_email(email)
    except Exception as e:
        if "404" in str(e) or "não encontrado" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cliente com email {email} não encontrado"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter cliente: {str(e)}"
        )


@router.post("/", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
async def create_cliente(cliente: ClienteCreate):
    """
    Criar novo cliente
    Password será automaticamente hasheada
    """
    try:
        return await cliente_service.create_cliente(cliente)
    except Exception as e:
        if "já existe" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já existe"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar cliente: {str(e)}"
        )


@router.put("/{cliente_id}", response_model=ClienteResponse)
async def update_cliente(cliente_id: str, cliente: ClienteUpdate):
    """
    Atualizar cliente
    Se password fornecida, será automaticamente hasheada
    """
    try:
        return await cliente_service.update_cliente(cliente_id, cliente)
    except Exception as e:
        if "404" in str(e) or "não encontrado" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cliente {cliente_id} não encontrado"
            )
        if "já existe" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já existe"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar cliente: {str(e)}"
        )


@router.delete("/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_cliente_access(cliente_id: str):
    """
    Revogar acesso do cliente (expira imediatamente)
    Define data_expiracao como datetime.now
    """
    try:
        await cliente_service.revoke_access(cliente_id)
        return None
    except Exception as e:
        if "404" in str(e) or "não encontrado" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cliente {cliente_id} não encontrado"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao revogar acesso: {str(e)}"
        )

