"""
Mock Storage - BD In-Memory
⚠️ ATENÇÃO: Dados são perdidos ao reiniciar o serviço!

Esta é uma implementação temporária para validar comunicação.
Quando a equipa decidir a tecnologia de BD, substituir por:
- app/core/database.py (connection)
- app/models/request.py (ORM models)
- app/services/request_service.py (business logic)
"""

from datetime import datetime
from typing import List, Optional
from app.models.requests import RequestCreate, RequestResponse

# "Base de Dados" in-memory
# ⚠️ Cada réplica do pod terá sua própria cópia!
MOCK_REQUESTS_DB: List[dict] = [
    {
        "id": 1,
        "client_id": 1,
        "demo_id": 1,
        "type": "renewal",
        "reason": "Cliente quer estender período de avaliação",
        "status": "pending",
        "created_at": "2025-10-15T10:00:00Z"
    },
    {
        "id": 2,
        "client_id": 1,
        "demo_id": 2,
        "type": "extension",
        "reason": "Demo expira amanhã, cliente ainda está a avaliar",
        "status": "approved",
        "created_at": "2025-10-14T14:30:00Z"
    },
    {
        "id": 3,
        "client_id": 2,
        "demo_id": 3,
        "type": "renewal",
        "reason": "Equipa do cliente mudou, precisam mais tempo",
        "status": "pending",
        "created_at": "2025-10-16T09:15:00Z"
    }
]

def get_all_requests() -> List[RequestResponse]:
    """
    Retorna todos os pedidos
    
    Em BD real seria: SELECT * FROM requests ORDER BY created_at DESC
    """
    return [RequestResponse(**req) for req in MOCK_REQUESTS_DB]


def get_request_by_id(request_id: int) -> Optional[RequestResponse]:
    """
    Busca pedido por ID
    
    Em BD real seria: SELECT * FROM requests WHERE id = ?
    """
    for req in MOCK_REQUESTS_DB:
        if req["id"] == request_id:
            return RequestResponse(**req)
    return None


def create_request(request_data: RequestCreate) -> RequestResponse:
    """
    Cria novo pedido
    
    Em BD real seria: 
    INSERT INTO requests (client_id, demo_id, type, reason, status, created_at)
    VALUES (?, ?, ?, ?, 'pending', NOW())
    RETURNING *
    """
    # Gerar novo ID (max + 1)
    new_id = max([r["id"] for r in MOCK_REQUESTS_DB], default=0) + 1
    
    # Criar pedido
    new_request = {
        "id": new_id,
        "client_id": request_data.client_id,
        "demo_id": request_data.demo_id,
        "type": request_data.type,
        "reason": request_data.reason,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    
    # Adicionar à "BD"
    MOCK_REQUESTS_DB.append(new_request)
    
    return RequestResponse(**new_request)


def update_request_status(request_id: int, new_status: str) -> Optional[RequestResponse]:
    """
    Atualiza status do pedido
    
    Em BD real seria:
    UPDATE requests SET status = ? WHERE id = ?
    RETURNING *
    """
    for req in MOCK_REQUESTS_DB:
        if req["id"] == request_id:
            req["status"] = new_status
            return RequestResponse(**req)
    return None


def get_requests_by_client(client_id: int) -> List[RequestResponse]:
    """
    Busca pedidos de um cliente
    
    Em BD real seria: SELECT * FROM requests WHERE client_id = ?
    """
    return [
        RequestResponse(**req) 
        for req in MOCK_REQUESTS_DB 
        if req["client_id"] == client_id
    ]