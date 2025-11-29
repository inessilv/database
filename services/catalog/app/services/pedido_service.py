from typing import List, Dict, Any
from app.models.pedido import (
    PedidoCreate, 
    PedidoUpdate, 
    PedidoResponse,
    PedidoApprove,
    PedidoReject,
    PedidoResponseCliente
)
from app.services.database_client import db_client


class PedidoService:
    """Service para gestão de pedidos"""
    
    async def get_all_pedidos(self) -> List[PedidoResponseCliente]:
        """Obter todos os pedidos"""
        pedidos = await db_client.get_all_pedidos()
        return [PedidoResponseCliente(**p) for p in pedidos]
    
    async def get_pending_pedidos(self) -> List[PedidoResponseCliente]:
        """Obter pedidos pendentes"""
        pedidos = await db_client.get_pending_pedidos()
        return [PedidoResponseCliente(**p) for p in pedidos]
    
    async def get_approved_pedidos(self) -> List[PedidoResponseCliente]:
        """Obter pedidos aprovados"""
        pedidos = await db_client.get_approved_pedidos()
        return [PedidoResponseCliente(**p) for p in pedidos]
    
    async def get_rejected_pedidos(self) -> List[PedidoResponseCliente]:
        """Obter pedidos rejeitados"""
        pedidos = await db_client.get_rejected_pedidos()
        return [PedidoResponseCliente(**p) for p in pedidos]
    
    async def get_pedido(self, pedido_id: str) -> PedidoResponseCliente:
        """Obter pedido por ID"""
        pedido = await db_client.get_pedido(pedido_id)
        return PedidoResponseCliente(**pedido)
    

    async def getByClienteId(self, cliente_id: str) -> PedidoResponseCliente:
        """Obter pedido por ID"""
        pedido = await db_client.get_pedido_by_cliente(cliente_id)
        return PedidoResponseCliente(**pedido)
    
    async def create_pedido(self, pedido: PedidoCreate) -> PedidoResponseCliente:
        """Criar novo pedido"""
        pedido_data = pedido.model_dump()
        created = await db_client.create_pedido(pedido_data)
        return PedidoResponseCliente(**created)
    
    async def approve_pedido(
        self, 
        pedido_id: str, 
        approve: PedidoApprove
    ) -> PedidoResponse:
        """
        Aprovar pedido
        TRANSACTION: Atualiza pedido + estende acesso do cliente
        """
        
        updated = await db_client.approve_pedido(
            pedido_id,
            approve.admin_id
        )
        return PedidoResponse(**updated)
    
    async def reject_pedido(
        self, 
        pedido_id: str, 
        reject: PedidoReject
    ) -> PedidoResponse:
        """
        Rejeitar pedido
        TRANSACTION: Atualiza estado do pedido
        """
        updated = await db_client.reject_pedido(
            pedido_id,
            reject.admin_id
        )
        return PedidoResponse(**updated)
    
    async def delete_pedido(self, pedido_id: str) -> None:
        """Apagar pedido"""
        await db_client.delete_pedido(pedido_id)


# Singleton instance
pedido_service = PedidoService()
