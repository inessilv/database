"""
Admin Service - Lógica de negócio para administradores
"""
import hashlib
from typing import List
from app.services.database_client import db_client
from app.models.admin import AdminCreate, AdminUpdate, AdminResponse


class AdminService:
    """Service para lógica de negócio de administradores"""
    
    @staticmethod
    def _hash_password(password: str) -> str:
        """Hash password usando SHA256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
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
        """
        Criar novo administrador
        Hasheia a password antes de enviar para a database
        """
        # Hash password
        password_hash = self._hash_password(admin_data.password)
        
        # Preparar dados para database
        db_data = {
            "nome": admin_data.nome,
            "email": admin_data.email,
            "password_hash": password_hash,
            "contacto": admin_data.contacto
        }
        
        # Criar na database
        admin = await db_client.create_admin(db_data)
        return AdminResponse(**admin)
    
    async def update_admin(self, admin_id: str, admin_data: AdminUpdate) -> AdminResponse:
        """
        Atualizar administrador
        Se password foi fornecida, hasheia antes de enviar
        """
        # Preparar dados para database
        db_data = {}
        
        if admin_data.nome is not None:
            db_data["nome"] = admin_data.nome
        
        if admin_data.email is not None:
            db_data["email"] = admin_data.email
        
        if admin_data.password is not None:
            db_data["password_hash"] = self._hash_password(admin_data.password)
        
        if admin_data.contacto is not None:
            db_data["contacto"] = admin_data.contacto
        
        # Atualizar na database
        admin = await db_client.update_admin(admin_id, db_data)
        return AdminResponse(**admin)
    
    async def delete_admin(self, admin_id: str) -> None:
        """Apagar administrador"""
        await db_client.delete_admin(admin_id)
    
    async def verify_admin_credentials(self, email: str, password: str) -> AdminResponse:
        """
        Verificar credenciais de admin (para login)
        Retorna admin se credenciais válidas, caso contrário lança exceção
        """
        # Obter admin com password_hash
        admin = await db_client.get_admin_with_password(email)
        
        # Verificar password
        password_hash = self._hash_password(password)
        if admin["password_hash"] != password_hash:
            raise Exception("Credenciais inválidas")
        
        # Retornar admin (sem password_hash)
        return AdminResponse(
            id=admin["id"],
            nome=admin["nome"],
            email=admin["email"],
            contacto=admin.get("contacto")
        )


# Singleton instance
admin_service = AdminService()
