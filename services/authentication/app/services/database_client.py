import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings


class DatabaseClient:
    """
    Cliente HTTP para comunicar com o Pod Database (port 8001)
    Todos os métodos são async para melhor performance
    """
    
    def __init__(self):
        self.base_url = settings.DATABASE_URL
        self.timeout = settings.HTTP_TIMEOUT
    
    
    async def _request(self, method: str, endpoint: str, **kwargs) -> Any:
        """
        Fazer request HTTP ao Database Service
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
            raise Exception(f"Erro na comunicação com Database Service: {error_detail}")
        except Exception as e:
            raise Exception(f"Erro ao comunicar com Database Service: {str(e)}")

    
    # ========================================================================
    # ADMIN
    # ========================================================================
    
    async def get_all_admins(self) -> List[Dict[str, Any]]:
        """GET /db/admin/all"""
        return await self._request("GET", "/db/admin/all")
    
    async def get_admin(self, admin_id: str) -> Dict[str, Any]:
        """GET /db/admin/{id}"""
        return await self._request("GET", f"/db/admin/{admin_id}")
    
    async def get_admin_by_email(self, email: str) -> Dict[str, Any]:
        """GET /db/admin/by-email/{email}"""
        return await self._request("GET", f"/db/admin/by-email/{email}")
    
    async def get_admin_with_password(self, email: str) -> Dict[str, Any]:
        """GET /db/admin/by-email-with-password/{email} - Para autenticação"""
        return await self._request("GET", f"/db/admin/by-email-with-password/{email}")
    
    async def create_admin(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """POST /db/admin/"""
        return await self._request("POST", "/db/admin/", json=data)
    
    async def update_admin(self, admin_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """PUT /db/admin/{id}"""
        return await self._request("PUT", f"/db/admin/{admin_id}", json=data)
    
    async def delete_admin(self, admin_id: str) -> None:
        """DELETE /db/admin/{id}"""
        await self._request("DELETE", f"/db/admin/{admin_id}")
    
    # ========================================================================
    # CLIENTES
    # ========================================================================
    
    async def get_all_clientes(self) -> List[Dict[str, Any]]:
        """GET /db/clientes/all"""
        return await self._request("GET", "/db/clientes/all")
    
    async def get_active_clientes(self) -> List[Dict[str, Any]]:
        """GET /db/clientes/active"""
        return await self._request("GET", "/db/clientes/active")
    
    async def get_expired_clientes(self) -> List[Dict[str, Any]]:
        """GET /db/clientes/expired"""
        return await self._request("GET", "/db/clientes/expired")
    
    async def get_cliente(self, cliente_id: str) -> Dict[str, Any]:
        """GET /db/clientes/{id}"""
        return await self._request("GET", f"/db/clientes/{cliente_id}")
    
    async def get_cliente_by_email(self, email: str) -> Dict[str, Any]:
        """GET /db/clientes/by-email/{email}"""
        return await self._request("GET", f"/db/clientes/by-email/{email}")
    
    async def get_cliente_with_password(self, email: str) -> Dict[str, Any]:
        """GET /db/clientes/by-email-with-password/{email} - Para autenticação"""
        return await self._request("GET", f"/db/clientes/by-email-with-password/{email}")
    
    async def create_cliente(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """POST /db/clientes/"""
        return await self._request("POST", "/db/clientes/", json=data)
    
    async def update_cliente(self, cliente_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """PUT /db/clientes/{id}"""
        return await self._request("PUT", f"/db/clientes/{cliente_id}", json=data)
    
    
    # ========================================================================
    # PEDIDOS
    # ========================================================================
    
    async def get_all_pedidos(self) -> List[Dict[str, Any]]:
        """GET /db/pedidos/all"""
        return await self._request("GET", "/db/pedidos/all")
    
    async def get_approved_pedidos(self) -> List[Dict[str, Any]]:
        """GET /db/pedidos/approved"""
        return await self._request("GET", "/db/pedidos/approved")
    
    async def get_pending_pedidos(self) -> List[Dict[str, Any]]:
        """GET /db/pedidos/pending"""
        return await self._request("GET", "/db/pedidos/pending")
    
    async def get_rejected_pedidos(self) -> List[Dict[str, Any]]:
        """GET /db/pedidos/rejected"""
        return await self._request("GET", "/db/pedidos/rejected")
    
    async def get_pedido(self, pedido_id: str) -> Dict[str, Any]:
        """GET /db/pedidos/{id}"""
        return await self._request("GET", f"/db/pedidos/{pedido_id}")
    
    async def create_pedido(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """POST /db/pedidos/"""
        return await self._request("POST", "/db/pedidos/", json=data)
    
    async def approve_pedido(self, pedido_id: str, admin_id: str) -> Dict[str, Any]:
        """POST /db/pedidos/{id}/approve - TRANSACTION"""
        payload = {"admin_id": admin_id}
        return await self._request("POST", f"/db/pedidos/{pedido_id}/approve", json=payload)
    
    async def reject_pedido(self, pedido_id: str, admin_id: str) -> Dict[str, Any]:
        """PUT /db/pedidos/{id}/reject - TRANSACTION"""
        return await self._request("POST", f"/db/pedidos/{pedido_id}/reject", 
                                  json={"admin_id": admin_id})
    
    async def delete_pedido(self, pedido_id: str) -> None:
        """DELETE /db/pedidos/{id}"""
        await self._request("DELETE", f"/db/pedidos/{pedido_id}")

# Singleton instance
db_client = DatabaseClient()
