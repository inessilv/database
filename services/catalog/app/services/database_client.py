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
    
    async def create_cliente(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """POST /db/clientes/"""
        return await self._request("POST", "/db/clientes/", json=data)
    
    async def update_cliente(self, cliente_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """PUT /db/clientes/{id}"""
        return await self._request("PUT", f"/db/clientes/{cliente_id}", json=data)
    
    async def delete_cliente(self, cliente_id: str) -> None:
        """DELETE /db/clientes/{id} - Revoga acesso (expira imediatamente)"""
        await self._request("DELETE", f"/db/clientes/{cliente_id}")
    
    
    # ========================================================================
    # DEMOS
    # ========================================================================
    
    async def get_all_demos(self) -> List[Dict[str, Any]]:
        """GET /db/demos/all"""
        return await self._request("GET", "/db/demos/all")
    
    async def get_active_demos(self) -> List[Dict[str, Any]]:
        """GET /db/demos/active"""
        return await self._request("GET", "/db/demos/active")
    
    async def get_demos_by_vertical(self, vertical: str) -> List[Dict[str, Any]]:
        """GET /db/demos/by-vertical/{vertical}"""
        return await self._request("GET", f"/db/demos/by-vertical/{vertical}")
    
    async def get_demos_by_horizontal(self, horizontal: str) -> List[Dict[str, Any]]:
        """GET /db/demos/by-horizontal/{horizontal}"""
        return await self._request("GET", f"/db/demos/by-horizontal/{horizontal}")
    
    async def get_demo(self, demo_id: str) -> Dict[str, Any]:
        """GET /db/demos/{id}"""
        return await self._request("GET", f"/db/demos/{demo_id}")
    
    async def create_demo(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """POST /db/demos/create"""
        return await self._request("POST", "/db/demos/create", json=data)
    
    async def update_demo(self, demo_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """PUT /db/demos/{id}/update"""
        return await self._request("PUT", f"/db/demos/{demo_id}/update", json=data)
    
    async def delete_demo(self, demo_id: str) -> None:
        """DELETE /db/demos/{id}/delete"""
        await self._request("DELETE", f"/db/demos/{demo_id}/delete")
    
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
    
    async def get_pedido_by_cliente(self, cliente_id: str) -> Dict[str, Any]:
        """GET /db/pedidos/by-cliente/{cliente_id} - retorna um pedido"""
        return await self._request("GET", f"/db/pedidos/by-cliente/{cliente_id}")
    
    async def get_pedidos_by_cliente(self, cliente_id: str) -> List[Dict[str, Any]]:
        """GET /db/pedidos/by-cliente/{cliente_id} - retorna lista de pedidos"""
        return await self._request("GET", f"/db/pedidos/by-cliente/{cliente_id}")
    
    async def create_pedido(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """POST /db/pedidos/create"""
        return await self._request("POST", "/db/pedidos/create", json=data)
    
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
    
    # ========================================================================
    # LOGS
    # ========================================================================
    
    async def get_all_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """GET /db/logs/all?limit={limit}"""
        return await self._request("GET", "/db/logs/all", params={"limit": limit})
    
    async def get_logs_by_cliente(self, cliente_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """GET /db/logs/by-cliente/{id}"""
        return await self._request("GET", f"/db/logs/by-cliente/{cliente_id}", 
                                  params={"limit": limit})
    
    async def get_logs_by_demo(self, demo_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """GET /db/logs/by-demo/{id}"""
        return await self._request("GET", f"/db/logs/by-demo/{demo_id}", 
                                  params={"limit": limit})
    
    async def create_log(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """POST /db/logs/"""
        return await self._request("POST", "/db/logs/", json=data)
    
    async def get_log_stats(self) -> List[Dict[str, Any]]:
        """GET /db/logs/stats/summary"""
        return await self._request("GET", "/db/logs/stats/summary")
    
    # ========================================================================
    # DOCKER IMAGES
    # ========================================================================
    
    async def get_all_docker_images(self) -> List[Dict[str, Any]]:
        """GET /db/docker-images/all"""
        return await self._request("GET", "/db/docker-images/all")
    
    async def get_docker_image(self, image_id: str) -> Dict[str, Any]:
        """GET /db/docker-images/{id}"""
        return await self._request("GET", f"/db/docker-images/{image_id}")
    
    async def create_docker_image(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """POST /db/docker-images/"""
        return await self._request("POST", "/db/docker-images/", json=data)
    
    async def update_docker_image(self, image_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """PUT /db/docker-images/{id}"""
        return await self._request("PUT", f"/db/docker-images/{image_id}", json=data)
    
    async def delete_docker_image(self, image_id: str) -> None:
        """DELETE /db/docker-images/{id}"""
        await self._request("DELETE", f"/db/docker-images/{image_id}")
    
    # ========================================================================
    # VIEWS
    # ========================================================================
    
    async def get_active_clients_view(self) -> List[Dict[str, Any]]:
        """GET /db/views/active-clients"""
        return await self._request("GET", "/db/views/active-clients")
    
    async def get_active_demos_view(self) -> List[Dict[str, Any]]:
        """GET /db/views/active-demos"""
        return await self._request("GET", "/db/views/active-demos")
    
    async def get_pending_requests_view(self) -> List[Dict[str, Any]]:
        """GET /db/views/pending-requests"""
        return await self._request("GET", "/db/views/pending-requests")
    
    async def get_client_stats_view(self) -> List[Dict[str, Any]]:
        """GET /db/views/client-stats"""
        return await self._request("GET", "/db/views/client-stats")
    
    async def get_client_stats_by_id(self, cliente_id: str) -> Dict[str, Any]:
        """GET /db/views/client-stats/{id}"""
        return await self._request("GET", f"/db/views/client-stats/{cliente_id}")


# Singleton instance
db_client = DatabaseClient()
