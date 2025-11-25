"""
Docker Images CRUD Endpoints
Tabela: docker_images (id, nome_imagem, versao_imagem, url, descrição, atualizado_em)
"""
from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from app.db.connection import DatabaseConnection as db


router = APIRouter()


# ============================================================================
# MODELS
# ============================================================================

class DockerImageBase(BaseModel):
    nome_imagem: str
    versao_imagem: str
    url: str
    descricao: Optional[str] = None


class DockerImageCreate(DockerImageBase):
    pass


class DockerImageUpdate(BaseModel):
    nome_imagem: Optional[str] = None
    versao_imagem: Optional[str] = None
    url: Optional[str] = None
    descricao: Optional[str] = None


class DockerImageResponse(DockerImageBase):
    id: str
    atualizado_em: str


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/all", response_model=List[DockerImageResponse])
def get_all_docker_images():
    """Listar todas as imagens Docker"""
    query = "SELECT * FROM docker_images ORDER BY nome_imagem, versao_imagem DESC"
    return db.execute_query(query)


@router.get("/{image_id}", response_model=DockerImageResponse)
def get_docker_image(image_id: str):
    """Obter imagem Docker específica por ID"""
    query = "SELECT * FROM docker_images WHERE id = ?"
    images = db.execute_query(query, (image_id,))
    
    if not images:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Imagem Docker {image_id} não encontrada"
        )
    
    return images[0]


@router.get("/by-name/{nome_imagem}", response_model=List[DockerImageResponse])
def get_docker_images_by_name(nome_imagem: str):
    """Obter todas as versões de uma imagem Docker por nome"""
    query = """
        SELECT * FROM docker_images 
        WHERE nome_imagem = ? 
        ORDER BY versao_imagem DESC
    """
    return db.execute_query(query, (nome_imagem,))


@router.post("/", response_model=DockerImageResponse, status_code=status.HTTP_201_CREATED)
def create_docker_image(image: DockerImageCreate):
    """Criar nova imagem Docker"""
    import secrets
    image_id = secrets.token_hex(16)
    
    query = """
        INSERT INTO docker_images (id, nome_imagem, versao_imagem, url, descricao)
        VALUES (?, ?, ?, ?, ?)
    """
    
    try:
        db.execute_insert(
            query,
            (image_id, image.nome_imagem, image.versao_imagem, image.url, image.descricao)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar imagem Docker: {str(e)}"
        )
    
    return get_docker_image(image_id)


@router.put("/{image_id}", response_model=DockerImageResponse)
def update_docker_image(image_id: str, image: DockerImageUpdate):
    """Atualizar imagem Docker"""
    # Verificar se existe
    existing = db.execute_query("SELECT id FROM docker_images WHERE id = ?", (image_id,))
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Imagem Docker {image_id} não encontrada"
        )
    
    # Construir query dinâmica
    updates = []
    params = []
    
    if image.nome_imagem is not None:
        updates.append("nome_imagem = ?")
        params.append(image.nome_imagem)
    
    if image.versao_imagem is not None:
        updates.append("versao_imagem = ?")
        params.append(image.versao_imagem)
    
    if image.url is not None:
        updates.append("url = ?")
        params.append(image.url)
    
    if image.descricao is not None:
        updates.append("descricao = ?")
        params.append(image.descricao)
    
    if not updates:
        return get_docker_image(image_id)
    
    # Trigger atualiza atualizado_em automaticamente
    params.append(image_id)
    query = f"UPDATE docker_images SET {', '.join(updates)} WHERE id = ?"
    
    try:
        db.execute_update(query, tuple(params))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar imagem Docker: {str(e)}"
        )
    
    return get_docker_image(image_id)


@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_docker_image(image_id: str):
    """Apagar imagem Docker"""
    rows_affected = db.execute_update("DELETE FROM docker_images WHERE id = ?", (image_id,))
    
    if rows_affected == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Imagem Docker {image_id} não encontrada"
        )
    
    return None
