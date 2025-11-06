"""
Demo Service
Lógica de negócio para Demos
"""
from typing import List, Dict, Any
from app.models.demo import DemoCreate, DemoUpdate, DemoResponse
from app.services.database_client import db_client


class DemoService:
    """Service para gestão de demos"""
    
    async def get_all_demos(self) -> List[DemoResponse]:
        """Obter todas as demos"""
        demos = await db_client.get_all_demos()
        return [DemoResponse(**d) for d in demos]
    
    async def get_active_demos(self) -> List[DemoResponse]:
        """Obter apenas demos ativas"""
        demos = await db_client.get_active_demos()
        return [DemoResponse(**d) for d in demos]
    
    async def get_demos_by_vertical(self, vertical: str) -> List[DemoResponse]:
        """Obter demos por vertical"""
        demos = await db_client.get_demos_by_vertical(vertical)
        return [DemoResponse(**d) for d in demos]
    
    async def get_demos_by_horizontal(self, horizontal: str) -> List[DemoResponse]:
        """Obter demos por horizontal"""
        demos = await db_client.get_demos_by_horizontal(horizontal)
        return [DemoResponse(**d) for d in demos]
    
    async def get_demo(self, demo_id: str) -> DemoResponse:
        """Obter demo por ID"""
        demo = await db_client.get_demo(demo_id)
        return DemoResponse(**demo)
    
    async def create_demo(self, demo: DemoCreate) -> DemoResponse:
        """Criar nova demo"""
        demo_data = demo.model_dump()
        created = await db_client.create_demo(demo_data)
        return DemoResponse(**created)
    
    async def update_demo(self, demo_id: str, demo: DemoUpdate) -> DemoResponse:
        """Atualizar demo"""
        update_data = demo.model_dump(exclude_none=True)
        updated = await db_client.update_demo(demo_id, update_data)
        return DemoResponse(**updated)
    
    async def delete_demo(self, demo_id: str) -> None:
        """Apagar demo"""
        await db_client.delete_demo(demo_id)


# Singleton instance
demo_service = DemoService()
