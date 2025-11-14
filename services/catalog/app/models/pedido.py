"""
Pedido Models
Models Pydantic para Pedidos de renovação/revogação
"""
from pydantic import BaseModel, Field
from typing import Optional


class PedidoBase(BaseModel):
    """Base model para Pedido"""
    cliente_id: str = Field(..., description="ID do cliente")
    tipo_pedido: str = Field(..., pattern="^(renovação|revogação)$")


class PedidoCreate(PedidoBase):
    """Model para criar Pedido"""
    pass


class PedidoUpdate(BaseModel):
    """Model para atualizar Pedido (aprovar/rejeitar)"""
    estado: str = Field(..., pattern="^(pendente|aprovado|rejeitado)$")
    gerido_por: str = Field(..., description="ID do admin que aprovou/rejeitou")
    nova_data_expiracao: Optional[str] = Field(None, description="Nova data se aprovado")


class PedidoResponse(PedidoBase):
    """Model para resposta de Pedido"""
    id: str
    estado: str
    criado_em: str
    gerido_por: Optional[str]
    
    class Config:
        from_attributes = True

class PedidoResponseCliente(PedidoResponse):
    cliente_nome: str
    cliente_email:str
    data_expiracao_atual: str


class PedidoApprove(BaseModel):
    """Model para aprovar pedido"""
    admin_id: str = Field(..., description="ID do admin aprovando")

class PedidoReject(BaseModel):
    """Model para rejeitar pedido"""
    admin_id: str = Field(..., description="ID do admin rejeitando")
