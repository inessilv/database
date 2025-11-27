import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings


class CatalogClient:
    """
    Cliente HTTP para comunicar com o Catalog Service
    
    FLUXO: Authentication → Catalog → Database
    
    Este cliente substitui o DatabaseClient anterior.
    Agora o Authentication não comunica diretamente com a Database,
    mas sim através do Catalog (respeitando a Network Policy).
    
    Todos os métodos são async para melhor performance.
    """
    
    def __init__(self):
        self.base_url = settings.CATALOG_URL
        self.timeout = settings.HTTP_TIMEOUT
    
    
    async def _request(self, method: str, endpoint: str, **kwargs) -> Any:
        """
        Fazer request HTTP ao Catalog Service
        """
        url = f"{self.base_url}{endpoint}"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
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
            raise Exception(f"Erro na comunicação com Catalog Service: {error_detail}")
        except Exception as e:
            raise Exception(f"Erro ao comunicar com Catalog Service: {str(e)}")

    
    # ========================================================================
    # ADMIN
    # ========================================================================
    
    async def get_all_admins(self) -> List[Dict[str, Any]]:
        """GET /api/admin/all"""
        return await self._request("GET", "/api/admin/all")
    
    async def get_admin(self, admin_id: str) -> Dict[str, Any]:
        """GET /api/admin/{id}"""
        return await self._request("GET", f"/api/admin/{admin_id}")
    
    async def get_admin_by_email(self, email: str) -> Dict[str, Any]:
        """GET /api/admin/by-email/{email}"""
        return await self._request("GET", f"/api/admin/by-email/{email}")
    
    async def create_admin(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """POST /api/admin/"""
        return await self._request("POST", "/api/admin/", json=data)
    
    async def update_admin(self, admin_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """PUT /api/admin/{id}"""
        return await self._request("PUT", f"/api/admin/{admin_id}", json=data)
    
    async def delete_admin(self, admin_id: str) -> None:
        """DELETE /api/admin/{id}"""
        await self._request("DELETE", f"/api/admin/{admin_id}")
    
    # ========================================================================
    # CLIENTES
    # ========================================================================
    
    async def get_all_clientes(self) -> List[Dict[str, Any]]:
        """GET /api/clientes/all"""
        return await self._request("GET", "/api/clientes/all")
    
    async def get_active_clientes(self) -> List[Dict[str, Any]]:
        """GET /api/clientes/active"""
        return await self._request("GET", "/api/clientes/active")
    
    async def get_expired_clientes(self) -> List[Dict[str, Any]]:
        """GET /api/clientes/expired"""
        return await self._request("GET", "/api/clientes/expired")
    
    async def get_cliente(self, cliente_id: str) -> Dict[str, Any]:
        """GET /api/clientes/{id}"""
        return await self._request("GET", f"/api/clientes/{cliente_id}")
    
    async def get_cliente_by_email(self, email: str) -> Dict[str, Any]:
        """GET /api/clientes/by-email/{email}"""
        return await self._request("GET", f"/api/clientes/by-email/{email}")
    
    async def create_cliente(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """POST /api/clientes/"""
        return await self._request("POST", "/api/clientes/", json=data)
    
    async def update_cliente(self, cliente_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """PUT /api/clientes/{id}"""
        return await self._request("PUT", f"/api/clientes/{cliente_id}", json=data)
    
    
    # ========================================================================
    # PEDIDOS
    # ========================================================================
    
    async def get_all_pedidos(self) -> List[Dict[str, Any]]:
        """GET /api/pedidos/all"""
        return await self._request("GET", "/api/pedidos/all")
    
    async def get_approved_pedidos(self) -> List[Dict[str, Any]]:
        """GET /api/pedidos/approved"""
        return await self._request("GET", "/api/pedidos/approved")
    
    async def get_pending_pedidos(self) -> List[Dict[str, Any]]:
        """GET /api/pedidos/pending"""
        return await self._request("GET", "/api/pedidos/pending")
    
    async def get_rejected_pedidos(self) -> List[Dict[str, Any]]:
        """GET /api/pedidos/rejected"""
        return await self._request("GET", "/api/pedidos/rejected")
    
    async def get_pedido(self, pedido_id: str) -> Dict[str, Any]:
        """GET /api/pedidos/{id}"""
        return await self._request("GET", f"/api/pedidos/{pedido_id}")
    
    async def create_pedido(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """POST /api/pedidos/"""
        return await self._request("POST", "/api/pedidos/", json=data)
    
    async def approve_pedido(self, pedido_id: str, admin_id: str) -> Dict[str, Any]:
        """POST /api/pedidos/{id}/approve - TRANSACTION"""
        payload = {"admin_id": admin_id}
        return await self._request("POST", f"/api/pedidos/{pedido_id}/approve", json=payload)
    
    async def reject_pedido(self, pedido_id: str, admin_id: str) -> Dict[str, Any]:
        """PUT /api/pedidos/{id}/reject - TRANSACTION"""
        return await self._request("POST", f"/api/pedidos/{pedido_id}/reject", 
                                  json={"admin_id": admin_id})
    
    async def delete_pedido(self, pedido_id: str) -> None:
        """DELETE /api/pedidos/{id}"""
        await self._request("DELETE", f"/api/pedidos/{pedido_id}")


# Singleton instance
catalog_client = CatalogClient()