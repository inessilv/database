"""
Log Service
Lógica de negócio para Logs
"""
from typing import List, Dict, Any
from app.models.log import LogCreate, LogResponse, LogFilter
from app.services.database_client import db_client


class LogService:
    """Service para gestão de logs"""
    
    async def get_all_logs(self, limit: int = 100) -> List[LogResponse]:
        """Obter todos os logs (com limite)"""
        logs = await db_client.get_all_logs(limit=limit)
        return [LogResponse(**l) for l in logs]
    
    async def get_logs_by_cliente(
        self, 
        cliente_id: str, 
        limit: int = 50
    ) -> List[LogResponse]:
        """Obter logs de um cliente específico"""
        logs = await db_client.get_logs_by_cliente(cliente_id, limit=limit)
        return [LogResponse(**l) for l in logs]
    
    async def get_logs_by_demo(
        self, 
        demo_id: str, 
        limit: int = 50
    ) -> List[LogResponse]:
        """Obter logs de uma demo específica"""
        logs = await db_client.get_logs_by_demo(demo_id, limit=limit)
        return [LogResponse(**l) for l in logs]
    
    async def create_log(self, log: LogCreate) -> LogResponse:
        """Criar novo log"""
        log_data = log.model_dump()
        created = await db_client.create_log(log_data)
        return LogResponse(**created)
    
    async def get_log_stats(self) -> List[Dict[str, Any]]:
        """Obter estatísticas de logs"""
        stats = await db_client.get_log_stats()
        return stats


# Singleton instance
log_service = LogService()
