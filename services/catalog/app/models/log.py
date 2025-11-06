"""
Log Models
Models Pydantic para Logs de atividade
"""
from pydantic import BaseModel, Field
from typing import Optional


class LogBase(BaseModel):
    """Base model para Log"""
    tipo: str = Field(
        ..., 
        pattern="^(login|logout|demo_aberta|demo_fechada|acesso_concedido|acesso_revogado|erro|aviso)$"
    )
    mensagem: Optional[str] = None


class LogCreate(LogBase):
    """Model para criar Log"""
    cliente_id: Optional[str] = Field(None, description="ID do cliente (NULL para eventos sistema)")
    demo_id: Optional[str] = Field(None, description="ID da demo (NULL para eventos gerais)")


class LogResponse(LogBase):
    """Model para resposta de Log"""
    id: str
    cliente_id: Optional[str]
    demo_id: Optional[str]
    timestamp: str
    
    class Config:
        from_attributes = True


class LogFilter(BaseModel):
    """Model para filtrar logs"""
    cliente_id: Optional[str] = None
    demo_id: Optional[str] = None
    tipo: Optional[str] = None
    limit: int = Field(default=100, ge=1, le=1000)
