"""
Database package
"""
from .mysql import get_db_connection, query_products, get_user_interactions, check_db_health

__all__ = ["get_db_connection", "query_products", "get_user_interactions", "check_db_health"]
