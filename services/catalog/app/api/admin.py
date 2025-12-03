"""
Admin API Endpoints (Públicos)
Endpoints para gestão de administradores
"""
from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models.admin import AdminCreate, AdminUpdate, AdminResponse
from app.services.admin_service import admin_service


router = APIRouter()


# ============================================================================
# ENDPOINTS PÚBLICOS
# ============================================================================

@router.get("/all", response_model=List[AdminResponse])
async def get_all_admins():
    """
    Listar todos os administradores
    """
    try:
        return await admin_service.get_all_admins()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter administradores: {str(e)}"
        )


@router.get("/{admin_id}", response_model=AdminResponse)
async def get_admin(admin_id: str):
    """
    Obter administrador específico por ID
    """
    try:
        return await admin_service.get_admin(admin_id)
    except Exception as e:
        if "404" in str(e) or "não encontrado" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Administrador {admin_id} não encontrado"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter administrador: {str(e)}"
        )


@router.get("/by-email/{email}", response_model=AdminResponse)
async def get_admin_by_email(email: str):
    """
    Obter administrador por email
    """
    try:
        return await admin_service.get_admin_by_email(email)
    except Exception as e:
        if "404" in str(e) or "não encontrado" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Administrador com email {email} não encontrado"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao obter administrador: {str(e)}"
        )


@router.post("/", response_model=AdminResponse, status_code=status.HTTP_201_CREATED)
async def create_admin(admin: AdminCreate):
    """
    Criar novo administrador
    """
    try:
        return await admin_service.create_admin(admin)
    except Exception as e:
        if "já existe" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já existe"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar administrador: {str(e)}"
        )


@router.put("/{admin_id}", response_model=AdminResponse)
async def update_admin(admin_id: str, admin: AdminUpdate):
    """
    Atualizar administrador
    """
    try:
        return await admin_service.update_admin(admin_id, admin)
    except Exception as e:
        if "404" in str(e) or "não encontrado" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Administrador {admin_id} não encontrado"
            )
        if "já existe" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email já existe"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar administrador: {str(e)}"
        )


@router.delete("/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_admin(admin_id: str):
    """
    Apagar administrador
    """
    try:
        await admin_service.delete_admin(admin_id)
        return None
    except Exception as e:
        if "404" in str(e) or "não encontrado" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Administrador {admin_id} não encontrado"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao apagar administrador: {str(e)}"
        )

