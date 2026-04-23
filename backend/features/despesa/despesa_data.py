"""
Repositório SQL para Despesas.
Dashboard Financeiro - Bandeirantes MS
"""

from decimal import Decimal
from typing import cast

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from backend.features.despesa.despesa_types import Despesa, TipoDespesa
from backend.shared.database.models import DespesaModel


class SQLDespesaRepository:
    """Repositório de despesas usando SQLAlchemy."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, despesa_id: int) -> Despesa | None:
        """Busca uma despesa pelo ID."""
        model = (
            self.db.query(DespesaModel).filter(DespesaModel.id == despesa_id).first()
        )

        if model is None:
            return None

        return self._model_to_entity(model)

    def list_all(
        self,
        ano: int | None = None,
        mes: int | None = None,
        categoria: str | None = None,
        tipo: TipoDespesa | None = None,
        ano_inicio: int | None = None,
        ano_fim: int | None = None,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[Despesa]:
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
        ano: int | None = None,
        mes: int | None = None,
        categoria: str | None = None,
        tipo: TipoDespesa | None = None,
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

    def get_total_by_ano(self, ano: int, tipo: TipoDespesa | None = None) -> Decimal:
        """Calcula o total de despesas por ano."""
        query = self.db.query(func.sum(DespesaModel.valor_pago)).filter(
            DespesaModel.ano == ano
        )

        if tipo is not None:
            query = query.filter(DespesaModel.tipo == tipo.value)

        result = query.scalar()

        return Decimal(str(result)) if result else Decimal("0")

    def get_total_by_mes(
        self, ano: int, mes: int, tipo: TipoDespesa | None = None
    ) -> Decimal:
        """Calcula o total de despesas por mês."""
        query = self.db.query(func.sum(DespesaModel.valor_pago)).filter(
            and_(DespesaModel.ano == ano, DespesaModel.mes == mes)
        )

        if tipo is not None:
            query = query.filter(DespesaModel.tipo == tipo.value)

        result = query.scalar()

        return Decimal(str(result)) if result else Decimal("0")

    def get_categorias(self) -> list[str]:
        """Retorna todas as categorias de despesa cadastradas."""
        categorias = self.db.query(DespesaModel.categoria).distinct().all()
        return [c[0] for c in categorias if c[0]]

    def _model_to_entity(self, model: DespesaModel) -> Despesa:
        """Converte um modelo SQLAlchemy para entidade de domínio."""
        return Despesa(
            id=cast(int | None, model.id),
            ano=cast(int, model.ano),
            mes=cast(int, model.mes),
            categoria=cast(str | None, model.categoria),
            subcategoria=cast(str | None, model.subcategoria),
            tipo=TipoDespesa[cast(str, model.tipo)],
            valor_empenhado=cast(Decimal, model.valor_empenhado),
            valor_liquidado=cast(Decimal, model.valor_liquidado),
            valor_pago=cast(Decimal, model.valor_pago),
            fonte=cast(str, model.fonte),
        )

    def get_totais_por_ano(
        self,
        ano: int,
        tipo: str | None = None,
    ) -> tuple[Decimal, Decimal, Decimal]:
        """Retorna (total_empenhado, total_liquidado, total_pago) para um ano.

        Args:
            ano: Ano para cálculo.
            tipo: Filtra por tipo de despesa ('CORRENTE', 'CAPITAL', 'CONTINGENCIA').

        Raises:
            ValueError: Se o tipo for inválido.
        """
        validos = {"CORRENTE", "CAPITAL", "CONTINGENCIA"}
        tipo_upper = None
        if tipo:
            tipo_upper = tipo.upper()
            if tipo_upper not in validos:
                raise ValueError(
                    f"Tipo inválido: {tipo}. Use CORRENTE, CAPITAL ou CONTINGENCIA."
                )

        query = self.db.query(
            func.sum(DespesaModel.valor_empenhado).label("total_empenhado"),
            func.sum(DespesaModel.valor_liquidado).label("total_liquidado"),
            func.sum(DespesaModel.valor_pago).label("total_pago"),
        ).filter(DespesaModel.ano == ano)

        if tipo_upper:
            query = query.filter(DespesaModel.tipo == tipo_upper)

        resultado = query.first()

        if resultado is None:
            return (
                Decimal("0"),
                Decimal("0"),
                Decimal("0"),
            )

        return (
            Decimal(str(resultado.total_empenhado or 0)),
            Decimal(str(resultado.total_liquidado or 0)),
            Decimal(str(resultado.total_pago or 0)),
        )

    def get_totais_por_mes(
        self,
        ano: int,
        mes: int,
        tipo: str | None = None,
    ) -> tuple[Decimal, Decimal, Decimal]:
        """Retorna (total_empenhado, total_liquidado, total_pago) para um mês.

        Args:
            ano: Ano para cálculo.
            mes: Mês para cálculo (1-12).
            tipo: Filtra por tipo de despesa ('CORRENTE', 'CAPITAL', 'CONTINGENCIA').

        Raises:
            ValueError: Se o tipo for inválido.
        """
        validos = {"CORRENTE", "CAPITAL", "CONTINGENCIA"}
        tipo_upper = None
        if tipo:
            tipo_upper = tipo.upper()
            if tipo_upper not in validos:
                raise ValueError(
                    f"Tipo inválido: {tipo}. Use CORRENTE, CAPITAL ou CONTINGENCIA."
                )

        query = self.db.query(
            func.sum(DespesaModel.valor_empenhado).label("total_empenhado"),
            func.sum(DespesaModel.valor_liquidado).label("total_liquidado"),
            func.sum(DespesaModel.valor_pago).label("total_pago"),
        ).filter(and_(DespesaModel.ano == ano, DespesaModel.mes == mes))

        if tipo_upper:
            query = query.filter(DespesaModel.tipo == tipo_upper)

        resultado = query.first()

        if resultado is None:
            return (
                Decimal("0"),
                Decimal("0"),
                Decimal("0"),
            )

        return (
            Decimal(str(resultado.total_empenhado or 0)),
            Decimal(str(resultado.total_liquidado or 0)),
            Decimal(str(resultado.total_pago or 0)),
        )

    def list_categorias(self) -> list[str]:
        """Retorna todas as categorias de despesa cadastradas."""
        results = (
            self.db.query(DespesaModel.categoria)
            .distinct()
            .order_by(DespesaModel.categoria)
            .all()
        )
        return [r[0] for r in results if r[0]]
