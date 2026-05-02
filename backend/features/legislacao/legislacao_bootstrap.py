"""Bootstrap idempotente de legislações a partir dos dados mockados."""
from __future__ import annotations

import json
import logging
from datetime import date

from sqlalchemy.orm import Session

from backend.features.legislacao.legislacao_mock_data import (
    _MOCK_LEGISLACOES_PART1,
)
from backend.features.legislacao.legislacao_mock_data_extra import (
    _MOCK_LEGISLACOES_PART2,
)
from backend.shared.database.models import LegislacaoModel

logger = logging.getLogger(__name__)


def bootstrap_legislacoes(session: Session) -> int:
    count = session.query(LegislacaoModel).count()
    if count > 0:
        logger.info("Tabela legislacoes já possui %d registros; bootstrap ignorado", count)
        return 0

    all_mock = _MOCK_LEGISLACOES_PART1 + _MOCK_LEGISLACOES_PART2
    seeded = 0
    for item in all_mock:
        vinculada = item.get("legislacao_vinculada")
        model = LegislacaoModel(
            tipo=item["tipo"].value if hasattr(item["tipo"], "value") else str(item["tipo"]),
            numero=item["numero"],
            ano=item["ano"],
            ementa=item["ementa"],
            texto_integral=item.get("texto_integral"),
            data_publicacao=date.fromisoformat(str(item["data_publicacao"])),
            data_promulgacao=date.fromisoformat(str(item["data_promulgacao"])) if item.get("data_promulgacao") else None,
            data_vigencia_inicio=date.fromisoformat(str(item["data_vigencia_inicio"])) if item.get("data_vigencia_inicio") else None,
            data_vigencia_fim=date.fromisoformat(str(item["data_vigencia_fim"])) if item.get("data_vigencia_fim") else None,
            status=item["status"].value if hasattr(item["status"], "value") else str(item["status"]),
            autor=item.get("autor"),
            sancionado_por=item.get("sancionado_por"),
            origem=item.get("origem"),
            legislacao_vinculada_json=json.dumps(vinculada) if vinculada else None,
            url_arquivo=item.get("url_arquivo"),
        )
        session.add(model)
        seeded += 1

    session.flush()
    logger.info("Bootstrap de legislações: %d registros inseridos", seeded)
    return seeded
