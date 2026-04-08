"""
Interface do repositório de receitas.

Define o contrato que todas as implementações de repositório de receitas devem seguir.
"""

from abc import ABC, abstractmethod
from datetime import date
from decimal import Decimal
from typing import List, Optional, Protocol

from backend.domain.entities.receita import Receita, TipoReceita


class ReceitaRepository(Protocol):
    """
    Protocolo definindo o contrato do repositório de receitas.

    Segue o princípio de inversão de dependência (DIP) permitindo
    que a camada de domínio não dependa de implementações específicas.

    Methods:
        add: Adiciona uma nova receita
        add_bulk: Adiciona múltiplas receitas em batch
        get_by_id: Busca receita por ID
        list: Lista receitas com filtros opcionais
        update: Atualiza uma receita existente
        delete: Remove uma receita
        get_by_periodo_e_categoria: Busca receita por período e categoria
        get_total_by_ano: Total de receitas por ano
        get_total_by_mes: Total de receitas por mês em um ano
        get_categorias: Lista todas as categorias de receita
    """

    @abstractmethod
    def add(self, receita: Receita) -> Receita:
        """
        Adiciona uma nova receita ao repositório.

        Args:
            receita: Receita a ser adicionada.

        Returns:
            Receita: Receita adicionada com ID gerado.

        Raises:
            IntegrityError: Se já existe receita para o mesmo período e categoria.
        """
        ...

    @abstractmethod
    def add_bulk(self, receitas: List[Receita]) -> int:
        """
        Adiciona múltiplas receitas em uma única transação.

        Args:
            receitas: Lista de receitas a serem adicionadas.

        Returns:
            int: Número de registros inseridos.

        Raises:
            IntegrityError: Se há duplicatas no período/categoria.
        """
        ...

    @abstractmethod
    def get_by_id(self, receita_id: int) -> Optional[Receita]:
        """
        Busca uma receita pelo seu ID.

        Args:
            receita_id: ID da receita.

        Returns:
            Receita se encontrada, None caso contrário.
        """
        ...

    @abstractmethod
    def list(
        self,
        ano: Optional[int] = None,
        mes: Optional[int] = None,
        categoria: Optional[str] = None,
        tipo: Optional[TipoReceita] = None,
        ano_inicio: Optional[int] = None,
        ano_fim: Optional[int] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> List[Receita]:
        """
        Lista receitas com filtros opcionais.

        Args:
            ano: Filtra por ano específico.
            mes: Filtra por mês específico.
            categoria: Filtra por categoria (busca parcial case-insensitive).
            tipo: Filtra por tipo de receita.
            ano_inicio: Ano inicial para range.
            ano_fim: Ano final para range.
            limit: Limite de resultados.
            offset: Offset para paginação.

        Returns:
            Lista de receitas que atendem aos filtros.
        """
        ...

    @abstractmethod
    def update(self, receita: Receita) -> Receita:
        """
        Atualiza uma receita existente.

        Args:
            receita: Receita com dados atualizados (deve ter ID).

        Returns:
            Receita atualizada.

        Raises:
            NotFoundError: Se a receita não existe.
        """
        ...

    @abstractmethod
    def delete(self, receita_id: int) -> bool:
        """
        Remove uma receita pelo ID.

        Args:
            receita_id: ID da receita a ser removida.

        Returns:
            True se removida, False se não encontrada.
        """
        ...

    @abstractmethod
    def get_by_periodo_e_categoria(
        self, ano: int, mes: int, categoria: str
    ) -> Optional[Receita]:
        """
        Busca receita por período e categoria.

        Args:
            ano: Ano da receita.
            mes: Mês da receita.
            categoria: Categoria da receita.

        Returns:
            Receita se encontrada, None caso contrário.
        """
        ...

    @abstractmethod
    def get_total_by_ano(
        self,
        ano: int,
        tipo: Optional[TipoReceita] = None,
    ) -> Decimal:
        """
        Calcula o total arrecadado em um ano.

        Args:
            ano: Ano para cálculo.
            tipo: Filtra por tipo de receita (opcional).

        Returns:
            Total arrecadado no ano.
        """
        ...

    @abstractmethod
    def get_total_by_mes(
        self,
        ano: int,
        mes: int,
        tipo: Optional[TipoReceita] = None,
    ) -> Decimal:
        """
        Calcula o total arrecadado em um mês específico.

        Args:
            ano: Ano para cálculo.
            mes: Mês para cálculo.
            tipo: Filtra por tipo de receita (opcional).

        Returns:
            Total arrecadado no mês.
        """
        ...

    @abstractmethod
    def get_categorias(self) -> List[str]:
        """
        Retorna todas as categorias de receita cadastradas.

        Returns:
            Lista de categorias únicas.
        """
        ...

    @abstractmethod
    def count(
        self,
        ano: Optional[int] = None,
        mes: Optional[int] = None,
        categoria: Optional[str] = None,
        tipo: Optional[TipoReceita] = None,
    ) -> int:
        """
        Conta o número de receitas que atendem aos filtros.

        Args:
            ano: Filtra por ano.
            mes: Filtra por mês.
            categoria: Filtra por categoria.
            tipo: Filtra por tipo.

        Returns:
            Número de receitas.
        """
        ...
