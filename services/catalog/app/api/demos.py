"""
Demo API Endpoints (Públicos)
Endpoints para gestão de demos do catálogo
"""
from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models.demo import DemoCreate, DemoUpdate, DemoResponse
from app.services.demo_service import demo_service


router = APIRouter()


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


@router.post("/", response_model=DemoResponse, status_code=status.HTTP_201_CREATED)
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar demo: {str(e)}"
        )


@router.put("/{demo_id}", response_model=DemoResponse)
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


@router.delete("/{demo_id}", status_code=status.HTTP_204_NO_CONTENT)
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
