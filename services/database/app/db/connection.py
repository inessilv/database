"""
SQLite Connection Handler
Provides thread-safe connection management
"""
import sqlite3
import threading
from contextlib import contextmanager
from typing import Optional, List, Dict, Any
from app.core.config import settings


class DatabaseConnection:
    """
    Thread-safe SQLite connection manager
    Uses connection pooling per thread
    """
    
    _local = threading.local()
    
    @classmethod
    def get_connection(cls) -> sqlite3.Connection:
        """
        Get or create a connection for the current thread
        """
        if not hasattr(cls._local, 'connection'):
            cls._local.connection = sqlite3.connect(
                settings.DB_PATH,
                timeout=settings.SQLITE_TIMEOUT / 1000.0,  # Convert ms to seconds
                check_same_thread=False
            )
            # Enable foreign keys
            cls._local.connection.execute("PRAGMA foreign_keys = ON")
            # Row factory for dict-like access
            cls._local.connection.row_factory = sqlite3.Row
        
        return cls._local.connection
    
    @classmethod
    def close_connection(cls):
        """
        Close connection for current thread
        """
        if hasattr(cls._local, 'connection'):
            cls._local.connection.close()
            delattr(cls._local, 'connection')
    
    @classmethod
    @contextmanager
    def get_cursor(cls):
        """
        Context manager for cursor with automatic commit/rollback
        """
        conn = cls.get_connection()
        cursor = conn.cursor()
        try:
            yield cursor
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cursor.close()
    
    @classmethod
    def execute_query(cls, query: str, params: Optional[tuple] = None) -> List[Dict[str, Any]]:
        """
        Execute a SELECT query and return results as list of dicts
        """
        with cls.get_cursor() as cursor:
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            # Convert sqlite3.Row to dict
            columns = [description[0] for description in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    @classmethod
    def execute_update(cls, query: str, params: Optional[tuple] = None) -> int:
        """
        Execute an INSERT/UPDATE/DELETE query
        Returns number of affected rows
        """
        with cls.get_cursor() as cursor:
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            return cursor.rowcount
    
    @classmethod
    def execute_insert(cls, query: str, params: Optional[tuple] = None) -> str:
        """
        Execute an INSERT query and return the last inserted ID
        """
        with cls.get_cursor() as cursor:
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            return cursor.lastrowid


# Convenience functions
def get_db():
    """Dependency for FastAPI endpoints"""
    return DatabaseConnection


def dict_factory(cursor, row):
    """Convert Row to dict"""
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}
