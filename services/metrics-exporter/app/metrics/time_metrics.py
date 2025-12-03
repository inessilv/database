"""
Time Metrics - Métricas de Tempo de Utilização de Demos
Calcula quanto tempo cada utilizador passa em cada demo
"""
from typing import Dict, Any, List
from datetime import datetime, timedelta

class TimeMetrics:
    def __init__(self, catalog_client):
        """Recebe o CatalogClient object, não string"""
        self.catalog_client = catalog_client
    
    async def get_tempo_overview(self) -> Dict[str, Any]:
        """Visão geral do tempo de utilização"""
        # Usar método execute_query do catalog_client
        sessions = await self.catalog_client.execute_query(
            "SELECT * FROM demo_sessions WHERE duracao_segundos IS NOT NULL"
        )
        
        if not sessions:
            return {
                "total_sessoes": 0,
                "tempo_total_minutos": 0,
                "tempo_total_horas": 0,
                "duracao_media_minutos": 0,
                "sessoes_hoje": 0,
                "tempo_hoje_minutos": 0,
                "timestamp": datetime.now().isoformat()
            }
        
        total_segundos = sum(s.get('duracao_segundos', 0) for s in sessions)
        total_sessoes = len(sessions)
        
        # Sessões de hoje
        hoje = datetime.now().date()
        sessoes_hoje = [
            s for s in sessions 
            if s.get('timestamp_fim') and 
            datetime.fromisoformat(s['timestamp_fim'].replace('Z', '+00:00')).date() == hoje
        ]
        tempo_hoje_segundos = sum(s.get('duracao_segundos', 0) for s in sessoes_hoje)
        
        return {
            "total_sessoes": total_sessoes,
            "tempo_total_segundos": total_segundos,
            "tempo_total_minutos": round(total_segundos / 60, 2),
            "tempo_total_horas": round(total_segundos / 3600, 2),
            "duracao_media_minutos": round((total_segundos / total_sessoes) / 60, 2) if total_sessoes > 0 else 0,
            "sessoes_hoje": len(sessoes_hoje),
            "tempo_hoje_minutos": round(tempo_hoje_segundos / 60, 2),
            "timestamp": datetime.now().isoformat()
        }
    
    async def get_tempo_por_cliente(self, limite: int = 10) -> Dict[str, Any]:
        """Top clientes por tempo total de utilização"""
        clientes = await self.catalog_client.execute_query(
            "SELECT * FROM view_tempo_por_cliente ORDER BY tempo_total_minutos DESC"
        )
        
        top_clientes = clientes[:limite]
        
        return {
            "top_clientes": top_clientes,
            "total_clientes": len(clientes),
            "limit": limite,
            "timestamp": datetime.now().isoformat()
        }
    
    async def get_tempo_por_demo(self, limite: int = 10) -> Dict[str, Any]:
        """Top demos por tempo total de utilização"""
        demos = await self.catalog_client.execute_query(
            "SELECT * FROM view_tempo_por_demo ORDER BY tempo_total_minutos DESC"
        )
        
        top_demos = demos[:limite]
        
        return {
            "top_demos": top_demos,
            "total_demos": len(demos),
            "limit": limite,
            "timestamp": datetime.now().isoformat()
        }
    
    async def get_tempo_cliente_especifico(self, cliente_id: str) -> Dict[str, Any]:
        """Tempo que um cliente específico passou em cada demo"""
        demos = await self.catalog_client.execute_query(
            f"SELECT * FROM view_tempo_cliente_demo WHERE cliente_id = '{cliente_id}' ORDER BY tempo_total_minutos DESC"
        )
        
        return {
            "cliente_id": cliente_id,
            "demos_utilizadas": demos,
            "total_demos": len(demos),
            "tempo_total_minutos": sum(d.get('tempo_total_minutos', 0) for d in demos),
            "timestamp": datetime.now().isoformat()
        }
    
    async def get_sessoes_ativas(self) -> Dict[str, Any]:
        """Sessões ativas neste momento (demos abertas sem fim)"""
        sessoes = await self.catalog_client.execute_query(
            "SELECT * FROM view_sessoes_ativas"
        )
        
        return {
            "sessoes_ativas": sessoes,
            "total": len(sessoes),
            "timestamp": datetime.now().isoformat()
        }
    
    async def get_tempo_por_periodo(self, dias: int = 7) -> Dict[str, Any]:
        """Tempo de utilização por dia nos últimos N dias"""
        sql = f"""
            SELECT 
                DATE(timestamp_fim) as data,
                COUNT(*) as sessoes,
                SUM(duracao_segundos) as tempo_total_segundos,
                ROUND(SUM(duracao_segundos) / 60.0, 2) as tempo_total_minutos,
                ROUND(AVG(duracao_segundos) / 60.0, 2) as duracao_media_minutos
            FROM demo_sessions
            WHERE duracao_segundos IS NOT NULL
                AND DATE(timestamp_fim) >= DATE('now', '-{dias} days')
            GROUP BY DATE(timestamp_fim)
            ORDER BY data DESC
        """
        dados = await self.catalog_client.execute_query(sql)
        
        return {
            "periodo_dias": dias,
            "dados_por_dia": dados,
            "total_dias_com_dados": len(dados),
            "timestamp": datetime.now().isoformat()
        }
    
    async def get_heatmap_utilizacao(self) -> Dict[str, Any]:
        """Heatmap de utilização (hora do dia vs dia da semana)"""
        sql = """
            SELECT 
                CAST(strftime('%w', timestamp_inicio) AS INTEGER) as dia_semana,
                CAST(strftime('%H', timestamp_inicio) AS INTEGER) as hora,
                COUNT(*) as sessoes,
                ROUND(SUM(duracao_segundos) / 60.0, 2) as tempo_total_minutos
            FROM demo_sessions
            WHERE duracao_segundos IS NOT NULL
                AND DATE(timestamp_inicio) >= DATE('now', '-30 days')
            GROUP BY dia_semana, hora
            ORDER BY dia_semana, hora
        """
        dados = await self.catalog_client.execute_query(sql)
        
        # Mapear dia da semana
        dias_nomes = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
        
        heatmap = {}
        for item in dados:
            dia = dias_nomes[item['dia_semana']]
            if dia not in heatmap:
                heatmap[dia] = {}
            heatmap[dia][f"{item['hora']:02d}:00"] = {
                "sessoes": item['sessoes'],
                "tempo_minutos": item['tempo_total_minutos']
            }
        
        return {
            "heatmap": heatmap,
            "periodo_dias": 30,
            "timestamp": datetime.now().isoformat()
        }


# Funções auxiliares para cálculos
def segundos_para_humano(segundos: int) -> str:
    """Converte segundos em formato legível"""
    if segundos < 60:
        return f"{segundos}s"
    elif segundos < 3600:
        minutos = segundos // 60
        seg = segundos % 60
        return f"{minutos}m {seg}s"
    else:
        horas = segundos // 3600
        minutos = (segundos % 3600) // 60
        return f"{horas}h {minutos}m"


def calcular_estatisticas(duracoes: List[int]) -> Dict[str, float]:
    """Calcula estatísticas sobre durações"""
    if not duracoes:
        return {
            "media": 0,
            "mediana": 0,
            "minimo": 0,
            "maximo": 0,
            "desvio_padrao": 0
        }
    
    duracoes_sorted = sorted(duracoes)
    n = len(duracoes)
    media = sum(duracoes) / n
    mediana = duracoes_sorted[n // 2] if n % 2 == 1 else (duracoes_sorted[n // 2 - 1] + duracoes_sorted[n // 2]) / 2
    
    # Desvio padrão
    variancia = sum((x - media) ** 2 for x in duracoes) / n
    desvio_padrao = variancia ** 0.5
    
    return {
        "media": round(media, 2),
        "mediana": round(mediana, 2),
        "minimo": min(duracoes),
        "maximo": max(duracoes),
        "desvio_padrao": round(desvio_padrao, 2)
    }