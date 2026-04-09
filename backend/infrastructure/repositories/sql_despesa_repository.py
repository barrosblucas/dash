"""
Repositório SQL para Despesas.
Dashboard Financeiro - Bandeirantes MS
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from decimal import Decimal

from backend.infrastructure.database.connection import get_db
from backend.infrastructure.database.models import DespesaModel
from backend.domain.entities.despesa import Despesa, TipoDespesa


class SQLDespesaRepository:
    """Repositório de despesas usando SQLAlchemy."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, despesa_id: int) -> Optional[Despesa]:
        """Busca uma despesa pelo ID."""
        model = (
            self.db.query(DespesaModel).filter(DespesaModel.id == despesa_id).first()
        )

        if model is None:
            return None

        return self._model_to_entity(model)

    def list(
        self,
        ano: Optional[int] = None,
        mes: Optional[int] = None,
        categoria: Optional[str] = None,
        tipo: Optional[TipoDespesa] = None,
        ano_inicio: Optional[int] = None,
        ano_fim: Optional[int] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> List[Despesa]:
        """Lista despesas com filtros opcionais."""
        query = self.db.query(DespesaModel)

        # Filtros
        if ano is not None:
            query = query.filter(DespesaModel.ano == ano)

        if mes is not None:
            query = query.filter(DespesaModel.mes == mes)

        if categoria is not None:
            query = query.filter(DespesaModel.categoria.ilike(f"%{categoria}%"))

        if tipo is not None:
            query = query.filter(DespesaModel.tipo == tipo.value)

        if ano_inicio is not None:
            query = query.filter(DespesaModel.ano >= ano_inicio)

        if ano_fim is not None:
            query = query.filter(DespesaModel.ano <= ano_fim)

        # Ordenação
        query = query.order_by(DespesaModel.ano.desc(), DespesaModel.mes.desc())

        # Paginação
        if limit is not None:
            query = query.limit(limit)

        if offset is not None:
            query = query.offset(offset)

        models = query.all()

        return [self._model_to_entity(model) for model in models]

    def count(
        self,
        ano: Optional[int] = None,
        mes: Optional[int] = None,
        categoria: Optional[str] = None,
        tipo: Optional[TipoDespesa] = None,
    ) -> int:
        """Conta o número total de despesas com filtros."""
        query = self.db.query(func.count(DespesaModel.id))

        if ano is not None:
            query = query.filter(DespesaModel.ano == ano)

        if mes is not None:
            query = query.filter(DespesaModel.mes == mes)

        if categoria is not None:
            query = query.filter(DespesaModel.categoria.ilike(f"%{categoria}%"))

        if tipo is not None:
            query = query.filter(DespesaModel.tipo == tipo.value)

        return query.scalar() or 0

    def get_total_by_ano(self, ano: int, tipo: Optional[TipoDespesa] = None) -> Decimal:
        """Calcula o total de despesas por ano."""
        query = self.db.query(func.sum(DespesaModel.valor_pago)).filter(
            DespesaModel.ano == ano
        )

        if tipo is not None:
            query = query.filter(DespesaModel.tipo == tipo.value)

        result = query.scalar()

        return Decimal(str(result)) if result else Decimal("0")

    def get_total_by_mes(
        self, ano: int, mes: int, tipo: Optional[TipoDespesa] = None
    ) -> Decimal:
        """Calcula o total de despesas por mês."""
        query = self.db.query(func.sum(DespesaModel.valor_pago)).filter(
            and_(DespesaModel.ano == ano, DespesaModel.mes == mes)
        )

        if tipo is not None:
            query = query.filter(DespesaModel.tipo == tipo.value)

        result = query.scalar()

        return Decimal(str(result)) if result else Decimal("0")

    def get_categorias(self) -> List[str]:
        """Retorna todas as categorias de despesa cadastradas."""
        categorias = self.db.query(DespesaModel.categoria).distinct().all()
        return [c[0] for c in categorias if c[0]]

    def _model_to_entity(self, model: DespesaModel) -> Despesa:
        """Converte um modelo SQLAlchemy para entidade de domínio."""
        return Despesa(
            id=model.id,
            ano=model.ano,
            mes=model.mes,
            categoria=model.categoria,
            subcategoria=model.subcategoria,
            tipo=TipoDespesa[model.tipo],
            valor_empenhado=model.valor_empenhado,
            valor_liquidado=model.valor_liquidado,
            valor_pago=model.valor_pago,
            fonte=model.fonte,
        )
