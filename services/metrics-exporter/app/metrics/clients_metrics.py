"""Clients Metrics"""
from typing import Dict, Any
from datetime import datetime

class ClientsMetrics:
    def __init__(self, catalog_client):
        """Recebe o CatalogClient object, não string"""
        self.catalog_client = catalog_client
    
    async def get_clients_overview(self) -> Dict[str, Any]:
        # Usar método do catalog_client
        clientes = await self.catalog_client.get_all_clientes()
        
        now = datetime.now()
        ativos = expirados = expira_breve = 0
        
        for cliente in clientes:
            exp_date = datetime.fromisoformat(cliente['data_expiracao'].replace('Z', '+00:00'))
            days_remaining = (exp_date - now).days
            if days_remaining < 0:
                expirados += 1
            elif days_remaining <= 7:
                expira_breve += 1
            else:
                ativos += 1
        
        return {
            "total_clientes": len(clientes),
            "ativos": ativos,
            "expirados": expirados,
            "expira_breve": expira_breve,
            "timestamp": now.isoformat()
        }