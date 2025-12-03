"""
Cliente Models para Catalog API
Baseados no schema.sql - tabela cliente
Autenticação via Microsoft OAuth apenas
"""
from pydantic import BaseModel, EmailStr
from typing import Optional


class ClienteCreate(BaseModel):
    """Model para criar cliente (POST)"""
    nome: str
    email: EmailStr
    data_expiracao: str  # ISO format: "2025-12-31"
    criado_por: str  # ID do admin que está a criar


class ClienteUpdate(BaseModel):
    """Model para atualizar cliente (PUT)"""
    nome: Optional[str] = None
    email: Optional[EmailStr] = None

class ClienteResponse(BaseModel):
    """Model para retornar cliente (GET)"""
    id: str
    nome: str
    email: str
    data_registo: str
    data_expiracao: str
    criado_por: str
    
    class Config:
        from_attributes = True

