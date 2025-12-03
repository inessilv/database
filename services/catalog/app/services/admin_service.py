"""
Admin Service - Lógica de negócio para administradores
Autenticação via Microsoft OAuth apenas
"""
from typing import List
from app.services.database_client import db_client
from app.models.admin import AdminCreate, AdminUpdate, AdminResponse


class AdminService:
    """Service para lógica de negócio de administradores"""
    
    async def get_all_admins(self) -> List[AdminResponse]:
        """Obter todos os administradores"""
        admins = await db_client.get_all_admins()
        return [AdminResponse(**admin) for admin in admins]
    
    async def get_admin(self, admin_id: str) -> AdminResponse:
        """Obter administrador por ID"""
        admin = await db_client.get_admin(admin_id)
        return AdminResponse(**admin)
    
    async def get_admin_by_email(self, email: str) -> AdminResponse:
        """Obter administrador por email"""
        admin = await db_client.get_admin_by_email(email)
        return AdminResponse(**admin)
    
    async def create_admin(self, admin_data: AdminCreate) -> AdminResponse:
        """Criar novo administrador"""
        db_data = {
            "nome": admin_data.nome,
            "email": admin_data.email,
            "contacto": admin_data.contacto
        }
        
        admin = await db_client.create_admin(db_data)
        return AdminResponse(**admin)
    
    async def update_admin(self, admin_id: str, admin_data: AdminUpdate) -> AdminResponse:
        """Atualizar administrador"""
        db_data = {}
        
        if admin_data.nome is not None:
            db_data["nome"] = admin_data.nome
        
        if admin_data.email is not None:
            db_data["email"] = admin_data.email
        
        if admin_data.contacto is not None:
            db_data["contacto"] = admin_data.contacto
        
        admin = await db_client.update_admin(admin_id, db_data)
        return AdminResponse(**admin)
    
    async def delete_admin(self, admin_id: str) -> None:
        """Apagar administrador"""
        await db_client.delete_admin(admin_id)


# Singleton instance
admin_service = AdminService()
