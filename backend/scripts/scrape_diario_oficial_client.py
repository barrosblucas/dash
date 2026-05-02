"""
Cliente HTTP assíncrono para busca e download no Diário Oficial MS.

Re-exporta DiarioOficialClient de backend.shared.diario_oficial_client
para compatibilidade com scripts existentes.
"""

from __future__ import annotations

from backend.shared.diario_oficial_client import DiarioOficialClient

__all__ = ["DiarioOficialClient"]
