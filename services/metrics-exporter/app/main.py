"""Metrics Exporter Service"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.catalog_client import catalog_client
from app.metrics.logs_metrics import LogsMetrics
from app.metrics.clients_metrics import ClientsMetrics
from app.metrics.demos_metrics import DemosMetrics
from app.metrics.time_metrics import TimeMetrics

app = FastAPI(title="E-Catalog Metrics Exporter", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

logs_metrics = LogsMetrics(catalog_client)
clients_metrics = ClientsMetrics(catalog_client)
demos_metrics = DemosMetrics(catalog_client)
time_metrics = TimeMetrics(catalog_client)

@app.get("/")
async def root():
    return {"service": "metrics-exporter", "version": "1.0.0", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/metrics/logs/overview")
async def get_logs_overview():
    return await logs_metrics.get_logs_overview()

@app.get("/metrics/logs/top-clients")
async def get_top_clients(limit: int = 10):
    return await logs_metrics.get_top_active_clients(limit)

@app.get("/metrics/logs/demos-per-client")
async def get_demos_per_client():
    return await logs_metrics.get_demos_por_cliente()

@app.get("/metrics/clients/overview")
async def get_clients_overview():
    return await clients_metrics.get_clients_overview()

@app.get("/metrics/demos/overview")
async def get_demos_overview():
    return await demos_metrics.get_demos_overview()

@app.get("/metrics/demos/top-used")
async def get_top_demos(limit: int = 10):
    return await demos_metrics.get_top_used_demos(limit)

@app.get("/metrics/overview")
async def get_overview():
    return {
        "logs": await logs_metrics.get_logs_overview(),
        "clients": await clients_metrics.get_clients_overview(),
        "demos": await demos_metrics.get_demos_overview()
    }

@app.get("/metrics/time/overview")
async def get_time_overview():
    return await time_metrics.get_tempo_overview()

@app.get("/metrics/time/top-clients")
async def get_time_top_clients(limit: int = 10):
    return await time_metrics.get_tempo_por_cliente(limit)

@app.get("/metrics/time/top-demos")
async def get_time_top_demos(limit: int = 10):
    return await time_metrics.get_tempo_por_demo(limit)

@app.get("/metrics/time/client/{cliente_id}")
async def get_time_client(cliente_id: str):
    return await time_metrics.get_tempo_cliente_especifico(cliente_id)

@app.get("/metrics/time/active-sessions")
async def get_active_sessions():
    return await time_metrics.get_sessoes_ativas()

@app.get("/metrics/time/by-period")
async def get_time_by_period(days: int = 7):
    return await time_metrics.get_tempo_por_periodo(days)

@app.get("/metrics/time/heatmap")
async def get_usage_heatmap():
    return await time_metrics.get_heatmap_utilizacao()