"""
Implementação do repositório de receitas usando SQLAlchemy.

Fornece persistência de receitas em banco SQLite/PostgreSQL.
"""

from decimal import Decimal

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from backend.features.receita.receita_types import (
    Receita,
    TipoReceita,
)
from backend.shared.database.models import ReceitaModel


class SQLReceitaRepository:
    """
    Implementação do repositório de receitas usando SQLAlchemy.

    Converte entre entidades de domínio (Receita) e modelos de infraestrutura (ReceitaModel).

    Attributes:
        session: Sessão do SQLAlchemy.
    """

    def __init__(self, session: Session):
        """
        Inicializa o repositório com uma sessão do SQLAlchemy.

        Args:
            session: Sessão do SQLAlchemy injetada.
        """
        self.session = session

    def _to_entity(self, model: ReceitaModel) -> Receita:
        """
        Converte modelo SQLAlchemy para entidade de domínio.

        Args:
            model: Modelo SQLAlchemy.

        Returns:
            Entidade de domínio Receita.
        """
        return Receita(
            id=model.id,
            ano=model.ano,
            mes=model.mes,
            categoria=model.categoria,
            subcategoria=model.subcategoria,
            tipo=TipoReceita(model.tipo),
            valor_previsto=Decimal(str(model.valor_previsto)),
            valor_arrecadado=Decimal(str(model.valor_arrecadado)),
            valor_anulado=Decimal(str(model.valor_anulado)),
            fonte=model.fonte,
            created_at=model.created_at.date() if model.created_at else None,
            updated_at=model.updated_at.date() if model.updated_at else None,
        )

    def _to_model(self, entity: Receita) -> ReceitaModel:
        """
        Converte entidade de domínio para modelo SQLAlchemy.

        Args:
            entity: Entidade de domínio.

        Returns:
            Modelo SQLAlchemy ReceitaModel.
        """
        return ReceitaModel(
            id=entity.id,
            ano=entity.ano,
            mes=entity.mes,
            categoria=entity.categoria,
            subcategoria=entity.subcategoria,
            tipo=entity.tipo.value,
            valor_previsto=entity.valor_previsto,
            valor_arrecadado=entity.valor_arrecadado,
            valor_anulado=entity.valor_anulado,
            fonte=entity.fonte,
        )

    def add(self, receita: Receita) -> Receita:
        """Adiciona uma nova receita ao repositório."""
        model = self._to_model(receita)
        self.session.add(model)
        self.session.flush()  # Flush para obter o ID gerado
        self.session.refresh(model)
        return self._to_entity(model)

    def add_bulk(self, receitas: list[Receita]) -> int:
        """Adiciona múltiplas receitas em uma única transação."""
        models = [self._to_model(r) for r in receitas]
        self.session.add_all(models)
        self.session.flush()
        return len(models)

    def get_by_id(self, receita_id: int) -> Receita | None:
        """Busca uma receita pelo seu ID."""
        model = (
            self.session.query(ReceitaModel)
            .filter(ReceitaModel.id == receita_id)
            .first()
        )
        return self._to_entity(model) if model else None

    def list_all(
        self,
        ano: int | None = None,
        mes: int | None = None,
        categoria: str | None = None,
        tipo: TipoReceita | None = None,
        ano_inicio: int | None = None,
        ano_fim: int | None = None,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[Receita]:
        """Lista receitas com filtros opcionais."""
        query = self.session.query(ReceitaModel)

        # Aplica filtros
        if ano is not None:
            query = query.filter(ReceitaModel.ano == ano)

        if mes is not None:
            query = query.filter(ReceitaModel.mes == mes)

        if categoria is not None:
            # Busca case-insensitive parcial
            query = query.filter(ReceitaModel.categoria.ilike(f"%{categoria}%"))

        if tipo is not None:
            query = query.filter(ReceitaModel.tipo == tipo.value)

        if ano_inicio is not None:
            query = query.filter(ReceitaModel.ano >= ano_inicio)

        if ano_fim is not None:
            query = query.filter(ReceitaModel.ano <= ano_fim)

        # Ordenação padrão: ano desc, mes desc
        query = query.order_by(
            ReceitaModel.ano.desc(), ReceitaModel.mes.desc(), ReceitaModel.categoria
        )

        # Paginação
        if limit is not None:
            query = query.limit(limit)

        if offset is not None:
            query = query.offset(offset)

        models = query.all()
        return [self._to_entity(m) for m in models]

    def update(self, receita: Receita) -> Receita:
        """Atualiza uma receita existente."""
        if receita.id is None:
            raise ValueError("Receita deve ter ID para ser atualizada")

        model = (
            self.session.query(ReceitaModel)
            .filter(ReceitaModel.id == receita.id)
            .first()
        )

        if model is None:
            raise ValueError(f"Receita não encontrada com ID: {receita.id}")

        # Atualiza campos
        model.ano = receita.ano
        model.mes = receita.mes
        model.categoria = receita.categoria
        model.subcategoria = receita.subcategoria
        model.tipo = receita.tipo.value
        model.valor_previsto = receita.valor_previsto
        model.valor_arrecadado = receita.valor_arrecadado
        model.valor_anulado = receita.valor_anulado
        model.fonte = receita.fonte

        self.session.flush()
        self.session.refresh(model)
        return self._to_entity(model)

    def delete(self, receita_id: int) -> bool:
        """Remove uma receita pelo ID."""
        model = (
            self.session.query(ReceitaModel)
            .filter(ReceitaModel.id == receita_id)
            .first()
        )

        if model is None:
            return False

        self.session.delete(model)
        self.session.flush()
        return True

    def get_by_periodo_e_categoria(
        self, ano: int, mes: int, categoria: str
    ) -> Receita | None:
        """Busca receita por período e categoria."""
        model = (
            self.session.query(ReceitaModel)
            .filter(
                and_(
                    ReceitaModel.ano == ano,
                    ReceitaModel.mes == mes,
                    ReceitaModel.categoria == categoria,
                )
            )
            .first()
        )
        return self._to_entity(model) if model else None

    def get_total_by_ano(
        self,
        ano: int,
        tipo: TipoReceita | None = None,
    ) -> Decimal:
        """Calcula o total arrecadado em um ano."""
        query = self.session.query(func.sum(ReceitaModel.valor_arrecadado)).filter(
            ReceitaModel.ano == ano
        )

        if tipo is not None:
            query = query.filter(ReceitaModel.tipo == tipo.value)

        total = query.scalar()
        return Decimal(str(total)) if total else Decimal("0")

    def get_total_by_mes(
        self,
        ano: int,
        mes: int,
        tipo: TipoReceita | None = None,
    ) -> Decimal:
        """Calcula o total arrecadado em um mês específico."""
        query = self.session.query(func.sum(ReceitaModel.valor_arrecadado)).filter(
            and_(ReceitaModel.ano == ano, ReceitaModel.mes == mes)
        )

        if tipo is not None:
            query = query.filter(ReceitaModel.tipo == tipo.value)

        total = query.scalar()
        return Decimal(str(total)) if total else Decimal("0")

    def get_categorias(self) -> list[str]:
        """Retorna todas as categorias de receita cadastradas."""
        results = (
            self.session.query(ReceitaModel.categoria)
            .distinct()
            .order_by(ReceitaModel.categoria)
            .all()
        )
        return [r[0] for r in results if r[0]]

    def count(
        self,
        ano: int | None = None,
        mes: int | None = None,
        categoria: str | None = None,
        tipo: TipoReceita | None = None,
    ) -> int:
        """Conta o número de receitas que atendem aos filtros."""
        query = self.session.query(func.count(ReceitaModel.id))

        if ano is not None:
            query = query.filter(ReceitaModel.ano == ano)

        if mes is not None:
            query = query.filter(ReceitaModel.mes == mes)

        if categoria is not None:
            query = query.filter(ReceitaModel.categoria.ilike(f"%{categoria}%"))

        if tipo is not None:
            query = query.filter(ReceitaModel.tipo == tipo.value)

        return query.scalar() or 0

    def list_detalhamento_by_ano(
        self,
        ano: int,
    ) -> list[dict]:
        """Retorna detalhamento hierárquico de receitas para um ano.

        Returns:
            Lista de dicionários com campos do modelo ReceitaDetalhamentoModel.
        """
        from backend.shared.database.models import ReceitaDetalhamentoModel

        modelos = (
            self.session.query(ReceitaDetalhamentoModel)
            .filter(ReceitaDetalhamentoModel.ano == ano)
            .order_by(ReceitaDetalhamentoModel.ordem)
            .all()
        )

        return [
            {
                "id": m.id,
                "ano": m.ano,
                "detalhamento": m.detalhamento,
                "nivel": m.nivel,
                "ordem": m.ordem,
                "tipo": m.tipo,
                "valor_previsto": m.valor_previsto,
                "valor_arrecadado": m.valor_arrecadado,
                "valor_anulado": m.valor_anulado,
                "fonte": m.fonte,
            }
            for m in modelos
        ]
