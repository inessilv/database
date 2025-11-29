"""
Cliente Service
Lógica de negócio para Clientes
Autenticação via Microsoft OAuth apenas
"""
from typing import List
from app.models.cliente import ClienteCreate, ClienteUpdate, ClienteResponse
from app.services.database_client import db_client


class ClienteService:
    """Service para gestão de clientes"""
    
    async def get_all_clientes(self) -> List[ClienteResponse]:
        """Obter todos os clientes"""
        clientes = await db_client.get_all_clientes()
        return [ClienteResponse(**c) for c in clientes]
    
    async def get_active_clientes(self) -> List[ClienteResponse]:
        """Obter clientes ativos (não expirados)"""
        clientes = await db_client.get_active_clientes()
        return [ClienteResponse(**c) for c in clientes]
    
    async def get_expired_clientes(self) -> List[ClienteResponse]:
        """Obter clientes expirados"""
        clientes = await db_client.get_expired_clientes()
        return [ClienteResponse(**c) for c in clientes]
    
    async def get_cliente(self, cliente_id: str) -> ClienteResponse:
        """Obter cliente por ID"""
        cliente = await db_client.get_cliente(cliente_id)
        return ClienteResponse(**cliente)
    
    async def get_cliente_by_email(self, email: str) -> ClienteResponse:
        """Obter cliente por email"""
        cliente = await db_client.get_cliente_by_email(email)
        return ClienteResponse(**cliente)
    
    async def create_cliente(self, cliente: ClienteCreate) -> ClienteResponse:
        """Criar novo cliente"""
        cliente_data = cliente.model_dump()
        created = await db_client.create_cliente(cliente_data)
        return ClienteResponse(**created)
    
    async def update_cliente(self, cliente_id: str, cliente: ClienteUpdate) -> ClienteResponse:
        """Atualizar cliente"""
        update_data = cliente.model_dump(exclude_none=True)
        updated = await db_client.update_cliente(cliente_id, update_data)
        return ClienteResponse(**updated)


# Singleton instance
cliente_service = ClienteService()
