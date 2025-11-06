"""
Pedido Service
Lógica de negócio para Pedidos (renovação/revogação)
"""
from typing import List, Dict, Any
from app.models.pedido import (
    PedidoCreate, 
    PedidoUpdate, 
    PedidoResponse,
    PedidoApprove,
    PedidoReject
)
from app.services.database_client import db_client


class PedidoService:
    """Service para gestão de pedidos"""
    
    async def get_all_pedidos(self) -> List[PedidoResponse]:
        """Obter todos os pedidos"""
        pedidos = await db_client.get_all_pedidos()
        return [PedidoResponse(**p) for p in pedidos]
    
    async def get_pending_pedidos(self) -> List[PedidoResponse]:
        """Obter pedidos pendentes"""
        pedidos = await db_client.get_pending_pedidos()
        return [PedidoResponse(**p) for p in pedidos]
    
    async def get_pedido(self, pedido_id: str) -> PedidoResponse:
        """Obter pedido por ID"""
        pedido = await db_client.get_pedido(pedido_id)
        return PedidoResponse(**pedido)
    
    async def create_pedido(self, pedido: PedidoCreate) -> PedidoResponse:
        """Criar novo pedido"""
        pedido_data = pedido.model_dump()
        created = await db_client.create_pedido(pedido_data)
        return PedidoResponse(**created)
    
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
            approve.admin_id,
            approve.nova_data_expiracao
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
