"""Demos Metrics"""
from typing import Dict, Any
from datetime import datetime

class DemosMetrics:
    def __init__(self, catalog_client):
        """Recebe o CatalogClient object, não string"""
        self.catalog_client = catalog_client
    
    async def get_demos_overview(self) -> Dict[str, Any]:
        # Usar método do catalog_client
        demos = await self.catalog_client.get_all_demos()
        
        ativas = len([d for d in demos if d['estado'] == 'ativa'])
        inativas = len([d for d in demos if d['estado'] == 'inativa'])
        
        verticals = {}
        for demo in demos:
            vertical = demo.get('vertical', 'Unknown')
            verticals[vertical] = verticals.get(vertical, 0) + 1
        
        return {
            "total_demos": len(demos),
            "ativas": ativas,
            "inativas": inativas,
            "por_vertical": verticals,
            "timestamp": datetime.now().isoformat()
        }
    
    async def get_top_used_demos(self, limit: int = 10) -> Dict[str, Any]:
        # Buscar logs e demos
        logs = await self.catalog_client.get_all_logs(limit=1000)
        demos = await self.catalog_client.get_all_demos()
        
        # Criar mapa ID → Nome
        demos_map = {d['id']: d['nome'] for d in demos}
        
        demo_logs = [l for l in logs if l['tipo'] == 'demo_aberta' and l.get('demo_id')]
        demo_counts = {}
        for log in demo_logs:
            demo_id = log['demo_id']
            demo_counts[demo_id] = demo_counts.get(demo_id, 0) + 1
        
        top_demos = sorted([
            {
                "demo_id": did,
                "demo_nome": demos_map.get(did, did),
                "aberturas": count
            } 
            for did, count in demo_counts.items()
        ], key=lambda x: x['aberturas'], reverse=True)[:limit]
        
        return {"top_demos": top_demos, "limit": limit, "timestamp": datetime.now().isoformat()}