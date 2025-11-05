"""
Log CRUD Endpoints
Tabela: log (id, cliente_id, demo_id, tipo, mensagem, timestamp)
"""
from fastapi import APIRouter, HTTPException, status
from typing import List, Optional, Literal
from pydantic import BaseModel
from app.db.connection import DatabaseConnection as db


router = APIRouter()


# ============================================================================
# MODELS
# ============================================================================

class LogCreate(BaseModel):
    cliente_id: Optional[str] = None  # Pode ser NULL para eventos de admin
    demo_id: Optional[str] = None  # Pode ser NULL para eventos gerais
    tipo: Literal['login', 'logout', 'demo_aberta', 'demo_fechada', 
                  'acesso_concedido', 'acesso_revogado', 'erro', 'aviso']
    mensagem: Optional[str] = None


class LogResponse(LogCreate):
    id: str
    timestamp: str


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/all", response_model=List[LogResponse])
def get_all_logs(limit: int = 100):
    """Listar todos os logs (limitado)"""
    query = "SELECT * FROM log ORDER BY timestamp DESC LIMIT ?"
    return db.execute_query(query, (limit,))


@router.get("/{log_id}", response_model=LogResponse)
def get_log(log_id: str):
    """Obter log específico por ID"""
    query = "SELECT * FROM log WHERE id = ?"
    logs = db.execute_query(query, (log_id,))
    
    if not logs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Log {log_id} não encontrado"
        )
    
    return logs[0]


@router.get("/by-cliente/{cliente_id}", response_model=List[LogResponse])
def get_logs_by_cliente(cliente_id: str, limit: int = 50):
    """Obter logs de um cliente específico"""
    query = """
        SELECT * FROM log 
        WHERE cliente_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
    """
    return db.execute_query(query, (cliente_id, limit))


@router.get("/by-demo/{demo_id}", response_model=List[LogResponse])
def get_logs_by_demo(demo_id: str, limit: int = 50):
    """Obter logs de uma demo específica"""
    query = """
        SELECT * FROM log 
        WHERE demo_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
    """
    return db.execute_query(query, (demo_id, limit))


@router.get("/by-tipo/{tipo}", response_model=List[LogResponse])
def get_logs_by_tipo(tipo: str, limit: int = 50):
    """Obter logs por tipo de evento"""
    query = """
        SELECT * FROM log 
        WHERE tipo = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
    """
    return db.execute_query(query, (tipo, limit))


@router.post("/", response_model=LogResponse, status_code=status.HTTP_201_CREATED)
def create_log(log: LogCreate):
    """Criar novo log"""
    import secrets
    log_id = secrets.token_hex(16)
    
    query = """
        INSERT INTO log (id, cliente_id, demo_id, tipo, mensagem)
        VALUES (?, ?, ?, ?, ?)
    """
    
    try:
        db.execute_insert(
            query,
            (log_id, log.cliente_id, log.demo_id, log.tipo, log.mensagem)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar log: {str(e)}"
        )
    
    return get_log(log_id)


@router.get("/stats/summary")
def get_log_stats():
    """Obter estatísticas gerais dos logs"""
    query = """
        SELECT 
            tipo,
            COUNT(*) as total,
            COUNT(DISTINCT cliente_id) as clientes_unicos,
            COUNT(DISTINCT demo_id) as demos_unicas
        FROM log
        GROUP BY tipo
        ORDER BY total DESC
    """
    return db.execute_query(query)


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log(log_id: str):
    """Apagar log"""
    rows_affected = db.execute_update("DELETE FROM log WHERE id = ?", (log_id,))
    
    if rows_affected == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Log {log_id} não encontrado"
        )
    
    return None
