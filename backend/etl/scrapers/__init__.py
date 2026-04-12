"""Scraper module for external data sources (QualitySistemas)."""

from .despesa_scraper import DespesaScraper
from .quality_api_client import QualityAPIClient

__all__ = ["DespesaScraper", "QualityAPIClient"]
