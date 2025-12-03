"""
Admin Models para Catalog API
Baseados no schema.sql - tabela admin
Autenticação via Microsoft OAuth apenas
"""
from pydantic import BaseModel, EmailStr
from typing import Optional


class AdminCreate(BaseModel):
    """Model para criar admin (POST)"""
    nome: str
    email: EmailStr
    contacto: Optional[str] = None


class AdminUpdate(BaseModel):
    """Model para atualizar admin (PUT)"""
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    contacto: Optional[str] = None


class AdminResponse(BaseModel):
    """Model para retornar admin (GET)"""
    id: str
    nome: str
    email: str
    contacto: Optional[str] = None
    
    class Config:
        from_attributes = True
