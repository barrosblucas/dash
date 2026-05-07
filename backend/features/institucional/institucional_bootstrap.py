"""Bootstrap idempotente de dados institucionais."""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from backend.shared.database.institucional_models import (
    DepartmentModel,
    OfficeModel,
    ProfileInstitucionalModel,
)

logger = logging.getLogger(__name__)

# Nomes/slugs das secretarias e autarquias conforme especificação
_SEED_DEPARTMENTS: list[dict[str, str]] = [
    {
        "name": "Secretaria Municipal de Administração",
        "slug": "administracao",
        "kind": "secretaria",
    },
    {
        "name": "Secretaria Municipal de Assistência Social e Cidadania",
        "slug": "assistencia-social-e-cidadania",
        "kind": "secretaria",
    },
    {
        "name": "Secretaria Municipal de Desenvolvimento e Turismo",
        "slug": "desenvolvimento-e-turismo",
        "kind": "secretaria",
    },
    {
        "name": "Secretaria Municipal de Educação",
        "slug": "educacao",
        "kind": "secretaria",
    },
    {
        "name": "Secretaria Municipal de Esporte e Cultura",
        "slug": "esporte-e-cultura",
        "kind": "secretaria",
    },
    {
        "name": "Secretaria Municipal de Finanças Públicas",
        "slug": "financas-publicas",
        "kind": "secretaria",
    },
    {
        "name": "Secretaria Municipal de Gestão Agrária e Ambiental",
        "slug": "gestao-agraria-e-ambiental",
        "kind": "secretaria",
    },
    {
        "name": "Secretaria Municipal de Governo",
        "slug": "governo",
        "kind": "secretaria",
    },
    {
        "name": "Secretaria Municipal de Infraestrutura",
        "slug": "infraestrutura",
        "kind": "secretaria",
    },
    {"name": "Secretaria Municipal de Saúde", "slug": "saude", "kind": "secretaria"},
    {
        "name": "SAAE - Serviço de Abastecimento de Água e Esgoto",
        "slug": "saae",
        "kind": "autarquia",
    },
]


def bootstrap_institucional(session: Session) -> None:
    """Cria dados iniciais idempotentes para o módulo institucional."""
    # 1. Profile institucional
    profile = session.query(ProfileInstitucionalModel).first()
    if profile is None:
        profile = ProfileInstitucionalModel(
            city_hall_name="Prefeitura Municipal de Bandeirantes",
            description="Informações institucionais em atualização.",
        )
        session.add(profile)
        session.flush()
        logger.info(
            "Profile institucional criado: city_hall_name=%s", profile.city_hall_name
        )

    # 2. Departamentos (secretarias + autarquias)
    existing = session.query(DepartmentModel).count()
    if existing == 0:
        for item in _SEED_DEPARTMENTS:
            leader_title = (
                "Diretor(a)" if item["kind"] == "autarquia" else "Secretário(a)"
            )
            dept = DepartmentModel(
                slug=item["slug"],
                name=item["name"],
                kind=item["kind"],
                leader_title=leader_title,
            )
            session.add(dept)
            session.flush()
            # Cria repartição inicial vinculada com nome igual ao do órgão
            office_kind = item[
                "kind"
            ]  # mescla: secretaria → secretaria, autarquia → autarquia
            office = OfficeModel(
                department_id=dept.id,
                kind=office_kind,
                name=item["name"],
            )
            session.add(office)
        session.flush()
        logger.info(
            "Bootstrap institucional: %d departamentos e repartições iniciais criados",
            len(_SEED_DEPARTMENTS),
        )
    else:
        logger.info(
            "Tabela institucional_departments já possui %d registros; bootstrap ignorado",
            existing,
        )
