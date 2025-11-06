"""
Admin CRUD Endpoints
Tabela: admin (id, nome, email, password_hash, contacto)
"""
from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from app.db.connection import DatabaseConnection as db


router = APIRouter()


# ============================================================================
# MODELS (baseados no schema.sql)
# ============================================================================

class AdminBase(BaseModel):
    nome: str
    email: EmailStr
    contacto: Optional[str] = None


class AdminCreate(AdminBase):
    password_hash: str  # Já vem hasheado do Catalog


class AdminUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    password_hash: Optional[str] = None
    contacto: Optional[str] = None


class AdminResponse(AdminBase):
    id: str
    
    class Config:
        from_attributes = True


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/all", response_model=List[AdminResponse])
def get_all_admins():
    """Listar todos os administradores"""
    query = "SELECT id, nome, email, contacto FROM admin"
    admins = db.execute_query(query)
    return admins


# @router.get("/{admin_id}", response_model=AdminResponse)
# def get_admin(admin_id: str):
#     """Obter admin específico por ID"""
#     query = "SELECT id, nome, email, contacto FROM admin WHERE id = ?"
#     admins = db.execute_query(query, (admin_id,))
    
#     if not admins:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f"Admin {admin_id} não encontrado"
#         )
    
#     return admins[0]


# @router.get("/by-email/{email}", response_model=AdminResponse)
# def get_admin_by_email(email: str):
#     """Obter admin por email (para login)"""
#     query = "SELECT id, nome, email, contacto FROM admin WHERE email = ?"
#     admins = db.execute_query(query, (email,))
    
#     if not admins:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f"Admin com email {email} não encontrado"
#         )
    
#     return admins[0]


# @router.get("/by-email-with-password/{email}")
# def get_admin_with_password(email: str):
#     """
#     Obter admin com password_hash (para autenticação)
#     NOTA: Este endpoint inclui password_hash - usar apenas para autenticação
#     """
#     query = "SELECT id, nome, email, password_hash, contacto FROM admin WHERE email = ?"
#     admins = db.execute_query(query, (email,))
    
#     if not admins:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f"Admin com email {email} não encontrado"
#         )
    
#     return admins[0]


# @router.post("/", response_model=AdminResponse, status_code=status.HTTP_201_CREATED)
# def create_admin(admin: AdminCreate):
#     """Criar novo administrador"""
#     # Gerar ID (UUID hex lowercase - igual ao schema)
#     import secrets
#     admin_id = secrets.token_hex(16)
    
#     query = """
#         INSERT INTO admin (id, nome, email, password_hash, contacto)
#         VALUES (?, ?, ?, ?, ?)
#     """
    
#     try:
#         db.execute_insert(
#             query,
#             (admin_id, admin.nome, admin.email, admin.password_hash, admin.contacto)
#         )
#     except Exception as e:
#         # Email duplicado ou outro erro
#         if "UNIQUE constraint failed" in str(e):
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="Email já existe"
#             )
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Erro ao criar admin: {str(e)}"
#         )
    
#     # Retornar admin criado
#     return get_admin(admin_id)


# @router.put("/{admin_id}", response_model=AdminResponse)
# def update_admin(admin_id: str, admin: AdminUpdate):
#     """Atualizar administrador"""
#     # Verificar se existe
#     existing = db.execute_query("SELECT id FROM admin WHERE id = ?", (admin_id,))
#     if not existing:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f"Admin {admin_id} não encontrado"
#         )
    
#     # Construir query dinâmica apenas com campos fornecidos
#     updates = []
#     params = []
    
#     if admin.nome is not None:
#         updates.append("nome = ?")
#         params.append(admin.nome)
    
#     if admin.email is not None:
#         updates.append("email = ?")
#         params.append(admin.email)
    
#     if admin.password_hash is not None:
#         updates.append("password_hash = ?")
#         params.append(admin.password_hash)
    
#     if admin.contacto is not None:
#         updates.append("contacto = ?")
#         params.append(admin.contacto)
    
#     if not updates:
#         # Nenhum campo para atualizar
#         return get_admin(admin_id)
    
#     params.append(admin_id)
#     query = f"UPDATE admin SET {', '.join(updates)} WHERE id = ?"
    
#     try:
#         db.execute_update(query, tuple(params))
#     except Exception as e:
#         if "UNIQUE constraint failed" in str(e):
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="Email já existe"
#             )
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Erro ao atualizar admin: {str(e)}"
#         )
    
#     return get_admin(admin_id)


# @router.delete("/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
# def delete_admin(admin_id: str):
#     """Apagar administrador"""
#     rows_affected = db.execute_update("DELETE FROM admin WHERE id = ?", (admin_id,))
    
#     if rows_affected == 0:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f"Admin {admin_id} não encontrado"
#         )
    
#     return None
