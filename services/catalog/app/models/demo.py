"""
Demo Models
Models Pydantic para Demos
"""
from pydantic import BaseModel, Field
from typing import Optional


class DemoBase(BaseModel):
    """Base model para Demo"""
    nome: str = Field(..., min_length=1, max_length=100)
    descrição: Optional[str] = None
    vertical: Optional[str] = Field(None, max_length=50)
    horizontal: Optional[str] = Field(None, max_length=50)
    keywords: Optional[str] = None
    codigo_projeto: Optional[str] = Field(None, max_length=6)
    url: Optional[str] = None
    comercial_nome: Optional[str] = Field(None, max_length=100)
    comercial_contacto: Optional[str] = Field(None, max_length=20)
    comercial_foto_url: Optional[str] = Field(None, max_length=255)


class DemoCreate(DemoBase):
    """Model para criar Demo"""
    estado: str = Field(default="ativa", pattern="^(ativa|inativa|manutenção)$")
    criado_por: str = Field(..., description="ID do admin que criou")


class DemoUpdate(BaseModel):
    """Model para atualizar Demo (todos campos opcionais)"""
    nome: Optional[str] = Field(None, min_length=1, max_length=100)
    descrição: Optional[str] = None
    vertical: Optional[str] = Field(None, max_length=50)
    horizontal: Optional[str] = Field(None, max_length=50)
    keywords: Optional[str] = None
    codigo_projeto: Optional[str] = Field(None, max_length=6)
    url: Optional[str] = None
    estado: Optional[str] = Field(None, pattern="^(ativa|inativa|manutenção)$")
    comercial_nome: Optional[str] = Field(None, max_length=100)
    comercial_contacto: Optional[str] = Field(None, max_length=20)
    comercial_foto_url: Optional[str] = Field(None, max_length=255)


class DemoResponse(DemoBase):
    """Model para resposta de Demo"""
    id: str
    estado: str
    criado_por: str
    criado_em: str
    atualizado_em: str
    
    class Config:
        from_attributes = True
