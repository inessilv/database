from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models.requests import RequestCreate, RequestResponse, RequestUpdate
from app.storage import (
    get_all_requests,
    get_request_by_id,
    create_request,
    update_request_status
)

router = APIRouter()

@router.get("/all", response_model=List[RequestResponse], summary="Listar todos os pedidos")
async def list_requests():
    """
    Retorna lista de todos os pedidos de renovação/extensão
    
    **Retorna:**
    - Lista de pedidos com todos os campos
    """
    requests = get_all_requests()
    return requests


@router.get("/{request_id}", response_model=RequestResponse, summary="Obter pedido específico")
async def get_request(request_id: int):
    """
    Retorna detalhes de um pedido específico
    
    **Parâmetros:**
    - request_id: ID do pedido
    
    **Retorna:**
    - Dados completos do pedido
    
    **Erros:**
    - 404: Pedido não encontrado
    """
    request = get_request_by_id(request_id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pedido com ID {request_id} não encontrado"
        )
    return request


@router.post("/", response_model=RequestResponse, status_code=status.HTTP_201_CREATED, summary="Criar novo pedido")
async def create_new_request(request_data: RequestCreate):
    """
    Cria um novo pedido de renovação/extensão
    
    **Body:**
    - client_id: ID do cliente (obrigatório)
    - demo_id: ID da demo (obrigatório)
    - type: "renewal" ou "extension" (obrigatório)
    - reason: Motivo do pedido (opcional)
    
    **Retorna:**
    - Pedido criado com ID e status "pending"
    """
    new_request = create_request(request_data)
    return new_request


@router.put("/{request_id}", response_model=RequestResponse, summary="Atualizar status do pedido")
async def update_request(request_id: int, update_data: RequestUpdate):
    """
    Atualiza status de um pedido (aprovar/rejeitar)
    
    **Parâmetros:**
    - request_id: ID do pedido
    
    **Body:**
    - status: "approved" ou "rejected"
    
    **Retorna:**
    - Pedido atualizado
    
    **Erros:**
    - 404: Pedido não encontrado
    """
    updated_request = update_request_status(request_id, update_data.status)
    if not updated_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pedido com ID {request_id} não encontrado"
        )
    return updated_request