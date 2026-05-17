"""Scrapers de features do portal de transparência.

Cada função executa o scraping de uma feature específica e persiste
no banco. Usado pelo ScrapingScheduler para manter o desacoplamento.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


async def scrape_cargos(year: int) -> dict[str, Any]:
    try:
        from backend.features.cargo.cargo_adapter import fetch_cargos
        from backend.features.cargo.cargo_data import upsert_cargos
        from backend.shared.database.connection import db_manager

        items = await fetch_cargos(year)
        if not items:
            return {"status": "NO_DATA", "count": 0}

        with db_manager.get_session() as session:
            count = upsert_cargos(session, items)

        logger.info("Scraping cargos %d: %d itens persistidos", year, count)
        return {"status": "SUCCESS", "count": count}
    except Exception:
        logger.exception("Erro scraping cargos — ano=%d", year)
        return {"status": "ERROR", "count": 0}


async def scrape_contratos(year: int) -> dict[str, Any]:
    try:
        from backend.features.contrato.contrato_adapter import fetch_contratos
        from backend.features.contrato.contrato_data import upsert_contratos
        from backend.shared.database.connection import db_manager

        items = await fetch_contratos(year)
        if not items:
            return {"status": "NO_DATA", "count": 0}

        with db_manager.session() as session:
            count = upsert_contratos(session, items)

        logger.info("Scraping contratos %d: %d itens persistidos", year, count)
        return {"status": "SUCCESS", "count": count}
    except Exception:
        logger.exception("Erro scraping contratos — ano=%d", year)
        return {"status": "ERROR", "count": 0}


async def scrape_convenios(year: int) -> dict[str, Any]:
    try:
        from backend.features.convenio.convenio_adapter import fetch_convenios
        from backend.features.convenio.convenio_data import upsert_convenios
        from backend.shared.database.connection import db_manager

        items = await fetch_convenios(year)
        if not items:
            return {"status": "NO_DATA", "count": 0}

        with db_manager.get_session() as session:
            count = upsert_convenios(session, items)

        logger.info("Scraping convênios %d: %d itens persistidos", year, count)
        return {"status": "SUCCESS", "count": count}
    except Exception:
        logger.exception("Erro scraping convênios — ano=%d", year)
        return {"status": "ERROR", "count": 0}


async def scrape_emendas(year: int) -> dict[str, Any]:
    try:
        from backend.features.emenda.emenda_adapter import fetch_emendas
        from backend.features.emenda.emenda_data import upsert_emendas
        from backend.shared.database.connection import db_manager

        items = await fetch_emendas(year)
        if not items:
            return {"status": "NO_DATA", "count": 0}

        with db_manager.get_session() as session:
            count = upsert_emendas(session, items)

        logger.info("Scraping emendas %d: %d itens persistidos", year, count)
        return {"status": "SUCCESS", "count": count}
    except Exception:
        logger.exception("Erro scraping emendas — ano=%d", year)
        return {"status": "ERROR", "count": 0}


async def scrape_folha(year: int) -> dict[str, Any]:
    from backend.features.folha.folha_adapter import (
        fetch_employees,
        fetch_offices,
    )
    from backend.features.folha.folha_data import (
        upsert_employees,
        upsert_offices,
    )
    from backend.shared.database.connection import db_manager

    try:
        total_offices = 0
        total_employees = 0
        months_with_data = 0

        for mes in range(1, 13):
            try:
                offices = await fetch_offices(year, mes)
                if not offices:
                    continue

                months_with_data += 1

                with db_manager.get_session() as session:
                    count = upsert_offices(session, offices)
                    total_offices += count

                for office in offices:
                    try:
                        employees = await fetch_employees(
                            year, mes,
                            office.office_id,
                            office.department_id,
                        )
                        if not employees:
                            continue

                        with db_manager.get_session() as session:
                            emp_count = upsert_employees(session, employees)
                            total_employees += emp_count
                    except Exception:
                        logger.exception(
                            "Erro ao buscar servidores — ano=%d mes=%d "
                            "office=%d dept=%d",
                            year, mes,
                            office.office_id,
                            office.department_id,
                        )
                        continue
            except Exception:
                logger.exception(
                    "Erro ao buscar offices — ano=%d mes=%d",
                    year, mes,
                )
                continue

        logger.info(
            "Scraping folha %d: %d offices, %d employees, "
            "%d meses com dados",
            year, total_offices, total_employees, months_with_data,
        )
        return {
            "status": "SUCCESS",
            "offices": total_offices,
            "employees": total_employees,
            "months": months_with_data,
        }
    except Exception:
        logger.exception("Erro scraping folha — ano=%d", year)
        return {"status": "ERROR", "offices": 0, "employees": 0}
