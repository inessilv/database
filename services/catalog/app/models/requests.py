# está só por questões de teste temos de ter a DB a funcionar primeiro é tudo para apagar

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

class RequestBase(BaseModel):
    """Campos base de um pedido"""
    client_id: int = Field(..., description="ID do cliente que fez o pedido", ge=1)
    demo_id: int = Field(..., description="ID da demo a renovar", ge=1)
    type: Literal["renewal", "extension"] = Field(..., description="Tipo de pedido")
    reason: Optional[str] = Field(None, description="Motivo do pedido")

class RequestCreate(RequestBase):
    """Schema para criar novo pedido"""
    pass

class RequestResponse(RequestBase):
    """Schema de resposta (inclui campos gerados)"""
    id: int = Field(..., description="ID único do pedido")
    status: Literal["pending", "approved", "rejected"] = Field(
        default="pending", 
        description="Estado do pedido"
    )
    created_at: str = Field(..., description="Data de criação (ISO format)")
    
    class Config:
        from_attributes = True

class RequestUpdate(BaseModel):
    """Schema para atualizar pedido (apenas status)"""
    status: Literal["approved", "rejected"] = Field(..., description="Novo status")