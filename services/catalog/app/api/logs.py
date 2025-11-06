"""
Log API Endpoints (Públicos)
Endpoints para gestão de logs de atividade
"""
from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Dict, Any
from app.models.log import LogCreate, LogResponse
from app.services.log_service import log_service


router = APIRouter()


# ============================================================================
# ENDPOINTS PÚBLICOS
# ============================================================================

@router.get("/all", response_model=List[LogResponse])
async def get_all_logs(limit: int = Query(default=100, ge=1, le=1000)):
    """
    Listar todos os logs (com limite)
    """
    try:
        return await log_service.get_all_logs(limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter logs: {str(e)}"
        )


@router.get("/by-cliente/{cliente_id}", response_model=List[LogResponse])
async def get_logs_by_cliente(
    cliente_id: str,
    limit: int = Query(default=50, ge=1, le=500)
):
    """
    Obter logs de um cliente específico
    """
    try:
        return await log_service.get_logs_by_cliente(cliente_id, limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter logs do cliente: {str(e)}"
        )


@router.get("/by-demo/{demo_id}", response_model=List[LogResponse])
async def get_logs_by_demo(
    demo_id: str,
    limit: int = Query(default=50, ge=1, le=500)
):
    """
    Obter logs de uma demo específica
    """
    try:
        return await log_service.get_logs_by_demo(demo_id, limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter logs da demo: {str(e)}"
        )


@router.post("/", response_model=LogResponse, status_code=status.HTTP_201_CREATED)
async def create_log(log: LogCreate):
    """
    Criar novo log de atividade
    """
    try:
        return await log_service.create_log(log)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar log: {str(e)}"
        )


@router.get("/stats/summary", response_model=List[Dict[str, Any]])
async def get_log_stats():
    """
    Obter estatísticas resumidas dos logs
    """
    try:
        return await log_service.get_log_stats()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter estatísticas: {str(e)}"
        )
