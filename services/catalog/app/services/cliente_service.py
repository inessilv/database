"""
Cliente Service
Lógica de negócio para Clientes
"""
from typing import List, Dict, Any
from app.models.cliente import ClienteCreate, ClienteUpdate, ClienteResponse
from app.services.database_client import db_client
import hashlib


class ClienteService:
    """Service para gestão de clientes"""
    
    @staticmethod
    def _hash_password(password: str) -> str:
        """Hash password usando SHA256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
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
        """
        Criar novo cliente
        Password é automaticamente hasheada
        """
        cliente_data = cliente.model_dump()
        
        # Hash da password
        cliente_data['password_hash'] = self._hash_password(cliente_data.pop('password'))
        
        created = await db_client.create_cliente(cliente_data)
        return ClienteResponse(**created)
    
    async def update_cliente(self, cliente_id: str, cliente: ClienteUpdate) -> ClienteResponse:
        """
        Atualizar cliente
        Se password fornecida, é automaticamente hasheada
        """
        update_data = cliente.model_dump(exclude_none=True)
        
        # Se password fornecida, fazer hash
        if 'password' in update_data:
            update_data['password_hash'] = self._hash_password(update_data.pop('password'))
        
        updated = await db_client.update_cliente(cliente_id, update_data)
        return ClienteResponse(**updated)
    

    async def verify_cliente_credentials(self, email: str, password: str) -> ClienteResponse:
        """
        Verificar credenciais de login
        Retorna dados do cliente se credenciais válidas
        """
        # Obter cliente com password
        cliente = await db_client.get_cliente_with_password(email)
        
        # Verificar password
        password_hash = self._hash_password(password)
        if cliente.get('password_hash') != password_hash:
            raise Exception("Credenciais inválidas")
        
        # Remover password_hash antes de retornar
        cliente.pop('password_hash', None)
        return ClienteResponse(**cliente)


# Singleton instance
cliente_service = ClienteService()
