from fastapi import APIRouter, HTTPException, status
from typing import List, Optional, Literal
from pydantic import BaseModel, field_validator
from app.db.connection import DatabaseConnection as db
import re


router = APIRouter()


# ============================================================================
# MODELS
# ============================================================================

class DemoBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    url: Optional[str] = None
    vertical: Optional[str] = None
    horizontal: Optional[str] = None
    keywords: Optional[str] = None
    codigo_projeto: Optional[str] = None
    comercial_nome: Optional[str] = None
    comercial_contacto: Optional[str] = None  
    comercial_foto_url: Optional[str] = None  # Pode ser Base64


class DemoCreate(DemoBase):
    estado: Literal['ativa', 'inativa', 'manutenção'] = 'ativa'
    criado_por: str  # admin_id
    
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
    nome: Optional[str] = None
    descricao: Optional[str] = None
    url: Optional[str] = None
    estado: Optional[Literal['ativa', 'inativa', 'manutenção']] = None
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
    id: str
    estado: str
    criado_por: str
    criado_em: str
    atualizado_em: str


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/all", response_model=List[DemoResponse])
def get_all_demos():
    """Listar todas as demos"""
    query = "SELECT * FROM demo ORDER BY nome ASC"
    return db.execute_query(query)


@router.get("/active", response_model=List[DemoResponse])
def get_active_demos():
    """Listar demos ativas"""
    query = "SELECT * FROM demo WHERE estado = 'ativa' ORDER BY nome"
    return db.execute_query(query)


@router.get("/by-vertical/{vertical}", response_model=List[DemoResponse])
def get_demos_by_vertical(vertical: str):
    """Listar demos por vertical"""
    query = "SELECT * FROM demo WHERE vertical = ? ORDER BY nome"
    return db.execute_query(query, (vertical,))


@router.get("/by-horizontal/{horizontal}", response_model=List[DemoResponse])
def get_demos_by_horizontal(horizontal: str):
    """Listar demos por horizontal"""
    query = "SELECT * FROM demo WHERE horizontal = ? ORDER BY nome"
    return db.execute_query(query, (horizontal,))


@router.get("/{demo_id}", response_model=DemoResponse)
def get_demo(demo_id: str):
    """Obter demo específica por ID"""
    query = "SELECT * FROM demo WHERE id = ?"
    demos = db.execute_query(query, (demo_id,))
    
    if not demos:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Demo {demo_id} não encontrada"
        )
    
    return demos[0]


@router.post("/create", response_model=DemoResponse, status_code=status.HTTP_201_CREATED)
def create_demo(demo: DemoCreate):
 
    import secrets
    demo_id = secrets.token_hex(16)
    
    query = """
        INSERT INTO demo (id, nome, descricao, url, estado, vertical, horizontal, 
                         keywords, codigo_projeto, comercial_nome, 
                         comercial_contacto, comercial_foto_url, criado_por)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    
    try:
        db.execute_insert(
            query,
            (demo_id, demo.nome, demo.descricao, demo.url, demo.estado,
             demo.vertical, demo.horizontal, demo.keywords, demo.codigo_projeto,
             demo.comercial_nome, demo.comercial_contacto,
             demo.comercial_foto_url, demo.criado_por)
        )
    except Exception as e:
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Código de projeto já existe"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar demo: {str(e)}"
        )
    
    return get_demo(demo_id)


@router.put("/{demo_id}/update", response_model=DemoResponse)
def update_demo(demo_id: str, demo: DemoUpdate):
   
    # Verificar se existe
    existing = db.execute_query("SELECT id FROM demo WHERE id = ?", (demo_id,))
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Demo {demo_id} não encontrada"
        )
    
    # Construir query dinâmica
    updates = []
    params = []
    
    if demo.nome is not None:
        updates.append("nome = ?")
        params.append(demo.nome)
    
    if demo.descricao is not None:
        updates.append("descricao = ?")
        params.append(demo.descricao)
    
    if demo.url is not None:
        updates.append("url = ?")
        params.append(demo.url)
    
    if demo.estado is not None:
        updates.append("estado = ?")
        params.append(demo.estado)
    
    if demo.vertical is not None:
        updates.append("vertical = ?")
        params.append(demo.vertical)
    
    if demo.horizontal is not None:
        updates.append("horizontal = ?")
        params.append(demo.horizontal)
    
    if demo.keywords is not None:
        updates.append("keywords = ?")
        params.append(demo.keywords)
    
    if demo.codigo_projeto is not None:
        updates.append("codigo_projeto = ?")
        params.append(demo.codigo_projeto)
    
    if demo.comercial_nome is not None:
        updates.append("comercial_nome = ?")
        params.append(demo.comercial_nome)
    
    if demo.comercial_contacto is not None:
        updates.append("comercial_contacto = ?")
        params.append(demo.comercial_contacto)
    
    if demo.comercial_foto_url is not None:
        updates.append("comercial_foto_url = ?")
        params.append(demo.comercial_foto_url)
    
    if not updates:
        return get_demo(demo_id)
    
    # Trigger atualiza atualizado_em automaticamente
    params.append(demo_id)
    query = f"UPDATE demo SET {', '.join(updates)} WHERE id = ?"
    
    try:
        db.execute_update(query, tuple(params))
    except Exception as e:
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Código de projeto já existe"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar demo: {str(e)}"
        )
    
    return get_demo(demo_id)


@router.delete("/{demo_id}/delete", status_code=status.HTTP_204_NO_CONTENT)
def delete_demo(demo_id: str):
    """Apagar demo"""
    rows_affected = db.execute_update("DELETE FROM demo WHERE id = ?", (demo_id,))
    
    if rows_affected == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Demo {demo_id} não encontrada"
        )
    
    return None