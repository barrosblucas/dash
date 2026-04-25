"""Catálogo de recursos sincronizados da feature saude."""

from __future__ import annotations

from backend.features.saude.saude_types import SaudeSnapshotResource

SaudeResourceDefinition = tuple[str, bool, dict[str, str]]

RESOURCE_DEFINITIONS: dict[SaudeSnapshotResource, SaudeResourceDefinition] = {
    SaudeSnapshotResource.MEDICAMENTOS_ESTOQUE: ("medicamentos-tabela", False, {}),
    SaudeSnapshotResource.MEDICAMENTOS_RANKING: (
        "buscar-dados-do-chart/lista-de-medicamentos-com-mais-saidas",
        False,
        {},
    ),
    SaudeSnapshotResource.MEDICAMENTOS_DISPENSADOS_MENSAL: (
        "buscar-dados-do-chart/quantidade-de-medicamentos-dispensados-por-mes",
        False,
        {},
    ),
    SaudeSnapshotResource.MEDICAMENTOS_ATENDIMENTOS_MENSAL: (
        "buscar-dados-do-chart/quantidade-de-atendimentos-medicamentos-por-mes",
        True,
        {},
    ),
    SaudeSnapshotResource.QUANTITATIVOS: ("buscar-dados-quantitativos", False, {}),
    SaudeSnapshotResource.ATENDIMENTOS_POR_SEXO: (
        "buscar-dados-do-chart/quantidade-de-atendimento-por-sexo",
        False,
        {},
    ),
    SaudeSnapshotResource.PESSOAS_FISICAS_JURIDICAS: (
        "buscar-dados-do-chart/quantidade-de-pessoas-fisicas-e-juridicas",
        False,
        {},
    ),
    SaudeSnapshotResource.PESSOAS_POR_MES: (
        "buscar-dados-do-chart/quantidade-de-pessoas-por-mes",
        False,
        {},
    ),
    SaudeSnapshotResource.PROCEDIMENTOS_POR_TIPO: (
        "buscar-dados-do-chart/quantidade-de-procedimentos-por-tipo",
        False,
        {},
    ),
    SaudeSnapshotResource.VACINAS_POR_MES: (
        "buscar-dados-do-chart/quantidade-de-vacinas-por-mes-do-esus",
        True,
        {},
    ),
    SaudeSnapshotResource.VACINAS_RANKING: (
        "buscar-dados-do-chart/vacinas-mais-aplicadas-por-periodo",
        False,
        {},
    ),
    SaudeSnapshotResource.VISITAS_MOTIVOS: (
        "buscar-dados-do-chart/familias-visitadas-motivos-da-visita",
        False,
        {},
    ),
    SaudeSnapshotResource.VISITAS_ACOMPANHAMENTO: (
        "buscar-dados-do-chart/familias-visitadas-acompanhamento",
        False,
        {},
    ),
    SaudeSnapshotResource.VISITAS_BUSCA_ATIVA: (
        "buscar-dados-do-chart/familias-visitadas-busca-ativa",
        False,
        {},
    ),
    SaudeSnapshotResource.VISITAS_CONTROLE_VETORIAL: (
        "buscar-dados-do-chart/familias-visitadas-controle-ambiente-vetorial",
        False,
        {},
    ),
    SaudeSnapshotResource.ATENCAO_PRIMARIA_ATENDIMENTOS_MENSAL: (
        "buscar-dados-do-chart/quantidade-de-atendimentos-por-mes-da-especialidade",
        True,
        {},
    ),
    SaudeSnapshotResource.ATENCAO_PRIMARIA_PROCEDIMENTOS: (
        "buscar-dados-do-chart/atencao-basica-quantidade-de-procedimentos-realizados-por-especialidade",
        False,
        {},
    ),
    SaudeSnapshotResource.ATENCAO_PRIMARIA_CBO: (
        "buscar-dados-do-chart/quantidade-de-atendimentos-por-cbo-da-especialidade",
        True,
        {"data_de_inicio": "{year}-01-01"},
    ),
    SaudeSnapshotResource.SAUDE_BUCAL_ATENDIMENTOS_MENSAL: (
        "buscar-dados-do-chart/quantidade-de-atendimentos-por-mes-da-odonto",
        False,
        {},
    ),
    SaudeSnapshotResource.HOSPITAL_CENSO: (
        "buscar-censo-dos-leitos-da-internacao",
        False,
        {},
    ),
    SaudeSnapshotResource.HOSPITAL_PROCEDIMENTOS: (
        "dados-hospitalar-quantidade-procedimentos-realizados",
        False,
        {},
    ),
    SaudeSnapshotResource.HOSPITAL_ATENDIMENTOS_MENSAL: (
        "buscar-dados-do-chart/quantidade-de-atendimentos-por-mes-do-hospital",
        False,
        {},
    ),
}

DEFAULT_SYNC_RESOURCES: list[SaudeSnapshotResource] = [
    SaudeSnapshotResource.MEDICAMENTOS_ESTOQUE,
    SaudeSnapshotResource.MEDICAMENTOS_RANKING,
    SaudeSnapshotResource.MEDICAMENTOS_DISPENSADOS_MENSAL,
    SaudeSnapshotResource.MEDICAMENTOS_ATENDIMENTOS_MENSAL,
    SaudeSnapshotResource.QUANTITATIVOS,
    SaudeSnapshotResource.PESSOAS_FISICAS_JURIDICAS,
    SaudeSnapshotResource.PESSOAS_POR_MES,
    SaudeSnapshotResource.PROCEDIMENTOS_POR_TIPO,
    SaudeSnapshotResource.VACINAS_POR_MES,
    SaudeSnapshotResource.VACINAS_RANKING,
    SaudeSnapshotResource.VISITAS_MOTIVOS,
    SaudeSnapshotResource.VISITAS_ACOMPANHAMENTO,
    SaudeSnapshotResource.VISITAS_BUSCA_ATIVA,
    SaudeSnapshotResource.VISITAS_CONTROLE_VETORIAL,
    SaudeSnapshotResource.ATENCAO_PRIMARIA_ATENDIMENTOS_MENSAL,
    SaudeSnapshotResource.ATENCAO_PRIMARIA_PROCEDIMENTOS,
    SaudeSnapshotResource.ATENCAO_PRIMARIA_CBO,
    SaudeSnapshotResource.SAUDE_BUCAL_ATENDIMENTOS_MENSAL,
    SaudeSnapshotResource.HOSPITAL_CENSO,
    SaudeSnapshotResource.HOSPITAL_PROCEDIMENTOS,
    SaudeSnapshotResource.HOSPITAL_ATENDIMENTOS_MENSAL,
]
