"""
Views Endpoints
Expõe as 4 views SQL como endpoints
"""
from fastapi import APIRouter
from typing import List, Dict, Any
from app.db.connection import DatabaseConnection as db


router = APIRouter()


# ============================================================================
# VIEWS ENDPOINTS
# ============================================================================

@router.get("/active-clients")
def get_active_clients_view() -> List[Dict[str, Any]]:
    """
    View: v_active_clients
    Clientes ativos com status de acesso
    """
    query = "SELECT * FROM v_active_clients ORDER BY access_status, nome"
    return db.execute_query(query)


@router.get("/active-demos")
def get_active_demos_view() -> List[Dict[str, Any]]:
    """
    View: v_active_demos
    Demos ativas com info do criador
    """
    query = "SELECT * FROM v_active_demos ORDER BY nome"
    return db.execute_query(query)


@router.get("/pending-requests")
def get_pending_requests_view() -> List[Dict[str, Any]]:
    """
    View: v_pending_requests
    Pedidos pendentes com info do cliente
    """
    query = "SELECT * FROM v_pending_requests"
    return db.execute_query(query)


@router.get("/client-stats")
def get_client_stats_view() -> List[Dict[str, Any]]:
    """
    View: v_client_stats
    Estatísticas de uso por cliente
    """
    query = "SELECT * FROM v_client_stats ORDER BY total_opens DESC"
    return db.execute_query(query)


@router.get("/client-stats/{cliente_id}")
def get_client_stats_by_id(cliente_id: str) -> Dict[str, Any]:
    """
    View: v_client_stats
    Estatísticas de um cliente específico
    """
    query = "SELECT * FROM v_client_stats WHERE id = ?"
    results = db.execute_query(query, (cliente_id,))
    
    if not results:
        # Cliente existe mas não tem stats
        return {
            "id": cliente_id,
            "demos_opened": 0,
            "total_opens": 0,
            "total_logins": 0,
            "ultima_atividade": None
        }
    
    return results[0]
