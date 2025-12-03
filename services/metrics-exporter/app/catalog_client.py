"""
Catalog Client para Metrics Exporter
Cliente HTTP para comunicar com o Catalog Service
"""
import httpx
from typing import List, Dict, Any
from app.core.config import settings


class CatalogClient:
    """
    Cliente para aceder ao Catalog Service
    
    FLUXO: Metrics Exporter → Catalog → Database
    
    Respeita Network Policy que só permite Catalog aceder Database.
    """
    
    def __init__(self):
        self.base_url = settings.CATALOG_URL
        self.timeout = 30.0
    
    async def _request(self, method: str, endpoint: str, **kwargs) -> Any:
        """Fazer request HTTP ao Catalog Service"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.request(method, url, **kwargs)
                response.raise_for_status()
                
                if response.status_code == 204:
                    return None
                
                return response.json()
        except httpx.HTTPStatusError as e:
            try:
                error_detail = e.response.json().get("detail", str(e))
            except Exception:
                error_detail = str(e)
            raise Exception(f"Catalog Service error: {error_detail}")
        except Exception as e:
            raise Exception(f"Failed to communicate with Catalog: {str(e)}")
    
    # ========================================================================
    # ENDPOINTS USADOS PELAS MÉTRICAS
    # ========================================================================
    
    async def get_all_clientes(self) -> List[Dict[str, Any]]:
        """GET /api/clientes/all"""
        return await self._request("GET", "/api/clientes/all")
    
    async def get_all_demos(self) -> List[Dict[str, Any]]:
        """GET /api/demos/all"""
        return await self._request("GET", "/api/demos/all")
    
    async def get_all_logs(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """GET /api/logs/all"""
        return await self._request("GET", f"/api/logs/all?limit={limit}")
    
    async def execute_query(self, sql: str) -> List[Dict[str, Any]]:
        """
        GET /api/db/query
        
        Executa query SQL genérica através do Catalog
        Usado para queries customizadas (views, agregações, etc)
        """
        return await self._request("GET", "/api/db/query", params={"sql": sql})


# Singleton instance
catalog_client = CatalogClient()