"""
Cliente Models para Catalog API
Baseados no schema.sql - tabela cliente
"""
from pydantic import BaseModel, EmailStr
from typing import Optional


class ClienteCreate(BaseModel):
    """Model para criar cliente (POST)"""
    nome: str
    email: EmailStr
    password: str  # Plain text - será hasheado
    data_registo: str  # ISO format: "2025-11-05"
    data_expiracao: str  # ISO format: "2025-12-31"
    criado_por: str  # ID do admin que está a criar


class ClienteUpdate(BaseModel):
    """Model para atualizar cliente (PUT)"""
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    data_expiracao: Optional[str] = None


class ClienteResponse(BaseModel):
    """Model para retornar cliente (GET)"""
    id: str
    nome: str
    email: str
    data_registo: str
    data_expiracao: str
    criado_por: str
    criado_em: str
    
    class Config:
        from_attributes = True


class ClienteExtendAccess(BaseModel):
    """Model para extender acesso de cliente"""
    nova_data_expiracao: str  # ISO format: "2026-01-01"
