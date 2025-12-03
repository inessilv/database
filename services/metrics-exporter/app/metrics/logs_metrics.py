"""Logs Metrics"""
from typing import Dict, Any, List
from datetime import datetime, timedelta

class LogsMetrics:
    def __init__(self, catalog_client):
        """Recebe o CatalogClient object, não string"""
        self.catalog_client = catalog_client
    
    async def get_logs_overview(self) -> Dict[str, Any]:
        # Usar método do catalog_client
        logs = await self.catalog_client.get_all_logs(limit=1000)
        
        now = datetime.now()
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)
        last_30d = now - timedelta(days=30)
        
        def filter_by_time(logs: List, start_time: datetime):
            return [l for l in logs if datetime.fromisoformat(l['timestamp'].replace('Z', '+00:00')) >= start_time]
        
        logs_24h = filter_by_time(logs, last_24h)
        logs_7d = filter_by_time(logs, last_7d)
        logs_30d = filter_by_time(logs, last_30d)
        
        return {
            "total_logs": len(logs),
            "last_24h": {
                "total": len(logs_24h),
                "logins": len([l for l in logs_24h if l['tipo'] == 'login']),
                "demos_abertas": len([l for l in logs_24h if l['tipo'] == 'demo_aberta']),
                "erros": len([l for l in logs_24h if l['tipo'] == 'erro']),
            },
            "last_7d": {
                "total": len(logs_7d),
                "logins": len([l for l in logs_7d if l['tipo'] == 'login']),
                "demos_abertas": len([l for l in logs_7d if l['tipo'] == 'demo_aberta']),
                "erros": len([l for l in logs_7d if l['tipo'] == 'erro']),
            },
            "last_30d": {
                "total": len(logs_30d),
                "logins": len([l for l in logs_30d if l['tipo'] == 'login']),
                "demos_abertas": len([l for l in logs_30d if l['tipo'] == 'demo_aberta']),
                "erros": len([l for l in logs_30d if l['tipo'] == 'erro']),
            },
            "timestamp": now.isoformat()
        }
    
    async def get_top_active_clients(self, limit: int = 10) -> Dict[str, Any]:
        # Buscar logs e clientes
        logs = await self.catalog_client.get_all_logs(limit=1000)
        clientes = await self.catalog_client.get_all_clientes()
        
        # Criar mapa ID → Nome
        clientes_map = {c['id']: c['nome'] for c in clientes}
        
        client_activity = {}
        for log in logs:
            cliente_id = log.get('cliente_id')
            if cliente_id:
                if cliente_id not in client_activity:
                    client_activity[cliente_id] = {
                        "cliente_id": cliente_id,
                        "cliente_nome": clientes_map.get(cliente_id, cliente_id),  # ✅ Adicionar nome
                        "total_eventos": 0,
                        "logins": 0,
                        "demos_abertas": 0
                    }
                client_activity[cliente_id]["total_eventos"] += 1
                if log['tipo'] == 'login':
                    client_activity[cliente_id]["logins"] += 1
                elif log['tipo'] == 'demo_aberta':
                    client_activity[cliente_id]["demos_abertas"] += 1
        
        top_clients = sorted(client_activity.values(), key=lambda x: x['total_eventos'], reverse=True)[:limit]
        return {"top_clients": top_clients, "limit": limit, "timestamp": datetime.now().isoformat()}
    
    async def get_demos_por_cliente(self) -> Dict[str, Any]:
        """Retorna quais demos cada cliente abriu e quantas vezes"""
        logs = await self.catalog_client.get_all_logs(limit=1000)
        demos = await self.catalog_client.get_all_demos()
        clientes = await self.catalog_client.get_all_clientes()
        
        # Criar mapas de ID → Nome
        demo_names = {d['id']: d['nome'] for d in demos}
        cliente_names = {c['id']: c['nome'] for c in clientes}
        
        # Agrupar demos por cliente
        cliente_demos = {}
        for log in logs:
            if log['tipo'] == 'demo_aberta' and log.get('cliente_id') and log.get('demo_id'):
                cliente_id = log['cliente_id']
                demo_id = log['demo_id']
                
                if cliente_id not in cliente_demos:
                    cliente_demos[cliente_id] = {
                        "cliente_id": cliente_id,
                        "cliente_nome": cliente_names.get(cliente_id, cliente_id),
                        "demos": {},
                        "total_aberturas": 0
                    }
                
                if demo_id not in cliente_demos[cliente_id]["demos"]:
                    cliente_demos[cliente_id]["demos"][demo_id] = {
                        "demo_id": demo_id,
                        "demo_nome": demo_names.get(demo_id, demo_id),
                        "aberturas": 0
                    }
                
                cliente_demos[cliente_id]["demos"][demo_id]["aberturas"] += 1
                cliente_demos[cliente_id]["total_aberturas"] += 1
        
        # Converter para lista e ordenar por total de aberturas
        resultado = []
        for cliente_id, data in cliente_demos.items():
            data["demos_list"] = list(data["demos"].values())
            data["demos_list"].sort(key=lambda x: x["aberturas"], reverse=True)
            del data["demos"]  # Remover dict, manter só a lista
            resultado.append(data)
        
        resultado.sort(key=lambda x: x["total_aberturas"], reverse=True)
        
        return {
            "clientes_demos": resultado,
            "total_clientes": len(resultado),
            "timestamp": datetime.now().isoformat()
        }