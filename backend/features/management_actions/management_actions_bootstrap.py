from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from backend.features.management_actions.management_actions_data import (
    create_action,
    list_actions,
)
from backend.features.management_actions.management_actions_types import (
    ActionCreateRequest,
)

logger = logging.getLogger(__name__)

SEED_ACTIONS: list[dict] = [
    {
        "title": "Pavimentação da Av. Central",
        "description": "Recapeamento integral de 3,2 km com nova sinalização, acessibilidade universal e galerias pluviais. Beneficiou 12 mil moradores da região central.",
        "category": "Infraestrutura",
        "category_icon": "road",
        "investment_raw": 4_200_000,
        "impact_label": "Beneficiados",
        "impact_number": 12,
        "impact_suffix": " mil",
        "image": "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&q=80",
        "month": "Janeiro",
        "year": "2024",
        "status": "concluída",
        "color": "#3b82f6",
        "progress": 100,
    },
    {
        "title": "UBS Jardim América",
        "description": "Unidade com 420m², 4 consultórios, farmácia e acolhimento. Atendimento ampliado para 8 mil pacientes da região sul.",
        "category": "Saúde",
        "category_icon": "local_hospital",
        "investment_raw": 2_800_000,
        "impact_label": "Pacientes",
        "impact_number": 8,
        "impact_suffix": " mil",
        "image": "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80",
        "month": "Março",
        "year": "2024",
        "status": "concluída",
        "color": "#10b981",
        "progress": 100,
    },
    {
        "title": "Praça da Juventude",
        "description": "Academia ao ar livre, playground inclusivo, pista de skate, quadra poliesportiva e Wi-Fi gratuito. Mais de 5 mil visitantes mensais.",
        "category": "Lazer",
        "category_icon": "sports_soccer",
        "investment_raw": 1_500_000,
        "impact_label": "Visitantes/mês",
        "impact_number": 5,
        "impact_suffix": " mil",
        "image": "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&q=80",
        "month": "Maio",
        "year": "2024",
        "status": "concluída",
        "color": "#ec4899",
        "progress": 100,
    },
    {
        "title": "Iluminação LED",
        "description": "Substituição de 2.400 pontos de iluminação com redução de 60% no consumo energético. Melhoria da segurança em 18 bairros.",
        "category": "Urbanismo",
        "category_icon": "lightbulb",
        "investment_raw": 3_100_000,
        "impact_label": "Economia energ.",
        "impact_number": 60,
        "impact_suffix": "%",
        "image": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&q=80",
        "month": "Julho",
        "year": "2024",
        "status": "concluída",
        "color": "#f59e0b",
        "progress": 100,
    },
    {
        "title": "Escola Municipal Prof. João Silva",
        "description": "Construção de 8 salas de aula, laboratório de informática, biblioteca e quadra coberta. Capacidade para 480 alunos em período integral.",
        "category": "Educação",
        "category_icon": "school",
        "investment_raw": 6_500_000,
        "impact_label": "Alunos",
        "impact_number": 480,
        "impact_suffix": "",
        "image": "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80",
        "month": "Setembro",
        "year": "2024",
        "status": "em andamento",
        "color": "#8b5cf6",
        "progress": 72,
    },
    {
        "title": "Rede de Esgoto — Bairro Progresso",
        "description": "Implantação de 4,8 km de rede coletora, ligação domiciliar e estação elevatória. Universalização do saneamento para 1.800 famílias.",
        "category": "Saneamento",
        "category_icon": "water_drop",
        "investment_raw": 5_300_000,
        "impact_label": "Famílias",
        "impact_number": 1800,
        "impact_suffix": "",
        "image": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
        "month": "Janeiro",
        "year": "2025",
        "status": "em andamento",
        "color": "#06b6d4",
        "progress": 55,
    },
    {
        "title": "CRAS — Centro de Referência",
        "description": "Centro de Assistência Social com brinquedoteca, salas de capacitação e cursos profissionalizantes. 3.500 atendimentos por ano.",
        "category": "Assistência",
        "category_icon": "volunteer_activism",
        "investment_raw": 1_900_000,
        "impact_label": "Atendidos/ano",
        "impact_number": 3500,
        "impact_suffix": "",
        "image": "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80",
        "month": "Fevereiro",
        "year": "2025",
        "status": "concluída",
        "color": "#f43f5e",
        "progress": 100,
    },
]


def seed_management_actions(db: Session) -> None:
    existing, count = list_actions(db)
    if count > 0:
        logger.info("Management actions já populadas (%d ações). Seed ignorado.", count)
        return

    for action_data in SEED_ACTIONS:
        create_action(db, ActionCreateRequest(**action_data))

    logger.info("Seed de management actions concluído: %d ações inseridas.", len(SEED_ACTIONS))
