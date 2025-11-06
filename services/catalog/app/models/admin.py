"""
Admin Models para Catalog API
Baseados no schema.sql - tabela admin
"""
from pydantic import BaseModel, EmailStr
from typing import Optional


class AdminCreate(BaseModel):
    """Model para criar admin (POST)"""
    nome: str
    email: EmailStr
    password: str  # Plain text - será hasheado
    contacto: Optional[str] = None


class AdminUpdate(BaseModel):
    """Model para atualizar admin (PUT)"""
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None  # Plain text - será hasheado
    contacto: Optional[str] = None


class AdminResponse(BaseModel):
    """Model para retornar admin (GET)"""
    id: str
    nome: str
    email: str
    contacto: Optional[str] = None
    
    class Config:
        from_attributes = True


class AdminLogin(BaseModel):
    """Model para login de admin"""
    email: EmailStr
    password: str
