"""
Demo API Endpoints (Públicos)
Endpoints para gestão de demos do catálogo
"""
from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models.demo import DemoCreate, DemoUpdate, DemoResponse
from app.services.demo_service import demo_service
from pydantic import BaseModel
from app.models.log import LogCreate
from app.services.log_service import log_service


router = APIRouter()

class OpenDemoRequest(BaseModel):
    """Request para abrir demo"""
    cliente_id: str

# ============================================================================
# ENDPOINTS PÚBLICOS
# ============================================================================

@router.get("/all", response_model=List[DemoResponse])
async def get_all_demos():
    """
    Listar todas as demos
    """
    try:
        return await demo_service.get_all_demos()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter demos: {str(e)}"
        )


@router.get("/active", response_model=List[DemoResponse])
async def get_active_demos():
    """
    Listar apenas demos ativas
    """
    try:
        return await demo_service.get_active_demos()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter demos ativas: {str(e)}"
        )


@router.get("/by-vertical/{vertical}", response_model=List[DemoResponse])
async def get_demos_by_vertical(vertical: str):
    """
    Listar demos por vertical
    """
    try:
        return await demo_service.get_demos_by_vertical(vertical)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter demos por vertical: {str(e)}"
        )


@router.get("/by-horizontal/{horizontal}", response_model=List[DemoResponse])
async def get_demos_by_horizontal(horizontal: str):
    """
    Listar demos por horizontal
    """
    try:
        return await demo_service.get_demos_by_horizontal(horizontal)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter demos por horizontal: {str(e)}"
        )


@router.get("/{demo_id}", response_model=DemoResponse)
async def get_demo(demo_id: str):
    """
    Obter demo específica por ID
    """
    try:
        return await demo_service.get_demo(demo_id)
    except Exception as e:
        if "404" in str(e) or "não encontrado" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Demo {demo_id} não encontrada"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter demo: {str(e)}"
        )


@router.post("/{demo_id}/open", status_code=status.HTTP_201_CREATED)
async def open_demo(demo_id: str, request: OpenDemoRequest):
    """
    Registar que um cliente abriu uma demo
    
    Cria log do tipo 'demo_aberta' com cliente_id e demo_id
    """
    try:
        # Verificar se demo existe
        demo = await demo_service.get_demo(demo_id)
        if not demo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Demo {demo_id} não encontrada"
            )
        
        # Criar log de demo_aberta
        log = LogCreate(
            tipo="demo_aberta",
            cliente_id=request.cliente_id,
            demo_id=demo_id,
            mensagem=f"Cliente abriu demo: {demo.nome}"
        )
        
        created_log = await log_service.create_log(log)
        
        return {
            "message": "Demo aberta registada com sucesso",
            "log_id": created_log.id,
            "demo": {
                "id": demo.id,
                "nome": demo.nome,
                "url": demo.url
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao registar abertura de demo: {str(e)}"
        )


@router.post("/create", response_model=DemoResponse, status_code=status.HTTP_201_CREATED)
async def create_demo(demo: DemoCreate):
    """
    Criar nova demo
    """
    try:
        return await demo_service.create_demo(demo)
    except Exception as e:
        if "já existe" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Código projeto já existe"
            )
        # Adicionar informação do criado_por no erro para debug
        error_msg = f"Erro ao criar demo: {str(e)}"
        if hasattr(demo, 'criado_por'):
            error_msg += f" (criado_por={demo.criado_por})"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )


@router.put("/{demo_id}/update", response_model=DemoResponse)
async def update_demo(demo_id: str, demo: DemoUpdate):
    """
    Atualizar demo
    """
    try:
        return await demo_service.update_demo(demo_id, demo)
    except Exception as e:
        if "404" in str(e) or "não encontrado" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Demo {demo_id} não encontrada"
            )
        if "já existe" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Código projeto já existe"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar demo: {str(e)}"
        )


@router.delete("/{demo_id}/delete", status_code=status.HTTP_204_NO_CONTENT)
async def delete_demo(demo_id: str):
    """
    Apagar demo
    """
    try:
        await demo_service.delete_demo(demo_id)
        return None
    except Exception as e:
        if "404" in str(e) or "não encontrado" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Demo {demo_id} não encontrada"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao apagar demo: {str(e)}"
        )
