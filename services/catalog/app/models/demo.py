from pydantic import BaseModel, field_validator
from typing import Optional, Literal
import re


class DemoBase(BaseModel):
    """Base model com campos comuns"""
    nome: str
    descricao: Optional[str] = None
    url: Optional[str] = None
    vertical: Optional[str] = None
    horizontal: Optional[str] = None
    keywords: Optional[str] = None
    codigo_projeto: Optional[str] = None
    comercial_nome: Optional[str] = None
    comercial_contacto: Optional[str] = None  # Validação de email
    comercial_foto_url: Optional[str] = None  # Pode ser Base64 ou URL


class DemoCreate(DemoBase):
    """Model para criar nova demo"""
    estado: Literal["ativa", "inativa", "manutenção"] = "ativa"
    criado_por: str  # ID do admin
    
    @field_validator('codigo_projeto')
    @classmethod
    def validate_codigo_projeto(cls, v):
        if v and len(v) != 6:
            raise ValueError('Código do projeto deve ter exatamente 6 caracteres')
        return v.upper() if v else v
    
    @field_validator('url')
    @classmethod
    def validate_url(cls, v):
        if v and not re.match(r'^https?://', v):
            raise ValueError('URL deve começar com http:// ou https://')
        return v


class DemoUpdate(BaseModel):
    """Model para atualizar demo (todos os campos opcionais)"""
    nome: Optional[str] = None
    descricao: Optional[str] = None
    url: Optional[str] = None
    estado: Optional[Literal["ativa", "inativa", "manutenção"]] = None
    vertical: Optional[str] = None
    horizontal: Optional[str] = None
    keywords: Optional[str] = None
    codigo_projeto: Optional[str] = None
    comercial_nome: Optional[str] = None
    comercial_contacto: Optional[str] = None
    comercial_foto_url: Optional[str] = None
    
    @field_validator('codigo_projeto')
    @classmethod
    def validate_codigo_projeto(cls, v):
        if v and len(v) != 6:
            raise ValueError('Código do projeto deve ter exatamente 6 caracteres')
        return v.upper() if v else v
    
    @field_validator('url')
    @classmethod
    def validate_url(cls, v):
        if v and not re.match(r'^https?://', v):
            raise ValueError('URL deve começar com http:// ou https://')
        return v


class DemoResponse(DemoBase):
    """Model para resposta de demo (inclui metadados)"""
    id: str
    estado: Literal["ativa", "inativa", "manutenção"]
    criado_por: str
    criado_em: str  # ISO datetime
    atualizado_em: str  # ISO datetime
    
    class Config:
        from_attributes = True